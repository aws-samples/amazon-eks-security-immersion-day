---
title : "Deep Dive into EKS Pod Identity"
weight : 23
---

## Deep Dive into EKS Pod Identity

In this section, let's deep dive into EKS Pod Identity and understand what is happening under the hood.

### Stage 1: During the Pod Creation 

In the previous section, we created an IAM Role `eks-pod-s3-read-access-role` and called an API `create-pod-identity-association` to create an association between the IAM role and kubernetes service account `sa1` in the Namespace `ns-a`.

When Amazon EKS starts a new pod that uses a service account with an EKS Pod Identity association, the [EKS Pod Identity webhook](https://github.com/aws/amazon-eks-pod-identity-webhookhttps://github.com/aws/amazon-eks-pod-identity-webhook) mutates the pod spec by adding two environment variables `AWS_CONTAINER_CREDENTIALS_FULL_URI` and `AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE`.

 This is because EKS Pod Identities have been added to the [`Container credential provider`](https://docs.aws.amazon.com/sdkref/latest/guide/feature-container-credentials.html) which is searched by AWS SDKs in a step in the default credential chain.
 
 Let us see the Pod spec and look for these variables.

 ```bash
 kubectl -n $NS get pod $APP -oyaml
 ```

::::expand{header="Check Output"}
```yaml
---
    - name: AWS_CONTAINER_CREDENTIALS_FULL_URI
      value: http://169.254.170.23/v1/credentials
    - name: AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE
      value: /var/run/secrets/pods.eks.amazonaws.com/serviceaccount/eks-pod-identity-token
    image: amazon/aws-cli:latest
    volumeMounts:
    - mountPath: /var/run/secrets/kubernetes.io/serviceaccount
      name: kube-api-access-mcz7j
      readOnly: true
    - mountPath: /var/run/secrets/pods.eks.amazonaws.com/serviceaccount
      name: eks-pod-identity-token
      readOnly: true
---
  volumes:
  - name: eks-pod-identity-token
    projected:
      defaultMode: 420
      sources:
      - serviceAccountToken:
          audience: pods.eks.amazonaws.com
          expirationSeconds: 86400
          path: eks-pod-identity-token
  - name: kube-api-access-mcz7j
    projected:
      defaultMode: 420
      sources:
      - serviceAccountToken:
          expirationSeconds: 3607
          path: token
      - configMap:
          items:
          - key: ca.crt
            path: ca.crt
          name: kube-root-ca.crt
      - downwardAPI:
          items:
          - fieldRef:
              apiVersion: v1
              fieldPath: metadata.namespace
            path: namespace
---
```
::::

Notice there are two Projected Service Account Tokens in the output. One of them is `kube-api-access-mcz7j` which is the default Service token created and injected by the API Server. The second one is `eks-pod-identity-token` is created and injected by the EKS Pod Identity webhook as explained above.

Let us exec into the Pod and see what does it contains.

```bash
kubectl -n $NS exec -it $APP -- bash
```

Run below commands `from inside the Pod` to view the EKS Pod Identity Token. 


```bash
export EKS_POD_IDENTITY_TOKEN=$(cat $AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE)
echo $EKS_POD_IDENTITY_TOKEN
```

Decoding this token at [https://jwt.io/](https://jwt.io/)

The Header in the Token looks like below.

```json
{
  "alg": "RS256",
  "kid": "63a691b676600ed2406d731ee9beedfb62bdd3b1"
}
```

The Payload in the Token looks like below.

```json
{
  "aud": [
    "pods.eks.amazonaws.com"
  ],
  "exp": 1702445428,
  "iat": 1702359028,
  "iss": "https://oidc.eks.us-east-1.amazonaws.com/id/8BA4A70AA33A68D27898EB4903D8A6E7",
  "kubernetes.io": {
    "namespace": "ns-a",
    "pod": {
      "name": "app1",
      "uid": "fd6df8ef-d820-4a7a-92c5-97f91dafb80a"
    },
    "serviceaccount": {
      "name": "sa1",
      "uid": "aad7d4eb-6302-40f6-9f89-92f8293bca5e"
    }
  },
  "nbf": 1702359028,
  "sub": "system:serviceaccount:ns-a:sa1"
}
```


Let us understand few important fields in the above output.

**iss** : It represents the issuer of the token which is an OIDC Provider `https://oidc.eks.us-east-1.amazonaws.com/id/8BA4A70AA33A68D27898EB4903D8A6E7`. This OIDC provider URL will be used during the verification process of the token.

**aud**: It represents the audience of the token which is `pods.eks.amazonaws.com`. This is the EKS Pod Identity Service i.e. EKS Auth.  This means the token will be accepted only by the EKS Auth Service and will be rejected by any other service.

**exp** and **iat** :  These represents the expiry time for the token which basically enables the time bound tokens.

**kubernetes.io**: It represents that this token is bound to a very specific pod `app1`
with a Service account `sa1` in the Namespace `ns-a`. This means, this token cannot be used any other pod even with the same Service token and same Namespace.


### Stage 2: During the call to S3 API to list Buckets 

To list the S3 buckets, we used this command `aws s3 ls` in the previous section.

The AWS CLI searches for the IAM credentials in the default [Credential provider chain](https://docs.aws.amazon.com/sdkref/latest/guide/standardized-credentials.html). In the search, it finds the [Container credential provider](https://docs.aws.amazon.com/sdkref/latest/guide/feature-container-credentials.html) in the list. That means, it will make a call to HTTP URL endpoint mentioned in the container environment variable `AWS_CONTAINER_CREDENTIALS_FULL_URI` by passing EKS Pod Identity token in the `Authorization` header.

Let us make this call ourselves from inside the pod.

```bash
curl 169.254.170.23/v1/credentials -H "Authorization: $EKS_POD_IDENTITY_TOKEN"
```

The output will like below.

```json
{
  "AccessKeyId": "AKIAIOSFODNN7EXAMPLE",
  "SecretAccessKey": "REDACTED",
  "Token": "REDACTED",
  "AccountId": "ACCOUNT_ID",
  "Expiration": "2023-12-12T12:50:44Z"
}
```

### Stage 3: At the Amazon EKS Pod Identity Agent


The EKS Pod Identity Agent runs as a Kubernetes `DaemonSet` and only provides credentials to pods on the node that it runs on.  The EKS Pod Identity Agent uses the `hostNetwork` and uses `port 80` and `port 2703` on a `link-local address` on the node. This address is `169.254.170.23` for IPv4 and `[fd00:ec2::23]` for IPv6 clusters.

Let us see the EKS Pod Identity Agent pods running in the cluster.

```bash
kubectl -n kube-system get ds -lapp.kubernetes.io/name=eks-pod-identity-agent 
```

::::expand{header="Check Output"}
```bash
NAME                     DESIRED   CURRENT   READY   UP-TO-DATE   AVAILABLE   NODE SELECTOR   AGE
eks-pod-identity-agent   3         3         3       3            3           <none>          3d1h
```
::::

Let us also see the EKS Pod Identity Agent specification. Notice the `hostNetwork: true` in the specification.

```bash
kubectl -n kube-system get ds -lapp.kubernetes.io/name=eks-pod-identity-agent -oyaml
```

::::expand{header="Check Output"}
```yaml
apiVersion: v1
items:
- apiVersion: apps/v1
  kind: DaemonSet
  metadata:
    annotations:
      deprecated.daemonset.template.generation: "1"
    creationTimestamp: "2023-12-09T07:23:09Z"
    generation: 1
    labels:
      app.kubernetes.io/instance: eks-pod-identity-agent
      app.kubernetes.io/managed-by: Helm
      app.kubernetes.io/name: eks-pod-identity-agent
      app.kubernetes.io/version: 0.0.25
      helm.sh/chart: eks-pod-identity-agent-1.0.0
    name: eks-pod-identity-agent
    namespace: kube-system
    resourceVersion: "6080325"
    uid: f8dcd0a2-baf3-477b-bc47-fcf42bbd6d9e
  spec:
    revisionHistoryLimit: 10
    selector:
      matchLabels:
        app.kubernetes.io/instance: eks-pod-identity-agent
        app.kubernetes.io/name: eks-pod-identity-agent
    template:
      metadata:
        creationTimestamp: null
        labels:
          app.kubernetes.io/instance: eks-pod-identity-agent
          app.kubernetes.io/name: eks-pod-identity-agent
      spec:
        affinity:
          nodeAffinity:
            requiredDuringSchedulingIgnoredDuringExecution:
              nodeSelectorTerms:
              - matchExpressions:
                - key: kubernetes.io/os
                  operator: In
                  values:
                  - linux
                - key: kubernetes.io/arch
                  operator: In
                  values:
                  - amd64
                  - arm64
                - key: eks.amazonaws.com/compute-type
                  operator: NotIn
                  values:
                  - fargate
        containers:
        - args:
          - --port
          - "80"
          - --cluster-name
          - eksworkshop-eksctl
          - --probe-port
          - "2703"
          command:
          - /go-runner
          - /eks-pod-identity-agent
          - server
          env:
          - name: AWS_REGION
            value: us-east-1
          image: 602401143452.dkr.ecr.us-east-1.amazonaws.com/eks/eks-pod-identity-agent:0.0.25
          imagePullPolicy: Always
          livenessProbe:
            failureThreshold: 3
            httpGet:
              host: localhost
              path: /healthz
              port: probes-port
              scheme: HTTP
            initialDelaySeconds: 30
            periodSeconds: 10
            successThreshold: 1
            timeoutSeconds: 10
          name: eks-pod-identity-agent
          ports:
          - containerPort: 80
            name: proxy
            protocol: TCP
          - containerPort: 2703
            name: probes-port
            protocol: TCP
          readinessProbe:
            failureThreshold: 30
            httpGet:
              host: localhost
              path: /readyz
              port: probes-port
              scheme: HTTP
            initialDelaySeconds: 1
            periodSeconds: 10
            successThreshold: 1
            timeoutSeconds: 10
          resources: {}
          securityContext:
            capabilities:
              add:
              - CAP_NET_BIND_SERVICE
          terminationMessagePath: /dev/termination-log
          terminationMessagePolicy: File
        dnsPolicy: ClusterFirst
        hostNetwork: true
        initContainers:
        - command:
          - /go-runner
          - /eks-pod-identity-agent
          - initialize
          image: 602401143452.dkr.ecr.us-east-1.amazonaws.com/eks/eks-pod-identity-agent:0.0.25
          imagePullPolicy: Always
          name: eks-pod-identity-agent-init
          resources: {}
          securityContext:
            privileged: true
          terminationMessagePath: /dev/termination-log
          terminationMessagePolicy: File
        priorityClassName: system-node-critical
        restartPolicy: Always
        schedulerName: default-scheduler
        securityContext: {}
        terminationGracePeriodSeconds: 30
    updateStrategy:
      rollingUpdate:
        maxSurge: 0
        maxUnavailable: 10%
      type: RollingUpdate
  status:
    currentNumberScheduled: 3
    desiredNumberScheduled: 3
    numberAvailable: 3
    numberMisscheduled: 0
    numberReady: 3
    observedGeneration: 1
    updatedNumberScheduled: 3
kind: List
metadata:
  resourceVersion: ""
```
::::

When the application Pod make a HTTP call to `169.254.170.23/v1/credentials`, the EKS Pod Identity agent running on that node, receives this call. The EKS Pod Identity Agent further call below API to the EKS Auth API Service.

```bash
aws eks-auth assume-role-for-pod-identity --cluster-name <cluster_name> --token <token>
```

The EKS worker node role need to have permissions for the agPod Identity Agentent to call `AssumeRoleForPodIdentity` action in EKS Auth API. You can use the AWS managed policy: `AmazonEKSWorkerNodePolicy` which is updated to include this permission. Alternatevely you can also add custom policy like below.

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "eks-auth:AssumeRoleForPodIdentity",
            ],
            "Resource": "*"
        }
    ]
}
```

The output from the above call `aws eks-auth assume-role-for-pod-identity` looks like below.

```json
{
    "subject": {
        "namespace": "ns-a",
        "serviceAccount": "app1"
    },
    "audience": "pods.eks.amazonaws.com",
    "podIdentityAssociation": {
        "associationArn": "arn:aws:eks:us-east-1:ACCOUNT_ID:podidentityassociation/eksworkshop-eksctl/a-lfw52xh1ihr1szuwp",
        "associationId": "a-lfw52xh1ihr1szuwp"
    },
    "assumedRoleUser": {
        "arn": "arn:aws:sts::ACCOUNT_ID:assumed-role/eks-pod-s3-readonly-access/eks-eks-ref-sc-app2-17903385-a093-4b17-9f47-97e9137a30fc",
        "assumeRoleId": "AROAEXAMPLEID:eks-eks-ref-sc-app2-17903385-a093-4b17-9f47-97e9137a30fc"
    },
    "credentials": {
        "sessionToken": "REDACTED",
        "secretAccessKey": "REDACTED",
        "accessKeyId": "AKIAIOSFODNN7EXAMPLE",
        "expiration": "2023-12-10T11:10:32+00:00"
    }
}
```

You can also lookup for the CloudTrail event for the above call.

```bash
EVENT_NAME="AssumeRoleForPodIdentity"
aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventName,AttributeValue=$EVENT_NAME --max-items=1
```

::::expand{header="Check Output"}
```json
{
  "Events": [
    {
      "EventId": "e05b6d2e-4be6-45dd-8ad5-ba1e076002a5",
      "EventName": "AssumeRoleForPodIdentity",
      "ReadOnly": "true",
      "AccessKeyId": "AKIAIOSFODNN7EXAMPLE",
      "EventTime": "2023-12-13T01:14:20+00:00",
      "EventSource": "eks-auth.amazonaws.com",
      "Username": "i-064d652934ecf0bfc",
      "Resources": [
        {
          "ResourceType": "AWS::EKS::Cluster",
          "ResourceName": "eksworkshop-eksctl"
        }
      ],
      "CloudTrailEvent": "{\"eventVersion\":\"1.09\",\"userIdentity\":{\"type\":\"AssumedRole\",\"principalId\":\"AROAEXAMPLEID:i-064d652934ecf0bfc\",\"arn\":\"arn:aws:sts::ACCOUNT_ID:assumed-role/platform-eks-node-group-20231128085853957000000011/i-064d652934ecf0bfc\",\"accountId\":\"ACCOUNT_ID\",\"accessKeyId\":\"AKIAIOSFODNN7EXAMPLE\",\"sessionContext\":{\"sessionIssuer\":{\"type\":\"Role\",\"principalId\":\"AROAEXAMPLEID\",\"arn\":\"arn:aws:iam::ACCOUNT_ID:role/platform-eks-node-group-20231128085853957000000011\",\"accountId\":\"ACCOUNT_ID\",\"userName\":\"platform-eks-node-group-20231128085853957000000011\"},\"attributes\":{\"creationDate\":\"2023-12-13T01:04:37Z\",\"mfaAuthenticated\":\"false\"},\"ec2RoleDelivery\":\"2.0\"}},\"eventTime\":\"2023-12-13T01:14:20Z\",\"eventSource\":\"eks-auth.amazonaws.com\",\"eventName\":\"AssumeRoleForPodIdentity\",\"awsRegion\":\"us-east-1\",\"sourceIPAddress\":\"44.219.101.145\",\"userAgent\":\"aws-sdk-go-v2/1.21.2 os/linux lang/go#1.19.13 md/GOOS#linux md/GOARCH#amd64 api/eksauth#1.0.0-zeta.e49712bf27d5\",\"requestParameters\":{\"clusterName\":\"eksworkshop-eksctl\",\"token\":\"HIDDEN_DUE_TO_SECURITY_REASONS\"},\"responseElements\":null,\"requestID\":\"7f8d9b80-3603-40eb-827b-e0afafc49507\",\"eventID\":\"e05b6d2e-4be6-45dd-8ad5-ba1e076002a5\",\"readOnly\":true,\"eventType\":\"AwsApiCall\",\"managementEvent\":true,\"recipientAccountId\":\"ACCOUNT_ID\",\"eventCategory\":\"Management\",\"tlsDetails\":{\"tlsVersion\":\"TLSv1.3\",\"cipherSuite\":\"TLS_AES_128_GCM_SHA256\",\"clientProvidedHostHeader\":\"eks-auth.us-east-1.api.aws\"}}"
    }
  ],
  "NextToken": "eyJOZXh0VG9rZW4iOiBudWxsLCAiYm90b190cnVuY2F0ZV9hbW91bnQiOiAxfQ=="
}
```
::::

Few things to observe from above output:

**Resource Type** for this API is `AWS::EKS::Cluster`.

**Resource name** corresponding to the **Resource Type** is our EKS Cluster name i.e. `eksworkshop-eksctl`.

**AWS principal** making the above call is the assumeRole of the EKS worker node i.e. `arn:aws:sts::ACCOUNT_ID:assumed-role/platform-eks-node-group-20231128085853957000000011/i-064d652934ecf0bfc`

**eventSource** at which this event occurred is EKS Auth API Service i.e. `eks-auth.amazonaws.com`

**requestParameters** in the above call includes **clusterName** i.e. `eksworkshop-eksctl` and EKS Pod Identity Service Account **token** which is `HIDDEN_DUE_TO_SECURITY_REASONS`

The EKS Auth API Service extracts the Service Account and Namespace details from the token and validates them against the EKS Pod Identity association we created earlier.

Once verified, the EKS Auth API also extract the IAM Role `eks-pod-s3-read-access-role` mapped in EKS Pod Identity association and calls AWS STS Service to get the temorary credentails. It then sends these credentials to EKS Pod Identity agent, which again sends it back to the Application pod.

You can also lookup for the CloudTrail event for the call to AWS STS Service to get the temporary credentials.

```json
{
  "Events": [
    {
      "EventId": "55621424-173a-3b4e-a321-661c4206278c",
      "EventName": "AssumeRole",
      "ReadOnly": "true",
      "EventTime": "2023-12-13T01:14:20+00:00",
      "EventSource": "sts.amazonaws.com",
      "Resources": [
        {
          "ResourceType": "AWS::IAM::AccessKey",
          "ResourceName": "AKIAIOSFODNN7EXAMPLE"
        },
        {
          "ResourceType": "AWS::STS::AssumedRole",
          "ResourceName": "arn:aws:sts::ACCOUNT_ID:assumed-role/eks-pod-s3-read-access-role/eks-eks-ref-sc-app1-b81f0fef-97e9-47da-97a2-948c5bbcd1b3"
        },
        {
          "ResourceType": "AWS::STS::AssumedRole",
          "ResourceName": "AROAEXAMPLEID:eks-eks-ref-sc-app1-b81f0fef-97e9-47da-97a2-948c5bbcd1b3"
        },
        {
          "ResourceType": "AWS::STS::AssumedRole",
          "ResourceName": "eks-eks-ref-sc-app1-b81f0fef-97e9-47da-97a2-948c5bbcd1b3"
        },
        {
          "ResourceType": "AWS::IAM::Role",
          "ResourceName": "arn:aws:iam::ACCOUNT_ID:role/eks-pod-s3-read-access-role"
        }
      ],
      "CloudTrailEvent": "{\"eventVersion\":\"1.08\",\"userIdentity\":{\"type\":\"AWSService\",\"invokedBy\":\"pods.eks.amazonaws.com\"},\"eventTime\":\"2023-12-13T01:14:20Z\",\"eventSource\":\"sts.amazonaws.com\",\"eventName\":\"AssumeRole\",\"awsRegion\":\"us-east-1\",\"sourceIPAddress\":\"pods.eks.amazonaws.com\",\"userAgent\":\"pods.eks.amazonaws.com\",\"requestParameters\":{\"roleArn\":\"arn:aws:iam::ACCOUNT_ID:role/eks-pod-s3-read-access-role\",\"roleSessionName\":\"eks-eks-ref-sc-app1-b81f0fef-97e9-47da-97a2-948c5bbcd1b3\",\"durationSeconds\":21600,\"tags\":[{\"key\":\"eks-cluster-arn\",\"value\":\"arn:aws:eks:us-east-1:ACCOUNT_ID:cluster/eksworkshop-eksctl\"},{\"key\":\"eks-cluster-name\",\"value\":\"eksworkshop-eksctl\"},{\"key\":\"kubernetes-namespace\",\"value\":\"ns-a\"},{\"key\":\"kubernetes-service-account\",\"value\":\"sa1\"},{\"key\":\"kubernetes-pod-name\",\"value\":\"app1\"},{\"key\":\"kubernetes-pod-uid\",\"value\":\"91eee131-74f3-49d4-8f7c-bcde305c120b\"}],\"transitiveTagKeys\":[\"eks-cluster-arn\",\"eks-cluster-name\",\"kubernetes-namespace\",\"kubernetes-service-account\",\"kubernetes-pod-name\",\"kubernetes-pod-uid\"]},\"responseElements\":{\"credentials\":{\"accessKeyId\":\"AKIAIOSFODNN7EXAMPLE\",\"sessionToken\":\"REDACTED\",\"expiration\":\"Dec 13, 2023, 7:14:20 AM\"},\"assumedRoleUser\":{\"assumedRoleId\":\"AROAEXAMPLEID:eks-eks-ref-sc-app1-b81f0fef-97e9-47da-97a2-948c5bbcd1b3\",\"arn\":\"arn:aws:sts::ACCOUNT_ID:assumed-role/eks-pod-s3-read-access-role/eks-eks-ref-sc-app1-b81f0fef-97e9-47da-97a2-948c5bbcd1b3\"},\"packedPolicySize\":55},\"requestID\":\"b24654c7-be30-474d-903e-caf147dd7286\",\"eventID\":\"55621424-173a-3b4e-a321-661c4206278c\",\"readOnly\":true,\"resources\":[{\"accountId\":\"ACCOUNT_ID\",\"type\":\"AWS::IAM::Role\",\"ARN\":\"arn:aws:iam::ACCOUNT_ID:role/eks-pod-s3-read-access-role\"}],\"eventType\":\"AwsApiCall\",\"managementEvent\":true,\"recipientAccountId\":\"ACCOUNT_ID\",\"sharedEventID\":\"3bf1ef4e-27b9-4653-b368-cdab2cc98411\",\"eventCategory\":\"Management\"}"
    }
  ]
}
```

Few things to observe from above output:

**Resource Type** for this API include multiple types such as `AWS::IAM::AccessKey`, `AWS::STS::AssumedRole` and `AWS::IAM::Role`

One of **Resource name** corresponding to the above **Resource Type** is our S3 read access role i.e. `eks-pod-s3-read-access-role`.

**userIdentity** making the above call is **AWSService** i.e. EKS Auth API with name as `pods.eks.amazonaws.com`

**eventSource** at which this event occurred is AWS STS Service i.e. `sts.amazonaws.com`

**requestParameters** in the above call includes Role Session Tags such as

```json
        "tags": [
            {
                "key": "eks-cluster-arn",
                "value": "arn:aws:eks:us-east-1:ACCOUNT_ID:cluster/eksworkshop-eksctl"
            },
            {
                "key": "eks-cluster-name",
                "value": "eksworkshop-eksctl"
            },
            {
                "key": "kubernetes-namespace",
                "value": "ns-a"
            },
            {
                "key": "kubernetes-service-account",
                "value": "sa1"
            },
            {
                "key": "kubernetes-pod-name",
                "value": "app1"
            },
            {
                "key": "kubernetes-pod-uid",
                "value": "91eee131-74f3-49d4-8f7c-bcde305c120b"
            }
        ]
```

This means, we can further configure our S3 read access IAM Role for fine grained IAM permissions to restrict the access to this Role for any specifc EKS Cluster or Namespace or Service Account or Pod Name or Pod UID. We will explore on how this works in the next module.



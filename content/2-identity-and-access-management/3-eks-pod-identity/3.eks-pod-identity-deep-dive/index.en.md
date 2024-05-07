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
  "iss": "https://oidc.eks.us-west-2.amazonaws.com/id/8BA4A70AA33A68D27898EB4903D8A6E7",
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

**iss** : It represents the issuer of the token which is an OIDC Provider `https://oidc.eks.us-west-2.amazonaws.com/id/8BA4A70AA33A68D27898EB4903D8A6E7`. This OIDC provider URL will be used during the verification process of the token.

**aud**: It represents the audience of the token which is `pods.eks.amazonaws.com`. This is the EKS Pod Identity Service i.e. EKS Auth.  This means the token will be accepted only by the EKS Auth Service and will be rejected by any other service.

**exp** and **iat** :  These represents the expiry time for the token which basically enables the time bound tokens.

**kubernetes.io**: It represents that this token is bound to a very specific pod `app1`
with a Service account `sa1` in the Namespace `ns-a`. This means, this token cannot be used by any other pod even with the same Service token and same Namespace.


### Stage 2: During the call to S3 API to list Buckets 

To list the S3 buckets, we used this command `aws s3 ls` in the previous section.

The AWS CLI searches for the IAM credentials in the default [Credential provider chain](https://docs.aws.amazon.com/sdkref/latest/guide/standardized-credentials.html). In the search, it finds the [Container credential provider](https://docs.aws.amazon.com/sdkref/latest/guide/feature-container-credentials.html) in the list. That means, it will make a call to HTTP URL endpoint mentioned in the container environment variable `AWS_CONTAINER_CREDENTIALS_FULL_URI` by passing EKS Pod Identity token in the `Authorization` header.

Let us make this call ourselves from inside the pod.

```bash
curl 169.254.170.23/v1/credentials -H "Authorization: $EKS_POD_IDENTITY_TOKEN"
```

The output will like look below.

```json
{
  "AccessKeyId": "ASIAQAHCJ2QPOKXPLCQ4",
  "SecretAccessKey": "UYEyaLMLoa0y6lx1FvpSzSwHJzZml7b9qiSRU2ry",
  "Token": "IQoJb3JpZ2luX2VjEK///////////wEaCXVzLWVhc3QtMSJIMEYCIQD26IOY4R6nkjzmSZBsya2g3lFNBEmsMUJ/WanZ7S9I6wIhANLXXajMfkaS2VaMjpMsTfCAJ0wqsXoguAJXtKbwV1MeKrIECCgQBBoMMDAwNDc0NjAwNDc4IgxBoWc4XimzrdkzqaAqjwQ7FZNzbWKi7Em4oEvEi9mvXmDd4fNf6ex5T++TZ2DNq+UTr7my46evteWjRmtX/NfK+JwIf5An87r47HMC6HifYexbL9oOixfPoAYihk75rA24WF2Xpiqrv6KqlFDeKNe4GIMevc9J4KjxaUGly0BGfEfarSG4z49nDdZfkrphj7GbAxNwZsIrKOnR9NkSg0f2MyKnWZFnKKtTWW8Kx70irDUmDghTXvAPVWljOaDW+V5STEx2AUHb6XMmQo8tc7MUWTSZglh2EcRfplKClJjXkwsPdCp8/5LFrZPYiOgK5pSV4thNxwhxPmvbLLvXNVnqAM80xRB/05qC0ww5J94t1qyvUsmignuF9R8NoFJr8VcQA0mIDp0lGnL5AvB1L4BNF96CQgBG2gbqpejB1cAcANbnRs9tWvjLr6uDtJyL+IhQGfXdCpSd12rqy4Ex2qMAP9dcaoX0ShlPYwQdP4k5tSeH5HIW9k0XADa0I41+hc32R0iHd8/vD+5Hf0k8l+jGUHgNQ5QCRuEl0BAm50rV+IRSFafTwcDXYNbQUXlHM6Z7sp58ksqzwX7qQfE5j4eruQF/MrYqcnxHYSySO0Y9WvpDfm1YgEX/IZCdJWQPxCVnGAY8cluiGBw2PdLu8We3cyC/Vnc+2nhg7I5R7gmyCuI10fepv99y71UpPCJacYfn++cuAzdX95b2v5k5UTDEheCrBjqOASSNOnzg8FcFw0zabrb/ryinPDWpKAJE2p/I5KlVQcJlXacEl3jD4qd/fVRRCm7ckrbngNWQTMxm6WEQLXNYKWk52+e/kxxgYdygOju3pzYSdEYcM/50O4h89amgwfZQfPK/8R9mCEqngUKOEbAty4ibwen0HyeNI4ILWf3rmVK0tCIfzLO3+lGCA9DQpqg=",
  "AccountId": "ACCOUNT_ID",
  "Expiration": "2023-12-12T12:50:44Z"
}
```

Run the command `exit` to `exit from the pod`

### Stage 3: At the Amazon EKS Pod Identity Agent


The EKS Pod Identity Agent runs as a Kubernetes `DaemonSet` and only provides credentials to pods on the node that it runs on.  The EKS Pod Identity Agent uses the `hostNetwork` and uses `port 80` and `port 2703` on a `link-local address` on the node. This address is `169.254.170.23` for IPv4 and `[fd00:ec2::23]` for IPv6 clusters.

#### EKS Pod Identity agent

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
:::code{language=yaml showCopyAction=false showLineNumbers=true highlightLines='106'}
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
            value: us-west-2
          image: 602401143452.dkr.ecr.us-west-2.amazonaws.com/eks/eks-pod-identity-agent:0.0.25
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
          image: 602401143452.dkr.ecr.us-west-2.amazonaws.com/eks/eks-pod-identity-agent:0.0.25
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
:::
::::

#### EKS Pod Identity calling EKS Auth API

When the application Pod make a HTTP call to `169.254.170.23/v1/credentials`, the EKS Pod Identity agent running on that node, receives this call. The EKS Pod Identity Agent further call below API to the EKS Auth API Service.

```bash
(
TOKEN=$(kubectl -n $NS exec -it $APP -- /bin/bash -c 'cat $AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE')
echo TOKEN=$TOKEN
aws eks-auth assume-role-for-pod-identity --cluster-name $EKS_CLUSTER --token $TOKEN
)
```

The EKS worker node role need to have IAM permissions for the Pod Identity Agent to call `AssumeRoleForPodIdentity` action in EKS Auth API. You can use the AWS managed policy: `AmazonEKSWorkerNodePolicy` which is updated to include this permission. Alternatively you can also add custom policy like below.

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "eks-auth:AssumeRoleForPodIdentity"
            ],
            "Resource": "*"
        }
    ]
}
```

An example output from the above call `aws eks-auth assume-role-for-pod-identity` is mentioned below just for reference. We can see the namespace and service account, the associationArn, and the AssumeRoleArn, with the IAM credentials for this session.

:::code{language=json showCopyAction=false showLineNumbers=false highlightLines='3,4,6,8,12,15'}
{
    "subject": {
        "namespace": "ns-a",
        "serviceAccount": "app1"
    },
    "audience": "pods.eks.amazonaws.com",
    "podIdentityAssociation": {
        "associationArn": "arn:aws:eks:us-west-2:ACCOUNT_ID:podidentityassociation/eksworkshop-eksctl/a-lfw52xh1ihr1szuwp",
        "associationId": "a-lfw52xh1ihr1szuwp"
    },
    "assumedRoleUser": {
        "arn": "arn:aws:sts::ACCOUNT_ID:assumed-role/eks-pod-s3-readonly-access/eks-eks-ref-sc-app2-17903385-a093-4b17-9f47-97e9137a30fc",
        "assumeRoleId": "AROAQAHCJ2QPFDE3D2IDP:eks-eks-ref-sc-app2-17903385-a093-4b17-9f47-97e9137a30fc"
    },
    "credentials": {
        "sessionToken": "IQoJb3JpZ2luX2VjEH4aCXVzLWVhc3QtMSJHMEUCIQDPfnCLOWO6aEuGGPfdYgrqqGFABVr+N9uZDPg5ONu39gIgLF9V2ONFar0zWDMERDeuS7wJnd8zijYBdi9ljTypMAwquwQI5v//////////ARAEGgwwMDA0NzQ2MDA0NzgiDO9thgc7RgERWWYK/iqPBPIaPWyt3e9JAIV/zq6REb/Fa3RCIFkzobnvD4fb4DuQiWWl84KkUIEpVxv0MG3hk6s8mkM41bNGokoDI4J70/EJfY/9Q3Ygo6Az6eVpbG0EgrFOrQm9Lv54bZ2pPfIdQt1Mj7gVExtW6PdsnhZX/04Or+a+rQJREc3viRE2KhvbOO3I1yAfxHQa1Px5z3gIgtdv2uh02D8qZQUFiDLHef4FuhZ/+gG/acSZL6r/yRsqii76/VTKKvrKZAqF+Ovig+HOmQ85DBZlgRXDDRI6CWtsw49zm9/vMX4nSpiYanuq0iFvRP0gTjkCdbywGZFim+OyzZHgopYgJap33SO7Clff54TpztANal53KyI+kv5N28m7bbFCPdiswIhNXQ6f709w9R1agXWwv294d5XZ0qIM8Vbh7LZvLRyCL7bP0NFYzyzqP+ksx7L5Y+LV1hJNe5z1W5EiQ0Yd/7lsWFn4jDN/SggVJu6qLxkOyFsYqB6oEpuFAu/CLJyf39lCLBvJrOdFWJcfVBS2NpycN08fKRw+BMseqFNjq05XRnnjePEAduNLmuDFzg2saPk5UtPPw/gc0LlLpoT4PME8M3fl/80jCzm+KFTMrbuMJrLyWWlugq0Lf1W64r0De9LgOmlbS+/f0FJR/W6XTCtRkqFRAdceEtourqeFRf8D0At6Kqk/VxbMcXczzI/UwTsj6dxdMMiQ1asGOo8BMqiQ73a+J7DJ3vXmxxy55J5Mlmx1Ja8E0qc/4LQtJp+RH20H0sHSM7ubP6KqfvTEN38wgC3WnOv8TpwwGJIOK7fMs/fAZmloC7qde7otfZnikuUECZmI6752fe7ydvX98jmf5ESmR64coLd45lQ9ZyBFvSdoq3ItPFiPENvpFqCidjQjVSNjjs4SD5GRvmo=",
        "secretAccessKey": "ftZLqkr+iQTZsGV/l3HZPCQVCQZUwgVwgYaaIiPY",
        "accessKeyId": "ASIAQAHCJ2QPPKHZNJFH",
        "expiration": "2023-12-10T11:10:32+00:00"
    }
}
:::

You can also lookup for the CloudTrail event for the above call.

```bash
EVENT_NAME="AssumeRoleForPodIdentity"
aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventName,AttributeValue=$EVENT_NAME --max-items=1
```

::::expand{header="Check Output"}
:::code{language=json showCopyAction=false showLineNumbers=false highlightLines='9,13,14'}
{
  "Events": [
    {
      "EventId": "e05b6d2e-4be6-45dd-8ad5-ba1e076002a5",
      "EventName": "AssumeRoleForPodIdentity",
      "ReadOnly": "true",
      "AccessKeyId": "ASIAQAHCJ2QPOFDF6NOW",
      "EventTime": "2023-12-13T01:14:20+00:00",
      "EventSource": "eks-auth.amazonaws.com",
      "Username": "i-064d652934ecf0bfc",
      "Resources": [
        {
          "ResourceType": "AWS::EKS::Cluster",
          "ResourceName": "eksworkshop-eksctl"
        }
      ],
      "CloudTrailEvent": "{\"eventVersion\":\"1.09\",\"userIdentity\":{\"type\":\"AssumedRole\",\"principalId\":\"AROAQAHCJ2QPM6KW4RJQK:i-064d652934ecf0bfc\",\"arn\":\"arn:aws:sts::ACCOUNT_ID:assumed-role/platform-eks-node-group-20231128085853957000000011/i-064d652934ecf0bfc\",\"accountId\":\"ACCOUNT_ID\",\"accessKeyId\":\"ASIAQAHCJ2QPOFDF6NOW\",\"sessionContext\":{\"sessionIssuer\":{\"type\":\"Role\",\"principalId\":\"AROAQAHCJ2QPM6KW4RJQK\",\"arn\":\"arn:aws:iam::ACCOUNT_ID:role/platform-eks-node-group-20231128085853957000000011\",\"accountId\":\"ACCOUNT_ID\",\"userName\":\"platform-eks-node-group-20231128085853957000000011\"},\"attributes\":{\"creationDate\":\"2023-12-13T01:04:37Z\",\"mfaAuthenticated\":\"false\"},\"ec2RoleDelivery\":\"2.0\"}},\"eventTime\":\"2023-12-13T01:14:20Z\",\"eventSource\":\"eks-auth.amazonaws.com\",\"eventName\":\"AssumeRoleForPodIdentity\",\"awsRegion\":\"us-west-2\",\"sourceIPAddress\":\"44.219.101.145\",\"userAgent\":\"aws-sdk-go-v2/1.21.2 os/linux lang/go#1.19.13 md/GOOS#linux md/GOARCH#amd64 api/eksauth#1.0.0-zeta.e49712bf27d5\",\"requestParameters\":{\"clusterName\":\"eksworkshop-eksctl\",\"token\":\"HIDDEN_DUE_TO_SECURITY_REASONS\"},\"responseElements\":null,\"requestID\":\"7f8d9b80-3603-40eb-827b-e0afafc49507\",\"eventID\":\"e05b6d2e-4be6-45dd-8ad5-ba1e076002a5\",\"readOnly\":true,\"eventType\":\"AwsApiCall\",\"managementEvent\":true,\"recipientAccountId\":\"ACCOUNT_ID\",\"eventCategory\":\"Management\",\"tlsDetails\":{\"tlsVersion\":\"TLSv1.3\",\"cipherSuite\":\"TLS_AES_128_GCM_SHA256\",\"clientProvidedHostHeader\":\"eks-auth.us-west-2.api.aws\"}}"
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

In the **CloudTrailEvent**, there are other informations, and you can tweak the previous command to have a prettier print of this part: 

```bash
aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventName,AttributeValue=$EVENT_NAME --max-items=1 | jq '.Events[] | (.CloudTrailEvent | fromjson)' 
```

::::expand{header="Check Output"}
:::code{language=json showCopyAction=false showLineNumbers=true highlightLines='30,31,32'}
{
  "eventVersion": "1.09",
  "userIdentity": {
    "type": "AssumedRole",
    "principalId": "AROA37QFXJP5E2DPF472Q:i-07574d724fb843fda",
    "arn": "arn:aws:sts::823571991546:assumed-role/eks-security-workshop/i-07574d724fb843fda",
    "accountId": "823571991546",
    "accessKeyId": "ASIA37QFXJP5LMALW5PH",
    "sessionContext": {
      "sessionIssuer": {
        "type": "Role",
        "principalId": "AROA37QFXJP5E2DPF472Q",
        "arn": "arn:aws:iam::823571991546:role/eks-security-workshop",
        "accountId": "823571991546",
        "userName": "eks-security-workshop"
      },
      "attributes": {
        "creationDate": "2024-04-16T08:23:33Z",
        "mfaAuthenticated": "false"
      },
      "ec2RoleDelivery": "2.0"
    }
  },
  "eventTime": "2024-04-16T08:29:33Z",
  "eventSource": "eks-auth.amazonaws.com",
  "eventName": "AssumeRoleForPodIdentity",
  "awsRegion": "us-west-2",
  "sourceIPAddress": "34.222.6.96",
  "userAgent": "aws-cli/2.15.38 Python/3.11.8 Linux/5.10.213-201.855.amzn2.x86_64 exe/x86_64.amzn.2 prompt/off command/eks-auth.assume-role-for-pod-identity",
  "requestParameters": {
    "clusterName": "eksworkshop-eksctl",
    "token": "HIDDEN_DUE_TO_SECURITY_REASONS"
  },
  "responseElements": null,
  "requestID": "1f3aa1ae-d897-4310-bab4-3e89f8d42f5d",
  "eventID": "eaef7c6d-f6d0-4a9a-8380-4547a9ac326e",
  "readOnly": true,
  "eventType": "AwsApiCall",
  "managementEvent": true,
  "recipientAccountId": "823571991546",
  "eventCategory": "Management",
  "tlsDetails": {
    "tlsVersion": "TLSv1.3",
    "cipherSuite": "TLS_AES_128_GCM_SHA256",
    "clientProvidedHostHeader": "eks-auth.us-west-2.api.aws"
  }
}
:::
::::

the **requestParameters** in the above call includes **clusterName** i.e. `eksworkshop-eksctl` and EKS Pod Identity Service Account **token** which is `HIDDEN_DUE_TO_SECURITY_REASONS`

#### EKS Pod Identity validation

The EKS Auth API Service extracts the Service Account and Namespace details from the token and validates them against the EKS Pod Identity association we created earlier.

#### EKS Pod Identity call to AWS STS service

Once verified, the EKS Auth API also extracts the IAM Role `eks-pod-s3-read-access-role` mapped in EKS Pod Identity association and calls AWS STS Service to get the temporary credentials. It then sends these credentials to EKS Pod Identity agent, which again sends it back to the Application pod.

You can also lookup for the CloudTrail event for the call to AWS STS Service to get the temporary credentials. We filter on the `CloudTrailEvent` parameter of the API call containing a tag with name 'eks-cluster-arn' so that it is one from the EKS Pod Identity:

```bash
events=$(aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventSource,AttributeValue=sts.amazonaws.com --max-items 100) 

echo $events | jq '.Events[] | (.CloudTrailEvent | fromjson | select(.requestParameters.tags[]?.key=="eks-cluster-arn"))'
```

> If there is no result, that means that the call was not in the last 100 events, you can ask the pod-identity daemonset to restart, so that it will make this call again
> ```
> kubectl rollout restart daemonset eks-pod-identity-agent -n kube-system
> ```

::::expand{header="AWS STS event" defaultExpanded=true}
:::code{language=json showCopyAction=false showLineNumbers=true highlightLines='11,14,17,23,27,53,71'}
{
  "eventVersion": "1.08",
  "userIdentity": {
    "type": "AWSService",
    "invokedBy": "pods.eks.amazonaws.com"
  },
  "eventTime": "2024-04-16T09:20:04Z",
  "eventSource": "sts.amazonaws.com",
  "eventName": "AssumeRole",
  "awsRegion": "us-west-2",
  "sourceIPAddress": "pods.eks.amazonaws.com",
  "userAgent": "pods.eks.amazonaws.com",
  "requestParameters": {
    "roleArn": "arn:aws:iam::823571991546:role/eks-pod-s3-read-access-role",
    "roleSessionName": "eks-eksworksho-app1-498124c2-a555-40bf-9059-ca9a26821eb0",
    "durationSeconds": 21600,
    "tags": [
      {
        "key": "eks-cluster-arn",
        "value": "arn:aws:eks:us-west-2:823571991546:cluster/eksworkshop-eksctl"
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
        "value": "0cda7f85-c1f9-4dee-b6e9-a0b50c8f3012"
      }
    ],
    "transitiveTagKeys": [
      "eks-cluster-arn",
      "eks-cluster-name",
      "kubernetes-namespace",
      "kubernetes-service-account",
      "kubernetes-pod-name",
      "kubernetes-pod-uid"
    ]
  },
  "responseElements": {
    "credentials": {
      "accessKeyId": "ASIA37QFXJP5MQOWRZ6Q",
      "sessionToken": "IQoJb3JpZ2luX2VjEIL//////////wEaCXVzLXdlc3QtMiJHMEUCIBIC8yw6n5TTiLCWM1YTOCvGCfjSgZHJZFU1sj5+qqvhAiEAm7lq4NL7joREHEA3kxCbr6ZP3Hftbm7WjdqO/LJTG2QqvgQIuv//////////ARAAGgw4MjM1NzE5OTE1NDYiDA/OosTJYTQlWD1LeyqSBA7ueUmFbbPZ850h5rEByl/Bg4kLz6Sp+61MkrhN3UQKmGWgQkLaSbZNj8fhVvFxpNy7HdLryOz0Nm3MQ4NK6alFMnogF3AMvt0Hz0qxoaWNqTnK2YS1O9bqpVt5nay03KoryjQjdM+fxE67e5IPDi6pbSzAnkfkfwMMD8VPtZyCckZ3+/b7KASEk5wGO8pJ28Ic2eI499VxZxEJ/obooLmjTJKizxMidUnmHGrBmFTCuHCZVOlL8xC2YFMT7acHvfoGqG3QjjdpGHbIdTw1kETrnxWJuken2AD46NbybI2XxDfVPWaU4RDrnHpDGmUwsSZl5l3lcN5HIvEEuGZrhfV/WErtsGeXLPFNSlRpUMuXEMGJHeZHmRA4aTeWDtFgzqfbYmB6e7NARuEQuzDmyhphbKx7PAd5Lm7dpgqT6D8Ejs3SqCBDaLe4XgOwWcGkAdXBaipsw4eQGmLlk2P/OXajbc7peTbhmXeZPWWQFWXTW8D9zLj5cmGZDuLE5HApfjiHwEcI80X1+XKalXXWAfsd6zytlkVHriv7Jm+7gwP2hGKtLCqmjC2ZAeNSPPQwXshFKJEQYaGJxJUHDxqVmzZI54Bl+9UCgDPnt5OPrraeBARoroyYXG3QN5mqf1sX+2kKhpSAN17rZdtp+uCUtOo5LN8CFOjwNDe7OQ339IWzOh8WJF2f/lE6g5SeegvwJPv3MMSF+bAGOo4BQueeZmOUoDcTyvXqvTRqrurdwole4HRq8D4V3F9viF/CXBYlkN18xdaM+dHwjdyD4fYGLVmoR1NWx8koKWICRiFv7JAG0MB/pd085pldHQ7Ea6uhS16AXK473ceRGEVL4GogjsASKi/gYGen7uCoKdIJR48yA2Fz19nUR5sYOUMnGtggmJHQyvbZMlJzGQ==",
      "expiration": "Apr 16, 2024, 3:20:04 PM"
    },
    "assumedRoleUser": {
      "assumedRoleId": "AROA37QFXJP5LOO5CGXEC:eks-eksworksho-app1-498124c2-a555-40bf-9059-ca9a26821eb0",
      "arn": "arn:aws:sts::823571991546:assumed-role/eks-pod-s3-read-access-role/eks-eksworksho-app1-498124c2-a555-40bf-9059-ca9a26821eb0"
    },
    "packedPolicySize": 56
  },
  "requestID": "3821a55e-cecc-4d68-9c9b-fc8b6d6994f4",
  "eventID": "7b7e4636-4713-3d04-b86a-cd6774cdbae9",
  "readOnly": true,
  "resources": [
    {
      "accountId": "823571991546",
      "type": "AWS::IAM::Role",
      "ARN": "arn:aws:iam::823571991546:role/eks-pod-s3-read-access-role"
    }
  ],
  "eventType": "AwsApiCall",
  "managementEvent": true,
  "recipientAccountId": "823571991546",
  "sharedEventID": "c30ac43f-e051-426b-94bc-ab73b05e34e9",
  "eventCategory": "Management"
}
:::
::::

We can see from the output, the source of this call if from AWSService pods.eks.amazonaws.com. That means that EKS Pod Identity retrieve the temporary credentials (l53) for our IAM Role (l71) and that it has attached some Session Tags (l17)  that can be use to filter access to AWS resources.

This means, we can further configure our S3 read access IAM Role for fine grained IAM permissions to restrict the access to this Role for any specifc EKS Cluster, Namespace, Service Account, Pod Name or Pod UID. We will explore on how this works in the next module.



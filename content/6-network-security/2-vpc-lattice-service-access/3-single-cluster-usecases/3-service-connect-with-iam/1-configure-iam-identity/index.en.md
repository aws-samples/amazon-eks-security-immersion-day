---
title : "Configuring IAM Identity for app1 service"
weight : 10
---

## Configuring IAM Identity for the client i.e. `app1-app1` Service

Amazon VPC Lattice uses AWS Signature Version 4 (SigV4) for client authentication. After the Auth Policy is enabled on the Amazon VPC Lattice Service, it is also necessary to make changes on the service caller side, so that the HTTP requests include the signed `Authorization` header, as well as other headers such as `x-amz-content-sha256`, `x-amz-date` and `x-amz-security-token` when making HTTP requests. The details of [AWS Sig v4 can be found here](https://docs.aws.amazon.com/IAM/latest/UserGuide/create-signed-request.html).

There are multiple options to sign the request for Amazon VPC Lattice services.

1. **[AWS SDK](https://docs.aws.amazon.com/vpc-lattice/latest/ug/sigv4-authenticated-requests.html)**: This option has the optimal performance and is the **prefered solution**, but requires code changes for the application.
1. By using a container sidecar to sign the requests:
    1. **[AWS SIGv4 Proxy Admission Controller](https://github.com/awslabs/aws-sigv4-proxy)**:  This option use AWS SIGv4 Proxy to forward HTTP request and add AWS Sigv4 headers. The details is covered in this [post](https://aws.amazon.com/blogs/containers/application-networking-with-amazon-vpc-lattice-and-amazon-eks/).
    1. Using new [envoy proxy signature](https://www.envoyproxy.io/docs/envoy/latest/configuration/http/http_filters/aws_request_signing_filter) functionality

Additionaly, if we uses the sidecar pattern, we can uses an admission controller to dynamically inject the signing sidecar in the Pod.

3. **[Kyverno policy engine](https://kyverno.io/)**: It runs as a [dynamic admission controller](https://kubernetes.io/docs/reference/access-authn-authz/extensible-admission-controllers/) and receives mutating admission webhook HTTP callbacks from the API server, and applies matching policies to return results that enforce admission policies. In other words, Kyverno can automatically inject the sidecar and init containers automatically. We will be using ths option in this module.


First, we can use the SDK to sign the request.
The first step is to be able to provide an IAM Role to the Pod that needs to sign the request. For that we are going to leverage the new [EKS Pod Identity](https://aws.amazon.com/about-aws/whats-new/2023/11/amazon-eks-pod-identity/?nc1=h_ls) feature:

### 1. Create an IAM Role for our pod

We are going to create an IAM role that will later be associated with our app1-v1 pod. This Role will have the permission to access the VPC Lattice Service, and retrieve Root CA in Private CA.

```bash
echo "Create IAM Role for VPC Lattice app"
export ROLE_NAME=aws-sigv4-client
aws iam create-role \
  --role-name ${ROLE_NAME} \
  --description 'iam role for ${ROLE_NAME} vpc lattice access' \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {
        "Service": "pods.eks.amazonaws.com"
      },
      "Action": ["sts:AssumeRole","sts:TagSession"]
    }]
  }'

aws iam attach-role-policy \
  --policy-arn arn:aws:iam::aws:policy/VPCLatticeServicesInvokeAccess \
  --role-name ${ROLE_NAME}

aws iam attach-role-policy \
  --policy-arn arn:aws:iam::aws:policy/AWSCertificateManagerPrivateCAReadOnly \
  --role-name ${ROLE_NAME}
```

::::expand{header="Check Output"}
```json
{
    "Role": {
        "Path": "/",
        "RoleName": "aws-sigv4-client",
        "RoleId": "AROAVR5MHJVY7PQ6Q7AMI",
        "Arn": "arn:aws:iam::382076407153:role/aws-sigv4-client",
        "CreateDate": "2024-02-09T11:00:22+00:00",
        "AssumeRolePolicyDocument": {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "pods.eks.amazonaws.com"
                    },
                    "Action": [
                        "sts:AssumeRole",
                        "sts:TagSession"
                    ]
                }
            ]
        },
        "PermissionsBoundary": {
            "PermissionsBoundaryType": "Policy",
            "PermissionsBoundaryArn": "arn:aws:iam::aws:policy/VPCLatticeServicesInvokeAccess"
        }
    }
}
```
::::

### 2. Install the new Pod Identity controller 

List the addon compatible versions
```bash
eksdemo get addon-versions -c $EKS_CLUSTER1_NAME
```

::::expand{header="Check Output"}
```
+------------------------------------+----------------------+--------------+
|                Name                |       Version        | Restrictions |
+------------------------------------+----------------------+--------------+
...
| eks-pod-identity-agent             | v1.1.0-eksbuild.1*   | -            |
| eks-pod-identity-agent             | v1.0.0-eksbuild.1    | -            |
...
```
::::

Create the Addon
```bash
eksdemo create addon eks-pod-identity-agent -c $EKS_CLUSTER1_NAME
```

### 3. Associate the role to the app1 application

Now we are going to use EKS Api to associate this role to our Role to our application:

```bash
aws eks create-pod-identity-association \
  --cluster-name $EKS_CLUSTER1_NAME \
  --namespace app1 \
  --service-account default \
  --role-arn arn:aws:iam::${AWS_ACCOUNT_ID}:role/aws-sigv4-client
```

::::expand{header="Check Output"}
```json
{
    "association": {
        "clusterName": "eksworkshop-eksctl",
        "namespace": "app1",
        "serviceAccount": "default",
        "roleArn": "arn:aws:iam::382076407153:role/aws-sigv4-client",
        "associationArn": "arn:aws:eks:us-west-2:382076407153:podidentityassociation/eksworkshop-eksctl/a-j3gyfla9wahgsrs6y",
        "associationId": "a-j3gyfla9wahgsrs6y",
        "tags": {},
        "createdAt": "2024-02-09T11:01:00.048000+00:00",
        "modifiedAt": "2024-02-09T11:01:00.048000+00:00"
    }
}
```
::::

And restart the pod so it takes the new role

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT -n app1 rollout restart deployment/app1-v1
```

### 4. Check the Role is used by the pod

We can check that the Pod Identity has been injected into our pod:

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT describe pods -n app1 app1 | grep pod-identity
```

::::expand{header="Check Output"}
:::code{language=yml showCopyAction=false showLineNumbers=false highlightLines='3'}
      AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE:  /var/run/secrets/pods.eks.amazonaws.com/serviceaccount/eks-pod-identity-token
      /var/run/secrets/pods.eks.amazonaws.com/serviceaccount from eks-pod-identity-token (ro)
  eks-pod-identity-token:
:::
::::

We can see that some env var and volume mount were added into the pod.

Now let's check what is the identity used inside the pod:

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT exec -ti -n app1 deployment/app1-v1 -- aws sts get-caller-identity
```

> Note: we have shipped the aws cli in our application demo

::::expand{header="Check Output"}
:::code{language=yml showCopyAction=false showLineNumbers=false highlightLines='4'}
{
    "UserId": "AROARNLDHSLO22SR73KBL:eks-eksworksho-app1-v1-5b-de387d83-d53c-4022-bebe-d6e35a034e4b",
    "Account": "012345678901",
    "Arn": "arn:aws:sts::012345678901:assumed-role/aws-sigv4-client/eks-eksworksho-app1-v1-5b-de387d83-d53c-4022-bebe-d6e35a034e4b"
}
:::
::::

We can see here that our Pod is assuming the `aws-sigv4-client` IAM role that we created previously.

You can also vew this in the pod identity controller logs:
```bash
kubectl stern --context $EKS_CLUSTER1_CONTEXT -n kube-system daemonset/eks-pod-identity-agent -c eks-pod-identity-agen| grep app1
```

::::expand{header="Check Output"}
```
eks-pod-identity-agent-fd2zw eks-pod-identity-agent {"client-addr":"10.254.145.206:37308","cluster-name":"eksworkshop-eksctl","fetched_role_arn":"arn:aws:sts::097381749469:assumed-role/aws-sigv4-client/eks-eksworksho-app1-v1-5b-de387d83-d53c-4022-bebe-d6e35a034e4b","fetched_role_id":"AROARNLDHSLO22SR73KBL:eks-eksworksho-app1-v1-5b-de387d83-d53c-4022-bebe-d6e35a034e4b","level":"info","msg":"Successfully fetched credentials from EKS Auth","request_time_ms":179,"time":"2024-02-08T13:32:58Z"}
```
::::

## Use the curl's AWS SDK integration to sign the requests.

In this first step, which will be the recommended one, we are going to simulate how you can leverage AWS SDK to use the IAM Role to sign the requests directly.

We are going to emulate this by using the `curl` programm which has an integration with AWS SDK to sign the requests.


```bash
app2DNS=$(kubectl --context $EKS_CLUSTER1_CONTEXT get httproute app2 -n app2 -o json | jq -r '.metadata.annotations."application-networking.k8s.aws/lattice-assigned-domain-name"')
kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/app1-v1 -n app1 -c app1-v1 -- /bin/bash -c '\
TOKEN=$(cat $AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE) && \
STS=$(curl -s 169.254.170.23/v1/credentials -H "Authorization: $TOKEN") && \
curl -s --aws-sigv4 "aws:amz:${AWS_REGION}:vpc-lattice-svcs" --user $(echo $STS | jq ".AccessKeyId" -r):$(echo $STS | jq ".SecretAccessKey" -r) -H "x-amz-content-sha256: UNSIGNED-PAYLOAD" -H "x-amz-security-token: $(echo $STS | jq ".Token" -r)" \
'$app2DNS
```

::::expand{header="Check Output" defaultExpanded=true}
```
Requsting to Pod(app2-v1-56f7c48bbf-nl6gg): Hello from app2-v1
```
::::

::alert[We correctly sign the requests using curl and EKS Pod Identity and had access to the app2 service with IAM authorization control at VPC lattice service level.]{header="Congratulation!"}

## How this works ?

You can check the JWT token that the app1 pod got from the EKS identity:

```bash
TOKEN=$(kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/app1-v1 -n app1 -c app1-v1 -- /bin/bash -c 'cat $AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE'); echo $TOKEN
```

You can decode this token on jwt.io and you will see an output similar to

:::code{language=json showCopyAction=false showLineNumbers=false highlightLines='9,11,15'}
{
  "aud": [
    "pods.eks.amazonaws.com"
  ],
  "exp": 1713281339,
  "iat": 1713194939,
  "iss": "https://oidc.eks.us-west-2.amazonaws.com/id/1C3DD11C7209255C21318440FF90E6E5",
  "kubernetes.io": {
    "namespace": "app1",
    "pod": {
      "name": "app1-v1-56b9f94b4-dvd5c",
      "uid": "376f3cff-44fe-4a00-b9d4-970555f311d3"
    },
    "serviceaccount": {
      "name": "default",
      "uid": "d0c2ed78-fc24-4548-903a-a5879bd6f06f"
    }
  },
  "nbf": 1713194939,
  "sub": "system:serviceaccount:app1:default"
}
:::

let's see how we can assume an IAM role with this token:

```bash
aws eks-auth assume-role-for-pod-identity --cluster-name $EKS_CLUSTER --token $TOKEN
```

We can see that out IAM session contains some IAM session tags that are store in the JWT token and allow to know who has assume this role.

We can see the detail of the session tags in the CloudTrail logs: 

```bash
events=$(aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventSource,AttributeValue=sts.amazonaws.com --max-items 100) 

echo $events | jq '.Events[] | (.CloudTrailEvent | fromjson | select(.requestParameters.tags[]?.key=="eks-cluster-arn"))'
```

::::expand{header="AWS STS event" defaultExpanded=false}
:::code{language=json showCopyAction=false showLineNumbers=true highlightLines='11,14,17,23,27,53,71'}
{
  "eventVersion": "1.08",
  "userIdentity": {
    "type": "AWSService",
    "invokedBy": "pods.eks.amazonaws.com"
  },
  "eventTime": "2024-04-16T09:33:20Z",
  "eventSource": "sts.amazonaws.com",
  "eventName": "AssumeRole",
  "awsRegion": "us-west-2",
  "sourceIPAddress": "pods.eks.amazonaws.com",
  "userAgent": "pods.eks.amazonaws.com",
  "requestParameters": {
    "roleArn": "arn:aws:iam::823571991546:role/aws-sigv4-client",
    "roleSessionName": "eks-eksworksho-app1-v1-56-d1861451-6ee5-4069-ae5d-741cbb99692a",
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
        "value": "app1"
      },
      {
        "key": "kubernetes-service-account",
        "value": "default"
      },
      {
        "key": "kubernetes-pod-name",
        "value": "app1-v1-56b9f94b4-dvd5c"
      },
      {
        "key": "kubernetes-pod-uid",
        "value": "376f3cff-44fe-4a00-b9d4-970555f311d3"
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
      "accessKeyId": "ASIA37QFXJP5M2XCT3LV",
      "sessionToken": "IQoJb3JpZ2luX2VjEIL//////////wEaCXVzLXdlc3QtMiJGMEQCIAYZzdfsDy76y4lH1wr9CqxwgH4Tppj5RxNDLQv1zSrnAiAWPmszQSsiKTRty+cbZJ3BsvxPMGLeMol2FmStIek33irbBAi7//////////8BEAAaDDgyMzU3MTk5MTU0NiIMOCcckQPwMq7t8OQVKq8ECLBUKkdC/6Jz8FsAn3eVvOUyfT3MXVOx5kPUWcEu6petffYGdpU87w/MsgJcb6GGO1MP3Zome8AJOqxZDsQhdj+n2X0zqVwaEoa+oDYWY19MrREPLS1FapSZ00KhFfFMHX/PSWFaX25Mgy424WQE3n9UsJ5HTPf6wupjJh5cHv1X+8fI0f8EU4fh7ktLShz3rrEVLCKLa2VpxzjFIbR2QdZ/fKI7GNbXV5FahMwYmw/NApKLIZsDstNrZyidjdaNZiynFMXcXyNpsRVvUZZjm2RVImjCzMBk/O+RbJf/qLwGkKDlSbMgTVoNJaIAl7q6+HWz8Xi9DWe2ZZxW9dNyy0N0vg8GlC4jipHX5D9WnRqBE57auf7nGvNNAvxPAgFb66Z1OImk9bycXka+4pAv+IEfzebdq/XlON1jdbanwxWEdqXlXYDyD2dkAy9/o/pCEND/+nthFguQWT8LeWlWTQvJ3c/gSyLthl+Xy57UQmAOGPM4+4wXaA84q/Tnq3wdxotn1bqsowCMlkSqLmIFE15lFDb/5Ky6i2NvIkPWZLKvYSfd3zaF08tY17YHhcO9KzUaz4apF4hQyS6oNT47Jy4QkqONtGOqg1A3jTWlbYtEPYgaMvj2+26Ce3eIO/wS4Jo+LIAdCN+kBw6kXDDEhuGVVpqcb8QcwndBngM54uZD9QGMlJkh6Dd3BUETuwxxCmWoKvfBlTTkBUozlNj6us20kRsIcKpzXcyiI3R4YTDgi/mwBjqPAYRtANge+V11kmTleyxjWgGuNsojx3aIVH6aWfQJaLCez22sPlTTTW+0NGzcJLikSKCks+wNXGBttmAIWvT1OxI085sCnALPyk2mTTf6BOj6xEGpeJQY4rI+rE55aaRxX5EZwIMJa4vq8NgpDPEffBYGdxmN89Q+l/RrBj3DBkEbTMisFM3FdQQ+V9TMrX/u",
      "expiration": "Apr 16, 2024, 3:33:20 PM"
    },
    "assumedRoleUser": {
      "assumedRoleId": "AROA37QFXJP5AGSZ5OSVM:eks-eksworksho-app1-v1-56-d1861451-6ee5-4069-ae5d-741cbb99692a",
      "arn": "arn:aws:sts::823571991546:assumed-role/aws-sigv4-client/eks-eksworksho-app1-v1-56-d1861451-6ee5-4069-ae5d-741cbb99692a"
    },
    "packedPolicySize": 61
  },
  "requestID": "5a244862-3083-453b-86d0-cfcfd8998acd",
  "eventID": "8164df1a-e944-36e0-a98f-380f0c97e81d",
  "readOnly": true,
  "resources": [
    {
      "accountId": "823571991546",
      "type": "AWS::IAM::Role",
      "ARN": "arn:aws:iam::823571991546:role/aws-sigv4-client"
    }
  ],
  "eventType": "AwsApiCall",
  "managementEvent": true,
  "recipientAccountId": "823571991546",
  "sharedEventID": "74108063-dd44-44eb-815d-53cbb7f5ed02",
  "eventCategory": "Management"
}
:::
::::

You can find more detail on how EKS Pod Identity works in the [Pod Identity module](/2-identity-and-access-management/3-eks-pod-identity/3-eks-pod-identity-deep-dive)


## How to force connection through VPC Lattice ?

At this step, we saw how we can connect to app2 through vpc lattice, and benefits from the IAM Auth policy.

But what prevent me to directly connecto to the internal kubernetes service ?

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT exec -ti -n app1 deployments/app1-v1 -- curl app2-v1.app2
```

To prevent this, we can rely on [VPC CNI Network policies](https://aws.amazon.com/blogs/containers/amazon-vpc-cni-now-supports-kubernetes-network-policies/).

We can activate the network policies with : 

```bash
aws eks create-addon --cluster-name eksworkshop-eksctl --addon-name vpc-cni --addon-version v1.14.0-eksbuild.3 \
    --resolve-conflicts OVERWRITE --configuration-values '{"enableNetworkPolicy": "true", "nodeAgent": {"enableCloudWatchLogs": "true"}}'     
````

You can Follow the steps in the [network policy modules](/6-network-security/1-network-policies/) to know more..

Once VPC CNI Network policies are activated, we can create simple rules to deny requests o, kubernetes services from other namespaces:

:::code{language=bash showCopyAction=true showLineNumbers=true highlightLines='25'}
cat << EOF > manifests/network-policy-app2-deny-from-other-namespaces.yaml
kind: NetworkPolicy
apiVersion: networking.k8s.io/v1
metadata:
  namespace: app2
  name: deny-from-other-namespaces
spec:
  podSelector:
    matchLabels:
  ingress:
  - from:
    - podSelector: {}
---
kind: NetworkPolicy
apiVersion: networking.k8s.io/v1
metadata:
  namespace: app2
  name: allow-vpc-lattice
spec:
  podSelector:
    matchLabels:
  ingress:
  - from:
    - ipBlock:
        cidr: 169.254.171.0/24
EOF
kubectl --context $EKS_CLUSTER1_CONTEXT apply -f manifests/network-policy-app2-deny-from-other-namespaces.yaml
:::

> You can find the VPC lattice prefix IP range from the following command:
> ```bash
> latticePrefix=$(aws ec2 describe-managed-prefix-lists --filters Name=owner-id,Values=AWS | jq '.PrefixLists[] | select(.PrefixListName=="com.amazonaws.us-west-2.vpc-lattice") | .PrefixListId' -r)
>
> aws ec2 get-managed-prefix-list-entries --prefix-list-id $latticePrefix --query 'Entries[].Cidr'
> ```

Try again to connect directly to the kubernetes service

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT exec -ti -n app1 deployments/app1-v1 -- curl -m 2 app2-v1.app2
```

::::expand{header="Check Output"}
```
curl: (28) Connection timed out after 2001 milliseconds
command terminated with exit code 28
```
::::

Try again to connect with VPC lattice: 

```bash
app2DNS=$(kubectl --context $EKS_CLUSTER1_CONTEXT get httproute app2 -n app2 -o json | jq -r '.metadata.annotations."application-networking.k8s.aws/lattice-assigned-domain-name"')
kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/app1-v1 -n app1 -c app1-v1 -- /bin/bash -c '\
TOKEN=$(cat $AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE) && \
STS=$(curl -s 169.254.170.23/v1/credentials -H "Authorization: $TOKEN") && \
curl -s --aws-sigv4 "aws:amz:${AWS_REGION}:vpc-lattice-svcs" --user $(echo $STS | jq ".AccessKeyId" -r):$(echo $STS | jq ".SecretAccessKey" -r) -H "x-amz-content-sha256: UNSIGNED-PAYLOAD" -H "x-amz-security-token: $(echo $STS | jq ".Token" -r)" \
'$app2DNS
```

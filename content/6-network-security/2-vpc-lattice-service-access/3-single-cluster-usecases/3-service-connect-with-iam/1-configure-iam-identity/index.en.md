---
title : "Configuring IAM Identity for app1 service"
weight : 10
---

## Configuring IAM Identity for the client i.e. `app1-app1` Service

Amazon VPC Lattice uses AWS Signature Version 4 (SigV4) for client authentication. After the Auth Policy is enabled on the Amazon VPC Lattice Service, it is also necessary to make changes on the service caller side, so that the HTTP requests include the signed `Authorization` header, as well as other headers such as `x-amz-content-sha256`, `x-amz-date` and `x-amz-security-token` when making HTTP requests. The details of [AWS Sig v4 can be found here](https://docs.aws.amazon.com/IAM/latest/UserGuide/create-signed-request.html).

There are multiple options to sign the request for Amazon VPC Lattice services.

   1. **[AWS SDK](https://docs.aws.amazon.com/vpc-lattice/latest/ug/sigv4-authenticated-requests.html)**: This option has the optimal performance, but requires code changes for the application.
   2. **[AWS SIGv4 Proxy Admission Controller](https://github.com/awslabs/aws-sigv4-proxy)**:  This option use AWS SIGv4 Proxy to forward HTTP request and add AWS Sigv4 headers. The details is covered in this [post](https://aws.amazon.com/blogs/containers/application-networking-with-amazon-vpc-lattice-and-amazon-eks/).
   3. **[Kyverno policy engine](https://kyverno.io/)**: It runs as a [dynamic admission controller](https://kubernetes.io/docs/reference/access-authn-authz/extensible-admission-controllers/) and receives mutating admission webhook HTTP callbacks from the API server, and applies matching policies to return results that enforce admission policies. In other words, Kyverno can automatically inject the sidecar and init containers automatically. We will be using ths option in this module.


First, we can use the SDK to sign the request.
Nut the first step is to be able to provide an IAM Role to the Pod that needs to sign the request. For that we are going to leverage the new [EKS Pod Identity](https://aws.amazon.com/about-aws/whats-new/2023/11/amazon-eks-pod-identity/?nc1=h_ls) feature:

### 1. Create an IAM Role for out pod
<!--
```bash
eksctl create podidentityassociation \
    --cluster $EKS_CLUSTER1_NAME \
    --namespace app1 \
    --service-account-name default \
    --permission-policy-arns="arn:aws:iam::111122223333:policy/permission-policy-1, arn:aws:iam::111122223333:policy/permission-policy-2" \
    --well-known-policies="autoScaler,externalDNS" \
    --permissions-boundary-arn arn:aws:iam::111122223333:policy/permissions-boundary
```
-->

We are going to create an IAM role that will be associated with our app1-v1 pod. This Role will have the permission to access the VPC Lattice Service.
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
  }' \
  --permissions-boundary arn:aws:iam::aws:policy/VPCLatticeServicesInvokeAccess

aws iam attach-role-policy \
  --policy-arn arn:aws:iam::aws:policy/VPCLatticeServicesInvokeAccess \
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
aws eks describe-addon-versions --kubernetes-version 1.28 --addon-name eks-pod-identity-agent  \
    --query 'addons[].addonVersions[].{Version: addonVersion, Defaultversion: compatibilities[0].defaultVersion}' --output table
```

::::expand{header="Check Output"}
```
-----------------------------------------
|         DescribeAddonVersions         |
+-----------------+---------------------+
| Defaultversion  |       Version       |
+-----------------+---------------------+
|  True           |  v1.1.0-eksbuild.1  |
|  False          |  v1.0.0-eksbuild.1  |
+-----------------+---------------------+
```
::::

Create the Addon
```bash
aws eks create-addon --cluster-name $EKS_CLUSTER1_NAME --addon-name eks-pod-identity-agent --addon-version v1.1.0-eksbuild.1 
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
```
      AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE:  /var/run/secrets/pods.eks.amazonaws.com/serviceaccount/eks-pod-identity-token
      /var/run/secrets/pods.eks.amazonaws.com/serviceaccount from eks-pod-identity-token (ro)
  eks-pod-identity-token:
```
::::

We can see that some env var and volume mount were added into the pod.

Now let's check what is the identity used inside the pod:

```bash
 kubectl --context $EKS_CLUSTER1_CONTEXT exec -ti -n app1 deployment/app1-v1 -- aws sts get-caller-identity
```

::::expand{header="Check Output"}
```
{
    "UserId": "AROARNLDHSLO22SR73KBL:eks-eksworksho-app1-v1-5b-de387d83-d53c-4022-bebe-d6e35a034e4b",
    "Account": "012345678901",
    "Arn": "arn:aws:sts::012345678901:assumed-role/aws-sigv4-client/eks-eksworksho-app1-v1-5b-de387d83-d53c-4022-bebe-d6e35a034e4b"
}
```
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

## Use the SDK to sign the requests.

In this first step, which will be the recommended one, we are going to simulate how you can leverage AWS SDK to use the IAM Role to sign the requests directly.

We are going to emulate this by using the `curl` programm which has an integration with AWS SDK to sign the requests.


```bash
kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/app1-v1 -n app1 -c app1-v1 -- /bin/bash -c 'TOKEN=$(cat $AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE) && STS=$(curl 169.254.170.23/v1/credentials -H "Authorization: $TOKEN") && curl -s --aws-sigv4 "aws:amz:${AWS_REGION}:vpc-lattice-svcs" --user $(echo $STS | jq ".AccessKeyId" -r):$(echo $STS | jq ".SecretAccessKey" -r) -H "x-amz-content-sha256: UNSIGNED-PAYLOAD" -H "x-amz-security-token: $(echo $STS | jq ".Token" -r)" '$app2DNS
```

::::expand{header="Check Output" defaultExpanded=true}
```
Requsting to Pod(app2-v1-56f7c48bbf-nl6gg): Hello from app2-v1
```
::::

We correctly sign the requests and had access to the app2 service with IAM authentication.



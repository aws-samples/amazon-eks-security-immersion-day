---
title : "Create IAM role"
weight : 21
---


In an AWS CodePipeline, we are going to use AWS CodeBuild to deploy a sample Kubernetes service. This requires an AWS Identity and Access Management (IAM) role capable of interacting with the EKS cluster.

In this step, we are going to create an IAM role and add an inline policy that we will use in the CodeBuild stage to interact with the EKS cluster via kubectl.

Set below environment variables
```bash
export ACCOUNT_ID=$(aws sts get-caller-identity --output text --query Account)
export AWS_REGION=$(curl -s 169.254.169.254/latest/dynamic/instance-identity/document | jq -r '.region')
```

Create the role.

```bash
cd ~/environment

TRUST="{ \"Version\": \"2012-10-17\", \"Statement\": [ { \"Effect\": \"Allow\", \"Principal\": { \"AWS\": \"arn:aws:iam::${ACCOUNT_ID}:root\" }, \"Action\": \"sts:AssumeRole\" } ] }"

echo '{ "Version": "2012-10-17", "Statement": [ { "Effect": "Allow", "Action": "eks:Describe*", "Resource": "*" } ] }' > /tmp/iam-role-policy

aws iam create-role --role-name EksWorkshopCodeBuildKubectlRole --assume-role-policy-document "$TRUST" --output text --query 'Role.Arn'

aws iam put-role-policy --role-name EksWorkshopCodeBuildKubectlRole --policy-name eks-describe --policy-document file:///tmp/iam-role-policy

```


::::expand{header="Check Output"}
```bash
arn:aws:iam::XXXXXXXXXX:role/EksWorkshopCodeBuildKubectlRole
```
::::

Now that we have the IAM role created, we are going to add the role to the **aws-auth** `ConfigMap` for the EKS cluster.

Once the ConfigMap includes this new role, kubectl in the CodeBuild stage of the pipeline will be able to interact with the EKS cluster via the IAM role.


```bash
eksctl create iamidentitymapping \
  --cluster eksworkshop-eksctl \
  --arn arn:aws:iam::${ACCOUNT_ID}:role/EksWorkshopCodeBuildKubectlRole \
  --username build \
  --group system:masters

```

::::expand{header="Check Output"}
```bash
2023-09-21 09:19:54 [ℹ]  checking arn arn:aws:iam::XXXXXXXXXX:role/EksWorkshopCodeBuildKubectlRole against entries in the auth ConfigMap
2023-09-21 09:19:54 [ℹ]  adding identity "arn:aws:iam::XXXXXXXXXX:role/EksWorkshopCodeBuildKubectlRole" to auth ConfigMap
```
::::

Run the below command to ensure that **aws-auth** `configmap` is updated successfully.

```bash
kubectl -n kube-system get cm aws-auth -oyaml
```

::::expand{header="Check Output"}
```yaml
apiVersion: v1
data:
  mapRoles: |
    - groups:
      - system:bootstrappers
      - system:nodes
      rolearn: arn:aws:iam::XXXXXXXXXX:role/eks-bootstrap-template-ws-EKSNodegroupRole-vR1giMDkzUTR
      username: system:node:{{EC2PrivateDNSName}}
    - groups:
      - system:masters
      rolearn: arn:aws:iam::XXXXXXXXXX:role/EksWorkshopCodeBuildKubectlRole
      username: build
  mapUsers: |
    []
kind: ConfigMap
metadata:
  creationTimestamp: "2023-09-19T04:27:41Z"
  name: aws-auth
  namespace: kube-system
  resourceVersion: "437687"
  uid: b8e4bdf3-cfa6-497b-83f2-9669c6fb00ca
```
::::    
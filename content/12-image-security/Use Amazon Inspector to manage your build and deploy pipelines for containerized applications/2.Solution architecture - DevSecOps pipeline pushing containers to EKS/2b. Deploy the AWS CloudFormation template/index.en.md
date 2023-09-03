---
title : "Run cloudformation to create DevSecOps piepline"
weight : 21
---


In an AWS CodePipeline, we are going to use AWS CodeBuild to deploy a sample Kubernetes service. This requires an AWS Identity and Access Management (IAM) role capable of interacting with the EKS cluster.

In this step, we are going to create an IAM role and add an inline policy that we will use in the CodeBuild stage to interact with the EKS cluster via kubectl.

Create the role:



Set below environment variables
```bash
export ACCOUNT_ID=$(aws sts get-caller-identity --output text --query Account)
export AWS_REGION=$(curl -s 169.254.169.254/latest/dynamic/instance-identity/document | jq -r '.region')
```


Create the roles:

```bash
cd ~/environment

TRUST="{ \"Version\": \"2012-10-17\", \"Statement\": [ { \"Effect\": \"Allow\", \"Principal\": { \"AWS\": \"arn:aws:iam::${ACCOUNT_ID}:root\" }, \"Action\": \"sts:AssumeRole\" } ] }"

echo '{ "Version": "2012-10-17", "Statement": [ { "Effect": "Allow", "Action": "eks:Describe*", "Resource": "*" } ] }' > /tmp/iam-role-policy

aws iam create-role --role-name EksWorkshopCodeBuildKubectlRole --assume-role-policy-document "$TRUST" --output text --query 'Role.Arn'

aws iam put-role-policy --role-name EksWorkshopCodeBuildKubectlRole --policy-name eks-describe --policy-document file:///tmp/iam-role-policy

```

Now that we have the IAM role created, we are going to add the role to the aws-auth ConfigMap for the EKS cluster.

Once the ConfigMap includes this new role, kubectl in the CodeBuild stage of the pipeline will be able to interact with the EKS cluster via the IAM role.



```bash
ROLE="   - rolearn: arn:aws:iam::${ACCOUNT_ID}:role/EksWorkshopCodeBuildKubectlRole\n  username: build\n   groups:\n   - system:masters"

kubectl get -n kube-system configmap/aws-auth -o yaml | awk "/mapRoles: \|/{print;print \"$ROLE\";next}1" > /tmp/aws-auth-patch.yml

kubectl patch configmap/aws-auth -n kube-system --patch "$(cat /tmp/aws-auth-patch.yml)"

```

This section will focus on building code commit repository and codepipeline for continous integration/deployment .

Click [here](https://ws-assets-prod-iad-r-pdx-f3b3f9f1a7d6a3d0.s3.us-west-2.amazonaws.com/165b0729-2791-4452-8920-53b734419050/inspector-codepipeline.yaml) to download cloudformation template to create code commit repository and codepipeline

Upload the Cloudformation template downloaded to cloud9 environment
![Enable Inspector!](/static/images/image-security/devsecops-inspector/cloud9-uploadfile.png)

1. Set below environment variables
```bash
export ACCOUNT_ID=$(aws sts get-caller-identity --output text --query Account)
export AWS_REGION=$(curl -s 169.254.169.254/latest/dynamic/instance-identity/document | jq -r '.region')
```
2.  Run cloudformation to create code repository codepipeline.
```bash
cd ~/environment
 aws cloudformation deploy --stack-name inspector-container-scan --template-file inspector-codepipeline.yaml --parameter-overrides CodeBucket=ws-assets-prod-iad-r-pdx-f3b3f9f1a7d6a3d0 CodeKey=165b0729-2791-4452-8920-53b734419050/inspector-pipeline/SourceOutput/code.zip --capabilities CAPABILITY_NAMED_IAM
```


The deployment of this CloudFormation stack will take 3–5 minutes.

Cloudformation script will create the following
1. Code commit Repository
2. Code pipeline
3. SNS topic to request approval messages
3. Lambda to auto approve/reject pipeline based on inspector scan summary
4. DynamoDb table to store pipeline stage and container details
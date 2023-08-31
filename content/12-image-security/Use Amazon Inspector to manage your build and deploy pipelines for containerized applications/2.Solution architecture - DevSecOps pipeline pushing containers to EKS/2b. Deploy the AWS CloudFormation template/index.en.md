---
title : "Run cloudformation to create DevSecOps piepline"
weight : 21
---


For the purpose of this workshop, you will use Amazon Elastic Container Registry (Amazon ECR) to create a private repository for a sample open source container image.

This section will focus on building code commit repository and codepipeline for continous integration/deployment .

Click [here](https://ws-assets-prod-iad-r-pdx-f3b3f9f1a7d6a3d0.s3.us-west-2.amazonaws.com/165b0729-2791-4452-8920-53b734419050/inspector-codepipeline.yaml) to download cloudformation template to create code commit repository and codepipeline
Click [here](https://ws-assets-prod-iad-r-pdx-f3b3f9f1a7d6a3d0.s3.us-west-2.amazonaws.com/165b0729-2791-4452-8920-53b734419050/inspector-pipeline/SourceOutput/code.zip) to download code to be checked in for the exercise

Upload the files downloaded to cloud9 environment
![Enable Inspector!](/static/images/image-security/devsecops-inspector/cloud9-uploadfile.png)

1. Set below environment variables
```bash
export ACCOUNT_ID=$(aws sts get-caller-identity --output text --query Account)
export AWS_REGION=$(curl -s 169.254.169.254/latest/dynamic/instance-identity/document | jq -r '.region')
```
2.  Run cloudformation to create code repository codepipeline.
```bash
cd ~/environment
 aws cloudformation deploy --stack-name inspector-container-scan --template-file inspector-codepipeline.yaml --parameter-overrides CodeBucket=ws-assets-prod-iad-r-pdx-f3b3f9f1a7d6a3d0.s3.us-west-2.amazonaws.com CodeKey=165b0729-2791-4452-8920-53b734419050/inspector-pipeline/SourceOutput/code.zip --capabilities CAPABILITY_NAMED_IAM
```


The deployment of this CloudFormation stack will take 3–5 minutes.

Cloudformation script will create the following
1. Code commit Repository
2. Code pipeline
3. SNS topic to request approval messages
3. Lambda to auto approve/reject pipeline based on inspector scan summary
4. DynamoDb table to store pipeline stage and container details
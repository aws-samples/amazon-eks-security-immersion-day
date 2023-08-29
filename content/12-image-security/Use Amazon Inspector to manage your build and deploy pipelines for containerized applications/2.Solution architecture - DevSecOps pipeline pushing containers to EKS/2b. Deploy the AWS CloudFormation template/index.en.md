---
title : "Solution Architecture - DevSecOps piepline pushing containers to EKS"
weight : 21
---


For the purpose of this workshop, you will use Amazon Elastic Container Registry (Amazon ECR) to create a private repository for a sample open source container image.

This section will focus on building code commit repository and codepipeline for continous integration/deployment .



1. Set below environment variables
```bash
export ACCOUNT_ID=$(aws sts get-caller-identity --output text --query Account)
export AWS_REGION=$(curl -s 169.254.169.254/latest/dynamic/instance-identity/document | jq -r '.region')
```
2.  Clone the sample application github repository.
```bash
cd ~/environment
 aws cloudformation deploy --stack-name inspector-container-scan --template-file inspector-container-scan.yaml --parameter-overrides CodeBucket=inspectpr-pipeline CodeKey=InspectorRepo/SourceOutput/code.zip --capabilities CAPABILITY_NAMED_IAM
```


The deployment of this CloudFormation stack will take 3–5 minutes.
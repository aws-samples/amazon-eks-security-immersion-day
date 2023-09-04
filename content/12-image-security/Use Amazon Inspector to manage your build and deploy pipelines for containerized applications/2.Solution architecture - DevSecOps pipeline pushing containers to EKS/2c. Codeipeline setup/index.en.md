---
title : "Codepipeline setup"
weight : 21
---

This section will focus on building code commit repository and codepipeline for continous integration/deployment .



 Run cloudformation to create code repository codepipeline.
```bash
cd ~/environment
aws cloudformation create-stack --stack-name inspector-container-scan --template-url https://ws-assets-prod-iad-r-pdx-f3b3f9f1a7d6a3d0.s3.us-west-2.amazonaws.com/165b0729-2791-4452-8920-53b734419050/inspector-codepipeline.yaml --parameter ParameterKey=CodeBucket,ParameterValue=ws-assets-prod-iad-r-pdx-f3b3f9f1a7d6a3d0 ParameterKey=CodeKey,ParameterValue=165b0729-2791-4452-8920-53b734419050/inspector-pipeline/SourceOutput/code.zip --capabilities CAPABILITY_NAMED_IAM
```


The deployment of this CloudFormation stack will take 3–5 minutes.

Cloudformation script will create the following
1. Code commit Repository
2. Code pipeline
3. SNS topic to request approval messages
3. Lambda to auto approve/reject pipeline based on inspector scan summary
4. DynamoDb table to store pipeline stage and container details
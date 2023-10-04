---
title : "CodePipeline setup"
weight : 21
---

This section will focus on building code commit repository and codepipeline for continuous integration/deployment .



 Run cloudformation to create code repository codepipeline.
```bash
cd ~/environment
aws cloudformation create-stack --stack-name inspector-container-scan --template-url https://ws-assets-prod-iad-r-pdx-f3b3f9f1a7d6a3d0.s3.us-west-2.amazonaws.com/165b0729-2791-4452-8920-53b734419050/inspector-codepipeline.yaml --parameter ParameterKey=CodeBucket,ParameterValue=ws-assets-prod-iad-r-pdx-f3b3f9f1a7d6a3d0 ParameterKey=CodeKey,ParameterValue=165b0729-2791-4452-8920-53b734419050/inspector-pipeline/SourceOutput/code.zip --capabilities CAPABILITY_NAMED_IAM
```
::::expand{header="Check Output"}
```bash

{
"StackId": "arn:aws:cloudformation:us-west-2:XXXXXXXXXXXX:stack/inspector-container-scan/XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
}
```
::::


 Cloudformation [template](https://ws-assets-prod-iad-r-pdx-f3b3f9f1a7d6a3d0.s3.us-west-2.amazonaws.com/165b0729-2791-4452-8920-53b734419050/inspector-codepipeline.yaml). can be downloaded as required for future reference

The deployment of this CloudFormation stack will take 3–5 minutes.

Snapshot of the [CloudFormation](https://us-west-2.console.aws.amazon.com/cloudformation/home?region=us-west-2#/) Stack **inspector-container-scan** resources created looks like below.

![Cloudformation Resources](/static/images/image-security/devsecops-inspector/Cloudformation-resources.png)

The CloudFormation Stack **inspector-container-scan** creates the following

1. [AWS CodeCommit Repository](https://us-west-2.console.aws.amazon.com/codesuite/codecommit/repositories/ContainerComponentsRepo/browse?region=us-west-2) `ContainerComponentsRepo`

![codecommitrepo](/static/images/image-security/devsecops-inspector/codecommitrepo.png)

2. [AWS CodePipeline](https://us-west-2.console.aws.amazon.com/codesuite/codepipeline/pipelines/ContainerBuildDeployPipeline/view?region=us-west-2) `ContainerBuildDeployPipeline`

![codepipeline](/static/images/image-security/devsecops-inspector/codepipeline.png)


3. [Amazon Simple Notification Service SNS topic](https://us-west-2.console.aws.amazon.com/sns/v3/home?region=us-west-2#/topics) `ContainerApprovalTopic` to request approval messages

![sns](/static/images/image-security/devsecops-inspector/sns.png)


3. [AWS Lambda Function](https://us-west-2.console.aws.amazon.com/lambda/home?region=us-west-2#/functions/process-build-approval-msg?tab=code) `process-build-approval-msg` to auto approve/reject pipeline based on inspector scan summary
![lambda_approval](/static/images/image-security/devsecops-inspector/lambda_approval.png)

4. [AWS Lambda Function](https://us-west-2.console.aws.amazon.com/lambda/home?region=us-west-2#/functions/eval-container-scan-results?tab=code) `eval-container-scan-results` to evaluate the container scan results.
tor scan summary
![lanbda_eval_function](/static/images/image-security/devsecops-inspector/lanbda_eval_function.png)

5. [Amazon DynamoDB Table](https://us-west-2.console.aws.amazon.com/dynamodbv2/home?region=us-west-2#table?name=ContainerImageApprovals) `ContainerImageApprovals` to store pipeline stage and container details

![dynamodb](/static/images/image-security/devsecops-inspector/dynamodb.png)

6. [AWS CodeBuild Project](https://us-west-2.console.aws.amazon.com/codesuite/codebuild/projects?region=us-west-2) `container-build` 

![build_project](/static/images/image-security/devsecops-inspector/build_project.png)

7. [AWS CodeBuild Project](https://us-west-2.console.aws.amazon.com/codesuite/codebuild/projects?region=us-west-2) `container-deploy` 

![deploy_project](/static/images/image-security/devsecops-inspector/deploy_project.png)

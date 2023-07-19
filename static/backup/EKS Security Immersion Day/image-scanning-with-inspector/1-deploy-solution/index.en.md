---
title : "Deploy the Solution"
weight : 21
---


Before we get a detailed understanding of how the container pipeline solution works, let's first deploy the solution using AWS CloudFormation in the AWS account, as it takes some time to create all the required infrastructure. This section will walk you through the steps to deploy the container approval pipeline.

#### Step 1: Activate Amazon Inspector in your AWS account

The sample solution provided by this blog post requires that you activate [Amazon Inspector](https://aws.amazon.com/inspector/#get-started) in your AWS account. If this service is not activated in your account, learn more about the [free trial and pricing](https://aws.amazon.com/inspector/pricing/) for this service, and follow the steps in [Getting started with Amazon Inspector](https://docs.aws.amazon.com/inspector/latest/user/getting_started_tutorial.html) to set up the service and start monitoring your account.


#### Step 2: Deploy the AWS CloudFormation template

For this next step, make sure you deploy the template within the AWS account and the recommended AWS Region.

**To deploy the CloudFormation stack**
   1. Choose the following **Launch Stack** button to launch a CloudFormation stack in your account. Use the AWS Management Console navigation bar to choose the region you want to deploy the stack in. [Launch Stack](https://console.aws.amazon.com/cloudformation/home?#/stacks/create/review?templateURL=https:%2F%2Fs3.amazonaws.com%2Fawsiammedia%2Fpublic%2Fsample%2F1277-How-to-use-Amazon-Inspector%2Finspector-container-scan-blog-template.yaml&stackName=inspector-container-pipeline-blog&param_CodeBucket=awsiammedia&param_CodeKey=public/sample/1277-How-to-use-Amazon-Inspector/inspector-pipeline-repo.zip)
   2. Review the stack name and the parameters for the template. The parameters are pre-populated with the necessary values, and there is no need to change them.
   3. Scroll to the bottom of the **Quick create stack** screen and select the checkbox next to **I acknowledge that AWS CloudFormation might create IAM resources**.
   4. Choose **Create stack**. The deployment of this CloudFormation stack will take 3–5 minutes.


While the CloudFormation stack is getting deployed successfully, let's proceed to get an understanding of how pipeline works.


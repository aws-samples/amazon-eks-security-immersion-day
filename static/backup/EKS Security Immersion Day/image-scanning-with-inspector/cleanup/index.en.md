---
title : "Cleanup"
weight : 29
---

When you’re finished deploying and testing the solution, use the following steps to remove the solution stack from your account.

**To delete images from the Amazon ECR repository**

1. In the [Amazon ECR console](https://console.aws.amazon.com/ecr/home), navigate to the AWS account and Region where you deployed the solution.
2. Choose the link for the repository named **inspector-blog-images**.
3. Delete all of the images that are listed in the repository.

**To delete objects in the CodePipeline artifact bucket**

1. In the [Amazon S3 console](https://console.aws.amazon.com/s3/) in your AWS account, locate the bucket whose name starts with blog-base-setup-codepipelineartifactstorebucket.
2. Delete the **ContainerBuildDeploy** folder that is in the bucket.

**To delete the CloudFormation stack**
In the [CloudFormation console](https://console.aws.amazon.com/cloudformation), delete the CloudFormation stack that was created to perform the steps in this post.


---
title : "Image Scanning with Amazon Inspector and DevSecOps with  AWS CodePipeline"
weight : 34
---

In this module, we’ll explore the process that Amazon Inspector takes to scan container images. We’ll also show how you can integrate Amazon Inspector into your containerized application build and deployment pipeline, and control pipeline steps based on the results of an Amazon Inspector container image scan.

The solution outlined in this post covers a deployment pipeline modeled in [AWS CodePipeline](https://aws.amazon.com/codepipeline/). The source for the pipeline is [AWS CodeCommit](https://aws.amazon.com/codecommit/), and the build of the container image is performed by [AWS CodeBuild](https://aws.amazon.com/codebuild/). The solution uses a collection of [AWS Lambda](https://aws.amazon.com/lambda/) functions and an [Amazon DynamoDB](https://aws.amazon.com/dynamodb/) table to evaluate the container image status and make an automated decision about deploying the container image. Finally, the pipeline has a deploy stage that will deploy the container image into an [Amazon Elastic Container Service (Amazon ECS) cluster](https://aws.amazon.com/ecs/).



Although this solution uses AWS continuous integration and continuous delivery (CI/CD) services such as CodePipeline and CodeBuild, you can also build similar capabilities by using third-party CI/CD solutions. In addition to CodeCommit, other third-party code repositories such as GitHub or [Amazon Simple Storage Service (Amazon S3)](https://aws.amazon.com/s3/) can be substituted in as a source for the pipeline.


Here is the high-level architecture of the solution, which integrates Amazon Inspector into a container build and deploy pipeline.



![inspector-with-codepipeline](/static/images/image-security/inspector-with-codepipeline.png)


The high-level workflow is as follows:

1. You commit the image definition to a CodeCommit repository.
2. An [Amazon EventBridge](https://aws.amazon.com/eventbridge/) rule detects the repository commit and initiates the container pipeline.
3. The **source** stage of the pipeline pulls the image definition and build instructions from the CodeCommit repository.
4. The **build** stage of the pipeline creates the container image and stores the final image in Amazon ECR.
5. The **ContainerVulnerabilityAssessment** stage sends out a request for approval by using an [Amazon Simple Notification Service (Amazon SNS)](https://aws.amazon.com/sns/) topic. A Lambda function associated with the topic stores the details about the container image and the active pipeline, which will be needed in order to send a response back to the pipeline stage.
6. Amazon Inspector scans the Amazon ECR image for vulnerabilities.
7. The Lambda function receives the Amazon Inspector scan summary message, through EventBridge, and makes a decision on allowing the image to be deployed. The function retrieves the pipeline approval details so that the approve or reject message is sent to the correct active pipeline stage.
8. The Lambda function submits an **Approved** or **Rejected** status to the deployment pipeline.
9. CodePipeline deploys the container image to an Amazon ECS cluster and completes the pipeline successfully if an approval is received. The pipeline status is set to **Failed** if the image is rejected.



---
title : "Solution Architecture - DevSecOps pipeline pushing containers to EKS"
weight : 21
---

In this section, following diagram shows high-level architecture of the solution, which integrates Amazon Inspector into a container build and deploy pipeline.

![Solution Architecture](/static/images/image-security/devsecops-inspector/EKSContainerInspector.png)

The high level workflow is as follows

1) You commit the image definition to a CodeCommit repository.
2) An [Amazon EventBridge](https://aws.amazon.com/eventbridge/) rule detects the repository commit and initiates the container pipeline.
3) The source stage of the pipeline pulls the image definition and build instructions from the CodeCommit repository.
4) The build stage of the pipeline creates the container image and stores the final image in Amazon ECR.
5) The ContainerVulnerabilityAssessment stage sends out a request for approval by using an [Amazon Simple Notification Service (Amazon SNS)](https://aws.amazon.com/sns/) topic. A Lambda function associated with the topic stores the details about the container image and the active pipeline, which will be needed in order to send a response back to the pipeline stage.
6) Amazon Inspector scans the Amazon ECR image for vulnerabilities.
7) The Lambda function receives the Amazon Inspector scan summary message, through EventBridge, and makes a decision on allowing the image to be deployed. The function retrieves the pipeline approval details so that the approve or reject message is sent to the correct active pipeline stage.
8) The Lambda function submits an **Approved** or **Rejected** status to the deployment pipeline.
9) CodePipeline deploys the container image to an Amazon ECS cluster and completes the pipeline successfully if an approval is received. The pipeline status is set to Failed if the image is rejected.


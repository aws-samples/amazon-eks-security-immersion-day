---
title : "Review CI/CD pipeline"
weight : 21
---


::alert[Please ensure you are in the correct region for the tasks listed below. You can select the correct region from the region selection dropdown towards the top right of the AWS console.]{header="Note"}

Select Services and go to CodePipeline under Developer Tools. Identify the Pipeline created for ContainerBuildDeployPipeline. Review the stages in the pipeline and notice the approval stage.

CodePipeline should look like as shown once all CloudFormation templates are completed and pipeline is done. You may check that by selecting Services -> CodePipeline -> Select the latest created pipeline.

![Inspector pipeline](/static/images/image-security/devsecops-inspector/Inspector-pipeline.png)

Here is further explanation for each stages of Code Pipeline.

## Source stage

1. When a new commit is made to the CodeCommit repository, an EventBridge rule, which is configured to look for updates to the CodeCommit repository, initiates the CodePipeline source action.
2. The source action then collects files from the source repository and makes them available to the rest of the pipeline stages.
3. The pipeline then moves to the build stage.


## Build stage

1. In the build stage, CodeBuild extracts the Dockerfile that holds the container definition and the buildspec.yaml file that contains the overall build instructions
2. CodeBuild creates the final container image and then pushes the container image to the designated Amazon ECR repository. 
3. Amazon Inspector scanning begins to check the image for vulnerabilities.
4. As part of the build, the image digest of the container image is stored as a variable in the build stage so that it can be used by later stages in the pipeline.

## Container Vulnerability Assessment

1. Request for approval is sent by using [Amazon simple notification service (SNS)](https://console.aws.amazon.com/sns)
2. Lambda associated to the SNS topic stores details about the container image and active pipeline.This is needed to send the response back to pipeline stage
3. Since Scan on push ie enabled during the ECR repository creation, the image will be automatically scanned by Amazon inspector for vulnerabilities.
4. On completion of scan,Lambda function receives the Amazon inspector scan summary ,through [Amazon EventBridge ](https://console.aws.amazon.com/events).
5. Lambda makes a decision on allowing image to be deployed
6. Lambda retrieves pipeline details and sends auto rejection message if there are critical vulnerabilities found
7. Users can also manually approve container vulnerability assessment in the pipeline


### Deploy stage

1. Once the ContainerVulnerabilityAssessment stage is approved, the container is deployed into the EKS cluster using kubectl

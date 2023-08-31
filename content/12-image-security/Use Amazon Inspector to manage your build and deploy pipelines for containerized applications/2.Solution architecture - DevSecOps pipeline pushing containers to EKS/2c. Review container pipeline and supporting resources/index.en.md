---
title : "Review CI/CD pipeline"
weight : 21
---


::alert[Please ensure you are in the correct region for the tasks listed below. You can select the correct region from the region selection dropdown towards the top right of the AWS console.]{header="Note"}

Select Services and go to CodePipeline under Developer Tools. Identify the Pipeline created for ContainerBuildDeployPipeline. Review the stages in the pipeline and notice the approval stage.

Below is a screenshot of CodePipeline once all CloudFormation templates are completed. You may check that by selecting Services -> CodePipeline -> Select the latest created pipeline.

![Inspector pipeline](/static/images/image-security/devsecops-inspector/Inspector-pipeline.png)

Here is further explanation for each stages of Code Pipeline.

Source stage

1. The pipeline is connected to repository.Any pushes to the repository,the pipeline will start

Build stage

1. buildspec.yaml is used for compiling and creating a container.
2. Container is pushed into [Elastic container repository](https://console.aws.amazon.com/ecr/repositories?)

   a) An Amazon ECR private registry hosts your container images in a highly available and scalable architecture. You can use your private registry to manage private image repositories consisting of Docker and Open Container Initiative (OCI) images and artifacts.
   ECR also integrates with the Docker CLI, so that you push and pull images from your development environments to your repositories.

   b) ECR provides enhanced scanning in tandem with Amazon inspector.Enhanced scanning is a capability offered with Amazon Inspector which provides automated continuous scanning.
   Inspector identifies vulnerabilities in both operating system and programming language (such as Python, Java, Ruby etc.) packages in real time.
3. The image is tagged as `latest` and stored in ECR.


Container Vulnerability Assessment

1. Request for approval is sent by using [Amazon simple notification service (SNS)](https://console.aws.amazon.com/sns)
2. Lambda associated to the SNS topic stores details about the container image and active pipeline.This is needed to send the response back to pipeline stage
3. Since Scan on push ie enabled during the ECR repository creation, the image will be automatically scanned by Amazon inspector for vulnerabilities.
4. On completion of scan,Lambda function receives the Amazon inspector scan summary ,through [Amazon EventBridge ](https://console.aws.amazon.com/events).
5. Lambda makes a decision on allowing image to be deployed
6. Lambda retrieves pipeline details and sends approval/rejection message to pipeline stage


Deploy stage

1. Once the ContainerVulnerabilityAssessment stage is approved, the container is deployed into the EKS cluster

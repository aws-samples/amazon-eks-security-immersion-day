---
title : "Container image build stage"
weight : 22
---

Let’s now review the build stage of the pipeline that is associated with the Amazon Inspector container solution. When a new commit is made to the CodeCommit repository, an EventBridge rule, which is configured to look for updates to the CodeCommit repository, initiates the CodePipeline source action. The source action then collects files from the source repository and makes them available to the rest of the pipeline stages. The pipeline then moves to the build stage.

In the build stage, CodeBuild extracts the Dockerfile that holds the container definition and the `buildspec.yaml` file that contains the overall build instructions. CodeBuild creates the final container image and then pushes the container image to the designated Amazon ECR repository. As part of the build, the image digest of the container image is stored as a variable in the build stage so that it can be used by later stages in the pipeline. Additionally, the build process writes the name of the container URI, and the name of the Amazon ECS task that the container should be associated with, to a file named `imagedefinitions.json`. This file is stored as an artifact of the build and will be referenced during the deploy phase of the pipeline.

Now that the image is stored in an Amazon ECR repository, Amazon Inspector scanning begins to check the image for vulnerabilities.

The details of the build stage are shown in below diagram.

![image-build-stage](/static/images/image-security/image-build-stage.png)



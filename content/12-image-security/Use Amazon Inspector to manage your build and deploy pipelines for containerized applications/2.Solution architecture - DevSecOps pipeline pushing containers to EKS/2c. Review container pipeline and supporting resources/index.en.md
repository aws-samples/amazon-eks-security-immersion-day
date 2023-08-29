---
title : "Solution Architecture - DevSecOps piepline pushing containers to EKS"
weight : 21
---

The CloudFormation stack is designed to deploy a collection of resources that will be used for an initial container build. When the CodePipeline resource is created, it will automatically pull the assets from the CodeCommit repository and start the pipeline for the container image.


1. In the CodePipeline console, navigate to the Region that the stack was deployed in.
2. Choose the pipeline named ContainerBuildDeployPipeline to show the full pipeline details
3. Review the Source and Build stage, which will show a status of Succeeded.
4. Review the ContainerVulnerabilityAssessment stage, which will show as failed with a Rejected status in the Manual Approval step.


![Codepipeline](/static/images/image-security/devsecops-inspector/inspector-codepipeline.png)
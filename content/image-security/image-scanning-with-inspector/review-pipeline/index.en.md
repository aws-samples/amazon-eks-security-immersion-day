---
title : "Review the container pipeline and supporting resources"
weight : 27
---

The CloudFormation stack is designed to deploy a collection of resources that will be used for an initial container build. When the CodePipeline resource is created, it will automatically pull the assets from the CodeCommit repository and start the pipeline for the container image.


**To review the pipeline and resources**

1. In the [CodePipeline console](https://console.aws.amazon.com/codepipeline/home), navigate to the Region that the stack was deployed in.
2. Choose the pipeline named **ContainerBuildDeployPipeline** to show the full pipeline details.
3. Review the **Source** and **Build** stage, which will show a status of **Succeeded**.
4. Review the **ContainerVulnerabilityAssessment** stage, which will show as failed with a **Rejected** status in the **Manual Approval** step.
   
Below diagram shows the full completed pipeline.

![codepipeline](/static/images/image-security/codepipeline.jpg)

5. Choose the **Details** link in the **Manual Approval** stage to reveal the reasons for the rejection. An example review summary is shown in below diageam.

![review](/static/images/image-security/review.jpg)



**To view the findings in Amazon Inspector**

1. In the [Amazon Inspector console](https://console.aws.amazon.com/inspector/v2/home), under **Findings**, choose **By repository**.
2. From the list of repositories, choose the **inspector-blog-images** repository.
3. Choose the **Image tag** link to bring up a list of the individual vulnerabilities that were found within the container image. Below diagram shows an example of the vulnerabilities list in the findings details.

![review-findings](/static/images/image-security/review-findings.png)

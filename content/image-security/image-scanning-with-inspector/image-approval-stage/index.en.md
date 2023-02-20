---
title : "Container image approval stage"
weight : 23
---

After the build stage is completed, the **ContainerVulnerabilityAssessment** stage begins. This stage is lightweight and consists of one stage action that is focused on waiting for an **Approved** or **Rejected** message for the container image that was created in the build stage. The **ContainerVulnerabilityAssessment** stage is configured to send an approval request message to an SNS topic. As part of the approval request message, the container image digest, from the build stage, will be included in the comments section of the message. The image digest is needed so that approval for the correct container image can be submitted later. Below diagram shows the comments section of the approval action where the container image digest is referenced.

![image-digest](/static/images/image-security/image-digest.png)


The SNS topic that the pipeline approval message is sent to is configured to invoke a Lambda function. The purpose of this Lambda function is to pull key details from the SNS message. Details retrieved from the SNS message include the pipeline name and stage, stage approval token, and the container image digest. The pipeline name, stage, and approval token are needed so that an approved or rejected response can be sent to the correct pipeline. The container image digest is the unique identifier for the container image and is needed so that it can be associated with the correct active pipeline. This information is stored in a DynamoDB table so that it can be referenced later when the step that assesses the result of an Amazon Inspector scan submits an approved or rejected decision for the container image. Below diagram illustrates the flow from the approval stage through storing the pipeline approval data in DynamoDB.

![image-approval-details](/static/images/image-security/image-approval-details.png)

This approval action will remain in a pending status until it receives an **Approved** or **Rejected** message or the timeout limit of seven days is reached. The seven-day timeout for approvals is the default for CodePipeline and cannot be changed. If no response is received in seven days, the stage and pipeline will complete with a **Failed** status.




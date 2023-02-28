---
title : "Processing Amazon Inspector scan results"
weight : 25
---

After Amazon Inspector sends out the scan status event, a Lambda function receives and processes that event. This function needs to consume the Amazon Inspector scan status message and make a decision about whether the image can be deployed.

The `eval_container_scan_results` Lambda function serves two purposes: The first is to extract the findings from the Amazon Inspector scan message that invoked the Lambda function. The second is to evaluate the findings based on thresholds that are defined as parameters in the Lambda function definition. Based on the threshold evaluation, the container image will be flagged as either **Approved** or **Rejected**. Below diagram shows examples of thresholds that are defined for different Amazon Inspector vulnerability severities, as part of the Lambda function.

![cve-thresholds](/static/images/image-security/cve-thresholds.jpg)

Based on the container vulnerability image results, the Lambda function determines whether the image should be approved or rejected for deployment. The function will retrieve the details about the current pipeline that the image is associated with from the DynamoDB table that was populated by the image approval action in the pipeline. After the details about the pipeline are retrieved, an **Approved** or **Rejected** message is sent to the pipeline approval action. If the status is **Approved**, the pipeline continues to the deploy stage, which will deploy the container image into the defined environment for that pipeline stage. If the status is **Rejected**, the pipeline status is set to **Rejected** and the pipeline will end.


Below diagram highlights the key steps that occur within the Lambda function that evaluates the Amazon Inspector scan status message.

![process-scan-results](/static/images/image-security/process-scan-results.png)



---
title : "Review Inspector Scanning"
weight : 21
---

::alert[Please ensure you are in the correct region for the tasks listed below. You can select the correct region from the region selection dropdown towards the top right of the AWS console.]{header="Note"}

Amazon Inspector is a vulnerability management service that continually scans AWS workloads for software vulnerabilities and unintended network exposure.
Amazon Inspector calculates a highly contextualized risk score for each finding by correlating common vulnerabilities and exposures (CVE) information with factors such as network access and exploitability. 
This score is used to prioritize the most critical vulnerabilities to improve remediation response efficiency. 
All findings are aggregated in the Amazon Inspector console and pushed to AWS Security Hub and Amazon EventBridge to automate workflows


To view findings in Amazon Inspector

1. In the [Amazon Inspector Console](https://us-west-2.console.aws.amazon.com/inspector/v2/home?region=us-west-2#/dashboard) Click on **Findings**, In the **Filter criteria** scroll down menu, Select **Repository name** and Enter and Click **inspector-workshop** in the text box and Click **Apply**.

![inspector_findings_by_repo_filter](/static/images/image-security/devsecops-inspector/inspector_findings_by_repo_filter.png)


2. You can see the vulnerabilities found within the container.

![inspector_findings_by_repo_filter2](/static/images/image-security/devsecops-inspector/inspector_findings_by_repo_filter2.png)



Amazon Inspector generates a highly contextualized Amazon Inspector risk score for each finding by correlating CVE information with environmental factors such as network reachability results and exploitability data.
This helps prioritize the findings and highlights the most critical findings and vulnerable resources. The Amazon Inspector score calculation (and which factors influenced the score) can be viewed in the Amazon Inspector Score tab within the Findings Details side panel.

![Inspector Score](/static/images/image-security/devsecops-inspector/Inspector-score.png)

## Automating Inspector summary with Pipeline

After Amazon Inspector sends out the scan status event, a Lambda function receives and processes that event. This function needs to consume the Amazon Inspector scan status message and make a decision about whether the image can be deployed.

The `eval_container_scan_results` [Lambda function](https://us-west-2.console.aws.amazon.com/lambda/home?region=us-west-2#/functions/eval-container-scan-results?tab=code) serves **two** purposes: 
1. Extract the findings from the Amazon Inspector scan message that invoked the Lambda function. 
2. Evaluate the findings based on thresholds that are defined as parameters in the Lambda function definition. 


Based on the container vulnerability image results, the Lambda function determines whether the image should be approved or rejected for deployment. The function will retrieve the details about the current pipeline that the image is associated with from the DynamoDB table that was populated by the image approval action in the pipeline. After the details about the pipeline are retrieved, an Approved or Rejected message is sent to the pipeline approval action. If the status is Approved, the pipeline continues to the deploy stage, which will deploy the container image into the defined environment for that pipeline stage. If the status is Rejected, the pipeline status is set to Rejected and the pipeline will end.

![Inspector Score](/static/images/image-security/devsecops-inspector/Inspector-lambda-logic.png)

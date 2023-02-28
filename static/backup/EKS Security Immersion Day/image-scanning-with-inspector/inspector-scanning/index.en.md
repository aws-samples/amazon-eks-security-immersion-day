---
title : "Amazon Inspector and container scanning"
weight : 24
---

When the container image is pushed to Amazon ECR, Amazon Inspector scans it for vulnerabilities.

In order to show how you can use the findings from an Amazon Inspector container scan in a build and deploy pipeline, let’s first review the workflow that occurs when Amazon Inspector scans a container image located in Amazon ECR.

![inspector-scan](/static/images/image-security/inspector-scan.png)

The above workflow diagram outlines the steps that happen after an image is pushed to Amazon ECR all the way to messaging that the image has been successfully scanned and what the final scan results are. The steps in this workflow are as follows:

1. The final container image is pushed to Amazon ECR by an individual or as part of a build.
2. Amazon ECR sends a message indicating that a new image has been pushed.
3. The message about the new image is received by Amazon Inspector.
4. Amazon Inspector pulls a copy of the container image from Amazon ECR and performs a vulnerability scan.
5. When Amazon Inspector is done scanning the image, a message summarizing the severity of vulnerabilities that were identified during the container image scan is sent to [Amazon EventBridge](https://aws.amazon.com/eventbridge/). You can create EventBridge rules that match the vulnerability summary message to route the message onto a target for notifications or to enable further action to be taken.

Here’s a sample EventBridge pattern that matches the scan summary message from Amazon Inspector.

```json
{
  "detail-type": ["Inspector2 Scan"],
  "source": ["aws.inspector2"]
}
```

This entire workflow, from ingesting the initial image to sending out the status on the Amazon Inspector scan, is fully managed. You just focus on how you want to use the Amazon Inspector scan status message to govern the approval and deployment of your container image.

The following is a sample of what the Amazon Inspector vulnerability summary message looks like. Note the values for following keys in json doc such as **detail-type**,  **resources**, **repository-name**, **finding-severity-counts** and **image-digest**.

```json
{
    "version": "0",
    "id": "bf67fc08-f522-f598-6946-8e7b372ba426",
    "detail-type": "Inspector2 Scan",
    "source": "aws.inspector2",
    "account": "<account id>",
    "time": "2022-05-25T16:08:17Z",
    "region": "us-east-2",
    "resources":
    [
        "arn:aws:ecr:us-east-2:<account id>:repository/vuln-images/vulhub/rsync"
    ],
    "detail":
    {
        "scan-status": "INITIAL_SCAN_COMPLETE",
        "repository-name": "arn:aws:ecr:us-east-2:<account id>:repository/vuln-images/vulhub/rsync",
        "finding-severity-counts": { "CRITICAL": 3, "HIGH": 16, "MEDIUM": 4, "TOTAL": 24 },
        "image-digest": "sha256:21ae0e3b7b7xxxx",
        "image-tags":
        [
            "latest"
        ]
    }
}
```

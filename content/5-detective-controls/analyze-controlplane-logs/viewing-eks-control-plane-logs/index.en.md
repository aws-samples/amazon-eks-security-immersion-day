---
title: "Viewing EKS Control Plane logs"
weight: 22
---

After you have enabled any of the control plane log types for your Amazon EKS cluster, you can view them on the CloudWatch console.

To learn more about viewing, analyzing, and managing logs in CloudWatch, see the [Amazon CloudWatch Logs User Guide](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/).

:::::tabs{variant="container"}

::::tab{id="cli" label="Using AWS CLI"}
Run the following command to view log-streams.

```bash
aws logs describe-log-streams --log-group-name /aws/eks/eksworkshop-eksctl/cluster --max-items 10 --order-by LastEventTime --query 'logStreams[].logStreamName'
```
:::expand{header="Check Output"}
The output contained 10 log streams for log group /aws/eks/eksworkshop-eksctl/cluster
```
[
    "kube-controller-manager-9ac68952bbfa494eb1625e2ff3f07bf7",
    "kube-controller-manager-96624a2fbc193d5ccd64f9f1ddbebbe3",
    "kube-apiserver-96624a2fbc193d5ccd64f9f1ddbebbe3",
    "kube-scheduler-96624a2fbc193d5ccd64f9f1ddbebbe3",
    "authenticator-9ac68952bbfa494eb1625e2ff3f07bf7",
    "cloud-controller-manager-9ac68952bbfa494eb1625e2ff3f07bf7",
    "kube-scheduler-9ac68952bbfa494eb1625e2ff3f07bf7",
    "authenticator-96624a2fbc193d5ccd64f9f1ddbebbe3",
    "kube-apiserver-audit-9ac68952bbfa494eb1625e2ff3f07bf7",
    "cloud-controller-manager-96624a2fbc193d5ccd64f9f1ddbebbe3"
]
```
:::


You can view the logs using tail command.

```bash
aws logs tail /aws/eks/eksworkshop-eksctl/cluster  | head -n 5
```



::::

::::tab{id="console" label="Using AWS Console"}

Open CloudWatch Console : 

https://console.aws.amazon.com/cloudwatch/home?#logsV2:log-groups

Filter for **/aws/eks/** prefix and select the cluster you want verify the logs:

![EKS Control Plane Logging View](/static/images/detective-controls/log-insights/cloudwatch-logs-1.png)

You will be presented with a number of log streams in the group:

![EKS Control Plane Logging Edit](/static/images/detective-controls/log-insights/cloudwatch-logs-2.png)

Click on any of these log streams to view the entries being sent to CloudWatch Logs by the EKS control plane.

![EKS Control Plane Logging Edit](/static/images/detective-controls/log-insights/cloudwatch-logs-3.png)

::::

:::::

In the next setction, we will use Log Insights to run queries on these logs.


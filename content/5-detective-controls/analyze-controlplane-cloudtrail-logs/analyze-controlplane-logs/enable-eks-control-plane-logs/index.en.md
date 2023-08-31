---
title : "Setup EKS Control Plane logs"
weight : 22
---
## Enable EKS Control Plane logs


By default, cluster control plane logs aren't sent to CloudWatch Logs. You must enable each log type individually to send logs for your cluster. CloudWatch Logs ingestion, archive storage, and data scanning rates apply to enabled control plane logs. 


:::::tabs{variant="container"}

::::tab{id="cli" label="Using AWS CLI"}
Run the following command to check the status of EKS ControlPlane Logs.

```bash
aws eks describe-cluster --name eksworkshop-eksctl --query 'cluster.logging'
```

:::expand{header="Check Output"}
```json
{
    "clusterLogging": [
        {
            "types": [
                "api",
                "audit",
                "authenticator",
                "controllerManager",
                "scheduler"
            ],
            "enabled": true
        }
    ]
}
```
:::

Run the following command to update EKS ControlPlane Logs.

```bash
aws eks update-cluster-config --name eksworkshop-eksctl --logging '{"clusterLogging":[{"types":["api","audit","authenticator","controllerManager","scheduler"],"enabled":true}]}'
```

:::expand{header="Check Output"}
You will see one of these messages, depending on the status of options prior running the above command : 

```
An error occurred (InvalidParameterException) when calling the UpdateClusterConfig operation: No changes needed for the logging config provided
```
```json
{
    "update": {
        "id": "7b8c0e2f-0eed-4979-bf7a-e5c354013ce9",
        "status": "InProgress",
        "type": "LoggingUpdate",
        "params": [
            {
                "type": "ClusterLogging",
                "value": "{\"clusterLogging\":[{\"types\":[\"api\",\"audit\",\"authenticator\",\"controllerManager\",\"scheduler\"],\"enabled\":true}]}"
            }
        ],
        "createdAt": "2023-07-30T19:34:27.440000+00:00",
        "errors": []
    }
}
```
:::

::::

::::tab{id="console" label="Using AWS Console"}

1. Open the Amazon EKS console at https://console.aws.amazon.com/eks/home#/clusters.
2. Choose the name of the cluster to display your cluster information.
3. Choose the Logging tab.
4. Choose Manage logging.
5. For each individual log type, choose whether the log type should be Enabled or Disabled. By default, each log type is Disabled.
6. Choose Save changes to finish.

![EKS Control Plane Logging View](/static/images/detective-controls/log-insights/control-plane-logs-view.png)

For this workshop, keep all the options enabled.

![EKS Control Plane Logging Edit](/static/images/detective-controls/log-insights/control-plane-logs-manage.png)

::::

:::::


---

## View EKS Control Plane logs


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
```json
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

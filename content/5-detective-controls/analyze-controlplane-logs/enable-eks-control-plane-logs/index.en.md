---
title : "Enable EKS Control Plane logs"
weight : 21
---


By default, cluster control plane logs aren't sent to CloudWatch Logs. You must enable each log type individually to send logs for your cluster. CloudWatch Logs ingestion, archive storage, and data scanning rates apply to enabled control plane logs. 


:::::tabs{variant="container"}

::::tab{id="cli" label="Using AWS CLI"}
Run the following command to check the status of EKS ControlPlane Logs.

```bash
aws eks describe-cluster --name eksworkshop-eksctl --query 'cluster.logging'
```

:::expand{header="Check Output"}
```
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
```
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




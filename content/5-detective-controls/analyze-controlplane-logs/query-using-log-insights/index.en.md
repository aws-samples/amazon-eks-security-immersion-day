---
title: "Query EKS Control Plane logs using CloudWatch Log Insights"
weight: 23
---


CloudWatch Logs Insights enables you to interactively search and analyze your log data in CloudWatch Logs. You can perform queries to help you more efficiently and effectively respond to operational issues. If an issue occurs, you can use CloudWatch Logs Insights to identify potential causes and validate deployed fixes. It includes a purpose-built query language with a few simple but powerful commands.

In this lab exercise, we'll take a look at few examples of using CloudWatch Log Insights to query the EKS control plane logs.


:::::tabs{variant="container"}

::::tab{id="cli" label="Using AWS CLI"}

```bash
QUERY_ID=`aws logs start-query   --log-group-name /aws/eks/eksworkshop-eksctl/cluster  --start-time \`date -d '-300 minutes' "+%s"\`  --end-time \`date "+%s"\`  --query-string 'fields @timestamp, @message, @logStream, @log' | jq -r .queryId` 
sleep 5  #just a pause
aws logs get-query-results --query-id $QUERY_ID
```
:::expand{header="Check Output"}

```
$ aws logs get-query-results --query-id $QUERY_ID
{
    "results": [
        [
            {
                "field": "@timestamp",
                "value": "2023-07-31 01:58:12.101"
            },
            {
                "field": "@message",
                "value": "{\"kind\":\"Event\",\"apiVersion\":\"audit.k8s.io/v1\",\"level\":\"Request\",\"auditID\":\"ff666369-8ea8-4fd9-8c54-64a49dc90e1d\",\"stage\":\"ResponseComplete\",\"requestURI\":\"/apis/apps/v1/namespaces/kube-system/deployments?fieldSelector=metadata.name%3Dvpc-resource-controller\",\"verb\":\"list\",\"user\":{\"username\":\"eks:k8s-metrics\",\"groups\":[\"system:authenticated\"]},\"sourceIPs\":[\"172.16.33.233\"],\"userAgent\":\"eks-k8s-metrics/v0.0.0 (linux/amd64) kubernetes/$Format\",\"objectRef\":{\"resource\":\"deployments\",\"namespace\":\"kube-system\",\"name\":\"vpc-resource-controller\",\"apiGroup\":\"apps\",\"apiVersion\":\"v1\"},\"responseStatus\":{\"metadata\":{},\"code\":200},\"requestReceivedTimestamp\":\"2023-07-31T01:58:11.743936Z\",\"stageTimestamp\":\"2023-07-31T01:58:11.751914Z\",\"annotations\":{\"authorization.k8s.io/decision\":\"allow\",\"authorization.k8s.io/reason\":\"RBAC: allowed by ClusterRoleBinding \\\"eks:k8s-metrics\\\" of ClusterRole \\\"eks:k8s-metrics\\\" to User \\\"eks:k8s-metrics\\\"\"}}"
            },
            {
                "field": "@logStream",
                "value": "kube-apiserver-audit-96624a2fbc193d5ccd64f9f1ddbebbe3"
            },
            {
                "field": "@log",
                "value": "466412623878:/aws/eks/eksworkshop-eksctl/cluster"
            },
            {
                "field": "@ptr",
                "value": "CnUKNAowNDY2NDEyNjIzODc4Oi9hd3MvZWtzL2Vrc3dvcmtzaG9wLWVrc2N0bC9jbHVzdGVyEAYSORoYAgZFYYzyAAAAAcZNExIABkxxTIAAAAIiIAEoptqkzZoxMIWnq82aMTiVAUDQ0QhIy6sBUN+YARgAIAEQkgEYAQ=="
            }
        ],
```
:::


::::

::::tab{id="console" label="Using AWS Console"}

First navigate to CloudWatch Log Insights in the console:

https://console.aws.amazon.com/cloudwatch/home#logsV2:logs-insights

Select the "Log Group" /aws/eks/eksworkshop-eksctl/cluster and click "Run Query". Keep the default query for now.

![EKS Control Plane Logging View](/static/images/detective-controls/log-insights/log-insights-1.png)

You should see some results, depending on how many logs you’ve generated. If you don’t see anything, try adjusting the timeframe, or wait a few minutes for the logs to ingest.

![EKS Control Plane Logging View](/static/images/detective-controls/log-insights/log-insights-2.png)

::::

:::::

Next, we'll explore various scenarios and see how a query language can help filter the logs more efficiently.


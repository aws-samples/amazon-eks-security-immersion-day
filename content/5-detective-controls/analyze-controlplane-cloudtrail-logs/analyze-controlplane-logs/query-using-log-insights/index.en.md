---
title: "Query EKS Control Plane logs using CloudWatch Logs Insights"
weight: 23
---

CloudWatch Logs Insights enables you to interactively search and analyze your log data in CloudWatch Logs. You can perform queries to help you more efficiently and effectively respond to operational issues. If an issue occurs, you can use CloudWatch Logs Insights to identify potential causes and validate deployed fixes. It includes a purpose-built query language with a few simple but powerful commands.

## Steps to run Queries using CloudWatch Logs Insights


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

First navigate to CloudWatch Logs Insights in the console:

https://console.aws.amazon.com/cloudwatch/home#logsV2:logs-insights

Select the "Log Group" **/aws/eks/eksworkshop-eksctl/cluster** and click **Run Query**. Keep the default query for now.

![EKS Control Plane Logging View](/static/images/detective-controls/log-insights/log-insights-1.png)

You should see some results, depending on how many logs you’ve generated. If you don’t see anything, try adjusting the timeframe, or wait a few minutes for the logs to ingest.

![EKS Control Plane Logging View](/static/images/detective-controls/log-insights/log-insights-2.png)

::::

:::::

Next, we'll explore various scenarios and see how a query language can help filter the logs more efficiently.  

::alert[The following section uses only AWS Console to execute these queries. If you want to use AWS CLI, please refer to above example.]



---

## Query EKS Control Plane logs for various scenarios


Logs Insights queries can help you gain valuable insights into your Amazon EKS control plane logs, enabling you to troubleshoot issues, monitor performance, and analyze the activities of the control plane components effectively. 

The following covers multiple scenarios and their queries.  To run these queries in AWS Console, 

First navigate to CloudWatch Logs Insights in the console:

https://console.aws.amazon.com/cloudwatch/home#logsV2:logs-insights

Select the "Log Group" **/aws/eks/eksworkshop-eksctl/cluster**

::alert[If your initial search didn't find any results, try extending the search time in Logs Insights and perform the query again.]{type="error"}



### Scenario-1 : Who created this cluster?

Replace query with the following and click "Run Query"

```bash
fields @logStream, @timestamp, @message
| sort @timestamp desc
| filter @logStream like /authenticator/
| filter @message like "username=kubernetes-admin"
| limit 50
```
> Hint : Look for the arn value to find the user, that created this cluster.
::::expand{header="Check Output"}
![EKS Control Plane Logging Edit](/static/images/detective-controls/log-insights/custom-query-sc1.png)
::::
---

### Scenario-2 :  Filter results by Specific Pod and Namespace

Replace query with the following and click "Run Query"

```bash
fields @timestamp, @message
| filter @logStream like "kube-apiserver-audit"
| filter @message like /coredns/ and @message like /kube-system/
| sort @timestamp desc
```
> Hint : Look for objectRef.name = 'coredns' and objectRef.namespace = 'kube-system'
::::expand{header="Check Output"}
![EKS Control Plane Logging Edit](/static/images/detective-controls/log-insights/custom-query-1.png)
![EKS Control Plane Logging Edit](/static/images/detective-controls/log-insights/custom-query-2.png)
::::

---

### Scenario-3 :  Count of HTTP response codes for calls made to Kubernetes API Server

Replace query with the following and click "Run Query"

```bash
fields @logStream, @timestamp, @message
| filter @logStream like /^kube-apiserver-audit/
| stats count(*) as count by responseStatus.code
| sort count desc
```

>::::expand{header="Check Output"}
![EKS Control Plane Logging Edit](/static/images/detective-controls/log-insights/custom-query-sc3.png)
::::

---

### Scenario-4 :  Filter HTTP Status Code 404

> In Kubernetes API server, the HTTP 404 error code indicates that the requested resource was not found on the server. This means that the API server could not locate the specified endpoint or URL, and the resource the client is trying to access does not exist within the Kubernetes cluster. The 404 error response is returned when the server cannot fulfill the client's request due to the absence of the requested resource.

Replace query with the following and click "Run Query"


```bash
fields @timestamp, @message
| filter @logStream like "kube-apiserver-audit"
| filter responseStatus.code like /404/
| sort @timestamp desc
```
> Hint: Look for responseStatus.code = 404
::::expand{header="Check Output"}
![EKS Control Plane Logging Edit](/static/images/detective-controls/log-insights/custom-query-sc4.png)
::::

---


### Scenario-5 : Find requests from user 'kubernetes-amdin'

> Hint: Run "kubectl get deploy" in your Cloud9 terminal and wait for a minute.

Replace query with the following and click "Run Query"


```bash
fields @logStream, @timestamp, @message
| filter @logStream like /^kube-apiserver-audit/
| filter strcontains(user.username,"kubernetes-admin")
| sort @timestamp desc
| limit 50
```
> Hint : Re-run your query, until you see latest message.  Look for objectRef.resource = deployments. This confirms your request populated in cloudwatch logs.
::::expand{header="Check Output"}
![EKS Control Plane Logging Edit](/static/images/detective-controls/log-insights/custom-query-sc5.png)
::::


### Scenario-6 : Find mutating change made to aws-auth ConfigMap

> In Amazon EKS (Elastic Kubernetes Service), the aws-auth ConfigMap is a critical configuration that controls the mapping of IAM roles or users to Kubernetes RBAC (Role-Based Access Control) roles within the cluster. The aws-auth ConfigMap allows you to grant necessary permissions for IAM entities to interact with the EKS cluster and its resources.

> When you make changes to the aws-auth ConfigMap, you are essentially mutating its contents to modify the association between IAM entities and Kubernetes RBAC roles.

Replace query with the following and click "Run Query"

```bash
fields @logStream, @timestamp, @message
| filter @logStream like /^kube-apiserver-audit/
| filter requestURI like /\/api\/v1\/namespaces\/kube-system\/configmaps/
| filter objectRef.name = "aws-auth"
| filter verb like /(create|delete|patch)/
| sort @timestamp desc
| limit 50
```

>::::expand{header="Check Output"}
![EKS Control Plane Logging Edit](/static/images/detective-controls/log-insights/custom-query-sc6.png)
::::

---


### Scenario-7 : List updates to the aws-auth ConfigMap

Replace query with the following and click "Run Query"

```bash
fields @timestamp, @message
| filter @logStream like "kube-apiserver-audit"
| filter verb in ["update", "patch"]
| filter objectRef.resource = "configmaps" and objectRef.name = "aws-auth" and objectRef.namespace = "kube-system"
| sort @timestamp desc
```

>::::expand{header="Check Output"}
::::

---

### Scenario-8 : List creation of new or changes to validation webhooks

Replace query with the following and click "Run Query"

```bash
fields @timestamp, @message
| filter @logStream like "kube-apiserver-audit"
| filter verb in ["create", "update", "patch"] and responseStatus.code = 201
| filter objectRef.resource = "validatingwebhookconfigurations"
| sort @timestamp desc
```

>::::expand{header="Check Output"}
::::

---

### Scenario-9 : List create, update, delete operations to RoleBindings

Replace query with the following and click "Run Query"

```bash
fields @timestamp, @message
| sort @timestamp desc
| limit 100
| filter objectRef.resource="rolebindings" and verb in ["create", "update", "patch", "delete"]
```

>::::expand{header="Check Output"}
::::

---

### Scenario-10 : List create, update, delete operations to ClusterRoles

Replace query with the following and click "Run Query"

```bash
fields @timestamp, @message
| sort @timestamp desc
| limit 100
| filter objectRef.resource="clusterroles" and verb in ["create", "update", "patch", "delete"]
```

>::::expand{header="Check Output"}
::::

---

### Scenario-11 : List create, update, delete operations to ClusterRoleBindings

Replace query with the following and click "Run Query"

```bash
fields @timestamp, @message
| sort @timestamp desc
| limit 100
| filter objectRef.resource="clusterrolebindings" and verb in ["create", "update", "patch", "delete"]
```

>::::expand{header="Check Output"}
::::

---

### Scenario-12 : Plots unauthorized read operations against Secrets

Replace query with the following and click "Run Query"

```bash
fields @timestamp, @message
| sort @timestamp desc
| limit 100
| filter objectRef.resource="secrets" and verb in ["get", "watch", "list"] and responseStatus.code="401"
| stats count() by bin(1m)
```

>::::expand{header="Check Output"}
::::

---

### Scenario-13 : List of failed anonymous requests

Replace query with the following and click "Run Query"

```bash
fields @timestamp, @message, sourceIPs.0
| sort @timestamp desc
| limit 100
| filter user.username="system:anonymous" and responseStatus.code in ["401", "403"]
```

>::::expand{header="Check Output"}
::::

---

### Scenario-14 : Find recently added node in the cluster

> To simulate this, Let's scale node-group mng-al2.  

> Currently mng-al2 node-group has two ec2 instances. We will increase this count to three. 

> Execute this in Cloud9 Terminal
```bash
eksctl scale nodegroup --cluster=eksworkshop-eksctl --nodes=3 mng-al2
```
> Check the status of node creation by executing 
```bash
kubectl get nodes --watch
```
> Contrl+C to exit

Once node creation is complete, in AWS Console, Replace query with the following and click "Run Query"

```bash
fields @logStream, @timestamp, @message
| filter @logStream like /^cloud-controller/
| filter @message not like 'Skip putting node'
| sort @timestamp asc
| limit 50
```

>::::expand{header="Check Output"}
![EKS Control Plane Logging Edit](/static/images/detective-controls/log-insights/custom-query-sc7.png)
::::

---

### Scenario-15 : Find the node where a pod was scheduled

> Create nginx pod. Execute the following command in Cloud9 Terminal

```bash
kubectl run nginx --image=nginx
```

In Logs Insights window on AWS Console, replace query with the following and click "Run Query"

```bash
fields @logStream, @timestamp, @message
| sort @timestamp desc
| filter @logStream like /kube-scheduler/
| filter @message like "nginx"
| limit 50
```

> ::::expand{header="Check Output"}
![EKS Control Plane Logging Edit](/static/images/detective-controls/log-insights/custom-query-sc8.png)
::::

---

### Scenario-16 : Find HTTP 5xx server errors related to Kubernetes API server requests.

> In Kubernetes, 5xx errors refer to a category of HTTP status codes that are returned by the Kubernetes API server to indicate server-side errors. These errors occur when the API server encounters an issue or encounters an unexpected condition that prevents it from fulfilling a client's request successfully. Few of the code listed below. 

> 500 : Internal Server Error

> 502 : Bad Gateway

> 503 : Service Unavailable

> 504 : Gateway Timeout

> 509 : Bandwidth Limit Exceeded

Replace query with the following and click "Run Query"

```bash
fields @logStream, @timestamp, responseStatus.code, @message
| filter @logStream like /^kube-apiserver-audit/
| filter responseStatus.code >= 500
| limit 50
```

::::expand{header="Check Output"}
![EKS Control Plane Logging Edit](/static/images/detective-controls/log-insights/custom-query-sc9.png)
::::

---

### Scenario-17 : How to detect when etcd is out of space?

Replace query with the following and click "Run Query"

```bash
fields @timestamp, @message, @logStream
| filter @logStream like /kube-apiserver-audit/
| filter @message like /mvcc: database space exceeded/
| limit 10
```


This concludes, various scenarios and how we can query the cloudwatch logs using Logs Insights queries.
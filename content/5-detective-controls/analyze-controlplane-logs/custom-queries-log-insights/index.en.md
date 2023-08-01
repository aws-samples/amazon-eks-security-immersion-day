---
title: "Custom Queries using Log Insights on  EKS Control Plane logs"
weight: 24
---

Logs Insights queries can help you gain valuable insights into your Amazon EKS control plane logs, enabling you to troubleshoot issues, monitor performance, and analyze the activities of the control plane components effectively. 

The following covers multiple scenarios and their queries.  To run these queries in AWS Console, 

First navigate to CloudWatch Log Insights in the console:

https://console.aws.amazon.com/cloudwatch/home#logsV2:logs-insights

Select the "Log Group" /aws/eks/eksworkshop-eksctl/cluster  

::alert[If your initial search didn't find any results, try extending the search time in Log Insights and perform the query again.]{type="error"}



:::expand{header="Scenario-1 : Who created this cluster?"}

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

:::expand{header="Scenario-2 :  Filter results by Specific Pod and Namespace"}

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

:::expand{header="Scenario-3 :  Count of HTTP response codes for calls made to Kubernetes API Server"}

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

:::expand{header="Scenario-4 :  Filter HTTP Status Code 404"}

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


:::expand{header="Scenario-5 : Find requests from user 'kubernetes-amdin"}

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

---

:::expand{header="Scenario-6 : Find mutating change made to aws-auth ConfigMap"}

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

:::expand{header="Scenario-7 : Find recently added node in the cluster "}

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

:::expand{header="Scenario-8 : Find the node where a pod was scheduled"}

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

:::expand{header="Scenario-9 : Find HTTP 5xx server errors related to Kubernetes API server requests."}

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
Click "Run query".  If you don't get any results, adjust for a longer search time and try again.

::::expand{header="Check Output"}
![EKS Control Plane Logging Edit](/static/images/detective-controls/log-insights/custom-query-sc9.png)
::::

This concludes, various scenarios and how we can query the cloudwatch logs using Logs Insights queries.
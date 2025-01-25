---
title : "OIDC authenticated user audit logging"
weight : 45
---

Fantastic, we've now got our Cognito-authenticated users set up and authorized to access Secrets within the EKS cluster.

One important thing to note is that all OIDC identity provider-authenticated users will be logged in the cluster's audit log. This provides a valuable audit trail that we can use to review user activity within the cluster.

However, in order to view these audit logs, we need to ensure that cluster logging has been enabled for the 'Audit' log type. This will allow us to either view the logs directly in CloudWatch Logs, or analyze them using CloudWatch Insights.


:::::tabs{variant="container"}

::::tab{id="cli" label="Using AWS CLI"}
Lets quickly check the logging configuration for our EKS cluster

:::code{language=t4-templating showLineNumbers=false showCopyAction=true}
aws eks describe-cluster --name eksworkshop-eksctl  | jq '.cluster.logging.clusterLogging[] | select(.types | contains(["audit"])) | .enabled'
:::

::::expand{header="Check Output"}
:::code{language=t4-templating showLineNumbers=false showCopyAction=true}
WSParticipantRole:~/environment $ aws eks describe-cluster --name eksworkshop-eksctl  | jq '.cluster.logging.clusterLogging[] | select(.types | contains(["audit"])) | .enabled'
true
:::

::::
::::
::::tab{id="console" label="Using AWS Console"}



Let's quickly check the logging configuration for our EKS cluster:

Navigate to the EKS service in the AWS Management Console.
Click on the "Observability" tab for your cluster.
Verify that the "Control plane logging" section has the "Audit" log type turned on.
If the "Audit" log is not enabled, you'll need to update the logging configuration to start capturing those user activity records.

Once the logging is set up correctly, you'll be able to review the audit logs to see details about which users are accessing the cluster, and what actions they're performing. This provides an important layer of visibility and security for your EKS environment
![oidc_eks_observability](/static/images/iam/oidc-cognito/oidc-eks-observability-cloudwatch-audit.jpg)


::::
:::::

Search for cloudwatch and click on cloudwatch
![oidc_eks_cloudwatch](/static/images/iam/oidc-cognito/oidc-eks-search-cloudwatch.jpg)

Click on Logs Insights

![oidc_eks_cloudwatch_loginsights](/static/images/iam/oidc-cognito/oidc-eks-cloudwatch-loginsights.jpg)

Select "/aws/eks/eksworkshop-eksctl/logs"and 

![oidc_eks_cloudwatch_loginsights](/static/images/iam/oidc-cognito/oidc-eks-cloudwatch-insights-logroups.jpg)

add filter code as shown below

:::code{language=t4-templating showLineNumbers=false showCopyAction=true}
fields @timestamp, @message
| sort @timestamp desc
| filter user.username = "test1@example.com"
:::

![oidc_eks_cloudwatch_loginsights](/static/images/iam/oidc-cognito/oidc-eks-cloudwatch-insights-filter.jpg)

The resulting audit log sample within CloudWatch Logs is shown below for the "kubectl get secrets" call 

![oidc_eks_login_audit](/static/images/iam/oidc-cognito/oidc-eks-user-secrets-audit.jpg)

The resulting audit log sample within CloudWatch Logs is shown below for the " kubectl get nodes" to the API server.

![oidc_eks_login_audit](/static/images/iam/oidc-cognito/oidc-eks-user-nodes-audit.jpg)

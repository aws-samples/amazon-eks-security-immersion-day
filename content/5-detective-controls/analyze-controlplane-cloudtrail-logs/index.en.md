---
title : "Analyze Amazon EKS Control Plane logs and Audit CloudTrail logs"
weight : 35
---

## EKS Control Plane Logs


Amazon EKS control plane logging provides audit and diagnostic logs directly from the Amazon EKS control plane to CloudWatch Logs in your account. These logs make it easy for you to secure and run your clusters. You can select the exact log types you need, and logs are sent as log streams to a group for each Amazon EKS cluster in CloudWatch.

**Pricing**: When you use Amazon EKS control plane logging, you're charged standard Amazon EKS pricing for each cluster that you run along with the standard CloudWatch Logs data ingestion and storage costs for any logs sent to CloudWatch Logs from your clusters.

The following cluster control plane log types are available. Each log type corresponds to a component of the Kubernetes control plane. To learn more about these components, see Kubernetes Components in the [Kubernetes documentation](https://kubernetes.io/docs/concepts/overview/components/)

- **Kubernetes API server component logs (api)** - Your cluster's API server is the control plane component that exposes the Kubernetes API.
- **Audit (audit)** – Kubernetes audit logs provide a record of the individual users, administrators, or system components that have affected your cluster.
- **Authenticator (authenticator)** – Authenticator logs are unique to Amazon EKS. These logs represent the control plane component that Amazon EKS uses for Kubernetes Role Based Access Control (RBAC) authentication using IAM credentials.
- **Controller manager (controllerManager)** – The controller manager manages the core control loops that are shipped with Kubernetes.
- **Scheduler (scheduler)** – The scheduler component manages when and where to run pods in your cluster.

You can enable or disable each log type on a per-cluster basis using the AWS Management Console, AWS CLI (version 1.16.139 or higher), or through the Amazon EKS API.

## CloudTrail Logs

When you create your AWS account, CloudTrail is also enabled on your AWS account. When any activity occurs in Amazon EKS, that activity is recorded in a CloudTrail event along with other AWS service events in Event history. You can view, search, and download recent events in your AWS account. For more information, see [Viewing events with CloudTrail event history](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/view-cloudtrail-events.html)

When pods within Amazon EKS utilize IAM Roles for Service Accounts (IRSA), their interactions with AWS APIs are automatically documented in CloudTrail, along with the corresponding service account name. If you observe an unauthorized service account name in the CloudTrail logs, it might indicate a misconfigured trust policy within the IAM role. CloudTrail proves valuable in associating AWS API actions with specific IAM entities within the context of an EKS cluster.

By effectively utilizing CloudTrail logs for auditing in EKS, you can enhance the security of your Kubernetes clusters, ensure compliance with regulations, and gain better visibility into the activities within your AWS environment.


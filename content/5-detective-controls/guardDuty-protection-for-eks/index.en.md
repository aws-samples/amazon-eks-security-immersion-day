---
title : "Amazon GuardDuty Protection for Amazon EKS"
weight : 34
---


[Amazon GuardDuty](https://aws.amazon.com/guardduty/) has expanded coverage to continuously monitor and profile Amazon Elastic Kubernetes Service (Amazon EKS) cluster activity to identify malicious or suspicious behavior that represents potential threats to container workloads. EKS Protection in Amazon GuardDuty provides threat detection coverage to help you protect Amazon EKS clusters within your AWS environment. EKS Protection includes [EKS Audit Log Monitoring](https://aws.amazon.com/about-aws/whats-new/2022/01/amazon-guardduty-elastic-kubernetes-service-clusters/) and [EKS Runtime Monitoring](https://aws.amazon.com/blogs/aws/amazon-guardduty-now-supports-amazon-eks-runtime-monitoring/).

**EKS Audit Log Monitoring** : EKS Audit Log Monitoring helps you detect potentially suspicious activities in EKS clusters within Amazon Elastic Kubernetes Service (Amazon EKS). EKS Audit Log Monitoring uses Kubernetes audit logs to capture chronological activities from users, applications using the Kubernetes API, and the control plane. For more information, see [Kubernetes audit logs](https://docs.aws.amazon.com/guardduty/latest/ug/features-kubernetes-protection.html#guardduty_k8s-audit-logs).


**EKS Runtime Monitoring**: EKS Runtime Monitoring uses operating system-level events to help you detect potential threats in Amazon EKS nodes and containers within your Amazon EKS clusters. For more information, see [Runtime Monitoring](https://docs.aws.amazon.com/guardduty/latest/ug/features-kubernetes-protection.html#guardduty_runtime-monitoring).


![GuardDuty Architecture](/static/images/detective-controls/2023-guardduty-1-diagram.jpg)


---
title : "Amazon GuardDuty Protection for Amazon EKS"
weight : 34
---





[Amazon GuardDuty](https://aws.amazon.com/guardduty/) has expanded coverage to continuously monitor and profile Amazon Elastic Kubernetes Service (Amazon EKS) cluster activity to identify malicious or suspicious behavior that represents potential threats to container workloads. EKS Protection in Amazon GuardDuty provides threat detection coverage to help you protect Amazon EKS clusters within your AWS environment. EKS Protection includes [EKS Audit Log Monitoring](https://aws.amazon.com/about-aws/whats-new/2022/01/amazon-guardduty-elastic-kubernetes-service-clusters/) and [EKS Runtime Monitoring](https://aws.amazon.com/blogs/aws/amazon-guardduty-now-supports-amazon-eks-runtime-monitoring/).

**EKS Audit Log Monitoring** : EKS Audit Log Monitoring helps you detect potentially suspicious activities in EKS clusters within Amazon Elastic Kubernetes Service (Amazon EKS). EKS Audit Log Monitoring uses Kubernetes audit logs to capture chronological activities from users, applications using the Kubernetes API, and the control plane. For more information, see [Kubernetes audit logs](https://docs.aws.amazon.com/guardduty/latest/ug/features-kubernetes-protection.html#guardduty_k8s-audit-logs).


**EKS Runtime Monitoring**: EKS Runtime Monitoring uses operating system-level events to help you detect potential threats in Amazon EKS nodes and containers within your Amazon EKS clusters. For more information, see [Runtime Monitoring](https://docs.aws.amazon.com/guardduty/latest/ug/features-kubernetes-protection.html#guardduty_runtime-monitoring).


![GuardDuty Architecture](/static/images/detective-controls/2023-guardduty-1-diagram.jpg)


[Amazon GuardDuty](https://aws.amazon.com/guardduty/) has expanded coverage to continuously monitor and profile Amazon Elastic Kubernetes Service (Amazon EKS) cluster activity to identify malicious or suspicious behavior that represents potential threats to container workloads. [Amazon GuardDuty for EKS Protection](https://docs.aws.amazon.com/guardduty/latest/ug/kubernetes-protection.html) monitors control plane activity by analyzing Kubernetes audit logs from existing and new Amazon EKS clusters in your accounts. Amazon GuardDuty is integrated with Amazon EKS, giving it direct access to the Kubernetes audit logs without requiring you to turn on or store these logs. Once a threat is detected, GuardDuty generates a security finding that includes container details such as pod ID, container image ID, and associated tags. 

At launch, GuardDuty for EKS Protection includes [27 new GuardDuty finding types](https://docs.aws.amazon.com/guardduty/latest/ug/guardduty_finding-types-kubernetes.html) that can help detect threats related to user and application activity captured in Kubernetes audit logs. Newly added Kubernetes threat detections include Amazon EKS clusters that are accessed by known malicious actors or from Tor nodes, API operations performed by anonymous users that might indicate a misconfiguration, and misconfigurations that can result in unauthorized access to Amazon EKS clusters. Also, using machine learning (ML) models, GuardDuty can identify patterns consistent with privilege-escalation techniques, such as a suspicious launch of a container with root-level access to the underlying Amazon Elastic Compute Cloud (Amazon EC2) host. See [Amazon GuardDuty Findings Types](https://docs.aws.amazon.com/guardduty/latest/ug/guardduty_findings) for a complete and detailed list of all new detections.

The first 30 days of GuardDuty for EKS Protection are available at no additional charge for existing GuardDuty accounts. For new accounts, GuardDuty for EKS Protection is part of the [30-day Amazon GuardDuty free trial](https://aws.amazon.com/guardduty/pricing/). During the trial period you can see the estimated cost of running the service after the trial period ends in the GuardDuty Management Console. Amazon GuardDuty optimizes your costs by only processing logs relevant for analysis. Amazon GuardDuty for EKS Protection is available in all AWS regions where GuardDuty is available. To receive programmatic updates on new Amazon GuardDuty features and threat detections, subscribe to the Amazon GuardDuty SNS topic.


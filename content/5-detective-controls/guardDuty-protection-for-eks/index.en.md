---
title : "Amazon GuardDuty protection for EKS"
weight : 34
---



### Prerequisites

This workshop is most suitable for participants who are currently building solutions in AWS using compute and/or container services.

#### Target Audience

This workshop is designed for an audience looking to build vulnerability management solutions using AWS services and native controls. Technical owners and individual contributors in Platform teams, Security teams, and Cloud Architecture teams can use this workshop to build advanced vulnerability management configurations.


#### Costs

In this workshop, you will create various AWS services. **This workshop will not incur any costs when run using AWS Event Dashboard at an AWS Event**. If you plan to run the workshop on your own, please make sure to check the [AWS Free Tier](https://aws.amazon.com/free/) page along with the building a cost estimation using the [AWS Pricing Calculator](https://calculator.aws/#/) to understand the spend involved.

#### Navigating the workshop

Navigate the workshop using the left navigation bar. You can see the range of tasks on the left.


#### Cleanup

Use the cleanup page for instructions on how to cleanup after the workshop is completed.

#### Feedback

We appreciate your opinion on how to improve this resource! If you have any feedback or suggestions for improvement, please email [amazon-eks-security-immersion-day@amazon.com](mailto:amazon-eks-security-immersion-day@amazon.com)
.

### Amazon GuardDuty protection for EKS


[Amazon GuardDuty](https://aws.amazon.com/guardduty/) has expanded coverage to continuously monitor and profile Amazon Elastic Kubernetes Service (Amazon EKS) cluster activity to identify malicious or suspicious behavior that represents potential threats to container workloads. [Amazon GuardDuty for EKS Protection](https://docs.aws.amazon.com/guardduty/latest/ug/kubernetes-protection.html) monitors control plane activity by analyzing Kubernetes audit logs from existing and new Amazon EKS clusters in your accounts. GuardDuty is integrated with Amazon EKS, giving it direct access to the Kubernetes audit logs without requiring you to turn on or store these logs. Once a threat is detected, GuardDuty generates a security finding that includes container details such as pod ID, container image ID, and associated tags. 

At launch, GuardDuty for EKS Protection includes [27 new GuardDuty finding types](https://docs.aws.amazon.com/guardduty/latest/ug/guardduty_finding-types-kubernetes.html) that can help detect threats related to user and application activity captured in Kubernetes audit logs. Newly added Kubernetes threat detections include Amazon EKS clusters that are accessed by known malicious actors or from Tor nodes, API operations performed by anonymous users that might indicate a misconfiguration, and misconfigurations that can result in unauthorized access to Amazon EKS clusters. Also, using machine learning (ML) models, GuardDuty can identify patterns consistent with privilege-escalation techniques, such as a suspicious launch of a container with root-level access to the underlying Amazon Elastic Compute Cloud (Amazon EC2) host. See [Amazon GuardDuty Findings Types](https://docs.aws.amazon.com/guardduty/latest/ug/guardduty_findings) for a complete and detailed list of all new detections.

The first 30 days of GuardDuty for EKS Protection are available at no additional charge for existing GuardDuty accounts. For new accounts, GuardDuty for EKS Protection is part of the [30-day Amazon GuardDuty free trial](https://aws.amazon.com/guardduty/pricing/). During the trial period you can see the estimated cost of running the service after the trial period ends in the GuardDuty Management Console. GuardDuty optimizes your costs by only processing logs relevant for analysis. GuardDuty for EKS Protection is available in all AWS regions where GuardDuty is available. To receive programmatic updates on new Amazon GuardDuty features and threat detections, subscribe to the Amazon GuardDuty SNS topic.


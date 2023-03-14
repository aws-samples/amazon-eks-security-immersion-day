---
title : "Introduction"
weight : 10
---

#### Introduction

This workshop is focused completely on Amazon EKS Security features. The intention is to provide hands-on 
lab modules as a reference to implement various security best practices on Amazon EKS.

The lab modules are structured to be consistent with and in the same order as various sections outlines in [Amazon EKS Best Practices Guide for Security](Amazon EKS Best Practices Guide for Security). This workshop can be a good follow up material to the Best Practice Guide, so you can refer to these lab modules as a starting point for your own implementation for your workloads.

#### Target audience

This is a technical workshop introducing chaos Amazon EKS Security Best Practices for Developers, DevOps, Platform and Infra Engineering teams.

At the end of the workshop, you will learn about how to implement various Amazon EKS Security Best Practices.

#### Prerequisites

For best results, the participants should have familiarity with the AWS console as well as some proficiency with command-line tooling.

Background in EKS, Kubernetes, Docker, and container workflows are highly recommended as a perquisites

#### Duration

As part of this workshop we will cover the following modules:

| Chapters | Time taken to complete | Dependency |
| --- | --- | --- |
| [Create Workspace Environment at an AWS Event](/1-create-workspace-environment/awsevent) | 15 mins | N/A |
| [Create Workspace Environment on Your Own](/1-create-workspace-environment/onown) | 30 mins | N/A |
| [IAM Authentication & RBAC Authorization](/2-identity-and-access-management/iam-groups-roles-to-manage-eks-access) | 60 mins | N/A |
| [IAM Role for Service Account (IRSA)](/2-identity-and-access-management/irsa) | 60 mins | N/A |
| [Pod Security Standards](/3-pod-security/psa-pss) | 45 mins | N/A |
| [Amazon GuardDuty protection for EKS](/5-detective-controls/guardDuty-protection-for-eks/) | 60 mins | N/A |
| [Validating Amazon EKS optimized Bottlerocket AMI against the CIS Benchmark](/10-regulatory-compliance/cis-bottlerocket-eks/) | 60 mins | N/A |
| [Image Scanning with Amazon Inspector and DevSecOps with  AWS CodePipeline](/12-image-security/manage-image-cve-with-inspector/) | 60 mins | N/A |


#### Cost

In this workshop, you will create various AWS services. **This workshop will not incur any costs when run using AWS Event Dashboard at an AWS Event**. If you plan to run the workshop on your own, please make sure to check the [AWS Free Tier](https://aws.amazon.com/free/) page along with the building a cost estimation using the [AWS Pricing Calculator](https://calculator.aws/#/) to understand the spend involved.

#### Feedback

We appreciate your opinion on how to improve this resource! If you have any feedback or suggestions for improvement, please email [amazon-eks-security-immersion-day@amazon.com](mailto:amazon-eks-security-immersion-day@amazon.com)
.
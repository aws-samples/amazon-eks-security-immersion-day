---
title : "Introduction"
weight : 10
---

#### Introduction

This workshop is focused completely on Amazon EKS Security features. The intention is to provide hands-on 
lab modules as a reference to implement various security best practices on Amazon EKS.

The lab modules are structured to be consistent with and in the same order as various sections outlines in [Amazon EKS Best Practices Guide for Security](https://aws.github.io/aws-eks-best-practices/security/docs/). This workshop can be a good follow up material to the Best Practice Guide, so you can refer to these lab modules as a starting point for your own implementation for your workloads.

#### Target audience

This is a technical workshop introducing Amazon EKS Security Best Practices for Developers, DevOps, Platform and Infra Engineering teams.

At the end of the workshop, you will learn about how to implement various Amazon EKS Security Best Practices.

#### Prerequisites

For best results, the participants should have familiarity with the AWS console as well as some proficiency with command-line tooling.

Background in Amazon EKS, Kubernetes, Docker, and container workflows are highly recommended as prerequisites.

#### Duration

As part of this workshop we will cover the following modules:

| Section | Modules | Time taken to complete | Dependency |
| --- | --- | --- | --- |
| **Workshop Environment Setup**| [Create Workspace Environment at an AWS Event](/1-create-workspace-environment/awsevent) | 15 mins | N/A |
| | [Create Workspace Environment on Your Own](/1-create-workspace-environment/onown) | 30 mins | N/A |
| **Identity and Access Management**| [Using AWS IAM Groups and Roles to Manage Kubernetes Cluster Access](/2-identity-and-access-management/iam-groups-roles-to-manage-eks-access) | 60 mins | N/A |
| | [IAM Role for service account (IRSA)](/2-identity-and-access-management/irsa) | 45 mins | N/A |
| **Pod Security**| [Pod Security Standards](/3-pod-security/psa-pss) | 45 mins | N/A |
| | [Using Open Policy Agent (OPA) and Gatekeeper for policy-based control in Amazon EKS](/3-pod-security/opa) | 45 mins | N/A |
| **Detective Controls** | [Amazon GuardDuty Protection for EKS - Audit Log Monitoring](/5-detective-controls/guardDuty-protection-for-eks/eks-audit-logs) | 45 mins | N/A |
| | [Amazon GuardDuty Protection for EKS - Runtime Monitoring](/5-detective-controls/guardDuty-protection-for-eks/eks-runtime) | 45 mins | N/A |
| | [Analyze Amazon EKS Control Plane logs and Audit CloudTrail logs](/5-detective-controls/analyze-controlplane-cloudtrail-logs) | 60 mins | N/A |
| **Regulatory Compliance**| [Validating Amazon EKS optimized Bottlerocket AMI against the CIS Benchmark](/10-regulatory-compliance/cis-bottlerocket-eks/) | 60 mins | N/A |
|  | [CIS EKS Benchmark Assessment Using Kube-bench](/10-regulatory-compliance//) | 45 mins | N/A |
|  | [CIS EKS Benchmark Assessment Using Kube-bench](/10-regulatory-compliance/kube-bench/) | 45 mins | N/A |
| **Image Security** | [Container Image CVE Management with Amazon Inspector](/12-image-security/manage-image-cve-with-inspector/) | 30 mins | N/A |
| | [Amazon ECR Security Controls](/12-image-security/amazon-ecr-security-controls/) | 60 mins | N/A |
| | [Container Image Signing and Verification with AWS Signer](/12-image-security/image-signing-with-aws-signer/) | 90 mins | N/A |
| **Data Encryption and Secrets Management** | [Mounting Secrets from AWS Secrets Manager](/13-data-encryption-and-secret-management/mounting-secrets-from-aws-secrets-manager/) | 60 mins | N/A |


#### Cost

In this workshop, you will create various AWS services. **This workshop will not incur any costs when run using AWS Event Dashboard at an AWS Event**. If you plan to run the workshop on your own, please make sure to check the [AWS Free Tier](https://aws.amazon.com/free/) page along with the building a cost estimation using the [AWS Pricing Calculator](https://calculator.aws/#/) to understand the spend involved.

#### Cleanup

There is a cleanup section at the end of every lab module. Ensure that you follow the steps outlined in the cleanup section to delete all the resources to avoid costs.

#### Feedback

We appreciate your opinion on how to improve this resource! If you have any feedback or suggestions for improvement, please email [amazon-eks-security-immersion-day@amazon.com](mailto:amazon-eks-security-immersion-day@amazon.com)
.

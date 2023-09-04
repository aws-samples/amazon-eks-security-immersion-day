---
title : "Use Amazon Inspector to manage your build and deploy pipelines for containerized applications"
weight : 34
---



In this section we will apply the DevOps model and deploy containerized application by using AWS services while covering the following:

* Deployment of required infrastructure including Amazon CodeCommit  and Amazon ECR repositories for code and images respectively
* Deployment and use a modernized pipeline using AWS CodePipeline, AWS CodeBuild 
* Scan vulnerabilities using Amazon inspector
* Automation of approval/rejection in AWS Codepipeline based on Amazon inspector scan results
* Aggregate all vulnerability findings to AWS Security hub


Container Image is the first line of defense against an attack. An insecure, poorly constructed image can allow an attacker to escape the bounds of the container and gain access to the host. Once on the host, an attacker can gain access to sensitive information or move laterally within the cluster or within your AWS account.

For more details on various Amazon EKS Best Practices in Image Security, refer to the [documentation](https://aws.github.io/aws-eks-best-practices/security/docs/image/).
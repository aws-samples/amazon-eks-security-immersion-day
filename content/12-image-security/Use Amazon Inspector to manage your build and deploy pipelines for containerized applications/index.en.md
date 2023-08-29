---
title : "Use Amazon Inspector to manage your build and deploy pipelines for containerized applications"
weight : 34
---


DevSecOps aims to help development teams address security issues efficiently. It is an alternative to older software security practices that could not keep up with tighter timelines and rapid software updates.
In conventional software development methods, security testing was a separate process from the SDLC. The security team discovered security flaws only after they built the software. 
The DevSecOps framework improves the SDLC by detecting vulnerabilities throughout the software development and delivery process.

DevSecOps and agile are not mutually exclusive practices. Agile allows the software team to act quickly on change requests. Meanwhile, DevSecOps introduces security practices into each iterative cycle in agile development. With DevSecOps, the software team can produce safer code using agile development methods.

In this workshop we will apply the DevOps model shown above by using AWS services and to deploy a containerized application:

* Setup of an AWS Cloud9 environment.
* Deployment of required infrastructure including Amazon Elastic Kubernetes Service (Amazon EKS)

with and Amazon ECR

* Usage of repository  using AWS CodeCommit
* Deploy and use a modernized pipeline using AWS CodePipeline, AWS CodeBuild and AWS CodeDeploy.
* Scan vulnerabilities using Amazon inspector
* Move all vulnerability findings to AWS Security hub



Container Image is the first line of defense against an attack. An insecure, poorly constructed image can allow an attacker to escape the bounds of the container and gain access to the host. Once on the host, an attacker can gain access to sensitive information or move laterally within the cluster or within your AWS account.

For more details on various Amazon EKS Best Practices in Image Security, refer to the [documentation](https://aws.github.io/aws-eks-best-practices/security/docs/image/).
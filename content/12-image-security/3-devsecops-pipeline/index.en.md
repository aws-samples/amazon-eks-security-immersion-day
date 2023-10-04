---
title : "DevSecOps pipeline using AWS CodePipeline,  Amazon Inspector and AWS Security Hub"
weight : 50
---

DevSecOps is the practice of integrating security testing at every stage of the software development process.
In conventional software development methods, security testing was a separate process from the SDLC. The security team discovered security flaws only after they built the software.
The DevSecOps framework improves the SDLC by detecting vulnerabilities throughout the software development and delivery process.

DevSecOps and agile are not mutually exclusive practices. Agile allows the software team to act quickly on change requests. Meanwhile, DevSecOps introduces security practices into each iterative cycle in agile development. With DevSecOps, the software team can produce safer code using agile development methods.



AWS supports modern DevSecOps practices so that software teams can automate their applications’ security, compliance, and data protection.

AWS provides a number of services that make it easy to build CI/CD pipelines, and to be able to template these pipelines so that they can be re-used for multiple services.

Relevant AWS services include:

1. [CodeCommit](https://aws.amazon.com/codecommit/): CodeCommit can be used to manage source control and make incremental changes to the application.
2. [CodeBuild](https://aws.amazon.com/codebuild/): CodeBuild is a fully managed continuous integration service that compiles source code,runs tests and produces ready-to-deploy software packages
3. [CodePipeline](https://aws.amazon.com/codepipeline/): CodePipeline can be used to automate continuous delivery pipelines for fast and reliable updates.
4. [CloudFormation](https://aws.amazon.com/cloudformation/): Cloudformation helps model,provision and manage AWS and third-party resources by treating infrastructure-as-code
3. [Amazon Inspector](https://aws.amazon.com/inspector/): Amazon inspector will be used for automated and continual vulnerability management at scale.
4. [Amazon Security Hub](https://aws.amazon.com/securityhub/): AWS Security hub is a cloud security posture management (CSPM) service that performs security best practice checks, aggregates alerts, and enables automated remediation.


In this workshop you will apply the DevOps model and deploy containerized application by using AWS services while covering the following:

* Deployment of required infrastructure including Amazon CodeCommit  and Amazon ECR repositories for code and images respectively
* Deployment and use a modernized pipeline using AWS CodePipeline, AWS CodeBuild 
* Scan vulnerabilities using Amazon inspector
* Automation of approval/rejection in AWS Codepipeline based on Amazon inspector scan results
* Aggregate all vulnerability findings to AWS Security hub

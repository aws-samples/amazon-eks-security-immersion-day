---
title : "Mounting Secrets from AWS Secrets Manager"
weight : 50
---

AWS offers two services to manage secrets and parameters conveniently in your code. [AWS Secrets Manager (Secrets Manager)](https://aws.amazon.com/secrets-manager/) allows you to easily rotate, manage, and retrieve database credentials, API keys, certificates, and other secrets throughout their lifecycle. [AWS Systems Manager Parameter Store (Parameter Store)](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html) provides hierarchical storage for configuration data. 

You can use [AWS Secrets and Configuration Provider (ASCP)](https://github.com/aws/secrets-store-csi-driver-provider-aws) for [Kubernetes Secrets Store CSI Driver](https://secrets-store-csi-driver.sigs.k8s.io/) to make secrets stored in Secrets Manager and parameters stored in parameter store appear as mounted volumes in Kubernetes PODs.

With the ASCP, you can store and manage your secrets in Secrets Manager and then retrieve them through your workloads running on Amazon EKS. You can use IAM roles and policies to limit access to your secrets to specific Kubernetes Pods in a cluster. The ASCP retrieves the Pod identity and exchanges the identity for an IAM role. ASCP assumes the IAM role of the Pod, and then it can retrieve secrets from Secrets Manager that are authorized for that role.

If you use Secrets Manager automatic rotation for your secrets, you can also use the Secrets Store CSI Driver rotation reconciler feature to ensure you are retrieving the latest secret from Secrets Manager.

In the following section, we will see example scenario of using secrets from [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/latest/userguide/integrating_csi_driver.html). Similar steps are required to use parameters from [AWS Systems Manager parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/integrating_csi_driver.html).
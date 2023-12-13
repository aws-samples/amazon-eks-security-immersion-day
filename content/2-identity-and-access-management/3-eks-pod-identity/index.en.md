---
title : "Amazon EKS Pod Identity"
weight : 34
---


## Granting AWS IAM permissions to workloads on Amazon EKS clusters

Amazon EKS provides 2 ways to grant AWS IAM permissions to workloads that run in Amazon EKS clusters.

**1. IAM roles for service accounts**


IAM roles for service accounts (IRSA) configures Kubernetes applications running on AWS with fine-grained IAM permissions to access various AWS resources. IRSA was build to support various Kubernetes deployment options supported by AWS such as Amazon EKS, Amazon EKS Anywhere, Red Hat OpenShift Service on AWS, and self managed Kubernetes clusters on Amazon EC2 instances. Thus, IRSA was build using foundational AWS service like IAM, and did not take any direct dependency on the Amazon EKS service and the EKS API. For more information, see [IAM roles for service accounts](https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html).

**2. EKS Pod Identities**


EKS Pod Identity offers cluster administrators a simplified workflow for authenticating applications to access various AWS resources. EKS Pod Identity is for EKS only, and as a result, it simplifies how cluster administrators can configure Kubernetes applications to obtain IAM permissions. For more information, see [EKS Pod Identities](https://docs.aws.amazon.com/eks/latest/userguide/pod-identities.html).


## Introduction to Amazon EKS Pod Identity

Amazon EKS supports EKS Pod Identity, a new feature that simplifies how cluster administrators can configure Kubernetes applications to obtain AWS [IAM](https://aws.amazon.com/iam/) permissions. These permissions can now be easily configured with fewer steps directly through EKS console, APIs, and CLI. 

EKS Pod Identity supports following features.

*  Reuse IAM role across multiple EKS clusters
*  Reuse of permission policies across IAM roles
*  Allow access to AWS resources based on matching tags


EKS Pod Identity offers cluster administrators a simplified workflow for authenticating applications to all AWS resources such as Amazon S3 buckets, Amazon DynamoDB tables, and more. As a result, cluster administrators need not switch between the EKS and IAM services, or execute privileged IAM operations to configure permissions required by your applications. IAM roles can now be used across multiple clusters without the need to update the role trust policy when creating new clusters. IAM credentials supplied by EKS Pod Identity include support for [role session tags](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_tags.html), with support for attributes such as cluster name, namespace, service account name. Role session tags enable administrators to author a single role that can work across service accounts by allowing access to AWS resources based on matching tags.


## How does Amazon EKS Pod Identity work?

EKS Pod Identity makes it easier to configure and automate granting AWS permissions to Kubernetes identities. As the cluster administrator, you no longer need to switch between Amazon EKS and IAM services to authenticate your applications to all AWS resources.  Instead of creating and distributing your AWS credentials to the containers or using the Amazon EC2 instance's role, you associate an IAM role with a Kubernetes service account and configure your Pods to use the service account.

The overall workflow to use Amazon EKS Pod Identity consiste of below steps.

1. Create IAM role with required permissions and specify `pods.eks.amazonaws.com` as the service principal in trust policy.
2. Install Amazon EKS Pod Identity Agent add-on
3. Map the role to a service account directly. 


Now, any new pods that use that service account will automatically be configured to receive IAM credentials. Each EKS Pod Identity association maps a role to a service account in a namespace in the specified cluster. If you have the same application in multiple clusters, you can make identical associations in each cluster without modifying the trust policy of the role. If a pod uses a service account that has an association, Amazon EKS sets environment variables in the containers of the pod. The environment variables configure the AWS SDKs, including the AWS CLI, to use the EKS Pod Identity credentials.



## Comparing EKS Pod Identity and IRSA


As part of this workshop we will cover the following modules:

|  | EKS Pod Identity | IRSA | 
| --- | --- | --- | 
| **Role extensibility**| no need to update the role's trust policy for each new cluster. | need to update role's trust policy with new EKS cluster OIDC provider endpoint| 
| **Cluster scalability** | no need to setup IAM OIDC provider | need to setup IAM OIDC provider. default global limit of 100 OIDC providers for AWS account applies| 
| **Role scalability**| no need to define trust relationship between IAM role and service account in the trust policy | need to define trust relationship between IAM role and service account in the trust policy. max of 8 trust relationships within a single trust policy applies due to limit on trust policy size |
| **Role reusability**| AWS STS temporary credentials supplied by EKS Pod Identity include role session tags, such as cluster name, namespace, service account name. | AWS STS session tags are not supported. You can reuse a role between clusters but every pod receives all of the permissions of the role |
| **Environments supported**| only available on Amazon EKS | IRSA can be used such as Amazon EKS, Amazon EKS Anywhere, Red Hat OpenShift Service on AWS, and self managed Kubernetes clusters on Amazon EC2 instances. |
| **EKS versions supported** | EKS Kubernetes versions 1.24 or later. | All of the supported EKS cluster versions. | 




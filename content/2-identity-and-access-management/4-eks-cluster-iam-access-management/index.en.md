---
title : "Amazon EKS Cluster Access Management Controls"
weight : 35
---


## Access Methods for Amazon EKS cluster

There are 2 types of identities to allow access to Amazon EKS cluster:

1. **An AWS Identity and Access Management (IAM) principal (role or user)**: it requires authentication to IAM. The IAM Identity 
    * **can be assigned** to Kubernetes permissions to work with Kubernetes objects on cluster. For this, there are 2 methods:
        1. **access entries**: Use `access entries` to manage the Kubernetes permissions of IAM principals from outside the cluster. You can add and manage access to the cluster by using same tools that you created the cluster with.
        2. **aws-auth ConfigMap**: Use `aws-auth ConfigMap` to manage the Kubernetes permissions of IAM principals from inside the cluster. You can't migrate entries that Amazon EKS added to the `ConfigMap` however, such as entries for IAM roles used with managed node groups or Fargate profiles
    * **can be assigned** to IAM permissions to work with Amazon EKS cluster and its resources using the Amazon EKS API, AWS CLI, AWS CloudFormation, AWS Management Console, or eksctl. 

Nodes join cluster by assuming an IAM role. The ability to access cluster using IAM principals is provided by the [AWS IAM Authenticator](https://github.com/kubernetes-sigs/aws-iam-authenticator#readme) for Kubernetes, which runs on the Amazon EKS control plane.

2.  **A user in your own OpenID Connect (OIDC) provider**: It requires authentication to OIDC provider. The OIDC Identity
    * **can be assigned** to Kubernetes permissions to work with Kubernetes objects on  cluster.
    * **can't be assigned** to IAM permissions so that they can work with your Amazon EKS cluster and its resources using the Amazon EKS API, AWS CLI, AWS CloudFormation, AWS Management Console, or eksctl.


You can use both types of identities with cluster. Users need to configure their kubectl config file to access Kubernetes objects on cluster.


## Introduction to Amazon EKS Cluster IAM Access Management Controls

Amazon EKS [supports simplified configuration of AWS IAM users and roles](https://aws.amazon.com/about-aws/whats-new/2023/12/amazon-eks-controls-iam-cluster-access-management/) with Kubernetes clusters, through a new set of APIs that tightly integrate IAM identities with Kubernetes authentication and authorization controls.

EKS already supports IAM identity authentication to Kubernetes clusters. This integration enables administrators to leverage IAM security features such as audit logging and multi-factor authentication. EKS access management controls simplify the process of mapping IAM to Kubernetes identities, by allowing administrators to fully define authorized IAM principals and their associated Kubernetes permissions directly through an EKS API during or after cluster creation. 

The IAM identity used to create a EKS cluster can have its Kubernetes permissions removed or scoped down to comply with security requirements, and control of a cluster can always be restored to an AWS account administrator. Other AWS services can use EKS access management controls to automatically obtain permissions to run applications on EKS clusters. EKS access management controls simplify the amount of work administrators need to do in order to create and manage clusters that are shared by multiple users and other AWS services.

EKS cluster administrators can now grant AWS IAM principals access to all supported versions (v1.23 and beyond) of Amazon EKS clusters and Kubernetes objects directly through Amazon EKS APIs.


EKS access management controls are supported in all AWS regions for newly created clusters using Kubernetes version 1.23 or later. Existing clusters need to be updated to a supported EKS platform version before using this feature. For more details, visit the [EKS documentation](https://docs.aws.amazon.com/eks/latest/userguide/access-entries.html).

## How does EKS Cluster IAM Access Management Controls work?

This functionality relies on two new concepts:

1.  **access entries**: An access entry is a cluster identity and is directly linked to an AWS IAM principal user or role, that is used to authenticate to an Amazon EKS cluster.

2.  **access policies**: Access policies are Amazon EKS-specific policies that authorizes an access entry to perform specific cluster actions. At launch, Amazon EKS supports only predefined AWS managed policies. Access policies are not AWS IAM entities and are defined and managed by Amazon EKS. Amazon EKS access policies include permission sets that support common use cases of administration, editing, or read-only access to Kubernetes resources.

Run the following command and output provide an up-to-date list of supported access policies for managing cluster access.

```bash
aws eks list-access-policies
```

```json
{
    "accessPolicies": [
        {
            "name": "AmazonEKSAdminPolicy",
            "arn": "arn:aws:eks::aws:cluster-access-policy/AmazonEKSAdminPolicy"
        },
        {
            "name": "AmazonEKSClusterAdminPolicy",
            "arn": "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
        },
        {
            "name": "AmazonEKSEditPolicy",
            "arn": "arn:aws:eks::aws:cluster-access-policy/AmazonEKSEditPolicy"
        },
        {
            "name": "AmazonEKSViewPolicy",
            "arn": "arn:aws:eks::aws:cluster-access-policy/AmazonEKSViewPolicy"
        }
    ]
}
```

The following Amazon EKS access policies are based on these [user-facing roles](https://kubernetes.io/docs/reference/access-authn-authz/rbac/#user-facing-roles) published in the Kubernetes documentation:



**AmazonEKSClusterAdminPolicy** – cluster-admin

**AmazonEKSAdminPolicy** – admin

**AmazonEKSEditPolicy** – edit

**AmazonEKSViewPolicy** – view



### Cluster access management API

The new cluster access management API objects and commands allow administrators to define access management configurations either during cluster creation or later, using familiar infrastructure as code (IaC) tools such as [AWS CloudFormation](https://docs.aws.amazon.com/cloudformation/?icmpid=docs_homepage_mgmtgov), [Terraform](https://www.terraform.io/), or the [AWS Cloud Development Kit (CDK)](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html).

Cluster access management using the access entry API is an opt-in feature for Amazon EKS v1.23 and either new or existing clusters.

### Kubernetes authorizers

Kubernetes allows different AuthZ services (i.e. authorizers) chained together in a sequence to make AuthZ decisions about inbound API server requests. This allows custom AuthZ services to be used with the Kubernetes API server. The new feature allows to use upstream RBAC (Role-based access control) in combination with access policies. Both the upstream RBAC and Amazon EKS authorizer support `allow` and `pass` (but not `deny`) on AuthZ decisions. When creating an access entry with Kubernetes usernames or groups, the upstream RBAC evaluates and immediately returns a AuthZ decision upon an allow outcome. If the RBAC authorizer can’t determine the outcome, then it passes the decision to the Amazon EKS authorizer. If both authorizers pass, then a deny decision is returned.


With the cluster access management controls, only AWS IAM principals with the appropriate permissions can authorize other AWS IAM principals to access Amazon EKS clusters.  Only the AWS IAM principal and the applied Amazon EKS access entry policies are used by the cluster access management authorizer. The following diagram illustrates the workflow.

![workflow](/static/images/iam/eks-access-management/workflow.png)

## Cluster authentication modes


The authentication mode determines methods to allow IAM principals to access Kubernetes objects on cluster. There are 3 cluster `authentication modes`. 

1. **CONFIG_MAP**: `aws-auth ConfigMap` Only. This is the original authentication mode for Amazon EKS clusters. The IAM principal that created the cluster is the initial user that can access the cluster by using kubectl.

2. **API_AND_CONFIG_MAP**: With this, you can use both methods (i.e. EKS API and ConfigMap) to add IAM principals to the cluster. Note that each method stores separate entries. 

3. **API**: `Access entries` only. With this, you can use the EKS API, AWS Command Line Interface, AWS SDKs, AWS CloudFormation, and AWS Management Console to manage access to the cluster for IAM principals.

Each access entry has a `type` and you can use the combination of an `access scope` to limit the principal to a specific namespace and an `access policy` to set preconfigured reusable permissions policies. Alternatively, you can use the Standard type and Kubernetes RBAC groups to assign custom permissions.


---
title : "OIDC URL and OIDC authenticated"
weight : 46
---

As you inspect the configuration details for your EKS cluster, you may notice another OIDC provider URL reference in addition to the one we've set up for Cognito. Don't be concerned - this is a separate OIDC integration used for other internal cluster operations, and is not directly related to the OIDC authentication feature we've been discussing in this workshop
![oidc_eks_observability](/static/images/iam/oidc-cognito/oidc-eks-openid-connecturl.jpg)

The EKS cluster configuration includes an additional OpenID Connect (OIDC) provider URL, separate from the one we set up for Cognito authentication.

This OIDC provider URL enables federation between the Kubernetes service account tokens (which are also JWTs) issued by the Kubernetes API server, and AWS IAM. It allows the Kubernetes API server to act as an OIDC identity provider and issue tokens that can be used to assume IAM roles.

"IAM Roles for Service Accounts" allows pods running in the EKS cluster to securely interact with other AWS services, by assuming temporary IAM role credentials based on the pod's Kubernetes service account identity.

The Kubernetes API server passes the token issued from the OIDC provider URL to the AWS STS AssumeRoleWithWebIdentity API operation. AWS STS then provides the IAM temporary role credentials, which the pod can use to access the necessary AWS resources.


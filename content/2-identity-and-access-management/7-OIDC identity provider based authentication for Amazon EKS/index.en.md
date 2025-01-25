---
title : "OIDC Identity provider based authentication for Amazon EKS"
weight : 40
---


Amazon EKS provides the ability to integrate with AWS IAM users and roles as a way to manage access to your Kubernetes clusters. While this is a straightforward approach, we've found that many development teams actually prefer to leverage their own OpenID Connect (OIDC) identity provider instead.

Using your existing OIDC IDP, such as Amazon Cognito, can offer some key advantages. You can tap into your organization's centralized user management workflows, allowing you to easily onboard new developers and manage access permissions, without having to create and maintain separate IAM entities.

Additionally, OIDC integration often provides a more seamless authentication experience for your developers. They can sign in using their familiar corporate credentials, rather than having to switch between AWS IAM and your internal identity system.

In this section, we'll walk through setting up Amazon Cognito as an OIDC-compatible IDP for your Amazon EKS cluster. You'll learn how to extract the necessary user information from the Cognito ID token, associate the IDP with your cluster, and configure Kubernetes RBAC to authorize access based on your existing user groups.

Below is high level architecture of what we intend to achieve in this lab 

![oidc_cognito_architecture](/static/images/iam/oidc-cognito/OIDC-authentication-architecture.png)

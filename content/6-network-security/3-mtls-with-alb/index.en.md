---
title : "Enabling mTLS with ALB in Amazon EKS"
weight : 60
---

In Amazon EKS cluster, you can use [Application Load Balancer](https://aws.amazon.com/elasticloadbalancing/application-load-balancer) to expose your in-cluster workload. When you create a Kubernetes `ingress`, an AWS Application Load Balancer (ALB) is provisioned that load balances application traffic. You can deploy an ALB to public or private subnets and mutually authenticate clients that present X509 certificates.

[Mutual authentication](https://en.wikipedia.org/wiki/Mutual_authentication) (mTLS) is commonly used for business-to-business (B2B) applications such as online banking, automobile, or gaming devices to authenticate devices using digital certificates to add an extra layer of security. Companies typically use it with a private certificate authority (CA) to authenticate their clients before granting access to data and services.

Mutual TLS authentication (mTLS) is a variation of transport layer security (TLS). Traditional TLS establishes secure communications between a server and client, where the server needs to provide its identity to its clients. With mutual TLS, a load balancer negotiates mutual authentication between the client and the server while negotiating TLS. When you use mutual TLS with Application Load Balancer, you simplify authentication management and reduce the load on your applications.

Mutual TLS for Application Load Balancers provides the following two options for validating your X.509v3 client certificates:

* **Mutual TLS passthrough:** When you use mutual TLS passthrough mode, Application Load Balancer sends the whole client certificate chain to the target using HTTP headers. Then, by using the client certificate chain, you can implement corresponding authentication and authorization logic in your application.
* **Mutual TLS verify:** When you use mutual TLS verify mode, Application Load Balancer performs X.509 client certificate authentication for clients when a load balancer negotiates TLS connections.

This module walks you through how to set up mTLS for an application running on Amazon Elastic Kubernetes Service (Amazon EKS) using [ALB Controller](https://docs.aws.amazon.com/eks/latest/userguide/aws-load-balancer-controller.html) and ACM Private CA. It can be used for business-to-business applications or standards such as [Open Banking](https://docs.aws.amazon.com/wellarchitected/latest/financial-services-industry-lens/open-banking.html).

## How mTLS Works

In TLS, the server has a TLS certificate and a public/private key pair, while the client does not. The client connects to server, server presents its TLS certificate, client verifies the server's certificate and finally, the client and server exchange information over encrypted TLS traffic. While in mTLS, both the client and server have a certificate, and both sides authenticate using their public/private key pair, including an additional steps where both the client and server presents their certificate to verify both parties.

**AWS Blogs on mTLS:**

* [Enabling mTLS with ALB in Amazon EKS](https://aws.amazon.com/blogs/containers/enabling-mtls-with-alb-in-amazon-eks/)
* [Mutual authentication for Application Load Balancer reliably verifies certificate-based client identities](https://aws.amazon.com/blogs/aws/mutual-authentication-for-application-load-balancer-to-reliably-verify-certificate-based-client-identities/)

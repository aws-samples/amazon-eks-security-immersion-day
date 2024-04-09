---
title : "Introduction to Demo System Architecture"
weight : 10
---

We will be implementing the following System Architecture in this Workshop Module.

![system_arch.png](/static/images/6-network-security/3-mtls-with-alb/system_arch.png)

In this architecture, we will be configuring mutual TLS on an Application Load Balancer that is used to exposed a sample backend application in the cluster. We will also deploy a client pod that will be connecting to the backend application by presenting its client certificate when it connects to the Application Load Balancer. The load balancer manage client authentication with certificates from the AWS Private Certificate Authority (PCA) to help ensure that only trusted clients communicate with the backend application. We will use mutual TLS in verify mode, this will ensure that the Application Load Balancer performs X.509 client certificate authentication for the client pod when the load balancer negotiates TLS connections.

A closer look at the flow of traffic between the client pod and the backend application within the cluster.

![system_arch.png](/static/images/6-network-security/3-mtls-with-alb/MTLS-Kubernetes-Traffic-Flow.png)

1. The client pod connects and presents its X.509v3 client certificate to the Application Load Balancer.
2. The Application Load Balancer authenticates the X.509 client certificate using the AWS Private Certificate Authority (PCA) in Trust store.
3. The Application Load Balancer approves, grant access, and passes on encrypted communication to the backend application.

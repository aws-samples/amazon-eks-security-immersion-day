---
title : "Single Cluster VPC Lattice Use cases"
weight : 12
---

In this section, We are going to work only in Cluster1. we will execute the following modules. It is recommended to execute these modules in the same order mentioned.

1. [**Deploy AWS Gateway API Controller and Gateway Resource**](1-deploy-gw-api-controller)
2. [**Usecase 1: Service Connectivity with HTTP in Default Configuration**](2-service-connect-defalt-config)
3. [**Usecase 2: Service Connectivity with HTTP and IAM Auth Access Controls**](3-service-connect-with-iam)
4. [**Usecase 3: Service Connectivity with HTTPS on Default Domain and IAM Auth Access Controls**](4-service-connect-https-default-domain)
5. [**Usecase 4: Service Connectivity with HTTPS on Custom Domain and IAM Auth Access Controls**](5-service-connect-https-custom-domain)

Final module Usecase 4 diagram:

![](/static/images/6-network-security/2-vpc-lattice-service-access/lattice-usecase4-kyverno.png)

In this module we are going to finally create microservice connectivity between the same EKS cluster, using custom domain name and IAM authorization between our application client (app1) and our application server (app4).

We are going to rely on: 
- Private Certificate Authority to secure our TLS connections
- AWS Route 53 to host our private domain name
- External DNS to register our VPC lattice service with AWS Route 53
- AWS ACM to offer certificate for our app4 application
- Gateway API controller to register our VPC lattice services from the `HTTPRoute` Objects. and secure access with the `IAMAuthPolicy` configured
- envoy proxy to to sigv4 signing of the request and call lattice service in HTTPS with the ACM certificate
- Kyverno to dynamically inject envoy proxy and configure iptables routes to make traffic goes into the proxy
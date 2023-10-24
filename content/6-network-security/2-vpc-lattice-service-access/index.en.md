---
title : "Implementing IAM based Service Authentication with Amazon VPC Lattice"
weight : 40
---

[Amazon VPC](https://aws.amazon.com/vpc/lattice/) Lattice is a fully managed application networking service built directly into the AWS network infrastructure that you use to connect, secure, and monitor all of your services across multiple accounts and virtual private clouds (VPCs). With Amazon EKS, customers can leverage Amazon VPC Lattice through the use of [AWS Gateway API controller](https://github.com/aws/aws-application-networking-k8s), an implementation of the [Kubernetes Gateway API](https://gateway-api.sigs.k8s.io/). Using VPC Lattice, EKS customers can set up cross-cluster connectivity with standard Kubernetes semantics in a simple and consistent manner.

## How Amazon VPC Lattice Works

* **Service Directory**: This is an account-level directory for gathering your services in once place. This can provide a view from the VPC Lattice section of the AWS console into all the services you own, as well as services that are shared with you. A service might direct traffic to a particular service type (such as HTTP) and port (such as port 80). However, using different rules, a request for the service could be sent to different targets such as a Kubernetes pod or a Lambda function, based on path or query string parameter.

* **service network** : It is a logical application layer network, called a service network, that connects clients and services across different VPCs and accounts, abstracting network complexity. A service network is a logical boundary that is used to automatically implement service discovery and connectivity as well as apply access and observability policies to a collection of services. It offers inter-application connectivity over HTTP/HTTPS and gRPC protocols within a VPC.

    Once a VPC has been enabled for a service network, clients in the VPC will automatically be able to discover the services in the service network through DNS and will direct all inter-application traffic through VPC Lattice. You can use AWS Resource Access Manager (RAM) to control which accounts, VPCs, and applications can establish communication via VPC Lattice.

* **Service Policies**: You can build service policies to configure observability, access, and traffic management across any service network or gateway. You configure rules for handling traffic and for authorizing access. For now, you can assign IAM roles to allow certain requests. These are similar to S3 or IAM resource policies. Overall, this provides a common way to apply access rules at the service or service network levels.

* **service** : A service is an independently deployable unit of software that delivers a specific task or function. In VPC Lattice, a service is a logical component that can live in any VPC or account and can run on a mixture of compute types (virtual machines, containers, and serverless functions). A service configuration consists of:

    One or two **listeners** that define the port and protocol that the service is expecting traffic on. Supported protocols are HTTP/1.1, HTTP/2, and gRPC, including HTTPS for TLS-enabled services.

    Listeners have **rules** that consist of a **priority**, which specifies the order in which rules should be processed, one or more **conditions** that define when to apply the rule, and actions that forward traffic to target groups. Each listener has a **default rule** that takes effect when no additional rules are configured, or no conditions are met.

    A **target group** is a collection of **targets**, or compute resources, that are running a specific workload you are trying to route toward. Targets can be Amazon Elastic Compute Cloud (Amazon EC2) instances, IP addresses, and Lambda functions. For Kubernetes workloads, VPC Lattice can target services and pods via the **AWS Gateway Controller for Kubernetes**. 

![vpc-lattice-logical-architecture-1024x576.png](/static/images/6-network-security/2-vpc-lattice-service-access/vpc-lattice-logical-architecture-1024x576.png)

    

##  Relationship between VPC Lattice and Kubernetes

As a Kubernetes user, you can have a very Kubernetes-native experience using the VPC Lattice APIs. The following figure illustrates how VPC Lattice objects connect to [Kubernetes Gateway API](https://gateway-api.sigs.k8s.io/) objects:


![vpc-lattice-to-k8s-objects.png](/static/images/6-network-security/2-vpc-lattice-service-access/vpc-lattice-to-k8s-objects.png)
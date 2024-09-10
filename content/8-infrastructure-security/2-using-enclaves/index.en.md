---
title : "Using Enclaves with Amazon EKS"
weight : 31
---

[AWS Nitro Enclaves](https://aws.amazon.com/ec2/nitro/nitro-enclaves/) is an Amazon EC2 capability that enables customers to create isolated compute environments to further protect and securely process highly sensitive data within their EC2 instances. Nitro Enclaves helps customers reduce the attack surface area for their most sensitive data processing applications. AWS Nitro Enclaves supports Amazon EKS and Kubernetes for orchestrating Nitro enclaves. Customers can use familiar Kubernetes tools to orchestrate, scale, and deploy enclaves from a Kubernetes pod.

The Nitro Enclaves [Device Plugin](https://kubernetes.io/docs/concepts/extend-kubernetes/compute-storage-net/device-plugins/) gives your pods and containers the ability to access the [Nitro Enclaves device driver](https://docs.kernel.org/virt/ne_overview.html) to provide Kubernetes pods with the ability to manage the lifecycle of an enclave. The device plugin works with both Amazon EKS and self-managed Kubernetes nodes.

![Enclaves-EKS.png](/static/images/using-enclaves/1-intro/Enclaves-EKS.png)
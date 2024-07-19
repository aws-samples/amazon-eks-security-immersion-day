---
title : "Introduction"
weight : 21
---

In this module, we will deploy an example scenario of using [Enclaves with Amazon EKS](https://docs.aws.amazon.com/enclaves/latest/user/kubernetes.html). We will be performing the following activities in this lab module:

1. Create a launch template to launch the enclave-enabled worker nodes
2. Create an enclave-enabled node group (EC2 instances with the EnclaveOptions parameter set to true) using the launch template.
3. Install the Nitro Enclaves Kubernetes device plugin
4. Prepare the image
5. Deploy a sample application to the cluster

The simple application that prints periodically on the Nitro Enclave debug console.

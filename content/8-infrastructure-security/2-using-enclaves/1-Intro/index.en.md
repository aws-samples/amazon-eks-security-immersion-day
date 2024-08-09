---
title : "Introduction"
weight : 21
---

In this module, we will deploy an example scenario of using [Enclaves with Amazon EKS](https://docs.aws.amazon.com/enclaves/latest/user/kubernetes.html). We will be performing the following activities in this lab module:

1. Create a launch template to launch the enclave-enabled worker nodes as a new node group in the existing Amazon EKS cluster.
2. Create an enclave-enabled node group (EC2 instances with the EnclaveOptions parameter set to true) using the launch template.
3. Install the Nitro Enclaves Kubernetes device plugin
4. Prepare the [image](https://github.com/aws/aws-nitro-enclaves-cli/tree/main/examples/x86_64/hello).
5. Deploy a sample application to the cluster

## Architecture

We will be implementing the following System Architecture in this Workshop Module.

* The EC2 instance (worker node) is enclave-enabled.
* The [Nitro Enclaves Kubernetes device plugin](https://github.com/aws/aws-nitro-enclaves-k8s-device-plugin) installed enables Kubernetes pods to access Nitro Enclaves device driver.
* The sample pod will be able to communicate with the enclave attached to the worker node.
* The sample application uses [Nitro CLI](https://docs.aws.amazon.com/enclaves/latest/user/nitro-enclave-cli.html) to create and terminate enclaves. It prints a simple text periodically on the Nitro Enclave debug console.

![Enclaves-EKS.png](/static/images/using-enclaves/1-intro/Enclaves-EKS.png)

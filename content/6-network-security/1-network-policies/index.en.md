---
title : "Implementing Kubernetes Network Policies using Amazon VPC CNI"
weight : 30
---

By default, Kubernetes allows all pods to communicate with each other with no restrictions. [Kubernetes Network Policies](https://kubernetes.io/docs/concepts/services-networking/network-policies/) enable you to define and enforce rules for the flow of traffic between pods. They act as a virtual firewall, which allows you to segment and secure your cluster by specifying ingress (i.e., incoming) and egress (e.g., outgoing) network traffic rules based on various criteria such as

* **pod label selectors**
* **namespaces**
* **IP blocks**
* **ports**

The Amazon [VPC Container Networking Interface (CNI)](https://github.com/aws/amazon-vpc-cni-k8s) Plugin [now supports](https://aws.amazon.com/about-aws/whats-new/2023/08/amazon-vpc-cni-kubernetes-networkpolicy-enforcement/) the Kubernetes NetworkPolicy resource.

With native VPC integration, you can secure applications using standard components including **security groups**, and **network access control lists (ACL)**, as part of additional defense-in-depth measures.

Starting with **VPC CNI v1.14**, NetworkPolicy support is available on **new clusters** running Kubernetes version **1.25 and above** and **Kernel version 5.10 or later** but **turned off by default** at launch.


## How does it work?

When Kubernetes network policies were first introduced, the default and widely adopted implementation was iptables. While iptables proved effective for enforcing network policies, it presented some limitations, particularly as Kubernetes clusters scaled up in size. 

To address these challenges and improve performance, Amazon EKS adopted an advanced approach by implementing network policies using extended Berkeley Packet Filter (eBPF). 


Amazon EKS introduces three key components that work seamlessly together:

* **Network Policy Controller**: When you create a new Amazon EKS cluster, the network policy controller is automatically installed on the Kubernetes control plane when the feature is enabled. It actively monitors the creation of network policies within your cluster and reconciles policy endpoints. Subsequently, the controller instructs the node agent to create or update eBPF programs on the node by publishing pod information through the policy endpoints. 

[Network Policy Controller](https://github.com/aws/amazon-network-policy-controller-k8s/) resolves the configured network policies and publishes the resolved endpoints via Custom CRD (PolicyEndpoints) resource. Network Policy agent derives the endpoints from PolicyEndpoint resources and enforces them via eBPF probes attached to pod's host Veth interface.

For more details, check out the Github page for [Amazon Network Policy Controller for Kubernetes](https://github.com/aws/amazon-network-policy-controller-k8s)

* **Node Agent**: The node agent is bundled with VPC CNI and runs as container under aws-node Daemonset. This node agent receives policy endpoints from controllers when the network policies are applied to the cluster. The node agent plays a critical role in managing eBPF programs, which paves the way for seamless enforcement of network policies.

For more details, check out the Github page for[aws-network-policy-agent](https://github.com/aws/aws-network-policy-agent)


* **eBPF SDK (Software Development Kit)**: Amazon VPC CNI includes an SDK that provides an intuitive interface to interact with [eBPF](https://ebpf.io/what-is-ebpf/) programs on the node. This SDK allows for runtime introspection, tracing, and analysis of eBPF execution that aides in identifying and resolving connectivity issues.

For more details, check out the Github page for [AWS eBPF SDK](https://github.com/aws/aws-ebpf-sdk-go)

![ebpf_overview](/static/images/6-network-security/1-network-policies/ebpf_overview.png)

[Image source](https://ebpf.io/what-is-ebpf/)

eBPF allows **Programmability** to run sandboxed programs inside kernel, **Security** to filter network traffic and **Observability** to capture system call events occurring within the kernel

The below diagram explains the interaction between these components.

![vpc_cni_policy](/static/images/6-network-security/1-network-policies/vpc_cni_policy.png)

For more details, checkout the [Amazon EKS documentation](https://docs.aws.amazon.com/eks/latest/userguide/cni-network-policy.html) and [launch blog](https://aws.amazon.com/blogs/containers/amazon-vpc-cni-now-supports-kubernetes-network-policies/).


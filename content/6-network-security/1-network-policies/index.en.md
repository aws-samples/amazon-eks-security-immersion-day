---
title : "Implementing Kubernetes Network Policies using Amazon VPC CNI"
weight : 30
---

By default, Kubernetes allows all pods to communicate with each other with no restrictions. Kubernetes Network Policies enable you to define and enforce rules for the flow of traffic between pods. They act as a virtual firewall, which allows you to segment and secure your cluster by specifying ingress (i.e., incoming) and egress (e.g., outgoing) network traffic rules based on various criteria such as pod labels, namespaces, IP addresses, IP blocks (CIDR ranges) and ports. [Amazon VPC CNI now supports Kubernetes Network Policies](https://aws.amazon.com/blogs/containers/amazon-vpc-cni-now-supports-kubernetes-network-policies/).


When Kubernetes network policies were first introduced, the default and widely adopted implementation was iptables. While iptables proved effective for enforcing network policies, it presented some limitations, particularly as Kubernetes clusters scaled up in size. 

To address these challenges and improve performance, Amazon EKS adopted an advanced approach by implementing network policies using extended Berkeley Packet Filter (eBPF). 


Amazon EKS introduces three key components that work seamlessly together:

* **Network Policy Controller**: When you create a new Amazon EKS cluster, the network policy controller is automatically installed on the Kubernetes control plane when the feature is enabled. It actively monitors the creation of network policies within your cluster and reconciles policy endpoints. Subsequently, the controller instructs the node agent to create or update eBPF programs on the node by publishing pod information through the policy endpoints. 
* **Node Agent**: The node agent is bundled with VPC CNI and runs as container under aws-node Daemonset. This node agent receives policy endpoints from controllers when the network policies are applied to the cluster. The node agent plays a critical role in managing eBPF programs, which paves the way for seamless enforcement of network policies.
* **eBPF SDK (Software Development Kit)**: Amazon VPC CNI includes an SDK that provides an intuitive interface to interact with eBPF programs on the node. This SDK allows for runtime introspection, tracing, and analysis of eBPF execution that aides in identifying and resolving connectivity issues.





   


    



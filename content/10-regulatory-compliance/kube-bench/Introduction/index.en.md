---
title : "Introduction to CIS Amazon EKS Benchmark and kube-bench"
weight : 21
---

### CIS Kubernetes Benchmark

The Center for Internet Security (CIS) publishes best practice security recommendations in the form of benchmarks. CIS benchmarks are the result of a community consensus process and are designed specifically for Kubernetes. The [CIS Kubernetes benchmark](https://www.cisecurity.org/benchmark/kubernetes) provide comprehensive security guidelines and recommendations for various aspects, including:

1. Control Plane Components: Recommendations for control plane node configurations and components.
2. Worker Nodes: Guidelines for worker node configurations and Kubelet. The Amazon EKS optimized [Amazon Linux AMIs](https://docs.aws.amazon.com/eks/latest/userguide/eks-optimized-ami.html) supports CIS EKS benchmark by default
3. Policies: Security recommendations encompassing RBAC, service accounts, Pod security standards, CNI and network policies.
4. Managed Services: This includes Secret Management, Container Image Scanning and Least privileged RBAC and IAM Roles etc.


### [CIS Amazon Elastic Kubernetes Service (EKS) Benchmark](https://aws.amazon.com/blogs/containers/introducing-cis-amazon-eks-benchmark/)

Since Amazon Elastic Kubernetes Service (EKS) is offering a managed control plane, not all the recommendations outlined in the CIS Kubernetes Benchmark are relevant, as customers are not configuring or overseeing the control plane components.

- If you are looking to harden the Amazon Linux 2 OS for CIS Benchmark and build Amazon EKS AMI, you can refer to the guidance provided [here](https://aws.amazon.com/blogs/containers/building-amazon-linux-2-cis-benchmark-amis-for-amazon-eks/).
- If you are looking to harden the Bottle rocket OS for CIS Benchmark and build Amazon EKS AMI, you can refer to the guidance provided [here](https://aws.amazon.com/blogs/containers/validating-amazon-eks-optimized-bottlerocket-ami-against-the-cis-benchmark/).

### kube-bench

kube-bench is a widely used open-source assessment tool for the CIS Kubernetes Benchmark, developed by AquaSecurity. This is a go application verifies the secure deployment of Kubernetes by conducting the checks specified in the CIS Kubernetes Benchmark. This tool can be configure using YAML files and enable easy updates to accommodate evolving test specifications. AquaSecurity, the creator of kube-bench, is an [AWS Advanced Technology Partner](https://aws.amazon.com/partners/find/partnerdetails/?n=Aqua%20Security&id=001E000001LiLQqIAN).

kube-bench implements the CIS Kubernetes Benchmark as closely as possible. There is not a one-to-one mapping between releases of Kubernetes and releases of the CIS benchmark. please check kube-bench cis kubernetes benchmark support [here](https://github.com/aquasecurity/kube-bench/blob/main/docs/platforms.md#cis-kubernetes-benchmark-support)
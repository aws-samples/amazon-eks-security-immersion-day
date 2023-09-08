---
title : "Configure EKS Cluster for Kubernetes network policies"
weight : 20
---

## Prerequisites

Network policies in the Amazon VPC CNI plugin for Kubernetes are supported in the following configurations.

*  **New Amazon EKS clusters of version 1.25 and later.**


You can check your current Kubernetes version with following command.

```bash
aws eks describe-cluster --name eksworkshop-eksctl --query cluster.version --output text
``` 

The outout shows 1.25, which is the supported version.

```bash
1.25
```

* **Version 1.14 or later of the Amazon VPC CNI plugin for Kubernetes on your cluster.**

You can see which version that you currently have with the following command.

```bash
kubectl describe daemonset aws-node --namespace kube-system | grep amazon-k8s-cni: | cut -d : -f 3
```

The output shows.

```bash
v1.12.2-eksbuild.1
```

This means we need to upgrade Amazon VPC CNI plugin to Version 1.14 or later. We will do that shortly in this section.

* **Your nodes must have Linux kernel version 5.10 or later**

Run the following command to check kernel version on the EKS worker nodes.

```bash
kubectl get node -o wide
```

The output will look lke below.

```bash
NAME                                          STATUS   ROLES    AGE    VERSION                INTERNAL-IP     EXTERNAL-IP   OS-IMAGE         KERNEL-VERSION                  CONTAINER-RUNTIME
ip-10-254-168-31.us-west-2.compute.internal   Ready    <none>   2d5h   v1.25.12-eks-8ccc7ba   10.254.168.31   <none>        Amazon Linux 2   5.10.186-179.751.amzn2.x86_64   containerd://1.6.19
ip-10-254-220-85.us-west-2.compute.internal   Ready    <none>   2d5h   v1.25.12-eks-8ccc7ba   10.254.220.85   <none>        Amazon Linux 2   5.10.186-179.751.amzn2.x86_64   containerd://1.6.19
```

The output shows the Linux version is `5.10.186-179.751.amzn2.x86_64` which is supported.

## Enable network policy in the VPC CNI

Open the `amazon-vpc-cni` `ConfigMap` in your editor.

```bash
kubectl edit configmap -n kube-system amazon-vpc-cni -o yaml       
```
Add the following line to the data in the `ConfigMap`.

```json
enable-network-policy-controller: "true"
```
Once you've added the line, your `ConfigMap` should look like the following example.

```yaml
apiVersion: v1
 kind: ConfigMap
 metadata:
  name: amazon-vpc-cni
  namespace: kube-system
 data:
  enable-network-policy-controller: "true"
```

Open the aws-node DaemonSet in your editor.

```bash
kubectl edit daemonset -n kube-system amazon-vpc-cni -o yaml
```

Replace the false with true in the command argument `--enable-network-policy=false` in the `args:` in the `aws-network-policy-agent` container in the VPC CNI `aws-node` daemonset manifest.

```yaml
     - args:
        - --enable-network-policy=true
```

Confirm that the `aws-node` pods are running on your cluster.

```bash
kubectl get pods -n kube-system | grep 'aws-node\|amazon'
```
An example output is as follows.

```bash
aws-node-cvdq6             2/2     Running   0          117m
aws-node-vhf65             2/2     Running   0          117m
```

If network policy is enabled, there are 2 containers in the `aws-node` pods. In previous versions and if network policy is disabled, there is only a single container in the `aws-node` pods.

Run the below command to check the container names in the  Amazon VPC CNI node agent.

```bash
kubectl get ds -n kube-system aws-node -o jsonpath='{.spec.template.spec.containers[*].name}{"\n"}'
```

The output will look like below.

```bash
aws-node aws-eks-nodeagent
```

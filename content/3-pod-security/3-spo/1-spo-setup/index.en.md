---
title : "Setting Up the Security Profiles Operator in Amazon EKS"
weight : 22
---

The Security Profiles Operator (SPO) is a powerful tool for managing security profiles in Kubernetes clusters. This guide will walk you through the process of installing and configuring SPO in your Amazon EKS environment.

**Prerequisites**

* An active Amazon EKS cluster
* kubectl configured to interact with your cluster
* Sufficient permissions to create and manage Kubernetes resources

**Step 1: Set Environment Variables**

First, let's set the necessary environment variables for the versions we'll be using:
```bash
export CERT_MANAGER_VERSION="v1.13.2"
export SPO_VERSION="v0.8.3"
```

**Step 2: Step 2: Install cert-manager**

`cert-manager` is a prerequisite for SPO. Install it using the following command:

:::code{showCopyAction=true showLineNumbers=false language=bash} kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/$CERT_MANAGER_VERSION/cert-manager.yaml :::

Verify the installation by checking if the `cert-manager` pods are ready:

:::code{showCopyAction=true showLineNumbers=false language=bash} kubectl --namespace cert-manager wait --for condition=ready pod -l app.kubernetes.io/instance=cert-manager :::

You should see output indicating that the pods are ready:

::::expand{header="Check Output"}
```bash
pod/cert-manager-7d75f47cc5-mq74z condition met
pod/cert-manager-cainjector-c778d44d8-zvlmb condition met
pod/cert-manager-webhook-55d76f97bb-rppzm condition met
```
::::

**Step 3: Install the Security Profiles Operator**

Now, let's install the Security Profiles Operator:

:::code{showCopyAction=true showLineNumbers=false language=bash} kubectl apply -f https://raw.githubusercontent.com/kubernetes-sigs/security-profiles-operator/$SPO_VERSION/deploy/operator.yaml :::

**Step 4: Validate the Installation**

To ensure that SPO is running correctly in your cluster, run:

:::code{showCopyAction=true showLineNumbers=false language=bash}
kubectl get pods -n security-profiles-operator
:::

You should see output similar to this:

```bash
NAME                                                READY    STATUS    RESTARTS   AGE
security-profiles-operator-76c6f984fd-5d6vb          1/1     Running   0          20m
security-profiles-operator-76c6f984fd-d5hnl          1/1     Running   0          20m
security-profiles-operator-76c6f984fd-gs9s5          1/1     Running   0          20m
security-profiles-operator-webhook-7896775d4-89rzr   1/1     Running   0          11m
security-profiles-operator-webhook-7896775d4-f6zbd   1/1     Running   0          11m
security-profiles-operator-webhook-7896775d4-ms2n8   1/1     Running   0          11m
spod-2wk65                                           2/2     Running   0          11m
spod-9f8jq                                           2/2     Running   0          11m
spod-frp6w                                           2/2     Running   0          11m
```


You have successfully set up the Security Profiles Operator in your Amazon EKS cluster. This powerful tool will help you manage and enforce security profiles across your Kubernetes workloads.

**Next Steps**

* Explore creating custom security profiles
* Implement security policies for your applications
* Monitor and audit security profile usage in your cluster

For more information on using SPO, refer to the official github [repo](https://github.com/kubernetes-sigs/security-profiles-operator).
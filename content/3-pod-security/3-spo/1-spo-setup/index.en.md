---
title : "Security Profiles Operator setup in Amazon EKS"
weight : 22
---

In this section, we will setup the Security Profiles Operator within the cluster.

**Install Operator**

Set below environment variables:
```bash
export CERT_MANAGER_VERSION="v1.13.2"
export SPO_VERSION="v0.8.3"
```

To deploy the operator, first install `cert-manager` via `kubectl`:

:::code{showCopyAction=true showLineNumbers=false language=bash} kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/$CERT_MANAGER_VERSION/cert-manager.yaml :::

Check if `cert-manager` has been succesfully installed:

:::code{showCopyAction=true showLineNumbers=false language=bash} kubectl --namespace cert-manager wait --for condition=ready pod -l app.kubernetes.io/instance=cert-manager :::

::::expand{header="Check Output"}
```bash
pod/cert-manager-7d75f47cc5-mq74z condition met
pod/cert-manager-cainjector-c778d44d8-zvlmb condition met
pod/cert-manager-webhook-55d76f97bb-rppzm condition met
```
::::

Install the operator:

:::code{showCopyAction=true showLineNumbers=false language=bash} kubectl apply -f https://raw.githubusercontent.com/kubernetes-sigs/security-profiles-operator/$SPO_VERSION/deploy/operator.yaml :::

Validate that Security Profiles Operator is running within your cluster:

:::code{showCopyAction=true showLineNumbers=false language=bash}
kubectl get pods -n security-profiles-operator
:::

The output will look like below.

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

This completes the SPO setup on Amazon EKS cluster.


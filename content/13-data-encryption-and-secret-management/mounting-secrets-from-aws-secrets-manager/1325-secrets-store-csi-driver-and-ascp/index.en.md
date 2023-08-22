---
title : "Secrets Store CSI Driver and ASCP"
weight : 25
---

Let's prepare your cluster by installing Secrets Store CSI Secret driver and AWS Secrets and Configuration Provider (ASCP). 

We will install Secret Store CSI Driver first using helm,

```bash
helm repo add secrets-store-csi-driver \
  https://kubernetes-sigs.github.io/secrets-store-csi-driver/charts

helm install -n kube-system csi-secrets-store \
  --set syncSecret.enabled=true \
  --set enableSecretRotation=true \
  secrets-store-csi-driver/secrets-store-csi-driver
```
::::expand{header="Check Output"}

```bash
"secrets-store-csi-driver" has been added to your repositories
NAME: csi-secrets-store
LAST DEPLOYED: Mon Aug 21 17:49:28 2023
NAMESPACE: kube-system
STATUS: deployed
REVISION: 1
TEST SUITE: None
NOTES:
The Secrets Store CSI Driver is getting deployed to your cluster.
To verify that Secrets Store CSI Driver has started, run:

  kubectl --namespace=kube-system get pods -l "app=secrets-store-csi-driver"

Now you can follow these steps https://secrets-store-csi-driver.sigs.k8s.io/getting-started/usage.html
to create a SecretProviderClass resource, and a deployment using the SecretProviderClass.

```

::::

Let's verify that daemonset deployed for *csi-secrets-store-secrets-store-csi-driver* for standard Secrets Store CSI Driver.

```bash
kubectl --namespace=kube-system get daemonset -l "app=secrets-store-csi-driver"
kubectl --namespace=kube-system get pods -l "app=secrets-store-csi-driver"
```

::::expand{header="Check Output"}

```text

NAME                             DESIRED   CURRENT   READY   UP-TO-DATE   AVAILABLE   NODE SELECTOR            AGE
csi-secrets-store-provider-aws   1         1         1       1            1           kubernetes.io/os=linux   34s

NAME                                               READY   STATUS    RESTARTS   AGE
csi-secrets-store-secrets-store-csi-driver-hd495   3/3     Running   0          39s
csi-secrets-store-secrets-store-csi-driver-hrqd7   3/3     Running   0          39s

```

::::

To install the csi-secrets-store-provider-aws for the ASCP use the YAML file from [github deployment](https://github.com/aws/secrets-store-csi-driver-provider-aws) directory.

```bash
kubectl apply -f https://raw.githubusercontent.com/aws/secrets-store-csi-driver-provider-aws/main/deployment/aws-provider-installer.yaml
```
::::expand{header="Check Output"}

```bash
ercontent.com/aws/secrets-store-csi-driver-provider-aws/main/deployment/aws-provider-installer.yaml
serviceaccount/csi-secrets-store-provider-aws created
clusterrole.rbac.authorization.k8s.io/csi-secrets-store-provider-aws-cluster-role created
clusterrolebinding.rbac.authorization.k8s.io/csi-secrets-store-provider-aws-cluster-rolebinding created
daemonset.apps/csi-secrets-store-provider-aws created
```
::::

Let's verify that daemonset deployed for *csi-secrets-store-provider-aws* for the ASCP that supports provider (AWS) specific options.

```bash
kubectl get daemonsets -n kube-system -l app=csi-secrets-store-provider-aws
kubectl get pods -n kube-system -l app=csi-secrets-store-provider-aws
```

::::expand{header="Check Output"}
```bash
NAME                             DESIRED   CURRENT   READY   UP-TO-DATE   AVAILABLE   NODE SELECTOR            AGE
csi-secrets-store-provider-aws   2         2         2       2            2           kubernetes.io/os=linux   29s

NAME                                   READY   STATUS    RESTARTS   AGE
csi-secrets-store-provider-aws-jdxm2   1/1     Running   0          33s
csi-secrets-store-provider-aws-jjjmr   1/1     Running   0          33s
```
::::

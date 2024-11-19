---
title: "Configure aws-auth configmap"
weight: 26
---

In this section, we will configure aws-auth configmap for mapping between IAM role(i.e. Kubernetes User) to Kubernetes RBAC Role.

#### Gives Access to our IAM roles to Amazon EKS cluster

In order to give access to the IAM roles we defined previously to our Amazon EKS cluster, we need to add specific **mapRoles** to the `aws-auth` ConfigMap

The advantage of using Role to access the cluster instead of specifying directly IAM users is that it will be easier to manage so we won't have to update the ConfigMap each time we want to add or remove users, we will just need to add or remove users from the IAM user group and we just configure the ConfigMap to allow the IAM role associated to the IAM user group.

### Update the aws-auth configmap to allow our IAM roles

The **aws-auth** configmap from the kube-system namespace must be edited in order to allow or delete IAM roles arns.

This file makes the mapping between IAM role and Kubernetes RBAC rights. We can edit it manually:

We can edit it using [eksctl](https://github.com/weaveworks/eksctl) :

```bash
eksctl create iamidentitymapping \
  --cluster eksworkshop-eksctl \
  --arn arn:aws:iam::${ACCOUNT_ID}:role/k8sDev \
  --username dev-user

eksctl create iamidentitymapping \
  --cluster eksworkshop-eksctl \
  --arn arn:aws:iam::${ACCOUNT_ID}:role/k8sInteg \
  --username integ-user

eksctl create iamidentitymapping \
  --cluster eksworkshop-eksctl \
  --arn arn:aws:iam::${ACCOUNT_ID}:role/k8sAdmin \
  --username admin \
  --group system:masters
```

::::expand{header="Check Output"}

```json
2023-03-14 09:57:10 [ℹ]  checking arn arn:aws:iam::12345678900:role/k8sDev against entries in the auth ConfigMap
2023-03-14 09:57:10 [ℹ]  adding identity "arn:aws:iam::12345678900:role/k8sDev" to auth ConfigMap

2023-03-14 09:57:10 [ℹ]  checking arn arn:aws:iam::12345678900:role/k8sInteg against entries in the auth ConfigMap
2023-03-14 09:57:10 [ℹ]  adding identity "arn:aws:iam::12345678900:role/k8sInteg" to auth ConfigMap

2023-03-14 09:57:10 [ℹ]  checking arn arn:aws:iam::12345678900:role/k8sAdmin against entries in the auth ConfigMap
2023-03-14 09:57:10 [ℹ]  adding identity "arn:aws:iam::12345678900:role/k8sAdmin" to auth ConfigMap
```

::::

you should have the config map looking something like:

```bash
kubectl get cm -n kube-system aws-auth -o yaml
```

The output looks like below.

```yaml
apiVersion: v1
data:
  mapRoles: |
    - groups:
      - system:bootstrappers
      - system:nodes
      rolearn: arn:aws:iam::12345678900:role/eksctl-eksworkshop-eksctl-nodegro-NodeInstanceRole-14TKBWBD7KWFH
      username: system:node:{{EC2PrivateDNSName}}
    - rolearn: arn:aws:iam::12345678900:role/k8sDev
      username: dev-user
    - rolearn: arn:aws:iam::12345678900:role/k8sInteg
      username: integ-user
    - groups:
      - system:masters
      rolearn: arn:aws:iam::12345678900:role/k8sAdmin
      username: admin
  mapUsers: |
    []
kind: ConfigMap
```

In the above output, the AWS IAM role for example `arn:aws:iam::ACCOUNT_ID:role/k8sAdmin` is mapped to a Kubernetes RBAC user `admin`, which is added to the Kubernetes RBAC group `system:masters`.

We can leverage eksctl to get a list of all identities managed in our cluster.

```bash
eksctl get iamidentitymapping --cluster eksworkshop-eksctl
```

The output looks like below.

```
ARN                                                                                             USERNAME                         GROUPS                          ACCOUNT
arn:aws:iam::12345678900:role/eksctl-eksworkshop-eksctl-nodegrou-NodeInstanceRole-i7siYfkDyXRy system:node:{{EC2PrivateDNSName}}  system:bootstrappers,system:nodes
arn:aws:iam::12345678900:role/k8sAdmin                                                         admin                              system:masters
arn:aws:iam::12345678900:role/k8sDev                                                           dev-user
arn:aws:iam::12345678900:role/k8sInteg  
```

Here is what we have done so far:

- created a RBAC role `dev-role` for IAM role `k8sDev` which maps to RBAC user  `dev-user` in `development` Namespace.
- created a RBAC role `integ-role` for IAM role `k8sInteg` which maps to RBAC user  `integ-user` in `integration` Namespace.
- mapped IAM role `k8sAdmin` to RBAC user  `admin` which is assigned to one of the default ClusterRoles `cluster-admin`. The ClusterRole `cluster-admin` maps to the **system\:masters** RBAC group that provides full Admininstrator permissions on the cluster.
  ::alert[This is only for example purpose. It is highly recommended not to add any Kubernetes user to **system\:masters** group unless it is necessary]{header="Note"}


We will see on next section how we can test it.

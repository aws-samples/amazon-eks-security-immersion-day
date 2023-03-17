---
title : "Configure aws-auth configmap"
weight : 26
---

In this section, we will configure aws-auth configmap for mapping between IAM Role(i.e. Kubernetes User) to Kubernetes RBAC Role.

#### Gives Access to our IAM Roles to Amazon EKS Cluster

In order to give access to the IAM Roles we defined previously to our Amazon EKS cluster, we need to add specific **mapRoles** to the `aws-auth` ConfigMap

The advantage of using Role to access the cluster instead of specifying directly IAM users is that it will be easier to manage so we won't have to update the ConfigMap each time we want to add or remove users, we will just need to add or remove users from the IAM Group and we just configure the ConfigMap to allow the IAM Role associated to the IAM Group.


### Update the aws-auth configmap to allow our IAM roles

The **aws-auth** configmap from the kube-system namespace must be edited in order to allow or delete IAM roles arns.

This file makes the mapping between IAM role and Kubernetes RBAC rights. We can edit it manually:

We can edit it using [eksctl](https://github.com/weaveworks/eksctl)  :

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
2023-03-14 09:57:10 [ℹ]  checking arn arn:aws:iam::XXXXXXXXXX:role/k8sDev against entries in the auth ConfigMap
2023-03-14 09:57:10 [ℹ]  adding identity "arn:aws:iam::XXXXXXXXXX:role/k8sDev" to auth ConfigMap

2023-03-14 09:57:10 [ℹ]  checking arn arn:aws:iam::XXXXXXXXXX:role/k8sInteg against entries in the auth ConfigMap
2023-03-14 09:57:10 [ℹ]  adding identity "arn:aws:iam::XXXXXXXXXX:role/k8sInteg" to auth ConfigMap

2023-03-14 09:57:10 [ℹ]  checking arn arn:aws:iam::XXXXXXXXXX:role/k8sAdmin against entries in the auth ConfigMap
2023-03-14 09:57:10 [ℹ]  adding identity "arn:aws:iam::XXXXXXXXXX:role/k8sAdmin" to auth ConfigMap
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
      rolearn: arn:aws:iam::xxxxxxxxxx:role/eksctl-eksworkshop-eksctl-nodegro-NodeInstanceRole-14TKBWBD7KWFH
      username: system:node:{{EC2PrivateDNSName}}
    - rolearn: arn:aws:iam::xxxxxxxxxx:role/k8sDev
      username: dev-user
    - rolearn: arn:aws:iam::xxxxxxxxxx:role/k8sInteg
      username: integ-user
    - groups:
      - system:masters
      rolearn: arn:aws:iam::xxxxxxxxxx:role/k8sAdmin
      username: admin
  mapUsers: |
    []
kind: ConfigMap
```

In the above output, the AWS IAM Role for example `arn:aws:iam::xxxxxxxxxx:role/k8sAdmin` is mapped to a Kubernetes RBAC user `admin`, which is added to the Kubernetes RBAC group `system:masters`.

We can leverage eksctl to get a list of all identities managed in our cluster. Example:

```bash
eksctl get iamidentitymapping --cluster eksworkshop-eksctl
```

The output looks like below.

```bash
arn:aws:iam::xxxxxxxxxx:role/eksctl-quick-nodegroup-ng-fe1bbb6-NodeInstanceRole-1KRYARWGGHPTTsystem:node:{{EC2PrivateDNSName}}system:bootstrappers,system:nodes
arn:aws:iam::xxxxxxxxxx:role/k8sAdmin           adminsystem:masters
arn:aws:iam::xxxxxxxxxx:role/k8sDev             dev-user
arn:aws:iam::xxxxxxxxxx:role/k8sInteg           integ-user
```

Here is what we have created so far:

-   a RBAC role for K8sAdmin, that we map to admin user and give access to **system\:masters** kubernetes Groups so that it has Full Admin rights on the cluster.
::alert[This is only for example purpose. It is highly recommended not to add any Kubernetes user to **system\:masters** group unless it is necessary]{header="Note"}
-   a RBAC role for k8sDev that we map on dev-user in development namespace
-   a RBAC role for k8sInteg that we map on integ-user in integration namespace

We will see on next section how we can test it.

---
title: "AWS console access to EKS cluster"
weight: 28
---

This step is optional, as nearly all of the workshop content is CLI-driven. But, if you'd like full access to your workshop cluster in the EKS console this step is recommended.

The EKS console allows you to see not only the configuration aspects of your cluster, but also to view Kubernetes cluster objects such as Deployments, Pods, and Nodes. For this type of access, the console IAM User or Role needs to be granted permission within the cluster.

By default, the credentials used to create the cluster are automatically granted these permissions. Following along in the workshop, you've created a cluster using temporary IAM credentials from within Cloud9. This means that you'll need to add your AWS Console credentials to the cluster.

#### Import your EKS console credentials to your new cluster:

IAM users and roles are bound to an Amazon EKS cluster via a ConfigMap named `aws-auth`. We can use `eksctl` to do this with one command.

You'll need to determine the correct credential to add for your AWS Console access. If you know this already, you can skip ahead to the `eksctl create iamidentitymapping` step below.

If you are running this workshop at AWS Event, you can get the ARN of IAM role used for AWS console login, as follows.

```bash
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export CONSOLE_IAM_ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/WSParticipantRole"
```

::alert[If you are running this workshop in your AWS Account, you need to set the environment variable `CONSOLE_IAM_ROLE_ARN` to the IAM user/role used to login into AWS console ]{header="Note"}

With your ARN in hand, you can issue the command to create the identity mapping within the cluster.

```bash
eksctl create iamidentitymapping --cluster eksworkshop-eksctl --arn ${CONSOLE_IAM_ROLE_ARN} --group system:masters --username admin
```

::::expand{header="Check Output"}
```bash
2023-05-21 14:10:10 [ℹ]  checking arn arn:aws:iam::12345678900:role/WSParticipantRole against entries in the auth ConfigMap
2023-05-21 14:10:10 [ℹ]  adding identity "arn:aws:iam::12345678900:role/WSParticipantRole" to auth ConfigMap
```
::::

Note that permissions can be restricted and granular but as this is a workshop cluster, you're adding your console credentials as administrator.

Now you can verify your entry in the AWS auth map within the console.

```bash
kubectl describe configmap -n kube-system aws-auth
```

::::expand{header="Check Output"}

```bash
Name:         aws-auth
Namespace:    kube-system
Labels:       <none>
Annotations:  <none>

Data
====
mapRoles:
----
- groups:
  - system:bootstrappers
  - system:nodes
  rolearn: arn:aws:iam::12345678900:role/eksctl-eksworkshop-eksctl-nodegrou-NodeInstanceRole-i7siYfkDyXRy
  username: system:node:{{EC2PrivateDNSName}}
- rolearn: arn:aws:iam::12345678900:role/k8sDev
  username: dev-user
- rolearn: arn:aws:iam::12345678900:role/k8sInteg
  username: integ-user
- groups:
  - system:masters
  rolearn: arn:aws:iam::12345678900:role/k8sAdmin
  username: admin
- groups:
  - system:masters
  rolearn: arn:aws:iam::12345678900:role/WSParticipantRole
  username: admin


mapUsers:
----
[]



BinaryData
====

Events:  <none>
```

::::

You can now view various Kubernetes Objects in the Amazon EKS cluster in the [AWS Console for Amazon EKS](https://console.aws.amazon.com/eks/home?#/clusters/eksworkshop-eksctl?selectedTab=cluster-resources-tab&selectedResourceId=pods).

![console-access-to-eks-cluster](/static/images/iam/iam-role-rbac/console-access-to-eks-cluster.png)

For more information, check out the [EKS documentation](https://docs.aws.amazon.com/eks/latest/userguide/add-user-role.html) on this topic.

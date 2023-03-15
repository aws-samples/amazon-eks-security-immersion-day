---
title : "Using IAM Groups to Manage Kubernetes Cluster Access"
weight : 34
---

In this module, we’ll learn about how to simplify access to different parts of the kubernetes clusters depending on IAM Roles.


When an Amazon EKS cluster is created, the IAM entity (user or role) that creates the cluster is
permanently added to the Kubernetes RBAC authorization table as the administrator. This entity will be automatically part of the Kubernetes RBAC group called **system\:masters** and gets assigned to the [Kubernetes Default ClusterRole](https://kubernetes.io/docs/reference/access-authn-authz/rbac/) called **cluster-admin**. The ClusterRole **cluster-admin** is the most powerful role and allows super-user access to perform any action on any resource. When used in a ClusterRoleBinding, it gives full control over every resource in the cluster and in all namespaces. When used in a RoleBinding, it gives full control over every resource in the role binding's namespace, including the namespace itself.

::alert[It is highly recommended not to add any Kubernetes user to **system\:masters** group unless it is necessary]{header="WARNING" type="warning"}

The identity of this entity isn't visible in your cluster configuration. So,
it's important to note the entity that created the cluster and make sure that you never delete it.


Initially, only the IAM entity that created the server can make calls to the Kubernetes API server using kubectl. If
you use the console to create the cluster, you must ensure that the same IAM credentials are in the AWS
SDK credential chain when you run kubectl commands on your cluster. After your cluster is created, you
can grant other IAM entities access to your cluster

Let us check the IAM role assigned to the Cloud 9 Instance.

```bash
C9_ROLE_ARN=$(aws sts get-caller-identity --query Arn)
IFS='/' read -r -a array <<< "$C9_ROLE_ARN"
C9_ROLE="${array[1]}"
echo "$C9_ROLE"
```

::::expand{header="Check Output if you running on your own"}
```bash
eksworkshop-admin
```
::::

::::expand{header="Check Output if you running at AWS Event"}
```bash
eks-bootstrap-template-ws-Cloud9InstanceRole-V1RKIVUA1ZM0
```
::::


Note the IAM role `eksworkshop-admin` or  `eks-bootstrap-template-ws-Cloud9InstanceRole-V1RKIVUA1ZM0` in the above output is used to create and authenticate the EKS Cluster.

Let us check if this IAM role is part of the `aws-auth` config map in `kube-system` namespace.

```bash
DOES_ROLE_EXISTS_IN_CONFIGMAP=$(kubectl get cm aws-auth -n kube-system -oyaml | grep $C9_ROLE)
echo $DOES_ROLE_EXISTS_IN_CONFIGMAP

if [ -z "$DOES_ROLE_EXISTS_IN_CONFIGMAP" ]
then
      echo "$C9_ROLE doesn't exist in aws-auth config map in kube-system namespace"
else
      echo "$C9_ROLE exists in aws-auth config map in kube-system namespace"
fi
```

::expand[eks-bootstrap-template-ws-Cloud9InstanceRole-V1RKIVUA1ZM0 doesn't  exist in aws-auth config map in kube-system namespace]{header="Check output"}

Note that the above IAM Role used to EKS cluster doesn't exist in `aws-auth`
 configmap, which is expected.

It is recommended to created a dedicated IAM role to create the EKS cluster with Least privileged IAM permissions to be able to perform CRUD operations on the EKS clusters.

Below diagram shows an example of IAM permissions and trust policy attached to this IAM Role.

![EKS Cluster Creator Role](/static/images/iam/iam-role-rbac/Least-Privileged-IAMRole.PNG)


Note that the IAM Role is assigned only a trust policy that allows any IAM principals (users or roles) in that account to assume this role.

At first glance, this looks to be a wide-open policy. But just because this role trusts any IAM user does not mean that any user can assume this role. Because the permission to assume a role is **NOT** automatically granted to an IAM principal. It has to be **EXPLICITLY** granted through a permission policy.

So what you will have to do next is create an IAM permissions policy like the one shown below and assign it to the user or role that wants to authenticate to the EKS cluster.

The net result is that such an IAM principal can now assume the role named EKS-Cluster-Creator and will be able to authenticate itself to the EKS cluster.

Instead of assigning this permission policy to each individual user, you could also create an IAM group, assign the permission policy to the group and then assign the users to the group.

![assumepolicy](/static/images/iam/iam-role-rbac/assumepolicy.png)

Assume the IAM role EKS-Cluster-Creator to create the EKS CLuster. In this module, the Cloud9 Instance assums this Role to create the cluster.

![Assume-EKS-Cluster-CreatorRole](/static/images/iam/iam-role-rbac/Assume-EKS-Cluster-CreatorRole.PNG)


Access the EKS cluster with EKS-Cluster-Creator and then use this  role to create the additional Kubernetes RBAC roles with limited set of permissions for admins / developers.

![Create-Additional-K8s-Roles](/static/images/iam/iam-role-rbac/Create-Additional-K8s-Roles.PNG)

Once the additional roles are created, then remove the right to assume the EKS-Cluster-Creator IAM role from the IAM principles.

![Remove-right-to-assumeIAM-Role](/static/images/iam/iam-role-rbac/Remove-right-to-assumeIAM-Role.PNG)
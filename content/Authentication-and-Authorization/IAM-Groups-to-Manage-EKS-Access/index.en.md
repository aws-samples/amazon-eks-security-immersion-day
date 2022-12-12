---
title : "Using IAM Groups to Manage Kubernetes Cluster Access"
weight : 34
---

In this module, we’ll learn about how to simplify access to different parts of the kubernetes clusters depending on IAM Groups


When an Amazon EKS cluster is created, the IAM entity (user or role) that creates the cluster is
permanently added to the Kubernetes RBAC authorization table as the administrator. This entity has
*system:masters* permissions. The identity of this entity isn't visible in your cluster configuration. So,
it's important to note the entity that created the cluster and make sure that you never delete it. 

Initially,
only the IAM entity that created the server can make calls to the Kubernetes API server using kubectl. If
you use the console to create the cluster, you must ensure that the same IAM credentials are in the AWS
SDK credential chain when you run kubectl commands on your cluster. After your cluster is created, you
can grant other IAM entities access to your cluster


One of the best practice is to create this role with Least priveleged IAM permissions to be able to manage the EKS clusters such as create, delete and update them.

Below diagram shows how to create such role.

![EKS Cluster Creater Role](../../static/images/Least-Privileged-IAMRole.PNG)

Assume this IAM role to create the EKE CLuster

![Assume-EKS-Cluster-CreatorRole](../../static/images/Assume-EKS-Cluster-CreatorRole.PNG)

use this  role to create the additional K8s Roles

![Create-Additional-K8s-Roles](../../static/images/Create-Additional-K8s-Roles.PNG)

Them remove the right to assume this role from the IAM principles

![Remove-right-to-assumeIAM-Role](../../static/images/Remove-right-to-assumeIAM-Role.PNG)
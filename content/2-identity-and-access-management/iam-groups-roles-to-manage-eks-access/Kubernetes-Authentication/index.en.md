---
title : "Kubernetes Authentication"
weight : 21
---



According to [the official kubernetes docs:](https://kubernetes.io/docs/reference/access-authn-authz/rbac/)

> Role-based access control (RBAC) is a method of regulating access to computer or network resources based on the roles of individual users within an enterprise.

The core logical components of RBAC are:

**Entity**  
A group, user, or service account (an identity representing an application that
wants to execute certain operations (actions) and requires permissions to do so).

**Resource**  
A pod, service, or secret that the entity wants to access using the certain operations.

**Role and ClusterRole**  
An RBAC Role or ClusterRole contains rules that represent a set of permissions. Permissions are purely additive (there are no "deny" rules).

A Role always sets permissions within a particular namespace; when you create a Role, you have to specify the namespace it belongs in.

ClusterRole, by contrast, is a non-namespaced resource. The resources have different names (Role and ClusterRole) because a Kubernetes object always has to be either namespaced or not namespaced; it can't be both.

![RBAC-Role](/static/images/iam/iam-role-rbac/RBAC-Role.png)


**RoleBinding and ClusterRoleBinding**  
A role binding grants the permissions defined in a role to a user or set of users. It holds a list of subjects (users, groups, or service accounts), and a reference to the role being granted. A RoleBinding grants permissions within a specific namespace whereas a ClusterRoleBinding grants that access cluster-wide.

A RoleBinding may reference any Role in the same namespace. Alternatively, a RoleBinding can reference a ClusterRole and bind that ClusterRole to the namespace of the RoleBinding. If you want to bind a ClusterRole to all the namespaces in your cluster, you use a ClusterRoleBinding.


![RBAC-ClusterRole](/static/images/iam/iam-role-rbac/RBAC-ClusterRole.png)

**Namespace** 

Namespaces are an excellent way of creating security boundaries, they also provide a unique scope for object names as the 'namespace' name implies. They are intended to be used in multi-tenant environments to create virtual kubernetes clusters on the same physical cluster.



If you have different teams which needs different kind of cluster access, it would be difficult to manually add or remove access for each Amazon EKS clusters you want them to give or remove access from.

We can leverage on AWS [IAM Groups](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_groups.html)  to easily add or remove users and give them permission to whole cluster, or just part of it depending on which groups they belong to.

In this lesson, we will create 3 IAM roles that we will map to 3 IAM groups.


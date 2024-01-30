---
title : "Create Access entries and policies"
weight : 23
---

In this section, let us create access entries and associate required access policies for different persona.

* Users from the IAM group `k8sClusterAdmin` are cluster administrators and needs the complete administrator access to the cluster
* Users from the IAM group `k8sTeamADev` are developers for the `project A` and needs the administrator access to their Namespace `team-a`
* Users from the IAM group `k8sTeamATest` are testers for the `project A` and needs the read-only access to their Namespace `team-a`

So, we will create the following IAM Roles in this section.

-   **k8sClusterAdmin** role assumed by users in the IAM group `k8sClusterAdmin` and is associated with **AmazonEKSClusterAdminPolicy** Kubernetes permissions on the cluster
-   **k8sTeamADev** role assumed by users in the IAM group `k8sTeamADev` and is associated with **AmazonEKSAdminPolicy** Kubernetes permissions on the Namespace `team-a`
-   **k8sTeamATest** role assumed by users in the IAM group `k8sTeamATest` and is associated with **AmazonEKSViewPolicy** Kubernetes permissions on the Namespace `team-a`

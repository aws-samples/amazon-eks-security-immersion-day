---
title: "Security Profiles Operator"
weight: 40
---


The Security Profiles Operator ([SPO](https://github.com/kubernetes-sigs/security-profiles-operator/tree/main)) in Kubernetes is a critical tool designed to enhance the security of Kubernetes clusters by managing and enforcing security profiles and policies at runtime. The operator makes it easier for users to use SELinux, seccomp and AppArmor in Kubernetes clusters.

> Kubernetes does not currently provide any native mechanisms for loading seccomp, AppArmor, or SELinux profiles onto Nodes. They either have to be loaded manually or installed onto Nodes when they are bootstrapped. This has to be done prior to referencing them in your Pods because the scheduler is unaware of which nodes have profiles.

## Features

The SPO's features are implemented for each one of the underlying
supported technologies, namely: Seccomp, SELinux and AppArmor. 
Here's the feature parity status across them:

|                                  | Seccomp | SELinux | AppArmor |
|----------------------------------|---------|---------|----------|
|                      Profile CRD |   Yes   |   Yes   |    Yes   |
|                   ProfileBinding |   Yes   |   No    |    No    |
|       Deploy profiles into nodes |   Yes   |   Yes   |    Yes   |
| Remove profiles no longer in use |   Yes   |   Yes   |    Yes   |
|   Profile Auto-generation (logs) |   Yes   |   WIP   |    No    |
|   Profile Auto-generation (ebpf) |   Yes   |   No    |    No    |
|             Audit log enrichment |   Yes   |   WIP   |    Yes   |

For information about the security model and what permissions each features requires,
refer to SPO's [security model](https://github.com/kubernetes-sigs/security-profiles-operator/blob/main/security-model.md).

## Understanding the Security Profiles Operator
 
Security profiles can increase security at the container level in your cluster.

[Seccomp](https://man.archlinux.org/man/seccomp.2.en) security profiles list the syscalls a process can make. Permissions are broader than SELinux, enabling users to restrict operations system-wide, such as write.

[SELinux](https://wiki.archlinux.org/title/SELinux) security profiles provide a label-based system that restricts the access and usage of processes, applications, or files in a system. All files in an environment have labels that define permissions. SELinux profiles can define access within a given structure, such as directories.

The SPO offers a method for defining seccomp and SELinux profiles as custom resources. It effeciently distributes these profiles to every node while a reconciliation loop ensures that the profiles stay up-to-date. Additionally, the SPO can also manage these profiles for namespaced workloads. 

In this workshop, we will look at how to deploy the SPO on an Amazon EKS as well as some sample scenarios for creating secomp and SELinux profiles, bind policies to pods, record workloads, and synchronize all worker nodes in a namespace. 

## About Security Profiles ##

Security profiles can increase security at the container level in your cluster.

Seccomp security profiles list the syscalls a process can make. Permissions are broader than SELinux, enabling users to restrict operations system-wide, such as `write`.

SELinux security profiles provide a label-based system that restricts the access and usage of processes, applications, or files in a system. All files in an environment have labels that define permissions. SELinux profiles can define access within a given structure, such as directories.

## Architecture

![SPO](/static/images/pod-security/spo/spo-architecture.svg)


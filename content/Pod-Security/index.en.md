---
title : "Pod Security"
weight : 40
---

# Introduction

In Kubernetes, PSPs are replaced with [Pod Security Admission (PSA)](https://kubernetes.io/docs/concepts/security/pod-security-admission/), a built-in admission controller that implements the security controls outlined in the [Pod Security Standards (PSS)](https://kubernetes.io/docs/concepts/security/pod-security-standards/). PSS was introduced into Kubernetes in 2020, prior to Kubernetes version 1.21. PSA reached a beta state in Kubernetes version 1.23, and was enabled in Amazon EKS version 1.23 by default.

> Kubernetes users can move to PSA and PSS prior to Kubernetes version 1.25, and before they replace PSP; both solutions can coexist in the same cluster. It’s considered a best practice to ease adoption and migration by using PSA/PSS  PSPs, until PSPs are removed from clusters. For additional guidance on migrating from PSPs to PSA, you should review the [Kubernetes documentation](https://kubernetes.io/docs/tasks/configure-pod-container/migrate-from-psp/) on this topic.

The below *kubectl* snippet can be used To identify pods in clusters that are annotated to use PSP.

```
kubectl get pod -A \

-o jsonpath='{range .items[?(@.metadata.annotations.kubernetes\.io/psp)]}{.metadata.name}{“\t”}{.metadata.annotations.kubernetes\.io/psp}{“\t”}{.metadata.namespace}{“\n”}’
```

# Pod Security Standards (PSS)

The security settings prescribed by PSS were derived from the experiences of the Kubernetes community with PSP.

According to the Kubernetes PSS documentation, the PSS “define three different profiles to broadly cover the security spectrum. These profiles are cumulative and range from highly-permissive to highly-restrictive.”

The policy levels are defined in the Kubernetes documentation as:

- __Privileged:__ Unrestricted policy, providing the widest possible level of permissions. This policy allows for known privilege escalations.

- __Baseline:__ Minimally restrictive policy which prevents known privilege escalations. Allows the default (minimally specified) pod configuration.

- __Restricted:__ Heavily restricted policy, following current pod hardening best practices.

> The PSS *Restricted* profile includes the new `pod.spec.os.name` field. This field is used to enable/disable OS-specific PSS settings. For example, restrictions on the following controls are only required if .spec.os.name is not `windows`: `Privilege Escalation`, `Seccomp` and `Linux Capabilities`.

Now that we explored PSS, let's see how we can enforce the related security profiles with the Kubernetes Pod Security Admission (PSA) controller.
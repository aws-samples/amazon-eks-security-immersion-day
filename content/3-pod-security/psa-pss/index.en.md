---
title : "Pod Security Standards"
weight : 41
---

#### Introduction

The Kubernetes pod specification includes a variety of different attributes that can strengthen or weaken your overall security posture. As a Kubernetes practitioner your chief concern should be preventing a process, that’s running within a container, from escaping the isolation boundaries of the container runtime and gaining access to the underlying host.

> Pod Security Concepts are outlined in the [EKS Best Practices Guide](https://aws.github.io/aws-eks-best-practices/security/docs/pods/), as wells as [Kubernetes Pod Security Documentation](https://kubernetes.io/docs/concepts/security/pod-security-standards/).

#### Pod Security Concepts

When considering Pod Security, there are several settings that can be used to control what containers, within pods, can do.
- Linux Capabilities
- Security Context
- Seccomp profiles
- AppArmor profiles
- Host Access (Network, PID)

#### Kubernetes Security Context Elements

Security Context Elements are applied to Kubernetes pods and containers to apply specific security settings. They can can be applied at pod and container levels. Container-level Security Context elements are more granular than there pod counterparts, and override pod-level settings.

A example Pod *Security Context* can be seen below. The settings therein apply to every container within the pod, unless overridden by a container-level *Security Context*.

```
securityContext:
  runAsUser: 1000
  runAsGroup: 3000
  fsGroup: 2000
  fsGroupChangePolicy: "OnRootMismatch"
```

The following is a container-level *Security Context* element. As you can see, it is more granular.

> This example container Security Context Element follows the official [Kubernetes documentation](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/#set-the-security-context-for-a-container).

```
securityContext:  
  allowPrivilegeEscalation: false  
  runAsUser: 1000  
  readOnlyRootFilesystem: true
  runAsNonRoot: true
  capabilities:
    drop: ["ALL"]  
  seccompProfile:
    type: "RuntimeDefault"
```

> This example is based on known good configurations, as part of [Pod Security Admission](https://kubernetes.io/docs/concepts/security/pod-security-admission/) and [Pod Security Standards](https://kubernetes.io/docs/concepts/security/pod-security-standards/) and [testing](https://github.com/aws-samples/k8s-psa-pss-testing#testing-setup-and-execution) performed by the Amazon EKS team.


#### Pod Security Policies are Deprecated

To control pod security, Kubernetes included Pod Security Policy (PSP) resources and admission controllers just prior to Kubernetes version 1.3. PSPs specify a set of security settings that pods must meet before they can be created or updated in a cluster. However, PSPs were deprecated in Kubernetes version 1.21, and they were removed in Kubernetes version 1.25.

The Kubernetes project [documented](https://kubernetes.io/blog/2021/04/06/podsecuritypolicy-deprecation-past-present-and-future/) why PSPs were deprecated. Simply put, PSPs were confusing to the majority of users. This confusion resulted in many misconfigurations; clusters were impaired or left unprotected by overly-restrictive or overly-permissive settings. 

How PSPs were applied was not obvious to many users. PSPs lacked certain capabilities that would have made them easier to add to existing clusters while gauging cluster impact, such as dry-run and audit modes. 

Finally, because of PSP implementation details, it wasn’t possible to enable PSPs by default. All this precipitated the need for a new, more user-friendly, and deterministic solution for pod security. It also had to remain built-in to Kubernetes.

In the next section we will explore Kubernetes [Pod Security Standards](https://kubernetes.io/docs/concepts/security/pod-security-standards/) and how they are replacing PSPs.

In Kubernetes, PSPs are replaced with [Pod Security Admission (PSA)](https://kubernetes.io/docs/concepts/security/pod-security-admission/), a built-in admission controller that implements the security controls outlined in the [Pod Security Standards (PSS)](https://kubernetes.io/docs/concepts/security/pod-security-standards/). PSS was introduced into Kubernetes in 2020, prior to Kubernetes version 1.21. PSA reached a beta state in Kubernetes version 1.23, and was enabled in Amazon EKS version 1.23 by default.

> Kubernetes users can move to PSA and PSS prior to Kubernetes version 1.25, and before they replace PSP; both solutions can coexist in the same cluster. It’s considered a best practice to ease adoption and migration by using PSA/PSS  PSPs, until PSPs are removed from clusters. For additional guidance on migrating from PSPs to PSA, you should review the [Kubernetes documentation](https://kubernetes.io/docs/tasks/configure-pod-container/migrate-from-psp/) on this topic.

The below *kubectl* snippet can be used To identify pods in clusters that are annotated to use PSP.

```
kubectl get pod -A \

-o jsonpath='{range .items[?(@.metadata.annotations.kubernetes\.io/psp)]}{.metadata.name}{“\t”}{.metadata.annotations.kubernetes\.io/psp}{“\t”}{.metadata.namespace}{“\n”}’
```

#### Pod Security Standards (PSS)

The security settings prescribed by PSS were derived from the experiences of the Kubernetes community with PSP.

According to the Kubernetes PSS documentation, the PSS “define three different profiles to broadly cover the security spectrum. These profiles are cumulative and range from highly-permissive to highly-restrictive.”

The policy levels are defined in the Kubernetes documentation as:

- __Privileged:__ Unrestricted policy, providing the widest possible level of permissions. This policy allows for known privilege escalations.

- __Baseline:__ Minimally restrictive policy which prevents known privilege escalations. Allows the default (minimally specified) pod configuration.

- __Restricted:__ Heavily restricted policy, following current pod hardening best practices.

> The PSS *Restricted* profile includes the new `pod.spec.os.name` field. This field is used to enable/disable OS-specific PSS settings. For example, restrictions on the following controls are only required if .spec.os.name is not `windows`: `Privilege Escalation`, `Seccomp` and `Linux Capabilities`.

Now that we explored PSS, let's see how we can enforce the related security profiles with the Kubernetes Pod Security Admission (PSA) controller.
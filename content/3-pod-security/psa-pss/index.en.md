---
title : "Pod Security Standards"
weight : 41
---



### Prerequisites

This workshop is most suitable for participants who are currently building solutions in AWS using compute and/or container services.

#### Target Audience

This workshop is designed for an audience looking to build vulnerability management solutions using AWS services and native controls. Technical owners and individual contributors in Platform teams, Security teams, and Cloud Architecture teams can use this workshop to build advanced vulnerability management configurations.


#### Costs

In this workshop, you will create various AWS services. **This workshop will not incur any costs when run using AWS Event Dashboard at an AWS Event**. If you plan to run the workshop on your own, please make sure to check the [AWS Free Tier](https://aws.amazon.com/free/) page along with the building a cost estimation using the [AWS Pricing Calculator](https://calculator.aws/#/) to understand the spend involved.

#### Navigating the workshop

Navigate the workshop using the left navigation bar. You can see the range of tasks on the left.


#### Cleanup

Use the cleanup page for instructions on how to cleanup after the workshop is completed.

#### Feedback

We appreciate your opinion on how to improve this resource! If you have any feedback or suggestions for improvement, please email [amazon-eks-security-immersion-day@amazon.com](mailto:amazon-eks-security-immersion-day@amazon.com)
.


### Pod Security Standards

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


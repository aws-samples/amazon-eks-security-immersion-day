---
title : "Pod Security Admission"
weight : 22
---

# Introduction

Pod Security Admission (PSA) went Beta in Kubernetes version 1.23, and consequently became available in Amazon EKS 1.23.

PSA is a Kubernetes in-tree admission controller to enforce: 

> "…requirements on a Pod's Security Context and other related fields according to the three levels defined by the Pod Security Standards” – Kubernetes Documentation

The PSA admission controller implements the controls, outlined by the PSS profiles, via three modes of operation:

- __enforce:__ Policy violations will cause the pod to be rejected.

- __audit:__ Policy violations trigger the addition of an audit annotation to the event recorded in the audit log, but are otherwise allowed.

- __warn:__ Policy violations will trigger a user-facing warning, but are otherwise allowed.

> For Kubernetes (and Amazon EKS) versions prior to 1.23, Kubernetes Dynamic Admission Controller version can be used.

## Default PSA and PSS settings

The default (cluster-wide) settings for PSA and PSS are seen below.

> __Note:__ These settings can not be changed (customized) at the Kubernetes API server for Amazon EKS. 

```
defaults:
  enforce: "privileged"
  enforce-version: "latest"
  audit: "privileged"
  audit-version: "latest"
  warn: "privileged"
  warn-version: "latest"
exemptions:
  # Array of authenticated usernames to exempt.
  usernames: []
  # Array of runtime class names to exempt.
  runtimeClasses: []
  # Array of namespaces to exempt.
  namespaces: []
```

The above settings configure the following cluster-wide scenario:

- No PSA exemptions are configured at Kubernetes API server startup.

- The Privileged PSS profile is configured by default for all PSA modes, and set to latest versions.

- Namespaces are opted into more restrictive PSS policies via labels.


## Namespaces opt-in to PSA/PSS settings

Given the above default PSA/PSS configuration, you must configure specific PSA modes and PSS profiles at the Kubernetes Namespace level, to opt Namespaces into more restrictive pod security provided by PSA and PSS. In this way, you can configure Namespaces to define the admission control mode you want to use for pod security. 

With Kubernetes labels, you can choose which of the predefined PSS levels you want to use for pods in a given Namespace. The labels you select define what action the PSA takes if a potential violation is detected. As seen in the following code, you configure any or all modes, or even set a different level for different modes. For each mode, there are two possible labels that determine the policy used.

```
# The per-mode level label indicates which policy level to apply for the mode.
#
# MODE must be one of `enforce`, `audit`, or `warn`.
# LEVEL must be one of `privileged`, `baseline`, or `restricted`.
pod-security.kubernetes.io/<MODE>: <LEVEL>

# Optional: per-mode version label that can be used to pin the policy to the
# version that shipped with a given Kubernetes minor version (for example v1.24).
#
# MODE must be one of `enforce`, `audit`, or `warn`.
# VERSION must be a valid Kubernetes minor version, or `latest`.
pod-security.kubernetes.io/<MODE>-version: <VERSION>
```

Below is an example of PSA and PSS Namespace configurations that can be used for testing. 

> __Note:__ The optional PSA mode-version label is not included. The cluster-wide setting, latest, configured by default, is used. By uncommenting the desired labels (in the following code), you can enable the PSA modes and PSS profiles you need for your respective Namespaces.

```
apiVersion: v1
kind: Namespace
metadata:
  name: <NAMESPACE_NAME>
  labels:    
    # pod-security.kubernetes.io/enforce: privileged
    # pod-security.kubernetes.io/audit: privileged
    # pod-security.kubernetes.io/warn: privileged
    
    # pod-security.kubernetes.io/enforce: baseline
    # pod-security.kubernetes.io/audit: baseline
    # pod-security.kubernetes.io/warn: baseline
    
    # pod-security.kubernetes.io/enforce: restricted
    # pod-security.kubernetes.io/audit: restricted
    # pod-security.kubernetes.io/warn: restricted
```

![Namespaces opt into PSA and PSS settings](../../../assets/k8s-psa-pss.png)

## PSA enforce mode user experience (UX) issues

When used independently, the PSA modes have different responses that result in different user experiences. The enforce mode prevents Pods from being created if the respective Pod specs violate the configured PSS profile. However, in this mode, non-Pod Kubernetes objects that create Pods, such as Deployments, won’t be prevented from being applied to the cluster, even if the Pod spec therein violates the applied PSS profile. In this case, the Deployment is applied while the Pods are prevented from being applied.

![PSA UX Issues](../../../assets/psa-ux-issues.png)

In some scenarios, this is a difficult user experience, as there is no immediate indication that the successfully applied Deployment object belies failed Pod creation. The offending Pod specs won’t create Pods. Inspecting the Deployment resource with `kubectl get deployments.apps <DEPLOYMENT_NAME> -o=jsonpath='{.status}'` will expose the message from the failed Pod(s) in the Deployment `.status.conditions` element.

In both the audit and warn PSA modes, the Pod restrictions don’t prevent violating Pods from being created and started. However, in these modes audit annotations on API server audit log events and warnings to API server clients (e.g., kubectl) are triggered, respectively. This occurs when Pods, as well as objects that create Pods, contain Pod specs with PSS violations. A kubectl Warning message is seen in the following output.

```
deployment.apps/test created
Warning: would violate PodSecurity "restricted:latest": allowPrivilegeEscalation != 
false (container "test" must set securityContext.allowPrivilegeEscalation=false), 
unrestricted capabilities (container "test" must set 
securityContext.capabilities.drop=["ALL"]), runAsNonRoot != true (pod or container 
"test" must set securityContext.runAsNonRoot=true), seccompProfile (pod or 
container "test" must set securityContext.seccompProfile.type to "RuntimeDefault" or "Localhost")
While the Deployment was created, the Pod was not. It’s clear that a best practice would be to use warn and audit modes at all times, for a better user experience.
```

While the Deployment was created, the Pod was not. It’s clear that a best practice would be to use *warn* and *audit* modes at all times, for a better user experience.

### Mixed PSA modes and PSS profiles
PSA modes can be mixed for a customized solution. For example, when you want to measure the impact of new restrictions, before the *enforce* PSA mode is enabled, you could use the following PSA/PSS settings to enforce the *Baseline* PSS profile, yet *audit* and *warn* on the *Restricted* PSS profile.

```
apiVersion: v1
kind: Namespace
metadata:
  name: <NAMESPACE_NAME>
  labels:    
    pod-security.kubernetes.io/enforce: baseline
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted

```



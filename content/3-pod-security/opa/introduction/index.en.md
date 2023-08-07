---
title : "Open Policy Agent Gatekeeper"
weight : 22
---

OPA decouples policy decision-making from policy enforcement. When your software needs to make policy decisions it queries OPA and supplies structured data (e.g., JSON) as input. OPA accepts arbitrary structured data as input.In the context of a development platform running on Amazon EKS, platform teams and administrators need a way of being able to set policies to adhere to governance and security requirements for all workloads and teams working on the same cluster. Examples of standard use cases for using policies via OPA Gatekeeper are listed below:


* Which users can access which resources.
* Which subnets egress traffic is allowed to.
* Which clusters a workload must be deployed to.
* Which registries binaries can be downloaded from.
* Which OS capabilities a container can execute with.
* Which times of day the system can be accessed at.

![OPA](/static/images/pod-security/opa/opa-service.png)

OPA generates policy decisions by evaluating the query input and against policies and data. OPA and Rego are domain-agnostic so you can describe almost any kind of invariant in your policies. Policy decisions are not limited to simple yes/no or allow/deny answers. Like query inputs, your policies can generate arbitrary structured data as output.

**Key Terminology**

* **OPA Constraint Framework** - Framework that enforces CRD-based policies and allow declaratively configured policies to be reliably shareable
* **Constraint** - A Constraint is a declaration that its author wants a system to meet a given set of requirements. Each Constraint is written with Rego, a declarative query language used by OPA to enumerate instances of data that violate the expected state of the system. All Constraints are evaluated as a logical AND. If one Constraint is not satisfied, then the whole request is rejected.
* **Enforcement Point** - Places where constraints can be enforced. Examples are Git hooks, Kubernetes admission controllers, and audit systems.
* **Constraint Template** - Templates that allows users to declare new constraints
* **Target** - Represents a coherent set of objects sharing a common identification and/or selection scheme, generic purpose, and can be analyzed in the same validation context

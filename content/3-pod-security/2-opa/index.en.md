---
title: "Using Open Policy Agent (OPA) and Gatekeeper for policy-based control in Amazon EKS"
weight: 41
---

Security and governance is a critical component of configuring and managing fine-grained control for Kubernetes clusters and applications. Amazon EKS provides secure, managed Kubernetes clusters by default, but you still need to ensure that you configure and administer the applications appropriately that you run as part of the cluster.

The Open Policy Agent (OPA, pronounced “oh-pa”) is an open source, general-purpose policy engine that unifies policy enforcement across the stack. OPA provides a high-level declarative language that lets you specify policy as code and simple APIs to offload policy decision-making from your software. You can use OPA to enforce policies in microservices, Kubernetes, CI/CD pipelines, API gateways, and more. OPA uses a policy language known as Rego which is a query language which was purpose built to support structured document models such as JSON. To learn more about Rego check out this [link](https://www.openpolicyagent.org/docs/latest/policy-language/).

OPA Gatekeeper is an open-source project that provides a first-class integration between OPA and Kubernetes. What Gatekeeper adds is an extensible parameterized policy library that includes native Kubernetes CRD's for instantiating and extending the OPA policy library. The Kubernetes API Server is configured to query OPA for admission control decisions when objects (e.g., Pods, Services, etc.) are created, updated, or deleted. The API Server sends the entire Kubernetes object in the webhook request to OPA. OPA evaluates the policies it has loaded using the admission review as input. Gatekeeper also provides audit functionality as well. The diagram below shows the flow between a user making a request to the Kube-API server and how AdmissionReview and AdmissionRequests are made through OPA Gatekeeper. 

![OPA](/static/images/pod-security/opa/kubernetes-admission-flow.png)

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

* **[OPA Constraint Framework](https://github.com/open-policy-agent/frameworks/tree/master/constraint)** - Framework that enforces CRD-based policies and allow declaratively configured policies to be reliably shareable
* **[Constraint](https://github.com/open-policy-agent/frameworks/tree/master/constraint#what-is-a-constraint)** - A Constraint is a declaration that its author wants a system to meet a given set of requirements. Each Constraint is written with [Rego](https://www.openpolicyagent.org/docs/latest/policy-language/), a declarative query language used by OPA to enumerate instances of data that violate the expected state of the system. All Constraints are evaluated as a logical AND. If one Constraint is not satisfied, then the whole request is rejected.
* **[Enforcement Point](https://github.com/open-policy-agent/frameworks/tree/master/constraint#what-is-an-enforcement-point)** - Places where constraints can be enforced. Examples are Git hooks, Kubernetes admission controllers, and audit systems.
* **[Constraint Template](https://github.com/open-policy-agent/frameworks/tree/master/constraint#what-is-a-constraint-template)** - Templates that allows users to declare new constraints
* **[Target](https://github.com/open-policy-agent/frameworks/tree/master/constraint#what-is-a-target)** - Represents a coherent set of objects sharing a common identification and/or selection scheme, generic purpose, and can be analyzed in the same validation context


**AWS Blogs on OPA:** 
* [Using Open Policy Agent on Amazon EKS](https://aws.amazon.com/blogs/opensource/using-open-policy-agent-on-amazon-eks) 
* [Realize Policy-as-Code with AWS Cloud Development Kit through Open Policy Agent](https://aws.amazon.com/blogs/opensource/realize-policy-as-code-with-aws-cloud-development-kit-through-open-policy-agent/) 
* [Policy-based countermeasures for Kubernetes – Part 1](https://aws.amazon.com/blogs/containers/policy-based-countermeasures-for-kubernetes-part-1/)
* [Policy-based countermeasures for Kubernetes – Part 2](https://aws.amazon.com/blogs/containers/policy-based-countermeasures-for-kubernetes-part-2/)

In this workshop, we will look at how to implement OPA on an Amazon EKS cluster as well as some sample scenarios for enforcing policies in the cluster using an OPA constraint framework.
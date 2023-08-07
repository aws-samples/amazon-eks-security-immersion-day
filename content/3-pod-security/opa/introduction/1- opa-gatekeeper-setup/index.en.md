---
title : "OPA Gatekeeper setup in EKS"
weight : 22
---

In this section, we will setup OPA Gatekeeper within the cluster.

### 1. Run the following commands to deploy OPA Gatekeeper using Prebuilt docker images

:::code{showCopyAction=true showLineNumbers=false language=bash}
kubectl apply -f https://raw.githubusercontent.com/open-policy-agent/gatekeeper/master/deploy/gatekeeper.yaml
:::

### 2. To validate that OPA Gatekeeper is running within your cluster run the following command:

:::code{showCopyAction=true showLineNumbers=false language=bash}
kubectl get pods -n gatekeeper-system
:::
The output will be similar to:

:::code{showCopyAction=true showLineNumbers=false language=bash}
NAME                                             READY   STATUS    RESTARTS      AGE
gatekeeper-audit-6584df88df-nsf28                1/1     Running   1 (37s ago)   41s
gatekeeper-controller-manager-5ff69b954d-nvzsb   1/1     Running   0             41s
gatekeeper-controller-manager-5ff69b954d-pmm7v   1/1     Running   0             41s
gatekeeper-controller-manager-5ff69b954d-t59kk   1/1     Running   0             41s
:::

If you notice the `gatekeeper-audit-6584df88df-nsf28` pod is created when we deploy the OpaGatekeeperAddOn. The audit functionality enables periodic evaluations of replicated resources against the Constraints enforced in the cluster to detect pre-existing misconfigurations. Gatekeeper stores audit results as violations listed in the status field of the relevant Constraint. The `gatekeeper-controller-manager` is simply there to manage the OpaGatekeeperAddOn. 

### 3. Observe OPA Gatekeeper Component logs once operational

:::code{showCopyAction=true showLineNumbers=false language=bash}
kubectl logs -l control-plane=audit-controller -n gatekeeper-system
kubectl logs -l control-plane=controller-manager -n gatekeeper-system
:::

You can follow the OPA logs to see the webhook requests being issued by the Kubernetes API server:

This completes the OPA Gatekeeper setup on Amazon EKS cluster. In order to define and enforce the policy, OPA Gatekeeper uses a framework [OPA Constraint Framework](https://github.com/open-policy-agent/frameworks/tree/master/constraint)


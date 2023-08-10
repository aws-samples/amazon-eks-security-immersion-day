---
title : "Clean up"
weight : 22
---

Clean up steps

:::code{showCopyAction=true showLineNumbers=false language=bash}
kubectl delete -f https://raw.githubusercontent.com/open-policy-agent/gatekeeper/master/deploy/gatekeeper.yaml
:::

**Summary**

OPA Gatekeeper enables us to implement fine-grained policies in Kubernetes clusters, enhancing overall security while also simplifying compliance and audit requirements.
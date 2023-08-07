---
title : "Clean up"
weight : 22
---

### Clean up steps

:::code{showCopyAction=true showLineNumbers=false language=bash}
kubectl delete -f https://raw.githubusercontent.com/open-policy-agent/gatekeeper/master/deploy/gatekeeper.yaml
:::

### Make sure that all the CRD were deleted:

:::code{showCopyAction=true showLineNumbers=false language=bash}
kubectl delete crd \
  configs.config.gatekeeper.sh \
  constraintpodstatuses.status.gatekeeper.sh \
  constrainttemplatepodstatuses.status.gatekeeper.sh \
  constrainttemplates.templates.gatekeeper.sh
:::
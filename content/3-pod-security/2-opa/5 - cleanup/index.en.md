---
title : "Clean up"
weight : 22
---

Run the following command to clean up the resources.

:::code{showCopyAction=true showLineNumbers=false language=bash}

kubectl delete -f constrainttemplate-1.yaml
kubectl delete -f constrainttemplate-2.yaml
kubectl delete -f constrainttemplate-3.yaml

kubectl delete -f constraint-1.yaml
kubectl delete -f constraint-2.yaml
kubectl delete -f constraint-3.yaml

kubectl delete -f example-1.yaml
kubectl delete -f example-2.yaml
kubectl delete -f example-3.yaml

kubectl delete -f https://raw.githubusercontent.com/open-policy-agent/gatekeeper/master/deploy/gatekeeper.yaml
:::

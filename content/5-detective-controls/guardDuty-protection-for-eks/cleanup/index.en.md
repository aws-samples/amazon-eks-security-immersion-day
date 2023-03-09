---
title : "Cleanup"
weight : 28
---

Once you have completed this chapter, you can cleanup the files and resources you created by issuing the following commands:

```bash
kubectl delete -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.7.0/aio/deploy/recommended.yaml
kubectl apply -f pod_with_sensitive_mount.yaml
kubectl apply -f elevate.yaml
kubectl apply -f anonymous.yaml
```

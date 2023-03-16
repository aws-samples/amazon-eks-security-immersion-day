---
title : "Cleanup"
weight : 28
---

Once you have completed this chapter, you can cleanup the files and resources you created by issuing the following commands:

```bash
kubectl delete -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.7.0/aio/deploy/recommended.yaml
kubectl delete -f pod_with_sensitive_mount.yaml
kubectl delete -f elevate.yaml
kubectl delete -f anonymous.yaml
```

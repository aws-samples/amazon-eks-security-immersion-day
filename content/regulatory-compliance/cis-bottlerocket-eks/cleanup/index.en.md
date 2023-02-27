---
title : "Cleanup"
weight : 28
---

Use these commands to delete the resources created during this post:

```bash
kubectl delete -f job-eks.yaml
kubectl delete -f deploy-nginx.yaml
eksctl delete cluster -f cluster.yaml --wait
aws ecr delete-repository --repository-name ${BOOTSTRAP_ECR_REPO} --force
aws ecr delete-repository --repository-name ${VALIDATION_ECR_REPO} --force
```



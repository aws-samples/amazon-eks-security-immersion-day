---
title : "Cleanup"
weight : 24
---

To cleanup, follow these steps. Note this section is WIP and will be updated with detailed steps.

```bash
kubectl delete -f app1.txt
kubectl delete -f app2.txt

aws s3 rb s3://eksworkshop-$ACCOUNT_ID-$AWS_REGION --region $AWS_REGION --force
```

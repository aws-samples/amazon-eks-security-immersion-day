---
title : "Cleanup"
weight : 28
---

To cleanup, follow these steps.

```bash
kubectl delete -f eks-iam-test4.yaml
kubectl delete -f eks-iam-test3.yaml
kubectl delete -f eks-iam-test2.yaml
kubectl delete -f eks-iam-test1.yaml

eksctl delete iamserviceaccount \
    --name iam-test \
    --cluster eksworkshop-eksctl \
    --wait

aws s3 rb s3://eksworkshop-$ACCOUNT_ID-$AWS_REGION --region $AWS_REGION --force
```

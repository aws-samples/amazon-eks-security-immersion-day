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

::::expand{header="Check Output"}
```bash
pod "eks-iam-test4" deleted
pod "eks-iam-test3" deleted
pod "eks-iam-test2" deleted
pod "eks-iam-test1" deleted


2023-03-14 12:53:47 [ℹ]  1 iamserviceaccount (default/iam-test) was included (based on the include/exclude rules)
2023-03-14 12:53:47 [ℹ]  1 task: { 
    2 sequential sub-tasks: { 
        delete IAM role for serviceaccount "default/iam-test",
        delete serviceaccount "default/iam-test",
    } }2023-03-14 12:53:47 [ℹ]  will delete stack "eksctl-eksworkshop-eksctl-addon-iamserviceaccount-default-iam-test"
2023-03-14 12:53:47 [ℹ]  waiting for stack "eksctl-eksworkshop-eksctl-addon-iamserviceaccount-default-iam-test" to get deleted
2023-03-14 12:53:47 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-addon-iamserviceaccount-default-iam-test"
2023-03-14 12:54:17 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-addon-iamserviceaccount-default-iam-test"
2023-03-14 12:54:17 [ℹ]  deleted serviceaccount "default/iam-test"

remove_bucket: eksworkshop-XXXXXXXXXX-us-west-2

```
::::

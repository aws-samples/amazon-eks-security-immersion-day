---
title : "Cleanup"
weight : 25
---

To cleanup, follow these steps. 

```bash
kubectl delete -f app1.txt
kubectl delete -f app2.txt

aws s3api delete-object --bucket $S3_BUCKET --key customer1.txt
aws s3api delete-object --bucket $S3_BUCKET --key customer2.txt

aws s3 rb s3://ekspodidentity-$ACCOUNT_ID-$AWS_REGION --region $AWS_REGION --force

```

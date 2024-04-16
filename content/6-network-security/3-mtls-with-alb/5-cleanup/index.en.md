---
title : "Cleanup"
weight : 14
---

Once you have completed this chapter, you can cleanup the files and resources you created by issuing the following commands:

```bash
cd ~/environment
kubectl delete namespace mtls --force --grace-period=0
helm delete aws-pca-issuer
eksdemo uninstall cert-manager -c $EKS_CLUSTER -D 
aws elbv2 delete-trust-store --trust-store-arn $TRUSTORE_ARN --region $AWS_REGION 
aws s3api delete-objects \
    --bucket ${S3_BUCKET} \
    --delete "$(aws s3api list-object-versions \
    --bucket "${S3_BUCKET}" \
    --output=json \
    --query='{Objects: Versions[].{Key:Key,VersionId:VersionId}}')"
aws s3 rb s3://${S3_BUCKET} --force 
```

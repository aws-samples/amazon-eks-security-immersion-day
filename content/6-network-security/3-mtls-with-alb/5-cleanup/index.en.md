---
title : "Cleanup"
weight : 14
---

Once you have completed this chapter, you can cleanup the files and resources you created by issuing the following commands:

```bash
cd ~/environment
kubectl delete namespace mtls --force
kubectl delete -f external-dns.yaml 
helm delete aws-pca-issuer 
helm delete aws-load-balancer-controller -n kube-system
helm delete cert-manager -n cert-manager
aws elbv2 delete-trust-store --trust-store-arn $TRUSTORE_ARN --region $AWS_REGION 
aws s3api delete-objects \
    --bucket ${S3_BUCKET} \
    --delete "$(aws s3api list-object-versions \
    --bucket "${S3_BUCKET}" \
    --output=json \
    --query='{Objects: Versions[].{Key:Key,VersionId:VersionId}}')"
aws s3api delete-objects \
    --bucket ${S3_BUCKET} \
    --delete "$(aws s3api list-object-versions \
    --bucket "${S3_BUCKET}" \
    --output=json \
    --query='{Objects: DeleteMarkers[].{Key:Key,VersionId:VersionId}}')"    
aws s3 rb s3://${S3_BUCKET} --force 
```

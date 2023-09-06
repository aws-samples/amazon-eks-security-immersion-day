---
title : "Cleanup"
weight : 26
---

You created a few resources for this workshop. If you are participating in an AWS hosted event, then you don't need to clean up anything. The temporary accounts will get deleted after the workshop.

If are running this workshop in your own account, you would need to follow the below steps to cleanup the environment you set up for the workshop.

```bash
source ~/.ecr_security
aws iam detach-role-policy \
  --role-name $ECR_ACCESS_ROLE \
  --policy-arn "arn:aws:iam::$ACCOUNT_ID:policy/$ECR_ACCESS_POLICY"
aws iam delete-policy \
  --policy-arn "arn:aws:iam::$ACCOUNT_ID:policy/$ECR_ACCESS_POLICY"
aws iam delete-role \
  --role-name $ECR_ACCESS_ROLE
aws ecr delete-repository \
  --repository-name $ECR_REPO_A \
  --region $AWS_REGION \
  --force
aws ecr delete-repository \
  --repository-name $ECR_REPO_B \
  --region $AWS_REGION \
  --force
aws ec2 delete-vpc-endpoints \
  --vpc-endpoint-ids $API_VPCE_ID $DKR_VPCE_ID $S3_VPCE_ID \
  --region $AWS_REGION
aws ec2 revoke-security-group-ingress \
  --group-id $VPCE_SG_ID \
  --security-group-rule-ids $SG_RULE_ID \
  --region $AWS_REGION
docker rmi $ECR_REPO_URI_A:v1
docker rmi $ECR_REPO_URI_A:v2
docker rmi $ECR_REPO_URI_B:v1
docker rmi $ECR_REPO_URI_B:v2
docker rmi alpine:local
docker rmi alpine:latest
rm -f Dockerfile
```

::alert[VPC Endpoint security group has no rules after above clean-up, but is in use until the VPC endpoints are fully deleted. You can remove the security group once the VPC endpoint deletion process is completed: `aws ec2 delete-security-group --group-id $VPCE_SG_ID --region $AWS_REGION`.]{header=""}

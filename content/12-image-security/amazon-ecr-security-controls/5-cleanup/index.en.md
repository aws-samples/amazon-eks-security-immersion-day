---
title : "Cleanup"
weight : 25
---

You created a few resources for this workshop. If you are participating in an AWS hosted event, then you don't need to clean up anything. The temporary accounts will get deleted after the workshop.

If are running this workshop in your own account, you would need to follow the below steps to cleanup the environment you set up for the workshop.

```bash
rm -f ~/.aws/credentials
rm -f /tmp/ecrTester.json
aws iam detach-role-policy \
  --role-name ecr_access_testing \
  --policy-arn "arn:aws:iam::$ACCOUNT_ID:policy/ecr_access_testing"
aws iam delete-policy \
  --policy-arn "arn:aws:iam::$ACCOUNT_ID:policy/ecr_access_testing"
aws iam delete-role \
  --role-name ecr_access_testing
aws ecr delete-repository \
  --repository-name team-a/alpine \
  --region $AWS_REGION \
  --force
aws ecr delete-repository \
  --repository-name team-b/alpine \
  --region $AWS_REGION \
  --force
aws ec2 delete-vpc-endpoints \
  --vpc-endpoint-ids $API_VPCE_ID $DKR_VPCE_ID $S3_VPCE_ID \
  --region $AWS_REGION
aws ec2 revoke-security-group-ingress \
  --group-id $VPCE_SG_ID \
  --security-group-rule-ids $SG_RULE_ID \
  --region $AWS_REGION
docker rmi $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/team-a/alpine:v1
docker rmi $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/team-a/alpine:v2
docker rmi $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/team-b/alpine:v1
docker rmi alpine:latest
```

::alert[VPC Endpoint security group has no rules, but is in use until the VPC endpoints are fully deleted. You can remove the security group once the VPC endpoint deletion process is completed: `aws ec2 delete-security-group --group-id $VPCE_SG_ID --region $AWS_REGION`.]{header=""}

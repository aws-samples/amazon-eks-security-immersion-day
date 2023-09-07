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

::::expand{header="Check Output"}
```json
{
    "repository": {
        "repositoryArn": "arn:aws:ecr:us-west-2:ACOOUNT_ID:repository/team-a/alpine",
        "registryId": "ACOOUNT_ID",
        "repositoryName": "team-a/alpine",
        "repositoryUri": "ACOOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/team-a/alpine",
        "createdAt": "2023-09-07T01:05:17+00:00",
        "imageTagMutability": "IMMUTABLE"
    }
}
{
    "repository": {
        "repositoryArn": "arn:aws:ecr:us-west-2:ACOOUNT_ID:repository/team-b/alpine",
        "registryId": "ACOOUNT_ID",
        "repositoryName": "team-b/alpine",
        "repositoryUri": "ACOOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/team-b/alpine",
        "createdAt": "2023-09-07T01:05:38+00:00",
        "imageTagMutability": "IMMUTABLE"
    }
}
{
    "Unsuccessful": []
}
{
    "Return": true
}
Untagged: ACOOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/team-a/alpine:v1
Untagged: ACOOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/team-a/alpine:v2
Untagged: ACOOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/team-a/alpine@sha256:c5c5fda71656f28e49ac9c5416b3643eaa6a108a8093151d6d1afc9463be8e33
Untagged: ACOOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/team-b/alpine:v1
Untagged: ACOOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/team-b/alpine@sha256:c5c5fda71656f28e49ac9c5416b3643eaa6a108a8093151d6d1afc9463be8e33
Untagged: ACOOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/team-b/alpine:v2
Untagged: ACOOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/team-b/alpine@sha256:da86df75e0d157fb800cf374a9b29029eddbfc5691948eccf6cbc35975974b68
Untagged: alpine:local
Deleted: sha256:db75f1a33d76cc0b92eed7203c94934a0f511c8eb7d037be20f58e102982a488
Untagged: alpine:latest
Untagged: alpine@sha256:7144f7bab3d4c2648d7e59409f15ec52a18006a128c733fcff20d3a4a54ba44a
Deleted: sha256:7e01a0d0a1dcd9e539f8e9bbd80106d59efbdf97293b3d38f5d7a34501526cdb
Deleted: sha256:4693057ce2364720d39e57e85a5b8e0bd9ac3573716237736d6470ec5b7b7230

```
::::

::alert[VPC Endpoint security group has no rules after above clean-up, but is in use until the VPC endpoints are fully deleted. You can remove the security group once the VPC endpoint deletion process is completed: `aws ec2 delete-security-group --group-id $VPCE_SG_ID --region $AWS_REGION`.]{header=""}

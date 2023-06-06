---
title : "Cleanup"
weight : 24
---

Once you have completed this chapter, you can cleanup the files and resources you created by issuing the following commands:

```bash
eksctl delete addon --cluster $EKS_CLUSTER_NAME --name $GD_EKS_ADDON_NAME
aws ec2 delete-vpc-endpoints --vpc-endpoint-ids $VPC_ENDPOINT_ID
aws ec2 delete-security-group --group-id $SECURITY_GROUP_ID
```

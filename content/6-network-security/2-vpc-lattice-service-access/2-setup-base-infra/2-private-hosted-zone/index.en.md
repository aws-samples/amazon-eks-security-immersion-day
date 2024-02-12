---
title : "Create Private Hosted Zone"
weight : 11
---

## Create Private Hosted Zone

```bash
export EKS_CLUSTER1_NAME=eksworkshop-eksctl
export EKS_CLUSTER1_VPC_ID=$(eksctl get cluster $EKS_CLUSTER1_NAME -ojson | jq -r '.[0]["ResourcesVpcConfig"]["VpcId"]')
echo "EKS_CLUSTER1_VPC_ID=$EKS_CLUSTER1_VPC_ID"
export CUSTOM_DOMAIN_NAME="vpc-lattice-custom-domain.io"
export HOSTED_ZONE_ID=$(aws route53 create-hosted-zone --name $CUSTOM_DOMAIN_NAME \
  --caller-reference $(date "+%Y%m%d%H%M%S") \
  --hosted-zone-config PrivateZone=true \
  --vpc VPCRegion=$AWS_REGION,VPCId=$EKS_CLUSTER1_VPC_ID |\
  jq -r ".HostedZone.Id")
echo "HOSTED_ZONE_ID=$HOSTED_ZONE_ID"
echo "export HOSTED_ZONE_ID=$HOSTED_ZONE_ID" >> ~/.bash_profile
echo "export CUSTOM_DOMAIN_NAME=$CUSTOM_DOMAIN_NAME" >> ~/.bash_profile
```

::::expand{header="Check Output"}
```bash
EKS_CLUSTER1_VPC_ID=vpc-0bacccb5d3d4d9cb5
HOSTED_ZONE_ID=/hostedzone/Z039859110X8DLX7ZIT0E
```
::::

You can connect to **Route 53** In the console and check that the private zone as been created:

![private-hosted-zone.png](/static/images/6-network-security/2-vpc-lattice-service-access/private-hosted-zone.png)

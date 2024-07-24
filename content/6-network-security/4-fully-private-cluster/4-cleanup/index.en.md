---
title : "Cleanup"
weight : 153
---

You created a few resources for this workshop. If you are participating in an AWS hosted event, then you don't need to clean up anything. The temporary accounts will get deleted after the workshop.

If are running this workshop in your own account, you would need to follow the below steps to cleanup the environment you set up for the workshop.

1) Delete the VPC endpoints created in addition to once created as a part of EKS private cluster
2) Delete the EKS cluster
3) Delete the Private Cloud9 environment
4) Delete the VPC and subnets created as a part of CFT Stack eks-private-vpc

List the VPC endpoints in created in the VPC

```bash
aws ec2 describe-vpc-endpoints --filter "Name=vpc-id,Values=$CLUSTER_VPC" --query VpcEndpoints[].[VpcId,VpcEndpointId,ServiceName] --output table
```

```
------------------------------------------------------------------------------------------------------
|                                        DescribeVpcEndpoints                                        |
+-----------------------+--------------------------+-------------------------------------------------+
|  vpc-02cc579cdd679aa3c|  vpce-094bc15d9e29372c0  |  com.amazonaws.ap-south-1.elasticloadbalancing  |
+-----------------------+--------------------------+-------------------------------------------------+
```

Note the VPC Endpoints IDs from the table for elasticloadbalancing,ssm,ssmmessages, ec2messages and eks

```bash
aws ec2 delete-vpc-endpoints --vpc-endpoint-ids $(aws ec2 describe-vpc-endpoints --filter "Name=vpc-id,Values=$CLUSTER_VPC" "Name=service-name,Values=com.amazonaws.$AWS_REGION.elasticloadbalancing" --query VpcEndpoints[].[VpcEndpointId] --output text)
aws ec2 delete-vpc-endpoints --vpc-endpoint-ids $(aws ec2 describe-vpc-endpoints --filter "Name=vpc-id,Values=$CLUSTER_VPC" "Name=service-name,Values=com.amazonaws.$AWS_REGION.eks" --query VpcEndpoints[].[VpcEndpointId] --output text)
aws ec2 delete-vpc-endpoints --vpc-endpoint-ids $(aws ec2 describe-vpc-endpoints --filter "Name=vpc-id,Values=$CLUSTER_VPC" "Name=service-name,Values=com.amazonaws.$AWS_REGION.ssm" --query VpcEndpoints[].[VpcEndpointId] --output text)
aws ec2 delete-vpc-endpoints --vpc-endpoint-ids $(aws ec2 describe-vpc-endpoints --filter "Name=vpc-id,Values=$CLUSTER_VPC" "Name=service-name,Values=com.amazonaws.$AWS_REGION.ssmmessages" --query VpcEndpoints[].[VpcEndpointId] --output text)
aws ec2 delete-vpc-endpoints --vpc-endpoint-ids $(aws ec2 describe-vpc-endpoints --filter "Name=vpc-id,Values=$CLUSTER_VPC" "Name=service-name,Values=com.amazonaws.$AWS_REGION.ec2messages" --query VpcEndpoints[].[VpcEndpointId] --output text)
```

```
{
    "Unsuccessful": []
}
```

Now delete the EKS cluster

```bash
eksctl delete cluster --name eksworkshop-eksctl-private
```


```
[ℹ]  using region "region-code"
[ℹ]  deleting EKS cluster "eksworkshop-eksctl-private"
[ℹ]  will delete stack "eksctl-eksworkshop-eksctl-private-nodegroup-m1"
[ℹ]  waiting for stack "eksctl-eksworkshop-eksctl-private-nodegroup-m1" to get deleted
[ℹ]  will delete stack "eksworkshop-eksctl-private"
[✔]  the following EKS cluster resource(s) for "eksworkshop-eksctl-private" will be deleted: cluster. If in doubt, check CloudFormation console
```

Delete the Private Cloud9 environment. The below command required the Cloud9 environment name to be "eksworkshop-private" which was the name used during creation of the same. If you had given a different name please replace it accordingly.

```bash
aws cloud9 delete-environment --region $AWS_REGION --environment-id $(aws cloud9 describe-environments --environment-ids $(aws cloud9 list-environments --query 'environmentIds[]' --output text) --query 'environments[?name==`eksworkshop-private`].id' --output text)
```

Delete the CloudFormation stack eks-private-vpc that create the VPC, Private Subnets, NAT Gateway and Internet Gateway

```bash
aws cloudformation delete-stack --stack-name eks-private-vpc
```


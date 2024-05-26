---
title : "Cleanup"
weight : 153
---

ou created a few resources for this workshop. If you are participating in an AWS hosted event, then you don't need to clean up anything. The temporary accounts will get deleted after the workshop.

If are running this workshop in your own account, you would need to follow the below steps to cleanup the environment you set up for the workshop.

1) Delete the VPC endpoints created in addition to once created as a part of EKS private cluster
2) Delete the EKS cluster
3) Delete the Private Cloud9 environment

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
aws ec2 delete-vpc-endpoints --vpc-endpoint-ids vpce-094bc15d9e29372c0
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

Delete the Private Cloud9 environment. The below command required the Cloud9 environment id. If you didn't save the ID when you created the environment, the ID can be found by using the AWS Cloud9 console. Select the name of the environment in the console, then find the last part of the Environment ARN.

```bash
aws cloud9 delete-environment --region MY-REGION --environment-id <<environment_id>>
```


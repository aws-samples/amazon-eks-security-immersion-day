---
title : "AWS console access to EKS Cluster"
weight : 27
---

This step is optional, as nearly all of the workshop content is CLI-driven. But, if you'd like full access to your workshop cluster in the EKS console this step is recommended.

The EKS console allows you to see not only the configuration aspects of your cluster, but also to view Kubernetes cluster objects such as Deployments, Pods, and Nodes. For this type of access, the console IAM User or Role needs to be granted permission within the cluster.

By default, the credentials used to create the cluster are automatically granted these permissions. Following along in the workshop, you've created a cluster using temporary IAM credentials from within Cloud9. This means that you'll need to add your AWS Console credentials to the cluster.

#### Import your EKS Console credentials to your new cluster:

Set the environment variable for the IAM role used to login into the AWS Console.


```bash
export rolearn="arn:aws:iam::$ACCOUNT_ID:role/WSParticipantRole"
```

With your ARN in hand, you can issue the command to associate access policy for the above IAM role. 

```bash
export EKS_CLUSTER_NAME="eksworkshop-eksctl"
export TYPE="STANDARD"
aws eks   create-access-entry --cluster-name $EKS_CLUSTER_NAME --principal-arn $rolearn --type $TYPE

export ACCESS_SCOPE="cluster"
export ACCESS_POLICY_ARN="arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
aws eks associate-access-policy --cluster-name $EKS_CLUSTER_NAME \
  --principal-arn $rolearn \
  --policy-arn $ACCESS_POLICY_ARN \
  --access-scope type=$ACCESS_SCOPE
```

::::expand{header="Check Output"}
```json
{
    "clusterName": "eksworkshop-eksctl",
    "principalArn": "arn:aws:iam::ACCOUNT_ID:role/WSOpsRole",
    "associatedAccessPolicy": {
        "policyArn": "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy",
        "accessScope": {
            "type": "cluster",
            "namespaces": []
        },
        "associatedAt": "2024-01-30T13:03:45.241000+00:00",
        "modifiedAt": "2024-01-30T13:03:45.241000+00:00"
    }
}
```
::::


Note that permissions can be restricted and granular but as this is a workshop cluster, you're adding your console credentials as administrator.


You can now view various Kubernetes Objects in the Amazon EKS Cluster in the [AWS Console for Amazon EKS](https://console.aws.amazon.com/eks/home?#/clusters/eksworkshop-eksctl?selectedTab=cluster-resources-tab&selectedResourceId=pods).


![console-access-to-eks-cluster](/static/images/iam/iam-role-rbac/console-access-to-eks-cluster.png)


For more information, check out the [EKS documentation](https://docs.aws.amazon.com/eks/latest/userguide/add-user-role.html) on this topic.

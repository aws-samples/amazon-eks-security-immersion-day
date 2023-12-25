---
title : "AWS console access to EKS Cluster"
weight : 27
---

This step is optional, as nearly all of the workshop content is CLI-driven. But, if you'd like full access to your workshop cluster in the EKS console this step is recommended.

The EKS console allows you to see not only the configuration aspects of your cluster, but also to view Kubernetes cluster objects such as Deployments, Pods, and Nodes. For this type of access, the console IAM User or Role needs to be granted permission within the cluster.

By default, the credentials used to create the cluster are automatically granted these permissions. Following along in the workshop, you've created a cluster using temporary IAM credentials from within Cloud9. This means that you'll need to add your AWS Console credentials to the cluster.

#### Import your EKS Console credentials to your new cluster:

IAM Users and Roles are bound to an EKS Kubernetes cluster via a ConfigMap named `aws-auth`. We can use `eksctl` to do this with one command.

You'll need to determine the correct credential to add for your AWS Console access. If you know this already, you can skip ahead to the `eksctl create iamidentitymapping` step below.

If you've built your cluster from Cloud9 as part of this tutorial, invoke the following within your environment to determine your IAM Role or User ARN. 

```bash
c9builder=$(aws cloud9 describe-environment-memberships --environment-id=$C9_PID | jq -r '.memberships[].userArn')
if echo ${c9builder} | grep -q user; then
	rolearn=${c9builder}
        echo Role ARN: ${rolearn}
elif echo ${c9builder} | grep -q assumed-role; then
        assumedrolename=$(echo ${c9builder} | awk -F/ '{print $(NF-1)}')
        rolearn=$(aws iam get-role --role-name ${assumedrolename} --query Role.Arn --output text) 
        echo Role ARN: ${rolearn}
fi
```

::::expand{header="Check Output"}
```bash
Role ARN: arn:aws:iam::XXXXXXXXXXX:role/WSParticipantRole
```
::::


With your ARN in hand, you can issue the command to create the identity mapping within the cluster.

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
    "accessEntry": {
        "clusterName": "eksworkshop-eksctl",
        "principalArn": "arn:aws:iam::ACCOUNT_ID:user/jp",
        "kubernetesGroups": [],
        "accessEntryArn": "arn:aws:eks:us-east-1:ACCOUNT_ID:access-entry/eksworkshop-eksctl/user/ACCOUNT_ID/jp/c4c64fde-7398-0694-afcf-55762dd1273c",
        "createdAt": 1703487006.702,
        "modifiedAt": 1703487006.702,
        "tags": {},
        "username": "arn:aws:iam::ACCOUNT_ID:user/jp",
        "type": "STANDARD"
    }
}

{
    "clusterName": "eksworkshop-eksctl",
    "principalArn": "arn:aws:iam::ACCOUNT_ID:user/jp",
    "associatedAccessPolicy": {
        "policyArn": "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy",
        "accessScope": {
            "type": "cluster",
            "namespaces": []
        },
        "associatedAt": 1703487066.012,
        "modifiedAt": 1703487066.012
    }
}
```
::::


Note that permissions can be restricted and granular but as this is a workshop cluster, you're adding your console credentials as administrator.


You can now view various Kubernetes Objects in the Amazon EKS Cluster in the [AWS Console for Amazon EKS](https://console.aws.amazon.com/eks/home?#/clusters/eksworkshop-eksctl?selectedTab=cluster-resources-tab&selectedResourceId=pods).


![console-access-to-eks-cluster](/static/images/iam/iam-role-rbac/console-access-to-eks-cluster.png)


For more information, check out the [EKS documentation](https://docs.aws.amazon.com/eks/latest/userguide/add-user-role.html) on this topic.

---
title : "Create Access entries and associate access policies"
weight : 25
---


## Create Access entries

So far we created **IAM Roles/Groups/Users** in AWS. In this section, let's create access entries for the IAM Roles.

```bash
export EKS_CLUSTER_NAME="eksworkshop-eksctl"
export TYPE="STANDARD"

export IAM_PRINCIPAL_ARN="arn:aws:iam::${ACCOUNT_ID}:role/k8sClusterAdmin"
aws eks   create-access-entry --cluster-name $EKS_CLUSTER_NAME --principal-arn $IAM_PRINCIPAL_ARN --type $TYPE

export IAM_PRINCIPAL_ARN="arn:aws:iam::${ACCOUNT_ID}:role/k8sTeamADev"
aws eks   create-access-entry --cluster-name $EKS_CLUSTER_NAME --principal-arn $IAM_PRINCIPAL_ARN --type $TYPE

export IAM_PRINCIPAL_ARN="arn:aws:iam::${ACCOUNT_ID}:role/k8sTeamATest"
aws eks   create-access-entry --cluster-name $EKS_CLUSTER_NAME --principal-arn $IAM_PRINCIPAL_ARN --type $TYPE
```

::::expand{header="Expand for Output"}
```json
{
    "accessEntry": {
        "clusterName": "eksworkshop-eksctl",
        "principalArn": "arn:aws:iam::ACCOUNT_ID:role/k8sClusterAdmin",
        "kubernetesGroups": [],
        "accessEntryArn": "arn:aws:eks:us-west-2:ACCOUNT_ID:access-entry/eksworkshop-eksctl/role/ACCOUNT_ID/k8sClusterAdmin/90c6ad21-e9df-a837-6b39-6ef67f1bd03d",
        "createdAt": "2024-01-30T12:06:51.206000+00:00",
        "modifiedAt": "2024-01-30T12:06:51.206000+00:00",
        "tags": {},
        "username": "arn:aws:sts::ACCOUNT_ID:assumed-role/k8sClusterAdmin/{{SessionName}}",
        "type": "STANDARD"
    }
}
{
    "accessEntry": {
        "clusterName": "eksworkshop-eksctl",
        "principalArn": "arn:aws:iam::ACCOUNT_ID:role/k8sTeamADev",
        "kubernetesGroups": [],
        "accessEntryArn": "arn:aws:eks:us-west-2:ACCOUNT_ID:access-entry/eksworkshop-eksctl/role/ACCOUNT_ID/k8sTeamADev/f8c6ad21-ebb9-d2aa-335c-d8af833bb77e",
        "createdAt": "2024-01-30T12:06:52.268000+00:00",
        "modifiedAt": "2024-01-30T12:06:52.268000+00:00",
        "tags": {},
        "username": "arn:aws:sts::ACCOUNT_ID:assumed-role/k8sTeamADev/{{SessionName}}",
        "type": "STANDARD"
    }
}
{
    "accessEntry": {
        "clusterName": "eksworkshop-eksctl",
        "principalArn": "arn:aws:iam::ACCOUNT_ID:role/k8sTeamATest",
        "kubernetesGroups": [],
        "accessEntryArn": "arn:aws:eks:us-west-2:ACCOUNT_ID:access-entry/eksworkshop-eksctl/role/ACCOUNT_ID/k8sTeamATest/96c6ad21-edac-ba70-daaf-bd4f626d04d0",
        "createdAt": "2024-01-30T12:06:53.092000+00:00",
        "modifiedAt": "2024-01-30T12:06:53.092000+00:00",
        "tags": {},
        "username": "arn:aws:sts::ACCOUNT_ID:assumed-role/k8sTeamATest/{{SessionName}}",
        "type": "STANDARD"
    }
}
```
::::


## Associate Access policies

Let us assoicate the required access policy to each of the access entries created above.


```bash

# Associate AmazonEKSClusterAdminPolicy access policy to IAM Role k8sClusterAdmin
export IAM_PRINCIPAL_ARN="arn:aws:iam::${ACCOUNT_ID}:role/k8sClusterAdmin"
export ACCESS_SCOPE="cluster"
export ACCESS_POLICY_ARN="arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
aws eks associate-access-policy --cluster-name $EKS_CLUSTER_NAME \
  --principal-arn $IAM_PRINCIPAL_ARN \
  --policy-arn $ACCESS_POLICY_ARN \
  --access-scope type=$ACCESS_SCOPE

# Associate AmazonEKSAdminPolicy access policy to IAM Role k8sTeamADev
export IAM_PRINCIPAL_ARN="arn:aws:iam::${ACCOUNT_ID}:role/k8sTeamADev"
export ACCESS_SCOPE="namespace"
export NAMESPACES="team-a"
export ACCESS_POLICY_ARN="arn:aws:eks::aws:cluster-access-policy/AmazonEKSAdminPolicy"
aws eks associate-access-policy --cluster-name $EKS_CLUSTER_NAME \
  --principal-arn $IAM_PRINCIPAL_ARN \
  --policy-arn $ACCESS_POLICY_ARN \
  --access-scope type=$ACCESS_SCOPE,namespaces=$NAMESPACES

# Associate AmazonEKSViewPolicy access policy to IAM Role k8sTeamATest
export IAM_PRINCIPAL_ARN="arn:aws:iam::${ACCOUNT_ID}:role/k8sTeamATest"
export ACCESS_SCOPE="namespace"
export NAMESPACES="team-a"
export ACCESS_POLICY_ARN="arn:aws:eks::aws:cluster-access-policy/AmazonEKSViewPolicy"
aws eks associate-access-policy --cluster-name $EKS_CLUSTER_NAME \
  --principal-arn $IAM_PRINCIPAL_ARN \
  --policy-arn $ACCESS_POLICY_ARN \
  --access-scope type=$ACCESS_SCOPE,namespaces=$NAMESPACES
```


::::expand{header="Expand for Output"}
```json
{
    "clusterName": "eksworkshop-eksctl",
    "principalArn": "arn:aws:iam::ACCOUNT_ID:role/k8sClusterAdmin",
    "associatedAccessPolicy": {
        "policyArn": "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy",
        "accessScope": {
            "type": "cluster",
            "namespaces": []
        },
        "associatedAt": 1703388453.491,
        "modifiedAt": 1703388453.491
    }
}
{
    "clusterName": "eksworkshop-eksctl",
    "principalArn": "arn:aws:iam::ACCOUNT_ID:role/k8sTeamADev",
    "associatedAccessPolicy": {
        "policyArn": "arn:aws:eks::aws:cluster-access-policy/AmazonEKSAdminPolicy",
        "accessScope": {
            "type": "namespace",
            "namespaces": [
                "team-a"
            ]
        },
        "associatedAt": 1703402093.134,
        "modifiedAt": 1703402093.134
    }
}
{
    "clusterName": "eksworkshop-eksctl",
    "principalArn": "arn:aws:iam::ACCOUNT_ID:role/k8sTeamATest",
    "associatedAccessPolicy": {
        "policyArn": "arn:aws:eks::aws:cluster-access-policy/AmazonEKSViewPolicy",
        "accessScope": {
            "type": "namespace",
            "namespaces": [
                "team-a"
            ]
        },
        "associatedAt": 1703402181.222,
        "modifiedAt": 1703402181.222
    }
}
```
::::

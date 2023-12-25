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
```bash
{
    "accessEntry": {
        "clusterName": "eksworkshop-eksctl",
        "principalArn": "arn:aws:iam::ACCOUNT_ID:role/k8sClusterAdmin",
        "kubernetesGroups": [],
        "accessEntryArn": "arn:aws:eks:us-east-1:ACCOUNT_ID:access-entry/eksworkshop-eksctl/role/ACCOUNT_ID/k8sClusterAdmin/10c647a6-4797-031a-9d4c-0f7ede79b940",
        "createdAt": 1703211208.652,
        "modifiedAt": 1703211208.652,
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
        "accessEntryArn": "arn:aws:eks:us-east-1:ACCOUNT_ID:access-entry/eksworkshop-eksctl/role/ACCOUNT_ID/k8sTeamADev/cac647d3-d5da-cdfe-eb1e-a90c0d2204f8",
        "createdAt": 1703217179.7,
        "modifiedAt": 1703217179.7,
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
        "accessEntryArn": "arn:aws:eks:us-east-1:ACCOUNT_ID:access-entry/eksworkshop-eksctl/role/ACCOUNT_ID/k8sTeamATest/b8c647d4-0370-57b3-3372-e71eddb1e27d",
        "createdAt": 1703217203.098,
        "modifiedAt": 1703217203.098,
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

export IAM_PRINCIPAL_ARN="arn:aws:iam::${ACCOUNT_ID}:role/k8sTeamADev"
export ACCESS_SCOPE="namespace"
export NAMESPACES="team-a"
export ACCESS_POLICY_ARN="arn:aws:eks::aws:cluster-access-policy/AmazonEKSAdminPolicy"
aws eks associate-access-policy --cluster-name $EKS_CLUSTER_NAME \
  --principal-arn $IAM_PRINCIPAL_ARN \
  --policy-arn $ACCESS_POLICY_ARN \
  --access-scope type=$ACCESS_SCOPE,namespaces=$NAMESPACES

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

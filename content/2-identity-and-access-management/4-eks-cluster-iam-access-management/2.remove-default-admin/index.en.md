---
title : "Removing the default cluster administrator"
weight : 22
---


## Removing the default cluster administrator

### View existing access policy

Earlier, in the default Mode `CONFIG_MAP`, when an Amazon EKS cluster was created, the principal used to provision the cluster was permanently granted Kubernetes cluster-admin privileges. It was not possible to remove Kubernetes cluster-admin privileges from this IAM principal. 

Now, with authentication modes `API_AND_CONFIG_MAP` and `API`, it is possible to remove the Kubernetes cluster-admin privileges from this IAM principal.

In this section, let us test removing Kubernetes cluster-admin privileges from the IAM principal and re-attaching it.

Let us first describe the access entry for the EKS cluster creation role `eks-security-workshop` and see what access policy is assigned to it.


```bash
export ACCOUNT_ID=$(aws sts get-caller-identity --output text --query Account)
export ACCESS_ENTRY="arn:aws:iam::$ACCOUNT_ID:role/eks-security-workshop"
echo "ACCESS_ENTRY=$ACCESS_ENTRY"
```

Let us describe the access entry.

```bash
aws eks  describe-access-entry --cluster-name $EKS_CLUSTER_NAME --principal-arn $ACCESS_ENTRY
```

::::expand{header="Check Output"}
```json
{
    "accessEntry": {
        "clusterName": "eksworkshop-eksctl",
        "principalArn": "arn:aws:iam::ACCOUNT_ID:role/eks-security-workshop",
        "kubernetesGroups": [],
        "accessEntryArn": "arn:aws:eks:us-west-2:ACCOUNT_ID:access-entry/eksworkshop-eksctl/role/ACCOUNT_ID/eks-security-workshop/cec6a258-37a5-8a88-c509-d66bf99078c9",
        "createdAt": "2024-01-26T07:33:50.099000+00:00",
        "modifiedAt": "2024-01-26T07:33:50.099000+00:00",
        "tags": {},
        "username": "arn:aws:sts::ACCOUNT_ID:assumed-role/eks-security-workshop/{{SessionName}}",
        "type": "STANDARD"
    }
}
```
::::

Let us get the associated access policies for the above IAM principal in the above access entry.

```bash
export IAM_PRINCIPAL_ARN=$(aws eks  describe-access-entry --cluster-name $EKS_CLUSTER_NAME --principal-arn $ACCESS_ENTRY --query 'accessEntry.principalArn' --output text)
echo "IAM_PRINCIPAL_ARN=$IAM_PRINCIPAL_ARN"
export ACCESS_POLICY_ARN=$(aws eks list-associated-access-policies --cluster-name $EKS_CLUSTER_NAME --principal-arn $IAM_PRINCIPAL_ARN --query 'associatedAccessPolicies[0].policyArn' --output text)
echo "ACCESS_POLICY_ARN=$ACCESS_POLICY_ARN"
```


::::expand{header="Check Output"}
```bash
IAM_PRINCIPAL_ARN=arn:aws:iam::ACCOUNT_ID:role/eks-security-workshop
ACCESS_POLICY_ARN=arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy
```
::::


As you see the IAM principal `arn:aws:iam::ACCOUNT_ID:role/eks-security-workshop` is associated with access policy `AmazonEKSClusterAdminPolicy` which is mapped to Kubernetes `cluster-admin` role.


Before removing Kubernetes cluster-admin privileges from the IAM principal `arn:aws:iam::ACCOUNT_ID:role/eks-security-workshop`, Let us list Kubernetes permissions for authenticated user.

Test cluster access now.

```bash
kubectl get node
```

::::expand{header="Check Output"}
```bash
NAME                              STATUS   ROLES    AGE    VERSION
ip-192-168-105-62.ec2.internal    Ready    <none>   172m   v1.28.3-eks-e71965b
ip-192-168-158-255.ec2.internal   Ready    <none>   172m   v1.28.3-eks-e71965b
ip-192-168-184-154.ec2.internal   Ready    <none>   172m   v1.28.3-eks-e71965b
```
::::

### Remove the access policy

Run the below command to disassociate the access policy from the IAM principal.

```bash
aws eks disassociate-access-policy --cluster-name $EKS_CLUSTER_NAME --principal-arn $IAM_PRINCIPAL_ARN --policy-arn $ACCESS_POLICY_ARN
```

Let us check the list of associated access policies for the IAM principal.

```bash
aws eks list-associated-access-policies --cluster-name $EKS_CLUSTER_NAME --principal-arn $IAM_PRINCIPAL_ARN 
```

::::expand{header="Check Output"}
```json
{
    "associatedAccessPolicies": [],
    "clusterName": "eksworkshop-eksctl",
    "principalArn": "arn:aws:iam::ACCOUNT_ID:role/eks-security-workshop"
}
```
::::

As expected, the `associatedAccessPolicies` is empty.

::alert[Notice that we only removed access policy from the IAM principal but the access entry still exists for this IAM principal.]{header="Note"}

Let us list the access entries avalable for the cluster.


```bash
aws eks list-access-entries --cluster-name $EKS_CLUSTER_NAME 
```

::::expand{header="Check Output"}
```json
{
    "accessEntries": [
        "arn:aws:iam::ACCOUNT_ID:role/eks-bootstrap-template-ws-EKSNodegroupRole-E1potkq4Auqa",
        "arn:aws:iam::ACCOUNT_ID:role/eks-security-workshop"
    ]
}
```
::::

You can also view these access entries in the EKS Console under the **Access** Tab.

![access_entries1](/static/images/iam/eks-access-management/access_entries1.png)

Test cluster access now.

```bash
kubectl get node
```

::::expand{header="Check Output"}
```bash
Error from server (Forbidden): nodes is forbidden: User "arn:aws:sts::ACCOUNT_ID:assumed-role/eks-security-workshop/EKSGetTokenAuth" cannot list resource "nodes" in API group "" at the cluster scope
```
::::

This indicates that the IAM principal, which originally created the EKS cluster does not have any Kubernetes permissions assigned now.

### Add the access policy 

Let us associate the access policy back to the IAM principal.

```bash
export ACCESS_SCOPE="cluster"
aws eks associate-access-policy --cluster-name $EKS_CLUSTER_NAME --principal-arn $IAM_PRINCIPAL_ARN --policy-arn $ACCESS_POLICY_ARN --access-scope type=$ACCESS_SCOPE
```

::::expand{header="Check Output"}
```json
{
    "clusterName": "eksworkshop-eksctl",
    "principalArn": "arn:aws:iam::ACCOUNT_ID:role/eks-security-workshop",
    "associatedAccessPolicy": {
        "policyArn": "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy",
        "accessScope": {
            "type": "cluster",
            "namespaces": []
        },
        "associatedAt": "2024-01-30T11:43:51.815000+00:00",
        "modifiedAt": "2024-01-30T11:43:51.815000+00:00"
    }
}
```
::::


Let us check again for the list of associated access policies for the IAM principal.

```bash
aws eks list-associated-access-policies --cluster-name $EKS_CLUSTER_NAME --principal-arn $IAM_PRINCIPAL_ARN 
```

::::expand{header="Check Output"}
```json
{
    "associatedAccessPolicies": [
        {
            "policyArn": "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy",
            "accessScope": {
                "type": "cluster",
                "namespaces": []
            },
            "associatedAt": "2024-01-30T11:43:51.815000+00:00",
            "modifiedAt": "2024-01-30T11:43:51.815000+00:00"
        }
    ],
    "clusterName": "eksworkshop-eksctl",
    "principalArn": "arn:aws:iam::ACCOUNT_ID:role/eks-security-workshop"
}
```
::::

Test cluster access now.

```bash
kubectl get node
```

::::expand{header="Check Output"}
```bash
NAME                              STATUS   ROLES    AGE    VERSION
ip-192-168-105-62.ec2.internal    Ready    <none>   172m   v1.28.3-eks-e71965b
ip-192-168-158-255.ec2.internal   Ready    <none>   172m   v1.28.3-eks-e71965b
ip-192-168-184-154.ec2.internal   Ready    <none>   172m   v1.28.3-eks-e71965b
```
::::

::alert[EKS clusters can be created with the AWS IAM principal with no cluster administrator access permissions at all using bootstrapClusterCreatorAdminPermissions flag. For example, `aws eks create-cluster --name CLUSTER_NAME --role-arn CLUSTER_ROLE_ARN --resources-vpc-config subnetIds=value,securityGroupIds=value --access-config authenticationMode=API_AND_CONFIG_MAP,bootstrapClusterCreatorAdminPermissions=false`]{header="Note"}

---
title : "Using access entries with Kubernetes RBAC"
weight : 24
---

## Using access entries with Kubernetes RBAC

The cluster access management controls and associated APIs don’t replace the existing RBAC authorizer in Amazon EKS. Rather, Amazon EKS access entries can be combined with the RBAC authorizer to grant cluster access to an AWS IAM principal while relying on Kubernetes RBAC to apply desired permissions.


In this section, instead of using EKS access policy `AmazonEKSClusterAdminPolicy`, we will use Kubernetes RBAC for administrator access to the EKS cluster.


## dis-associate access policy from IAM Role.

Let us first dis-associate the access policy `AmazonEKSClusterAdminPolicy` from the IAM Role `k8sClusterAdmin`.


```bash
export IAM_PRINCIPAL_ARN="arn:aws:iam::${ACCOUNT_ID}:role/k8sClusterAdmin"
export ACCESS_POLICY_ARN="arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
aws eks disassociate-access-policy --cluster-name $EKS_CLUSTER_NAME \
  --principal-arn $IAM_PRINCIPAL_ARN \
  --policy-arn $ACCESS_POLICY_ARN
```

Use IAM Role `k8sClusterAdmin` to access EKS cluster.

```bash
export KUBECONFIG=/tmp/kubeconfig-admin
kubectl whoami
```

::::expand{header="Check Output"}
```bash
arn:aws:sts::ACCOUNT_ID:assumed-role/k8sClusterAdmin/botocore-session-1703490059
```
::::

Test access to cluster.

```bash
kubectl get node
```

::::expand{header="Check Output"}
```bash
Error from server (Forbidden): pods is forbidden: User "arn:aws:sts::ACCOUNT_ID:assumed-role/k8sClusterAdmin/botocore-session-1703490059" cannot list resource "pods" in API group "" in the namespace "default"```
::::

This shows that the IAM Role `k8sClusterAdmin` does not have any access to the cluster.

## Apply Kubernetes RBAC to access entry


```bash
export EKS_CLUSTER_NAME="eksworkshop-eksctl"
export EKS_ADMIN_RBAC_GROUP="k8s-rbac-group-admin"
export IAM_PRINCIPAL_ARN="arn:aws:iam::${ACCOUNT_ID}:role/k8sClusterAdmin"

aws eks   update-access-entry --cluster-name $EKS_CLUSTER_NAME --principal-arn $IAM_PRINCIPAL_ARN  --kubernetes-groups $EKS_ADMIN_RBAC_GROUP
```

::::expand{header="Check Output"}
```json
{
    "accessEntry": {
        "clusterName": "eksworkshop-eksctl",
        "principalArn": "arn:aws:iam::ACCOUNT_ID:role/k8sClusterAdmin",
        "kubernetesGroups": [
            "k8s-rbac-group-admin"
        ],
        "accessEntryArn": "arn:aws:eks:us-east-1:ACCOUNT_ID:access-entry/eksworkshop-eksctl/role/ACCOUNT_ID/k8sClusterAdmin/90c64ff4-ef0b-8aa1-0152-39a0f56117f6",
        "createdAt": 1703489953.533,
        "modifiedAt": 1703491655.547,
        "tags": {},
        "username": "arn:aws:sts::ACCOUNT_ID:assumed-role/k8sClusterAdmin/{{SessionName}}",
        "type": "STANDARD"
    }
}
::::

Let us apply Kubernetes RBAC using `ClusterRoleBinding` Resource

```bash
cd ~/environment
cat << EOF > rbac-for-access-entry.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: cluster-admin-ae
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
- apiGroup: rbac.authorization.k8s.io
  kind: Group
  name: $EKS_ADMIN_RBAC_GROUP
EOF
```

```bash
unset KUBECONFIG
kubectl apply -f rbac-for-access-entry.yaml
```

::::expand{header="Check Output"}
```bash
clusterrolebinding.rbac.authorization.k8s.io/cluster-admin-ae created
::::

Use IAM Role `k8sClusterAdmin` to access EKS cluster.

```bash
export KUBECONFIG=/tmp/kubeconfig-admin
kubectl whoami
```

::::expand{header="Check Output"}
```bash
arn:aws:sts::ACCOUNT_ID:assumed-role/k8sClusterAdmin/botocore-session-1703490059
```
::::

Test access to cluster.

```bash
kubectl get node
```

::::expand{header="Check Output"}
```bash
NAME                              STATUS   ROLES    AGE    VERSION
ip-192-168-105-62.ec2.internal    Ready    <none>   4d1h   v1.28.3-eks-e71965b
ip-192-168-158-255.ec2.internal   Ready    <none>   4d1h   v1.28.3-eks-e71965b
ip-192-168-184-154.ec2.internal   Ready    <none>   4d1h   v1.28.3-eks-e71965b
::::
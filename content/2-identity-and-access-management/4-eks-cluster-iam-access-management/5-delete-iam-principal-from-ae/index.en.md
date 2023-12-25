---
title : "Deleting IAM principal from access entry"
weight : 25
---

## Deleting IAM principal from access entry


The reference of a cluster access entry to its underlying AWS IAM principal is unique, as seen in the `accessEntryArn` in the following create-access-entry output snippet.

Let us get the `accessEntryArn` for the IAM Principal `k8sTeamADev`

```bash
export IAM_PRINCIPAL_ARN="arn:aws:iam::${ACCOUNT_ID}:role/k8sTeamADev"
export ACCESS_ENTRY_ARN=$(aws eks  describe-access-entry --cluster-name $EKS_CLUSTER_NAME --principal-arn $IAM_PRINCIPAL_ARN  --query 'accessEntry.accessEntryArn' --output text)
echo "ACCESS_ENTRY_ARN=$ACCESS_ENTRY_ARN"
```

::::expand{header="Check Output"}
```bash
ACCESS_ENTRY_ARN=arn:aws:eks:us-east-1:ACCOUNT_ID:access-entry/eksworkshop-eksctl/role/ACCOUNT_ID/k8sTeamADev/a2c64ff4-f10f-08c2-4e54-b1ea2b0468b1
```
::::


Once an access entry is created, the underlying AWS IAM principal cannot be changed, while keeping the cluster access. The access entry and associated access policies must be recreated

Use IAM Role `k8sTeamADev` to access EKS cluster.

```bash
export KUBECONFIG=/tmp/kubeconfig-dev
kubectl whoami
```

::::expand{header="Check Output"}
```bash
arn:aws:sts::ACCOUNT_ID:assumed-role/k8sTeamADev/botocore-session-1703494771
```
::::

Test access to cluster.


```bash
kubectl get pod -n team-a
```

::::expand{header="Check Output"}
```bash
NAME          READY   STATUS    RESTARTS   AGE
nginx-admin   1/1     Running   0          78m
nginx-dev     1/1     Running   0          3s
```
::::


Before deleting the IAM Principal `k8sTeamADev`. let us find the Role Id.

```bash
export IAM_ROLE="k8sTeamADev"
export ROLE_ID=$(aws iam get-role --role-name $IAM_ROLE --query 'Role.RoleId' --output text)
echo "ROLE_ID=$ROLE_ID"
```

::::expand{header="Check Output"}
```bash
ROLE_ID=AROAQAHCJ2QPJTOAB3E4V
```
::::

### Delete and re-create IAM Role

Let us delete the IAM Role `k8sTeamADev`

```bash
aws iam delete-role --role-name $IAM_ROLE
```


Let us re-create the IAM Role `k8sTeamADev`

```bash
export IAM_ROLE="k8sTeamADev"
export ROLE_DESCRIPTION="Kubernetes Admin role for develoeprs for Namespace team-a"

export IAM_ROLE_ARN=$(aws iam get-role --role-name $IAM_ROLE | jq -r '.Role.Arn')
if [ -z "$IAM_ROLE_ARN" ]
then
      IAM_ROLE_ARN=$(aws iam create-role \
        --role-name $IAM_ROLE \
        --description  "$ROLE_DESCRIPTION" \
        --assume-role-policy-document "$POLICY" \
        --output text \
        --query 'Role.Arn')
      echo "IAM Role ${IAM_ROLE} created. IAM_ROLE_ARN=$IAM_ROLE_ARN"
  
else
      echo "IAM Role ${IAM_ROLE} already exist..."
fi
```

::::expand{header="Check Output"}
```bash
IAM Role k8sTeamADev created. IAM_ROLE_ARN=arn:aws:iam::ACCOUNT_ID:role/k8sTeamADev
```
::::

Let us find the Role Id.

```bash
export IAM_ROLE="k8sTeamADev"
export ROLE_ID=$(aws iam get-role --role-name $IAM_ROLE --query 'Role.RoleId' --output text)
echo "ROLE_ID=$ROLE_ID"
```

::::expand{header="Check Output"}
```bash
ROLE_ID=AROAQAHCJ2QPOIJYQ2RTT
```
::::

Note that the current Role Id `AROAQAHCJ2QPOIJYQ2RTT` from the earlier one `AROAQAHCJ2QPJTOAB3E4V` even for same Role ARN.

Let us test access to EKS cluster.

```bash
kubectl whoami
```

::::expand{header="Check Output"}
```bash
Error: Unauthorized
```
::::


```bash
kubectl get pod -n team-a
```

::::expand{header="Check Output"}
```bash
error: You must be logged in to the server (Unauthorized)
```
::::

### Delete and re-create access entry

Delete the access entry

```bash
export IAM_PRINCIPAL_ARN="arn:aws:iam::${ACCOUNT_ID}:role/k8sTeamADev"
aws eks delete-access-entry --cluster-name $EKS_CLUSTER_NAME \
  --principal-arn $IAM_PRINCIPAL_ARN
```

Re-create the access entry

```bash
export IAM_PRINCIPAL_ARN="arn:aws:iam::${ACCOUNT_ID}:role/k8sTeamADev"
aws eks   create-access-entry --cluster-name $EKS_CLUSTER_NAME --principal-arn $IAM_PRINCIPAL_ARN --type $TYPE
```

::::expand{header="Check Output"}
```json
{
    "accessEntry": {
        "clusterName": "eksworkshop-eksctl",
        "principalArn": "arn:aws:iam::ACCOUNT_ID:role/k8sTeamADev",
        "kubernetesGroups": [],
        "accessEntryArn": "arn:aws:eks:us-east-1:ACCOUNT_ID:access-entry/eksworkshop-eksctl/role/ACCOUNT_ID/k8sTeamADev/d8c65022-b943-703a-4dc3-7ea66a5b5a59",
        "createdAt": 1703495955.158,
        "modifiedAt": 1703495955.158,
        "tags": {},
        "username": "arn:aws:sts::ACCOUNT_ID:assumed-role/k8sTeamADev/{{SessionName}}",
        "type": "STANDARD"
    }
}
```
::::


```bash
export IAM_PRINCIPAL_ARN="arn:aws:iam::${ACCOUNT_ID}:role/k8sTeamADev"
export ACCESS_SCOPE="namespace"
export NAMESPACES="team-a"
export ACCESS_POLICY_ARN="arn:aws:eks::aws:cluster-access-policy/AmazonEKSAdminPolicy"
aws eks associate-access-policy --cluster-name $EKS_CLUSTER_NAME \
  --principal-arn $IAM_PRINCIPAL_ARN \
  --policy-arn $ACCESS_POLICY_ARN \
  --access-scope type=$ACCESS_SCOPE,namespaces=$NAMESPACES
```

::::expand{header="Check Output"}
```json
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
        "associatedAt": 1703496078.676,
        "modifiedAt": 1703496078.676
    }
}
```
::::


```bash
\rm -rf ~/.aws/cli/cache
kubectl whoami
```

::::expand{header="Check Output"}
```json
arn:aws:sts::ACCOUNT_ID:assumed-role/k8sTeamADev/botocore-session-1703496838
```
::::


Let's create a pod:

```bash
kubectl run nginx-dev2 --image=nginx -n team-a
```

::::expand{header="Check Output"}
```bash
pod/nginx-dev2 created
```
::::

We can list the pods:

```bash
kubectl get pods -n team-a
```

The output looks like below

```bash
NAME          READY   STATUS    RESTARTS   AGE
nginx-admin   1/1     Running   0          115m
nginx-dev     1/1     Running   0          36m
nginx-dev2    1/1     Running   0          12s
```

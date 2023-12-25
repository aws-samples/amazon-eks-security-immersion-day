---
title : "Cleanup"
weight : 26
---

Once you have completed this chapter, you can cleanup the files and resources you created by issuing the following commands:

```bash
unset KUBECONFIG

kubectl delete pod nginx-dev -n team-a
kubectl delete pod nginx-admin -n team-a

kubectl delete namespace team-a

# disassociate the access policies

export IAM_PRINCIPAL_ARN="arn:aws:iam::${ACCOUNT_ID}:role/k8sClusterAdmin"
export ACCESS_POLICY_ARN="arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
aws eks disassociate-access-policy --cluster-name $EKS_CLUSTER_NAME \
  --principal-arn $IAM_PRINCIPAL_ARN \
  --policy-arn $ACCESS_POLICY_ARN 

export IAM_PRINCIPAL_ARN="arn:aws:iam::${ACCOUNT_ID}:role/k8sTeamADev"
export ACCESS_POLICY_ARN="arn:aws:eks::aws:cluster-access-policy/AmazonEKSAdminPolicy"
aws eks disassociate-access-policy --cluster-name $EKS_CLUSTER_NAME \
  --principal-arn $IAM_PRINCIPAL_ARN \
  --policy-arn $ACCESS_POLICY_ARN 
  
export IAM_PRINCIPAL_ARN="arn:aws:iam::${ACCOUNT_ID}:role/k8sTeamATest"
export ACCESS_POLICY_ARN="arn:aws:eks::aws:cluster-access-policy/AmazonEKSViewPolicy"
aws eks disassociate-access-policy --cluster-name $EKS_CLUSTER_NAME \
  --principal-arn $IAM_PRINCIPAL_ARN \
  --policy-arn $ACCESS_POLICY_ARN 

# Delete the access entries

export IAM_PRINCIPAL_ARN="arn:aws:iam::${ACCOUNT_ID}:role/k8sClusterAdmin"
aws eks delete-access-entry --cluster-name $EKS_CLUSTER_NAME \
  --principal-arn $IAM_PRINCIPAL_ARN


export IAM_PRINCIPAL_ARN="arn:aws:iam::${ACCOUNT_ID}:role/k8sTeamADev"
aws eks delete-access-entry --cluster-name $EKS_CLUSTER_NAME \
  --principal-arn $IAM_PRINCIPAL_ARN

export IAM_PRINCIPAL_ARN="arn:aws:iam::${ACCOUNT_ID}:role/k8sTeamATest"
aws eks delete-access-entry --cluster-name $EKS_CLUSTER_NAME \
  --principal-arn $IAM_PRINCIPAL_ARN  

aws iam remove-user-from-group --group-name k8sClusterAdmin --user-name User1Admin
aws iam remove-user-from-group --group-name k8sTeamADev --user-name User1TeamADev
aws iam remove-user-from-group --group-name k8sTeamATest --user-name User1TeamATest

aws iam delete-group-policy --group-name k8sClusterAdmin --policy-name k8sClusterAdmin-policy 
aws iam delete-group-policy --group-name k8sTeamADev --policy-name k8sTeamADev-policy
aws iam delete-group-policy --group-name k8sTeamATest --policy-name k8sTeamATest-policy 

aws iam delete-group --group-name k8sClusterAdmin
aws iam delete-group --group-name k8sTeamADev
aws iam delete-group --group-name k8sTeamATest

aws iam delete-access-key --user-name User1Admin --access-key-id=$(jq -r .AccessKey.AccessKeyId /tmp/User1Admin.json)
aws iam delete-access-key --user-name User1TeamADev --access-key-id=$(jq -r .AccessKey.AccessKeyId /tmp/User1TeamADev.json)
aws iam delete-access-key --user-name User1TeamATest --access-key-id=$(jq -r .AccessKey.AccessKeyId /tmp/User1TeamATest.json)

aws iam delete-user --user-name User1Admin
aws iam delete-user --user-name User1TeamADev
aws iam delete-user --user-name User1TeamATest

aws iam delete-role --role-name k8sClusterAdmin
aws iam delete-role --role-name k8sTeamADev
aws iam delete-role --role-name k8sTeamATest

rm /tmp/*.json
rm /tmp/kubeconfig*

# reset aws credentials and config files
rm  ~/.aws/{config,credentials}
aws configure set default.region ${AWS_REGION}
```

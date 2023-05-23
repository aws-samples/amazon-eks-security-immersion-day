---
title : "Cleanup"
weight : 29
---

Once you have completed this chapter, you can cleanup the files and resources you created by issuing the following commands:

```bash
unset KUBECONFIG

kubectl delete namespace development integration
kubectl delete pod nginx-admin

eksctl delete iamidentitymapping --cluster eksworkshop-eksctl --arn arn:aws:iam::${ACCOUNT_ID}:role/k8sAdmin
eksctl delete iamidentitymapping --cluster eksworkshop-eksctl --arn arn:aws:iam::${ACCOUNT_ID}:role/k8sDev
eksctl delete iamidentitymapping --cluster eksworkshop-eksctl --arn arn:aws:iam::${ACCOUNT_ID}:role/k8sInteg

aws iam remove-user-from-group --group-name k8sAdmin --user-name PaulAdmin
aws iam remove-user-from-group --group-name k8sDev --user-name JeanDev
aws iam remove-user-from-group --group-name k8sInteg --user-name PierreInteg

aws iam delete-group-policy --group-name k8sAdmin --policy-name k8sAdmin-policy 
aws iam delete-group-policy --group-name k8sDev --policy-name k8sDev-policy 
aws iam delete-group-policy --group-name k8sInteg --policy-name k8sInteg-policy 

aws iam delete-group --group-name k8sAdmin
aws iam delete-group --group-name k8sDev
aws iam delete-group --group-name k8sInteg

aws iam delete-access-key --user-name PaulAdmin --access-key-id=$(jq -r .AccessKey.AccessKeyId /tmp/PaulAdmin.json)
aws iam delete-access-key --user-name JeanDev --access-key-id=$(jq -r .AccessKey.AccessKeyId /tmp/JeanDev.json)
aws iam delete-access-key --user-name PierreInteg --access-key-id=$(jq -r .AccessKey.AccessKeyId /tmp/PierreInteg.json)

aws iam delete-user --user-name PaulAdmin
aws iam delete-user --user-name JeanDev
aws iam delete-user --user-name PierreInteg

aws iam delete-role --role-name k8sAdmin
aws iam delete-role --role-name k8sDev
aws iam delete-role --role-name k8sInteg

rm /tmp/*.json
rm /tmp/kubeconfig*

# reset aws credentials and config files
rm  ~/.aws/{config,credentials}
aws configure set default.region ${AWS_REGION}
```

::::expand{header="Check Output"}
```bash
namespace "development" deleted
namespace "integration" deleted
pod "nginx-admin" deleted
2023-03-14 10:38:40 [ℹ]  removing identity "arn:aws:iam::XXXXXXXXXX:role/k8sAdmin" from auth ConfigMap (username = "admin", groups = ["system:masters"])
2023-03-14 10:38:40 [ℹ]  removing identity "arn:aws:iam::XXXXXXXXXX:role/k8sDev" from auth ConfigMap (username = "dev-user", groups = [])
2023-03-14 10:38:42 [ℹ]  removing identity "arn:aws:iam::XXXXXXXXXX:role/k8sInteg" from auth ConfigMap (username = "integ-user", groups = [])
```
::::

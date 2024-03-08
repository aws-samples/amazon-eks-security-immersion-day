---
title : "Cleanup"
weight : 30
---

Confirm the environment variable setup correctly.

```bash
test -n "$EKS_CLUSTER" && echo EKS_CLUSTER is "$EKS_CLUSTER" \
 || echo EKS_CLUSTER is not set
test -n "$AWS_REGION" && echo AWS_REGION is "$AWS_REGION" || echo AWS_REGION is not set
```

::::expand{header="Output" defaultExpanded=true}

```text
EKS_CLUSTER is eksworkshop-eksctl
AWS_REGION is us-west-2
```

::::

The output must show both variables set. Although, your AWS region may be different.

Ensure that you are in correct directory path before running the cleanup steps.

```bash
ls -p
```

::::expand{header="Output" defaultExpanded=true}

```text
00_iam_policy_arn_dbsecret		    nginx-deployment-spc-k8s-secrets.yaml	
nginx-deployment.yaml
nginx-deployment-k8s-secrets.yaml	nginx-deployment-spc.yaml
```

::::

Run the following commands to cleanup Lab Environment

```bash
kubectl delete -f nginx-deployment-k8s-secrets.yaml
rm nginx-deployment-k8s-secrets.yaml

kubectl delete -f nginx-deployment-spc-k8s-secrets.yaml
rm nginx-deployment-spc-k8s-secrets.yaml

kubectl delete -f nginx-deployment.yaml
rm nginx-deployment.yaml

kubectl delete -f nginx-deployment-spc.yaml
rm nginx-deployment-spc.yaml

eksctl delete iamserviceaccount \
    --region="$AWS_REGION" --name "nginx-deployment-sa"  \
    --cluster "$EKS_CLUSTER" 

sleep 5

aws --region "$AWS_REGION" iam \
	delete-policy --policy-arn $(cat 00_iam_policy_arn_dbsecret)
unset IAM_POLICY_ARN_SECRET
unset IAM_POLICY_NAME_SECRET
rm 00_iam_policy_arn_dbsecret

aws --region "$AWS_REGION" secretsmanager \
  delete-secret --secret-id  dbsecret_eksid --force-delete-without-recovery

kubectl delete -f \
 https://raw.githubusercontent.com/aws/secrets-store-csi-driver-provider-aws/main/deployment/aws-provider-installer.yaml

helm uninstall -n kube-system csi-secrets-store
helm repo remove secrets-store-csi-driver
```

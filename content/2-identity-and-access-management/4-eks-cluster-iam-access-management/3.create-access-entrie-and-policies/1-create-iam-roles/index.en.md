---
title : "Create AWS IAM Roles"
weight : 22
---

Set below environment variables

```bash
export ACCOUNT_ID=$(aws sts get-caller-identity --output text --query Account)
export AWS_REGION=$(curl -s 169.254.169.254/latest/dynamic/instance-identity/document | jq -r '.region')
```


Create the IAM Roles:

```bash
POLICY=$(echo -n '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"AWS":"arn:aws:iam::'; echo -n "$ACCOUNT_ID"; echo -n ':root"},"Action":"sts:AssumeRole","Condition":{}}]}')

export IAM_ROLE="k8sClusterAdmin"
export ROLE_DESCRIPTION="Kubernetes administrator role."

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

export IAM_ROLE="k8sTeamATest"
export ROLE_DESCRIPTION="ubernetes Viewer role for testers for Namespace team-a"

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
IAM Role k8sClusterAdmin created. IAM_ROLE_ARN=arn:aws:iam::ACCOUNT_ID:role/k8sClusterAdmin
IAM Role k8sTeamADev created. IAM_ROLE_ARN=arn:aws:iam::ACCOUNT_ID:role/k8sTeamADev
IAM Role k8sTeamATest created. IAM_ROLE_ARN=arn:aws:iam::ACCOUNT_ID:role/k8sTeamATest
```
::::


> In this example, the assume-role-policy allows the root account to assume the role. We are going to allow specific groups to also be able to assume those roles. Check the [official documentation](https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts-technical-overview.html)  for more information.


Because the above roles are only used to authenticate within our Amazon EKS cluster, they don't need to have AWS permissions. We will only use them to allow some IAM groups to assume this role in order to have access to our EKS cluster.

Let's go to the AWS IAM Console and check one of the above IAM Role and see that there are no IAM permissions attached to the Role.

![k8sClusterAdmin-role](/static/images/iam/eks-access-management/k8sClusterAdmin-role.png)


And also let's see trust policy of the IAM Role that allows the root account to assume the role, which means 
any IAM principal (user or role) can now assume the role.

![k8sClusterAdmin-trust-policy](/static/images/iam/eks-access-management/k8sClusterAdmin-trust-policy.png)


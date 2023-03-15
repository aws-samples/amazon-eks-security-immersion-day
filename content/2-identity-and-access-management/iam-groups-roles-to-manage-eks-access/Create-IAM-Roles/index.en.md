---
title : "Create IAM Roles"
weight : 22
---

Let us create 3 least privileged IAM Roles

![Least-Privileged-IAM-Role-for-k8sRoles](/static/images/iam/iam-role-rbac/Least-Privileged-IAM-Role-for-k8sRoles.png)


We are going to create 3 roles:

-   a **k8sAdmin** role which will have **admin** rights in our EKS cluster
-   a **k8sDev** role which will give access to the **developers** namespace in our EKS cluster
-   a **k8sInteg** role which will give access to the **integration** namespace in our EKS cluster

Set below environment variables
```bash
export ACCOUNT_ID=$(aws sts get-caller-identity --output text --query Account)
export AWS_REGION=$(curl -s 169.254.169.254/latest/dynamic/instance-identity/document | jq -r '.region')
```


Create the roles:

```bash
POLICY=$(echo -n '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"AWS":"arn:aws:iam::'; echo -n "$ACCOUNT_ID"; echo -n ':root"},"Action":"sts:AssumeRole","Condition":{}}]}')

echo ACCOUNT_ID=$ACCOUNT_ID
echo POLICY=$POLICY

aws iam create-role \
  --role-name k8sAdmin \
  --description "Kubernetes administrator role (for AWS IAM Authenticator for Kubernetes)." \
  --assume-role-policy-document "$POLICY" \
  --output text \
  --query 'Role.Arn'

aws iam create-role \
  --role-name k8sDev \
  --description "Kubernetes developer role (for AWS IAM Authenticator for Kubernetes)." \
  --assume-role-policy-document "$POLICY" \
  --output text \
  --query 'Role.Arn'
  
aws iam create-role \
  --role-name k8sInteg \
  --description "Kubernetes role for integration namespace in quick cluster." \
  --assume-role-policy-document "$POLICY" \
  --output text \
  --query 'Role.Arn'
```

::::expand{header="Check Output"}
```bash
arn:aws:iam::XXXXXXXXXXX:role/k8sAdmin
arn:aws:iam::XXXXXXXXXXX:role/k8sDev
arn:aws:iam::XXXXXXXXXXX:role/k8sInteg
```
::::


> In this example, the assume-role-policy allows the root account to assume the role. We are going to allow specific groups to also be able to assume those roles. Check the [official documentation](https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts-technical-overview.html)  for more information.


Because the above roles are only used to authenticate within our EKS cluster, they don't need to have AWS permissions. We will only use them to allow some IAM groups to assume this role in order to have access to our EKS cluster.

Let's go to the AWS IAM Console and check one of the above IAM Role and see that there are no IAM permissions attached to the Role.

![k8sAdmink8sAdmin-role](/static/images/iam/iam-role-rbac/k8sAdmin-role.png)


And also let's see trust policy of the IAM Role that allows the root account to assume the role, which means 
any IAM principal (user or role) can now assume the role.

![k8sAdmin-trust-policy](/static/images/iam/iam-role-rbac/k8sAdmin-trust-policy.png)


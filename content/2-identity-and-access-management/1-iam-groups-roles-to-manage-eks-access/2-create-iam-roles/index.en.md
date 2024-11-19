---
title: "Create AWS IAM roles"
weight: 22
---

Let us create 3 least privileged IAM roles

We are going to create 3 IAM roles:

- a **k8sAdmin** role which will have **admin** rights in our Amazon EKS cluster
- a **k8sDev** role which will give access to the **developers** namespace in our Amazon EKS cluster
- a **k8sInteg** role which will give access to the **integration** namespace in our Amazon EKS cluster

Create the IAM roles:

```bash
POLICY=$(echo -n '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"AWS":"arn:aws:iam::'; echo -n "$ACCOUNT_ID"; echo -n ':root"},"Action":"sts:AssumeRole","Condition":{}}]}')

export IAM_ROLE="k8sAdmin"
export ROLE_DESCRIPTION="Kubernetes administrator role (for AWS IAM Authenticator for Kubernetes)."

export IAM_ROLE_ARN=$(aws iam get-role --role-name $IAM_ROLE | jq -r '.Role.Arn')
if [ -z "$IAM_ROLE_ARN" ]
then
      IAM_ROLE_ARN=$(aws iam create-role \
        --role-name $IAM_ROLE \
        --description  "$ROLE_DESCRIPTION" \
        --assume-role-policy-document "$POLICY" \
        --output text \
        --query 'Role.Arn')
      echo "IAM role ${IAM_ROLE} created. IAM_ROLE_ARN=$IAM_ROLE_ARN"

else
      echo "IAM role ${IAM_ROLE} already exist..."
fi


export IAM_ROLE="k8sDev"
export ROLE_DESCRIPTION="Kubernetes developer role (for AWS IAM Authenticator for Kubernetes)."

export IAM_ROLE_ARN=$(aws iam get-role --role-name $IAM_ROLE | jq -r '.Role.Arn')
if [ -z "$IAM_ROLE_ARN" ]
then
      IAM_ROLE_ARN=$(aws iam create-role \
        --role-name $IAM_ROLE \
        --description  "$ROLE_DESCRIPTION" \
        --assume-role-policy-document "$POLICY" \
        --output text \
        --query 'Role.Arn')
      echo "IAM role ${IAM_ROLE} created. IAM_ROLE_ARN=$IAM_ROLE_ARN"

else
      echo "IAM role ${IAM_ROLE} already exist..."
fi

export IAM_ROLE="k8sInteg"
export ROLE_DESCRIPTION="Kubernetes role for integration namespace in quick cluster."

export IAM_ROLE_ARN=$(aws iam get-role --role-name $IAM_ROLE | jq -r '.Role.Arn')
if [ -z "$IAM_ROLE_ARN" ]
then
      IAM_ROLE_ARN=$(aws iam create-role \
        --role-name $IAM_ROLE \
        --description  "$ROLE_DESCRIPTION" \
        --assume-role-policy-document "$POLICY" \
        --output text \
        --query 'Role.Arn')
      echo "IAM role ${IAM_ROLE} created. IAM_ROLE_ARN=$IAM_ROLE_ARN"

else
      echo "IAM role ${IAM_ROLE} already exist..."
fi

```

::::expand{header="Check Output"}

```bash
An error occurred (NoSuchEntity) when calling the GetRole operation: The role with name k8sAdmin cannot be found.
IAM Role k8sAdmin created. IAM_ROLE_ARN=arn:aws:iam::12345678900:role/k8sAdmin

An error occurred (NoSuchEntity) when calling the GetRole operation: The role with name k8sDev cannot be found.
IAM Role k8sDev created. IAM_ROLE_ARN=arn:aws:iam::12345678900:role/k8sDev

An error occurred (NoSuchEntity) when calling the GetRole operation: The role with name k8sInteg cannot be found.
IAM Role k8sInteg created. IAM_ROLE_ARN=arn:aws:iam::12345678900:role/k8sInteg
```

::::

> In this example, the assume-role-policy allows the root account to assume the role. We are going to allow specific groups to also be able to assume those roles. Check the [official documentation](https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts-technical-overview.html) for more information.

Because the above roles are only used to authenticate within our Amazon EKS cluster, they don't need to have AWS permissions. We will only use them to allow some IAM groups to assume this role in order to have access to our EKS cluster.

Go to the AWS [IAM console](https://console.aws.amazon.com/iam/home#/roles/details/k8sAdmin?section=permissions) and view `k8sAdmin` IAM role. Notice that there are no IAM permissions attached to the IAM role.

![k8s Admin role](/static/images/iam/iam-role-rbac/k8sAdmin-role.png)

And also let's see trust policy of the IAM role that allows the root account to assume the role, which means
any IAM principal (user or role) can now assume the role.

![k8sAdmin-trust-policy](/static/images/iam/iam-role-rbac/k8sAdmin-trust-policy.png)

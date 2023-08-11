---
title : "Prepare Secret and IAM Access Controls"
weight : 26
---

### **Set Variables**

Lets verify if AWS_REGION variable is set.

```bash
test -n "$AWS_REGION" && echo AWS_REGION is "$AWS_REGION" || echo AWS_REGION is not set

```

If AWS_REGION is not set, follow the [Cloud9 setup steps](https://catalog.workshops.aws/eks-security-immersionday/en-US/1-create-workspace-environment/awsevent/setup-cloud9#d.-confirm-amazon-eks-setup).


Lets verify if EKS_CLUSTER variable is set

```bash
test -n "$EKS_CLUSTER" && echo EKS_CLUSTER is "$EKS_CLUSTER" || echo EKS_CLUSTER is not set
```

::::expand{header="If EKS_CLUSTER is not set,"}
```bash
export EKS_CLUSTER="eksworkshop-eksctl"
```
::::

### **Create Secret in AWS Secret Manager**

We will create a secret in AWS Secret Manager that we can use for rest of this lab module.

```bash
aws --region "$AWS_REGION" secretsmanager \
  create-secret --name dbsecret_eksid \
  --secret-string '{"username":"testdb_user", "password":"super-sekret"}'
```

In Next step, We will store the newly created secret's ARN as environment variable.

```bash
SECRET_ARN=$(aws --region "$AWS_REGION" secretsmanager \
    describe-secret --secret-id  dbsecret_eksid \
    --query 'ARN' | sed -e 's/"//g' )

echo $SECRET_ARN
```

### **Create an IAM Policy**

We will create an IAM Policy that will provide permissions to access the secret when attached to [IAM principal](https://docs.aws.amazon.com/IAM/latest/UserGuide/intro-structure.html#intro-structure-principal).

```bash
IAM_POLICY_NAME_SECRET="dbsecret_eksid_secrets_policy_$RANDOM"
IAM_POLICY_ARN_SECRET=$(aws --region "$AWS_REGION" iam \
	create-policy --query Policy.Arn \
    --output text --policy-name $IAM_POLICY_NAME_SECRET \
    --policy-document '{
    "Version": "2012-10-17",
    "Statement": [ {
        "Effect": "Allow",
        "Action": ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"],
        "Resource": ["'"$SECRET_ARN"'" ]
    } ]
}')

echo $IAM_POLICY_ARN_SECRET | tee -a 00_iam_policy_arn_dbsecret
```

## **Create an IAM OIDC identity provider**

Determine whether you have an existing IAM OIDC provider for your cluster. Lets retrieve your cluster's OIDC provider ID and store it in a variable

```bash
oidc_id=$(aws eks describe-cluster --name $EKS_CLUSTER --query "cluster.identity.oidc.issuer" --output text | cut -d '/' -f 5)

aws iam list-open-id-connect-providers | grep $oidc_id | cut -d "/" -f4
```

If output is returned, then you already have an IAM OIDC provider for your cluster and you can skip the next step. If no output is returned, then you must create an IAM OIDC provider for your cluster with following step.

```bash
eksctl utils associate-iam-oidc-provider --cluster $EKS_CLUSTER --approve

```

## **Configure Kubernetes Service Account to assume IAM Role**

We will now configure a Kubernetes service account to assume an AWS Identity and Access Management (IAM) role. Any Pods that are configured to use the service account can then access any AWS service that the role has permissions to access.

Create an IAM role and associate it with a Kubernetes service account.

```bash
eksctl create iamserviceaccount \
    --region="$AWS_REGION" --name "nginx-deployment-sa"  \
    --role-name nginx-deployment-sa-role --cluster "$EKS_CLUSTER" \
    --attach-policy-arn "$IAM_POLICY_ARN_SECRET" --approve \
    --override-existing-serviceaccounts
```

## **Confirm that the role and service account are configured correctly** 

Confirm that the IAM role's trust policy is configured correctly.

```bash
export ROLE_NAME="nginx-deployment-sa-role"
aws iam get-role --role-name $ROLE_NAME --query Role.AssumeRolePolicyDocument
```

::::expand{header="Sample output: }
```text
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Federated": "arn:aws:iam::111122223333:oidc-provider/oidc.eks.us-west-2.amazonaws.com/id/E3A4622FDFC68EA2CF6AE462D1927734"
            },
            "Action": "sts:AssumeRoleWithWebIdentity",
            "Condition": {
                "StringEquals": {
                    "oidc.eks.us-west-2.amazonaws.com/id/E3A4622FDFC68EA2CF6AE462D1927734:aud": "sts.amazonaws.com",
                    "oidc.eks.us-west-2.amazonaws.com/id/E3A4622FDFC68EA2CF6AE462D1927734:sub": "system:serviceaccount:default:nginx-deployment-sa"
                }
            }
        }
    ]
}
```
::::

Confirm that the policy that you attached to your role in a previous step is attached to the role.

```bash
aws iam list-attached-role-policies --role-name $ROLE_NAME --query AttachedPolicies[].PolicyArn --output text
```

::::expand{header="Sample output: }
```text
arn:aws:iam::111122223333:policy/dbsecret_eksid_secrets_policy_10075
```
::::

Confirm that the Kubernetes service account is annotated with the role.
```bash
kubectl describe serviceaccount nginx-deployment-sa -n default

```

::::expand{header="Sample output: }
```text
Name:                nginx-deployment-sa
Namespace:           default
Labels:              app.kubernetes.io/managed-by=eksctl
Annotations:         eks.amazonaws.com/role-arn: arn:aws:iam::111122223333:role/nginx-deployment-sa-role
Image pull secrets:  <none>
Mountable secrets:   <none>
Tokens:              <none>
Events:              <none>
```
::::


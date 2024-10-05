---
title : "Enable EKS Pod Identity"
weight : 21
---


## Deploy a Sample App without EKS Pod Identity

Before we configure the EKS Pod Identity feature, let us first deploy a Sample App and test if can access list of S3 buckets or not.

### Create a App template file

Run below command to generate a App template file, which we will be using throughout this workshop module.

```bash
cat > ~/environment/app-template.yaml <<EOF
apiVersion: v1
kind: Namespace
metadata:
  name: \$NS
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: \$SA
  namespace: \$NS
--- 
apiVersion: v1
kind: Pod
metadata:
  name: \$APP
  namespace: \$NS
  labels:
     app: \$APP
spec:
  serviceAccountName: \$SA 
  containers:
    - name: \$APP
      image: amazon/aws-cli:latest
      command: ['sleep', '36000']
  restartPolicy: Never
EOF
```


### Deploy a Sample App 

Run below command to deploy a Sample App `app1` with a Kubernetes Service account `sa1` in Namspace `ns-a`.  

```bash
export APP=app1
export NS=ns-a
export SA=sa1
envsubst < ~/environment/app-template.yaml > ~/environment/$APP.yaml
kubectl  apply -f ~/environment/$APP.yaml
```

::::expand{header="Check Output"}
```bash
namespace/ns-a created
serviceaccount/sa1 created
pod/app1 created
```
::::

Check if the Pod is running fine.

```bash
kubectl -n $NS get pod
```

::::expand{header="Check Output"}
```bash
NAME   READY   STATUS    RESTARTS   AGE
app1   1/1     Running   0          2m29s
```
::::

Check if the Pod can access any S3 Buckets.


```bash
kubectl -n $NS exec -it $APP -- aws s3 ls
```

::::expand{header="Check Output"}
```bash
An error occurred (AccessDenied) when calling the ListBuckets operation: Access Denied
command terminated with exit code 254
```
::::

The `AccessDenied` error is expected since the Pod is not confugured with any IAM permissions to list S3 Buckets.


## Configure Amazon EKS Pod Identity

### Step1: Create an IAM Role

Create a trust policy and configure the principal to `pods.eks.amazonaws.com`

```bash
export IAM_ROLE="eks-pod-s3-read-access-role"
export IAM_ROLE_TRUST_POLICY="eks-pod-s3-read-access-trust-policy"
export IAM_POLICY="eks-pod-s3-read-access-policy"
export ROLE_DESCRIPTION="To allow Kubernetes Pods to allow readonly acces to S3"

cat > ~/environment/$IAM_ROLE_TRUST_POLICY.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "pods.eks.amazonaws.com"
            },
            "Action": [
                "sts:AssumeRole",
                "sts:TagSession"
            ]
        }
    ]
}
EOF
```

Using above trust policy, create the IAM role.

```bash
export IAM_ROLE_ARN=$(aws iam get-role --role-name $IAM_ROLE | jq -r '.Role.Arn')

if [ -z "$IAM_ROLE_ARN" ]
then
      IAM_ROLE_ARN=$(aws iam create-role \
        --role-name $IAM_ROLE \
        --description  "$ROLE_DESCRIPTION" \
        --assume-role-policy-document file://~/environment/$IAM_ROLE_TRUST_POLICY.json \
        --output text \
        --query 'Role.Arn')
      echo "IAM Role ${IAM_ROLE} created. IAM_ROLE_ARN=$IAM_ROLE_ARN"
  
else
      echo "IAM Role ${IAM_ROLE} already exist. IAM_ROLE_ARN=$IAM_ROLE_ARN"
fi
```

::::expand{header="Check Output"}

```bash
An error occurred (NoSuchEntity) when calling the GetRole operation: The role with name eks-pod-s3-read-access-role cannot be found.
IAM Role eks-pod-s3-read-access-role created. IAM_ROLE_ARN=arn:aws:iam::ACCOUNT_ID:role/eks-pod-s3-read-access-role
```
::::

Let us create a custom IAM Policy for S3 to list buckets and get Objects.

```bash
cat > ~/environment/$IAM_POLICY.json <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListAllMyBuckets"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:GetObjectTagging"
            ],
            "Resource": "*"
        }
    ]
}
EOF
```

Create the IAM Policy.

```bash
policyArn=$(aws iam create-policy --policy-name $IAM_POLICY  --policy-document file://~/environment/$IAM_POLICY.json --output text --query Policy.Arn)
echo "policyArn=$policyArn"
```
::::expand{header="Check Output"}
```bash
policyArn=arn:aws:iam::ACCOUNT_ID:policy/eks-pod-s3-read-access-policy
```
::::

Attache the policy to the IAM Role.

```bash
aws iam attach-role-policy \
  --role-name $IAM_ROLE \
  --policy-arn $policyArn
```

Go to IAM Console and view the IAM Role.

![iam_role_permissions](/static/images/iam/eks-pod-identity/iam_role_permissions.png)

Look at the trust policy.

![iam_role_trust](/static/images/iam/eks-pod-identity/iam_role_trust.png)

### Step2: Add Amazon EKS Pod Identity Agent add-on

```bash
export EKS_CLUSTER_NAME="eksworkshop-eksctl"
export EKS_POD_IDENTITY_ADDON_NAME="eks-pod-identity-agent"
aws eks create-addon --cluster-name $EKS_CLUSTER_NAME --addon-name $EKS_POD_IDENTITY_ADDON_NAME
```

::::expand{header="Check Output"}
```json
{
    "addon": {
        "addonName": "eks-pod-identity-agent",
        "clusterName": "eksworkshop-eksctl",
        "status": "CREATING",
        "addonVersion": "v1.0.0-eksbuild.1",
        "health": {
            "issues": []
        },
        "addonArn": "arn:aws:eks:us-west-2:ACCOUNT_ID:addon/eksworkshop-eksctl/eks-pod-identity-agent/3cc62ccc-4901-453e-3659-e23c441f1d1b",
        "createdAt": "2023-12-11T15:57:00.387000+00:00",
        "modifiedAt": "2023-12-11T15:57:00.402000+00:00",
        "tags": {}
    }
}
```
::::


Go to EKS Console and view the eks-pod-identity-agent under the **Add-on** tab.

![add-on](/static/images/iam/eks-pod-identity/add-on.png)


### Step3: Create Pod Identity association

Create the EKS Pod Identity association for the Service account `sa1` in Namespace `ns-a` for the IAM Role `eks-pod-s3-read-access-role`.

```bash
aws eks create-pod-identity-association \
  --cluster-name $EKS_CLUSTER_NAME \
  --namespace $NS \
  --service-account $SA \
  --role-arn $IAM_ROLE_ARN
```


::::expand{header="Check Output"}
```json
{
    "association": {
        "clusterName": "eksworkshop-eksctl",
        "namespace": "ns-a",
        "serviceAccount": "sa1",
        "roleArn": "arn:aws:iam::ACCOUNT_ID:role/eks-pod-s3-read-access-role",
        "associationArn": "arn:aws:eks:us-west-2:ACCOUNT_ID:podidentityassociation/eksworkshop-eksctl/a-fyvwurwka5tyvgnmd",
        "associationId": "a-fyvwurwka5tyvgnmd",
        "tags": {},
        "createdAt": "2023-12-11T17:34:29.617000+00:00",
        "modifiedAt": "2023-12-11T17:34:29.617000+00:00"
    }
}
```
::::


Go to EKS Console and view the Pod Identity associations under the **Access** tab.

![access](/static/images/iam/eks-pod-identity/access.png)

We can get the list of current EKS Pod Identity associations using below API.

```bash
aws eks list-pod-identity-associations --cluster-name $EKS_CLUSTER_NAME
```

::::expand{header="Check Output"}
```json
{
    "associations": [
        {
            "clusterName": "eksworkshop-eksctl",
            "namespace": "ns-a",
            "serviceAccount": "sa1",
            "associationArn": "arn:aws:eks:us-east-1:ACCOUNT_ID:podidentityassociation/eksworkshop-eksctl/a-1gdi6ws8nzackqyvg",
            "associationId": "a-1gdi6ws8nzackqyvg"
        }
    ]
}
```
::::

EKS also provides few more [commands](https://docs.aws.amazon.com/cli/latest/reference/eks/#cli-aws-eks) to manage the Pod Identity association such `delete-pod-identity-association`, `describe-pod-identity-association` and `update-pod-identity-association`.  You can use the `update-pod-identity-association` to update the IAM Role anytime. 

The namespace and service account cannot be edited. To change them, delete the association and create a new association.
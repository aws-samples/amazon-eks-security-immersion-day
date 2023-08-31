---
title : "Create deployment role for EKS"
weight : 22
---

In an AWS CodePipeline, we are going to use AWS CodeBuild to deploy a sample Kubernetes service. This requires an AWS Identity and Access Management (IAM) role capable of interacting with the EKS cluster.

In this step, we are going to create an IAM role and add an inline policy that we will use in the CodeBuild stage to interact with the EKS cluster via kubectl.

Create the role:



Set below environment variables
```bash
export ACCOUNT_ID=$(aws sts get-caller-identity --output text --query Account)
export AWS_REGION=$(curl -s 169.254.169.254/latest/dynamic/instance-identity/document | jq -r '.region')
```


Create the roles:

```bash
cd ~/environment

TRUST="{ \"Version\": \"2012-10-17\", \"Statement\": [ { \"Effect\": \"Allow\", \"Principal\": { \"AWS\": \"arn:aws:iam::${ACCOUNT_ID}:root\" }, \"Action\": \"sts:AssumeRole\" } ] }"

echo '{ "Version": "2012-10-17", "Statement": [ { "Effect": "Allow", "Action": "eks:Describe*", "Resource": "*" } ] }' > /tmp/iam-role-policy

aws iam create-role --role-name EksWorkshopCodeBuildKubectlRole --assume-role-policy-document "$TRUST" --output text --query 'Role.Arn'

aws iam put-role-policy --role-name EksWorkshopCodeBuildKubectlRole --policy-name eks-describe --policy-document file:///tmp/iam-role-policy

```

Now that we have the IAM role created, we are going to add the role to the aws-auth ConfigMap for the EKS cluster.

Once the ConfigMap includes this new role, kubectl in the CodeBuild stage of the pipeline will be able to interact with the EKS cluster via the IAM role.



```bash
ROLE="    - rolearn: arn:aws:iam::${ACCOUNT_ID}:role/EksWorkshopCodeBuildKubectlRole\n      username: build\n      groups:\n        - system:masters"

kubectl get -n kube-system configmap/aws-auth -o yaml | awk "/mapRoles: \|/{print;print \"$ROLE\";next}1" > /tmp/aws-auth-patch.yml

kubectl patch configmap/aws-auth -n kube-system --patch "$(cat /tmp/aws-auth-patch.yml)"

```














For codepipeline to deploy in our EKS clusters, Lets create a IAM role and add it to aws-auth-config


We are going to create 1 roles:

-   a **k8sDeploy** role which will have **admin** rights in our Amazon EKS cluster

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
  --role-name k8sDeploy \
  --description "Kubernetes administrator role (for AWS IAM Authenticator for Kubernetes)." \
  --assume-role-policy-document "$POLICY" \
  --output text \
  --query 'Role.Arn'

```

::::expand{header="Check Output"}
```bash
arn:aws:iam::XXXXXXXXXXX:role/k8sDeploy

```
::::

Let's create Kubernetes RBAC objects


#### Create kubernetes namespaces

-   **development** namespace will be accessible for IAM users from **k8sDev** group

```bash
kubectl create namespace integration
kubectl create namespace development
```

::::expand{header="Expand for Output"}
```bash
namespace/integration created
namespace/development created
```
::::



#### Configuring access to development namespace

We create a kubernetes `role` and `rolebinding` in the development namespace giving full access to the kubernetes user **dev-user**

```bash
cat << EOF | kubectl apply -f - -n development
kind: Role
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: dev-role
rules:
  - apiGroups:
      - ""
      - "apps"
      - "batch"
      - "extensions"
    resources:
      - "configmaps"
      - "cronjobs"
      - "deployments"
      - "events"
      - "ingresses"
      - "jobs"
      - "pods"
      - "pods/attach"
      - "pods/exec"
      - "pods/log"
      - "pods/portforward"
      - "secrets"
      - "services"
    verbs:
      - "create"
      - "delete"
      - "describe"
      - "get"
      - "list"
      - "patch"
      - "update"
---
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: dev-role-binding
subjects:
- kind: User
  name: dev-user
roleRef:
  kind: Role
  name: dev-role
  apiGroup: rbac.authorization.k8s.io
EOF
```
::::expand{header="Expand for Output"}
```bash
role.rbac.authorization.k8s.io/dev-role created
rolebinding.rbac.authorization.k8s.io/dev-role-binding created
```
::::


The role we define will give full access to everything in that namespace. It is a Role, and not a ClusterRole, so it is going to be applied only in the **development** namespace.

#### Configuring access to integration namespace

We create a kubernetes `role` and `rolebinding` in the integration namespace for full access with the kubernetes user **integ-user**

```bash
cat << EOF | kubectl apply -f - -n integration
kind: Role
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: integ-role
rules:
  - apiGroups:
      - ""
      - "apps"
      - "batch"
      - "extensions"
    resources:
      - "configmaps"
      - "cronjobs"
      - "deployments"
      - "events"
      - "ingresses"
      - "jobs"
      - "pods"
      - "pods/attach"
      - "pods/exec"
      - "pods/log"
      - "pods/portforward"
      - "secrets"
      - "services"
    verbs:
      - "create"
      - "delete"
      - "describe"
      - "get"
      - "list"
      - "patch"
      - "update"
---
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: integ-role-binding
subjects:
- kind: User
  name: integ-user
roleRef:
  kind: Role
  name: integ-role
  apiGroup: rbac.authorization.k8s.io
EOF
```

::::expand{header="Expand for Output"}
```bash
role.rbac.authorization.k8s.io/integ-role created
rolebinding.rbac.authorization.k8s.io/integ-role-binding created
```
::::

The role we define will give full access to everything in that namespace. It is a `Role`, and not a `ClusterRole`, so it is going to be applied only in the **integration** namespace.







> In this example, the assume-role-policy allows the root account to assume the role. We are going to allow specific groups to also be able to assume those roles. Check the [official documentation](https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts-technical-overview.html)  for more information.


1. Set below environment variables
```bash
export ACCOUNT_ID=$(aws sts get-caller-identity --output text --query Account)
export AWS_REGION=$(curl -s 169.254.169.254/latest/dynamic/instance-identity/document | jq -r '.region')
```
2.  Clone the  application from codecommit repository.
```bash
cd ~/environment
git clone https://git-codecommit.eu-west-2.amazonaws.com/v1/repos/ContainerComponentsRepo
cd ~/environment/ContainerComponentsRepo
```
3. Open the "Dockerfile" and change  Docker file with the following content

```bash
cat > Dockerfile <<EOF
FROM public.ecr.aws/amazonlinux/amazonlinux:latest
```

4. Save the file by using "CTRL+O",Choose "Y" and "CTRL+X"

5. Push the file back to remote Code commit repository with following commands
```bash
git add .
git commit -m "modified docker image in Dockerfile"
git push
```


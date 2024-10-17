---
title : "Configuring authorization using RBAC"
weight : 44
---

Excellent, we've now integrated our Cognito User Pool as the OIDC identity provider for the Amazon EKS cluster. The next step is to set up the necessary authorization to allow users to access resources within the cluster.

Before we test the authentication flow, we need to create a Kubernetes RBAC Cluster Role and ClusterRoleBinding. This will ensure that once users authenticate successfully, they'll have the appropriate permissions to interact with the resources they need.

:::code{language=bash showLineNumbers=false showCopyAction=true}
aws eks update-kubeconfig --name $CLUSTER_NAME
kubectl get svc
::::


::::expand{header="Check Output"}
:::code{language=t4-templating showLineNumbers=false showCopyAction=false}
NAME         TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE
kubernetes   ClusterIP   10.100.0.1   <none>        443/TCP   21d
::::

Let's start by creating a Cluster Role that will allow read-only access to Secrets within the cluster. We'll call this role secret-readers.

:::code{language=yml showLineNumbers=false showCopyAction=true}
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: secret-readers
rules:
- apiGroups:
  - ""
  resources:
  - secrets
  verbs:
  - 'get'
  - 'watch'
  - 'list'
EOF
:::

:::code{language=bash showLineNumbers=false showCopyAction=true}
kubectl create -f clusterrole-read-secrets.yaml
:::

Great, now we can bind this Cluster Role to a group called secret-readers in our OIDC identity provider. This will grant users who are members of the secret-reader group the ability to read Secrets, but they won't be able to access any other Kubernetes resources.


:::code{language=yml showLineNumbers=false showCopyAction=true}
kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: secret-readers-role-binding
  namespace: default
subjects:
- kind: Group
  name: "gid:secret-reader"
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: secret-readers
  apiGroup: rbac.authorization.k8s.io
EOF
:::

Create a file `clusterrolebinding-read-secrets.yaml` with the above text and save it in a local directory. Add the ClusterRoleBinding to the cluster using the command below.

:::code{language=bash showLineNumbers=false showCopyAction=true}
kubectl create -f clusterrolebinding-read-secrets.yaml
:::

we've now set up the necessary RBAC permissions to allow users in the secret-readers group to access Secrets within the EKS cluster.

The final step is to update your local ~/.kube/config file so you can access the cluster through kubectl. This will involve configuring the OIDC authenticator settings using the ID token and refresh token from our Cognito User Pool.
:::code{language=bash showLineNumbers=false showCopyAction=true}
output=$(aws cognito-idp admin-initiate-auth --auth-flow ADMIN_USER_PASSWORD_AUTH --client-id $CLIENT_ID --auth-parameters USERNAME=test1@example.com,PASSWORD=Blah123$ --user-pool-id $POOL_ID --output json)
REFRESH_TOKEN=$(echo $output | jq -r '.AuthenticationResult.RefreshToken')
ID_TOKEN=$(echo $output | jq -r '.AuthenticationResult.IdToken')
:::


Now we can use those values to update the ~/.kube/config file with the necessary OIDC authenticator settings:

:::code{language=bash showLineNumbers=false showCopyAction=true}
kubectl config set-credentials cognito-user \
--auth-provider=oidc \
--auth-provider-arg=idp-issuer-url=$ISSUER_URL \
--auth-provider-arg=client-id=$CLIENT_ID \
--auth-provider-arg=refresh-token=$REFRESH_TOKEN \
--auth-provider-arg=id-token=$ID_TOKEN
:::

we've retrieved the necessary ID token and refresh token from Cognito, and updated the ~/.kube/config file with the OIDC authenticator settings.

The next step is to add some context to your kubeconfig to relate this user to the specific EKS cluster we're working with. We'll create a new context called oidc-secret-reader that associates the "cognito-user" with the EKS cluster

:::code{language=bash showLineNumbers=false showCopyAction=true}
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query "Account" --output text)
AWS_REGION=$(aws configure get region)
kubectl config set-context oidc-secret-reader --cluster arn:aws:eks:$AWS_REGION:$AWS_ACCOUNT_ID:cluster/$CLUSTER_NAME --user cognito-user
kubectl config use-context oidc-secret-reader
:::

Now let's switch to this new context so we're operating within the proper permissions scope:

:::code{language=bash showLineNumbers=false showCopyAction=true}
kubectl config use-context oidc-secret-reader
:::

::::expand{header="Check Output"}
Switched to context "oidc-secret-reader".
::::

The user we configured in Cognito is now associated with the secret-readers group, which has read-only access to Secrets within the EKS cluster.

Let's verify the user's access by trying to list the Secrets in the default namespace:

:::code{language=bash showLineNumbers=false showCopyAction=true}
kubectl get secrets
:::

::::expand{header="Check Output"}
::code{language=t4-templating showLineNumbers=false showCopyAction=true}
kubectl get secrets
NAME                  TYPE                                  DATA   AGE
azure-eks-secret      kubernetes.io/service-account-token   3      19d
deploy-robot-secret   kubernetes.io/service-account-token   3      19d
::
::::
Let's verify the user's access by trying to list the nodes in the default namespace which the user should not have access to:

:::code{language=bash showLineNumbers=false showCopyAction=true}
kubectl get nodes
:::

::::expand{header="Check Output"}
:::code{language=t4-templating showLineNumbers=false showCopyAction=true}
kubectl get nodes
Error from server (Forbidden): nodes is forbidden: User "test1@example.com" cannot list resource "nodes" in API group "" at the cluster scope
:::

::::



---
title: "Test Amazon EKS access"
weight: 27
---

## Automate assumerole with aws cli

It is possible to automate the retrieval of temporary credentials for the assumed role by configuring the AWS CLI in the files `~/.aws/config` and `~/.aws/credentials`. As an example, we will define three profiles.

#### Add in `~/.aws/config`:

```bash
mkdir -p ~/.aws

if ! test -f ~/.aws/config; then
touch ~/.aws/config
else
  echo "AWS Config file ~/.aws/config already exists..."
fi

cat << EoF >> ~/.aws/config

[profile admin]
role_arn=arn:aws:iam::${ACCOUNT_ID}:role/k8sAdmin
source_profile=eksAdmin

[profile dev]
role_arn=arn:aws:iam::${ACCOUNT_ID}:role/k8sDev
source_profile=eksDev

[profile integ]
role_arn=arn:aws:iam::${ACCOUNT_ID}:role/k8sInteg
source_profile=eksInteg

EoF
```

#### Add in `~/.aws/credentials`:

```bash
if ! test -f ~/.aws/credentials; then
cat << EoF >> ~/.aws/credentials

[eksAdmin]
aws_access_key_id=$(jq -r .AccessKey.AccessKeyId /tmp/PaulAdmin.json)
aws_secret_access_key=$(jq -r .AccessKey.SecretAccessKey /tmp/PaulAdmin.json)

[eksDev]
aws_access_key_id=$(jq -r .AccessKey.AccessKeyId /tmp/JeanDev.json)
aws_secret_access_key=$(jq -r .AccessKey.SecretAccessKey /tmp/JeanDev.json)

[eksInteg]
aws_access_key_id=$(jq -r .AccessKey.AccessKeyId /tmp/PierreInteg.json)
aws_secret_access_key=$(jq -r .AccessKey.SecretAccessKey /tmp/PierreInteg.json)

EoF
else
  echo "AWS Credentials file ~/.aws/credentials already exists..."
fi


```

#### Test this with the dev profile:

```bash
aws sts get-caller-identity --profile dev
```

The output looks like below.

```
{
    "UserId": "AROAUD5VMKW75WJEHFU4X:botocore-session-1581687024",
    "Account": "12345678900",
    "Arn": "arn:aws:sts::12345678900:assumed-role/k8sDev/botocore-session-1581687024"
}
```

The assumed-role is k8sDev, so we achieved our goal.

When specifying the **\--profile dev** parameter we automatically ask for temporary credentials for the role k8sDev. You can test this with **integ** and **admin** also.

```bash
aws sts get-caller-identity --profile admin
```

The output looks like below.

```
{
    "UserId": "AROAUD5VMKW77KXQAL7ZX:botocore-session-1582022121",
    "Account": "12345678900",
    "Arn": "arn:aws:sts::12345678900:assumed-role/k8sAdmin/botocore-session-1582022121"
}
```

> When specifying the **\--profile admin** parameter we automatically ask for temporary credentials for the role k8sAdmin


## Install `yq` tool


Run the following commands to install `yq` [tool](https://github.com/mikefarah/yq)

```bash
sudo wget https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64 -O /usr/bin/yq
sudo chmod +x /usr/bin/yq
```

## Using AWS profiles with the Kubectl config file

It is also possible to specify the AWS_PROFILE to use with the aws-iam-authenticator in the `~/.kube/config` file, so that it will use the appropriate profile.

### With dev profile

Create a new KUBECONFIG file to test this:

```bash
export KUBECONFIG=/tmp/kubeconfig-dev
eksctl utils write-kubeconfig -c eksworkshop-eksctl
cat $KUBECONFIG | yq e '.users.[].user.exec.args += ["--profile", "dev"]' - | sed 's/eksworkshop-eksctl./eksworkshop-eksctl-dev./g' > ${KUBECONFIG}.tmp && mv ${KUBECONFIG}.tmp $KUBECONFIG

```

::::expand{header="Check Output"}

```
2023-03-14 10:16:28 [✔]  saved kubeconfig as "/tmp/kubeconfig-dev"
```

::::

We added the `--profile dev` parameter to our kubectl config file, so that this will ask kubectl to use our IAM role associated to our dev profile, and we rename the context using suffix **\-dev**.

With this configuration we should be able to interact with the **development** namespace, because it has our RBAC role defined.

Let's create a pod:

```bash
kubectl run nginx-dev --image=nginx -n development
```

::::expand{header="Check Output"}

```
pod/nginx-dev created
```

::::

We can list the pods:

```bash
kubectl get pods -n development
```

The output looks like below

```
NAME                     READY   STATUS    RESTARTS   AGE
nginx-dev   1/1     Running   0          28s
```

... but not in other namespaces:

```bash
kubectl get pods -n integration
```

The output looks like below

```
Error from server (Forbidden): pods is forbidden: User "dev-user" cannot list resource "pods" in API group "" in the namespace "integration"
```

#### Test with integ profile

```bash
export KUBECONFIG=/tmp/kubeconfig-integ
eksctl utils write-kubeconfig -c eksworkshop-eksctl
cat $KUBECONFIG | yq e '.users.[].user.exec.args += ["--profile", "integ"]' - | sed 's/eksworkshop-eksctl./eksworkshop-eksctl-integ./g' > ${KUBECONFIG}.tmp && mv ${KUBECONFIG}.tmp $KUBECONFIG

```

::::expand{header="Check Output"}

```
2023-03-14 10:24:31 [✔]  saved kubeconfig as "/tmp/kubeconfig-integ"
```

::::

Let's create a pod:

```bash
kubectl run nginx-integ --image=nginx -n integration
```

::::expand{header="Check Output"}

```
pod/nginx-integ created
```

::::

We can list the pods:

```bash
kubectl get pods -n integration
```

```
NAME          READY   STATUS    RESTARTS   AGE
nginx-integ   1/1     Running   0          43s
```

... but not in other namespaces:

```bash
kubectl get pods -n development
```

```
Error from server (Forbidden): pods is forbidden: User "integ-user" cannot list resource "pods" in API group "" in the namespace "development"
```

#### Test with admin profile

```bash
export KUBECONFIG=/tmp/kubeconfig-admin
eksctl utils write-kubeconfig -c eksworkshop-eksctl
cat $KUBECONFIG | yq e '.users.[].user.exec.args += ["--profile", "admin"]' - | sed 's/eksworkshop-eksctl./eksworkshop-eksctl-admin./g' > ${KUBECONFIG}.tmp && mv ${KUBECONFIG}.tmp $KUBECONFIG

```

::::expand{header="Check Output"}

```
2023-03-14 10:30:52 [✔]  saved kubeconfig as "/tmp/kubeconfig-admin"
```

::::

Let's create a pod in the default namespace:

```bash
kubectl run nginx-admin --image=nginx
```

::::expand{header="Check Output"}

```
pod/nginx-admin created
```

::::

We can list the pods:

```bash
kubectl get pods
```

We can list the pods:

```
NAME          READY   STATUS    RESTARTS   AGE
nginx-admin   1/1     Running   0          2m21s
```

We can list ALL pods in all namespaces:

```bash
kubectl get pods -A
```

The output looks like below.

```
NAMESPACE     NAME                       READY   STATUS    RESTARTS   AGE
default       nginx-admin                1/1     Running   0          15s
development   nginx-dev                  1/1     Running   0          11m
integration   nginx-integ                1/1     Running   0          4m29s
kube-system   aws-node-mzbh4             1/1     Running   0          100m
kube-system   aws-node-p7nj7             1/1     Running   0          100m
kube-system   aws-node-v2kg9             1/1     Running   0          100m
kube-system   coredns-85bb8bb6bc-2qbx6   1/1     Running   0          105m
kube-system   coredns-85bb8bb6bc-87ndr   1/1     Running   0          105m
kube-system   kube-proxy-4n5lc           1/1     Running   0          100m
kube-system   kube-proxy-b65xm           1/1     Running   0          100m
kube-system   kube-proxy-pr7k7           1/1     Running   0          100m
```

## Conclusion

In this module, we have seen how to configure Amazon EKS to provide finer access to users combining IAM Groups and Kubernetes RBAC. You can create different groups depending on your needs, configure their associated RBAC access in your cluster, and simply add or remove users from the group to grant or revoke access to your cluster.

Users will only have to configure their AWS CLI in order to automatically retrieve their associated rights in your cluster.

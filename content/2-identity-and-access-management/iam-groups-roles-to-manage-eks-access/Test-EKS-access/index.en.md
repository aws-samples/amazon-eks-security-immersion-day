---
title : "Test EKS access"
weight : 27
---


## Automate assumerole with aws cli


It is possible to automate the retrieval of temporary credentials for the assumed role by configuring the AWS CLI in the files `~/.aws/config` and `~/.aws/credentials`. As an example, we will define three profiles.

#### Add in `~/.aws/config`:

```bash
mkdir -p ~/.aws

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
```

#### Test this with the dev profile:

```bash
aws sts get-caller-identity --profile dev
```

The output looks like below.

```json
{
    "UserId": "AROAUD5VMKW75WJEHFU4X:botocore-session-1581687024",
    "Account": "xxxxxxxxxx",
    "Arn": "arn:aws:sts::xxxxxxxxxx:assumed-role/k8sDev/botocore-session-1581687024"
}
```

The assumed-role is k8sDev, so we achieved our goal.

When specifying the **\--profile dev** parameter we automatically ask for temporary credentials for the role k8sDev. You can test this with **integ** and **admin** also.

```bash
aws sts get-caller-identity --profile admin
```

The output looks like below.

```bash
{
    "UserId": "AROAUD5VMKW77KXQAL7ZX:botocore-session-1582022121",
    "Account": "xxxxxxxxxx",
    "Arn": "arn:aws:sts::xxxxxxxxxx:assumed-role/k8sAdmin/botocore-session-1582022121"
}
```

> When specifying the **\--profile admin** parameter we automatically ask for temporary credentials for the role k8sAdmin

## Using AWS profiles with the Kubectl config file

It is also possible to specify the AWS\_PROFILE to use with the aws-iam-authenticator in the `~/.kube/config` file, so that it will use the appropriate profile.


### With dev profile

Create a new KUBECONFIG file to test this:

```bash
export KUBECONFIG=/tmp/kubeconfig-dev && eksctl utils write-kubeconfig -c eksworkshop-eksctl
cat $KUBECONFIG | yq e '.users.[].user.exec.args += ["--profile", "dev"]' - -- | sed 's/eksworkshop-eksctl./eksworkshop-eksctl-dev./g' | sponge $KUBECONFIG
```

::::expand{header="Check Output"}
```bash

2023-03-14 10:16:28 [✔]  saved kubeconfig as "/tmp/kubeconfig-dev"

Unable to find image 'mikefarah/yq:latest' locally
latest: Pulling from mikefarah/yq
63b65145d645: Pulling fs layer
865242c25e72: Pulling fs layer
48f2cb577b3c: Pulling fs layer
6b38082b4af1: Pulling fs layer
0a8c5b7f3b42: Pulling fs layer
6b38082b4af1: Waiting
0a8c5b7f3b42: Waiting
48f2cb577b3c: Verifying Checksum
48f2cb577b3c: Download complete
63b65145d645: Verifying Checksum
63b65145d645: Download complete
865242c25e72: Verifying Checksum
865242c25e72: Download complete
63b65145d645: Pull complete
6b38082b4af1: Verifying Checksum
6b38082b4af1: Download complete
0a8c5b7f3b42: Verifying Checksum
0a8c5b7f3b42: Download complete
865242c25e72: Pull complete
48f2cb577b3c: Pull complete
6b38082b4af1: Pull complete
0a8c5b7f3b42: Pull complete
Digest: sha256:29ebb32f7d89a6b8e102a9cf1fb1c073d7154c17e5eda8a584f60f036b11f655
Status: Downloaded newer image for mikefarah/yq:latest
```
::::


> Note: this assume you uses yq >= version 4. you can reference to [this page](https://mikefarah.gitbook.io/yq/upgrading-from-v3)  to adapt this command for another version.

We added the `--profile dev` parameter to our kubectl config file, so that this will ask kubectl to use our IAM role associated to our dev profile, and we rename the context using suffix **\-dev**.

With this configuration we should be able to interact with the **development** namespace, because it has our RBAC role defined.

Let's create a pod:

```bash
kubectl run nginx-dev --image=nginx -n development
```

::::expand{header="Check Output"}
```bash
pod/nginx-dev created
```
::::

We can list the pods:

```bash
kubectl get pods -n development
```

The output looks like below

```bash
NAME                     READY   STATUS    RESTARTS   AGE
nginx-dev   1/1     Running   0          28s
```

... but not in other namespaces:

```bash
kubectl get pods -n integration
```
The output looks like below

```bash
Error from server (Forbidden): pods is forbidden: User "dev-user" cannot list resource "pods" in API group "" in the namespace "integration"
```
#### Test with integ profile

```bash
export KUBECONFIG=/tmp/kubeconfig-integ && eksctl utils write-kubeconfig -c eksworkshop-eksctl
cat $KUBECONFIG | yq e '.users.[].user.exec.args += ["--profile", "integ"]' - -- | sed 's/eksworkshop-eksctl./eksworkshop-eksctl-integ./g' | sponge $KUBECONFIG
```

::::expand{header="Check Output"}
```bash
2023-03-14 10:24:31 [✔]  saved kubeconfig as "/tmp/kubeconfig-integ"
```
::::

> Note: this assume you uses yq >= version 4. you can reference to [this page](https://mikefarah.gitbook.io/yq/upgrading-from-v3)  to adapt this command for another version.

Let's create a pod:

```bash
kubectl run nginx-integ --image=nginx -n integration
```

::::expand{header="Check Output"}
```bash
pod/nginx-integ created
```
::::

We can list the pods:

```bash
kubectl get pods -n integration
```

```bsh
NAME          READY   STATUS    RESTARTS   AGE
nginx-integ   1/1     Running   0          43s
```

... but not in other namespaces:

```bash
kubectl get pods -n development
```

```bash
Error from server (Forbidden): pods is forbidden: User "integ-user" cannot list resource "pods" in API group "" in the namespace "development"
```

#### Test with admin profile

```bash
export KUBECONFIG=/tmp/kubeconfig-admin && eksctl utils write-kubeconfig -c eksworkshop-eksctl
cat $KUBECONFIG | yq e '.users.[].user.exec.args += ["--profile", "admin"]' - -- | sed 's/eksworkshop-eksctl./eksworkshop-eksctl-admin./g' | sponge $KUBECONFIG
```


::::expand{header="Check Output"}
```bash
2023-03-14 10:30:52 [✔]  saved kubeconfig as "/tmp/kubeconfig-admin"
```
::::


> Note: this assume you uses yq >= version 4. you can reference to [this page](https://mikefarah.gitbook.io/yq/upgrading-from-v3)  to adapt this command for another version.

Let's create a pod in the default namespace:

```bash
kubectl run nginx-admin --image=nginx
```

::::expand{header="Check Output"}
```bash
pod/nginx-admin created
```
::::

We can list the pods:

```bash
kubectl get pods
```

We can list the pods:

```bash
NAME          READY   STATUS    RESTARTS   AGE
nginx-admin   1/1     Running   0          2m21s
```

We can list ALL pods in all namespaces:

```bash
kubectl get pods -A
```
The output looks like below.

```bash
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

In this module, we have seen how to configure EKS to provide finer access to users combining IAM Groups and Kubernetes RBAC. You can create different groups depending on your needs, configure their associated RBAC access in your cluster, and simply add or remove users from the group to grant or revoke access to your cluster.

Users will only have to configure their AWS CLI in order to automatically retrieve their associated rights in your cluster.

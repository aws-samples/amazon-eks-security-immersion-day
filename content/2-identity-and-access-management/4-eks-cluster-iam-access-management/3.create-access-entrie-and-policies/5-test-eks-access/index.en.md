---
title : "Test Amazon EKS access"
weight : 26
---


## Install kubectl whoami plugin

Before we start testing access to EKS cluster with using different IAM Roles, let us install this useful plugin to see who is authenticating to the EKS cluster.

```bash
cd ~/environment
wget https://github.com/rajatjindal/kubectl-whoami/releases/download/v0.0.46/kubectl-whoami_v0.0.46_linux_amd64.tar.gz
tar xvf kubectl-whoami_v0.0.46_linux_amd64.tar.gz
chmod +x kubectl-whoami
sudo cp kubectl-whoami /usr/local/bin/
```

Run the command to see who is currently authenticating to EKS cluster.

```bash
kubectl whomai  
```

::::expand{header="Check Output"}
```bash
arn:aws:sts::ACCOUNT_ID:assumed-role/eksworkshop-admin/i-0d45e819f38a652ea
```
::::

As expected we are currently using the IAM Role `eksworkshop-admin` which is used to create the EKS cluster.


## Automate Assume Role with AWS CLI


It is possible to automate the retrieval of temporary credentials for the assumed role by configuring the AWS CLI in the files `~/.aws/config` and `~/.aws/credentials`. As an example, we will define three profiles.

#### Add in `~/.aws/config`:

```bash
mkdir -p ~/.aws

if ! test -f ~/.aws/config; then
cat << EoF >> ~/.aws/config
[profile admin]
role_arn=arn:aws:iam::${ACCOUNT_ID}:role/k8sClusterAdmin
source_profile=eksAdmin

[profile dev]
role_arn=arn:aws:iam::${ACCOUNT_ID}:role/k8sTeamADev
source_profile=eksDev

[profile test]
role_arn=arn:aws:iam::${ACCOUNT_ID}:role/k8sTeamATest
source_profile=eksTest

EoF
else
  echo "AWS Config file ~/.aws/config already exists..."
fi
```

#### Add in `~/.aws/credentials`:

```bash
if ! test -f ~/.aws/credentials; then
cat << EoF >> ~/.aws/credentials

[eksAdmin]
aws_access_key_id=$(jq -r .AccessKey.AccessKeyId /tmp/User1Admin.json)
aws_secret_access_key=$(jq -r .AccessKey.SecretAccessKey /tmp/User1Admin.json)

[eksDev]
aws_access_key_id=$(jq -r .AccessKey.AccessKeyId /tmp/User1TeamADev.json)
aws_secret_access_key=$(jq -r .AccessKey.SecretAccessKey /tmp/User1TeamADev.json)

[eksTest]
aws_access_key_id=$(jq -r .AccessKey.AccessKeyId /tmp/User1TeamATest.json)
aws_secret_access_key=$(jq -r .AccessKey.SecretAccessKey /tmp/User1TeamATest.json)

EoF
else
  echo "AWS Credentials file ~/.aws/credentials already exists..."
fi


```

#### Test AWS Identity this with admin and dev profiles:

```bash
aws sts get-caller-identity --profile admin
```

The output looks like below.

```json
{
    "UserId": "AROAQAHCJ2QPK2HMSDOCN:botocore-session-1703471700",
    "Account": "ACCOUNT_ID",
    "Arn": "arn:aws:sts::ACCOUNT_ID:assumed-role/k8sClusterAdmin/botocore-session-1703471700"
}
```

The assumed-role is `k8sClusterAdmin`, so we achieved our goal.

When specifying the **\--profile admin** parameter we automatically ask for temporary credentials for the role k8sClusterAdmin. You can test this with **dev** and **test** also.

```bash
aws sts get-caller-identity --profile dev
```

The output looks like below.

```bash
{
    "UserId": "AROAQAHCJ2QPJXZGQTPAF:botocore-session-1703475768",
    "Account": "ACCOUNT_ID",
    "Arn": "arn:aws:sts::ACCOUNT_ID:assumed-role/k8sTeamADev/botocore-session-1703475768"
}
```

> When specifying the **\--profile dev** parameter we automatically ask for temporary credentials for the role k8sTeamADev

## Using AWS profiles with the Kubectl config file

It is also possible to specify the AWS\_PROFILE to use with the aws-iam-authenticator in the `~/.kube/config` file, so that it will use the appropriate profile.

### With admin profile

Create a new KUBECONFIG file to test this:

```bash
export KUBECONFIG=/tmp/kubeconfig-admin && eksctl utils write-kubeconfig -c eksworkshop-eksctl
cat $KUBECONFIG | yq e '.users.[].user.exec.args += ["--profile", "admin"]' - -- | sed 's/eksworkshop-eksctl./eksworkshop-eksctl-admin./g' | sponge $KUBECONFIG
```

::::expand{header="Check Output"}
```bash

```
::::


> Note: this assume you uses yq >= version 4. you can reference to [this page](https://mikefarah.gitbook.io/yq/upgrading-from-v3)  to adapt this command for another version.

We added the `--profile admin` parameter to our kubectl config file, so that this will ask kubectl to use our IAM role associated to our admin profile, and we rename the context using suffix **\-admin**.

Let us look at the kubeconfig file created and see how we are using profile `admin` to get token and then authenticating to the cluster.

```bash
cat $KUBECONFIG
```

::::expand{header="Check Output"}
```yaml
apiVersion: v1
clusters:
  - cluster:
      certificate-authority-data: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURCVENDQWUyZ0F3SUJBZ0lJZkxOUEdmZHMyMkF3RFFZSktvWklodmNOQVFFTEJRQXdGVEVUTUJFR0ExVUUKQXhNS2EzVmlaWEp1WlhSbGN6QWVGdzB5TXpFeU1qRXdOalEzTWpWYUZ3MHpNekV5TVRnd05qVXlNalZhTUJVeApFekFSQmdOVkJBTVRDbXQxWW1WeWJtVjBaWE13Z2dFaU1BMEdDU3FHU0liM0RRRUJBUVVBQTRJQkR3QXdnZ0VLCkFvSUJBUURnSHpEVmEzVDBLanJzYmcyWE5qZnhUZG9wSXN1QlVEM0VXTTJCNjR4VUZ0cUpXTDZaOE04VUxjZzcKWVpJZS9vQVR3Q0tocU5UdlNqSXpJUWNjek05UVFhM0c5YzRHWEk4eGNWZ0JUUlB4eExHdTNRT3FvTTJHSDRWVgovQzc1UmxVUGtjbTJZd2ZieTVuWS80aVZ4ZytBME5LRTczYTF0MHBYSUZ6ZlViMmJIaGNMVWxjWE9mQUpQVWRjCkNaZDNSMmRaRnFrUFJ6eCtYbUs1NkVzblZKekh0OEUrRjdIb1ZnM2p3YVNKanRseFhLOTBxODZtaHBnK0I0Y2EKaVJ1RmdSbTBzQUlYYjVEMDc5RUZPRjl6ZzBuc0RsU0owcGE1cTZ1MmdMaVUyOE9OZEk0MDQzOFJXKzZjWEMrawpGVjdYcWtsamxzZ0xJVFkweHFOeWlMWUdZbWhOQWdNQkFBR2pXVEJYTUE0R0ExVWREd0VCL3dRRUF3SUNwREFQCkJnTlZIUk1CQWY4RUJUQURBUUgvTUIwR0ExVWREZ1FXQkJTazM5TGM2RXBOVnAzMDNvclMxblIzcUZick5UQVYKQmdOVkhSRUVEakFNZ2dwcmRXSmxjbTVsZEdWek1BMEdDU3FHU0liM0RRRUJDd1VBQTRJQkFRQkRiYmgvV0VWUQpIMEd1MUp5Z3pNODZHVTFNQ2MwcDFqK1ZOQXNsd2RCa2pnaXB4czYrRW9xNCtnK3ptVVMydGNmYmNKT2FHRW1qCm03OUdsakZOZHpnOTkvYmxscUtoUVRUYXdDQnRFdEpqRkpZTDRpdXYwdGlQTmZQV01ONHVmUmh6OWxhd0pWMlkKR1dEbmM0ankwWjNiaS9XbDkzbU1admRyWW54MHhFN0JFbE5oNjd2QnpGanZlaE1sSldmaHd5TURJYVEvVFhONApQRDhqQlU3dnBvU2xMS0oyL1owcVREayt5azRDeXVzQXQ1MWRHRGZmQmovWmFvbVBvSGp3RHg4bFRTWWxZeUZiCmtVY0g1RmJTUGFoQzR6VnhQaE5abG1nazVXOWFoRm14OTFOSnpqekxEVzdoZElxdEYzSUxTUTd4MU9CRGRjZlEKT3htS3Bvc0FiNU5ZCi0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K
      server: https://C7D065E5990AA2C6E0772CD22937F4FC.gr7.us-east-1.eks.amazonaws.com
    name: eksworkshop-eksctl-admin.us-east-1.eksctl.io
contexts:
  - context:
      cluster: eksworkshop-eksctl-admin.us-east-1.eksctl.io
      user: i-08b0a08412575c115@eksworkshop-eksctl-admin.us-east-1.eksctl.io
    name: i-08b0a08412575c115@eksworkshop-eksctl-admin.us-east-1.eksctl.io
current-context: i-08b0a08412575c115@eksworkshop-eksctl-admin.us-east-1.eksctl.io
kind: Config
preferences: {}
users:
  - name: i-08b0a08412575c115@eksworkshop-eksctl-admin.us-east-1.eksctl.io
    user:
      exec:
        apiVersion: client.authentication.k8s.io/v1beta1
        args:
          - eks
          - get-token
          - --output
          - json
          - --cluster-name
          - eksworkshop-eksctl
          - --region
          - us-east-1
          - --profile
          - admin
        command: aws
        env:
          - name: AWS_STS_REGIONAL_ENDPOINTS
            value: regional
        provideClusterInfo: false
```
::::

Run the command again to see who is now authenticating to the EKS cluster.

```bash
kubectl whoami
```

::::expand{header="Check Output"}
```bash
arn:aws:sts::ACCOUNT_ID:assumed-role/k8sClusterAdmin/botocore-session-1703478796
```
::::

This shows that we are now authenticating to the cluster using IAM Role `k8sClusterAdmin` using the profile `admin`

Since the IAM Principal `k8sClusterAdmin` is associated with access policy `AmazonEKSClusterAdminPolicy`, it has all the Kubernetes permissions on the cluster.

Let us run few kubectl commands.

```bash
kubectl get pod -A
kubectl get node
```

Let's create a Namespace `test` and create a pod in that namespace.

```bash
kubectl create ns team-a
kubectl run nginx-admin --image=nginx -n team-a
```

::::expand{header="Check Output"}
```bash
namespace/team-a created
pod/nginx-admin created
```
::::

We can list the pods:

```bash
kubectl get pods -n team-a
```

The output looks like below

```bash
NAME        READY   STATUS    RESTARTS   AGE
nginx-admin   1/1     Running   0          14s
```

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

We added the `--profile dev` parameter to our kubectl config file, so that this will ask kubectl to use our IAM role associated to our `dev` profile, and we rename the context using suffix **\-dev**.

Run the command again to see who is now authenticating to the EKS cluster.

```bash
kubectl whoami
```

::::expand{header="Check Output"}
```bash
arn:aws:sts::ACCOUNT_ID:assumed-role/k8sTeamADev/botocore-session-1703482786
```
::::

This shows that we are now authenticating to the cluster using IAM Role `k8sTeamADev` using the profile `dev`

Since the IAM Principal `k8sTeamADev` is associated with access policy `AmazonEKSAdminPolicy` for the Namespace `team-a`, it allows read/write access to most resources in a namespace, including the ability to create roles and role bindings within the namespace.

Let's create a pod:

```bash
kubectl run nginx-dev --image=nginx -n team-a
```

::::expand{header="Check Output"}
```bash
pod/nginx-dev created
```
::::

We can list the pods:

```bash
kubectl get pods -n team-a
```

The output looks like below

```bash
NAME          READY   STATUS    RESTARTS   AGE
nginx-admin   1/1     Running   0          5m54s
nginx-dev     1/1     Running   0          13s
```

... but not in other namespaces:

```bash
kubectl get pods -n default
```
The output looks like below

```bash
Error from server (Forbidden): pods is forbidden: User "arn:aws:sts::ACCOUNT_ID:assumed-role/k8sTeamADev/botocore-session-1703482786" cannot list resource "pods" in API group "" in the namespace "default"
```

#### Test with test profile

```bash
export KUBECONFIG=/tmp/kubeconfig-test && eksctl utils write-kubeconfig -c eksworkshop-eksctl
cat $KUBECONFIG | yq e '.users.[].user.exec.args += ["--profile", "test"]' - -- | sed 's/eksworkshop-eksctl./eksworkshop-eksctl-test./g' | sponge $KUBECONFIG
```

::::expand{header="Check Output"}
```bash
2023-03-14 10:24:31 [✔]  saved kubeconfig as "/tmp/kubeconfig-test"
```
::::

> Note: this assume you uses yq >= version 4. you can reference to [this page](https://mikefarah.gitbook.io/yq/upgrading-from-v3)  to adapt this command for another version.


We added the `--profile test` parameter to our kubectl config file, so that this will ask kubectl to use our IAM role associated to our `test` profile, and we rename the context using suffix **\-test**.

Run the command again to see who is now authenticating to the EKS cluster.

```bash
kubectl whoami
```

::::expand{header="Check Output"}
```bash
arn:aws:sts::ACCOUNT_ID:assumed-role/k8sTeamATest/botocore-session-1703484518
```
::::

This shows that we are now authenticating to the cluster using IAM Role `k8sTeamATest` using the profile `test`

Since the IAM Principal `k8sTeamATest` is associated with access policy `AmazonEKSViewPolicy` for the Namespace `team-a`, it allows read-only access to see most objects in a namespace.

Let's create a pod:

```bash
kubectl run nginx-test --image=nginx -n team-a
``` 

::::expand{header="Check Output"}
```bash
Error from server (Forbidden): pods is forbidden: User "arn:aws:sts::ACCOUNT_ID:assumed-role/k8sTeamATest/botocore-session-1703484518" cannot create resource "pods" in API group "" in the namespace "team-a"
```
::::

The error is expected since it is a read-only access.

We can list the pods:

```bash
kubectl get pods -n team-a
```

The output looks like below

```bash
NAME          READY   STATUS    RESTARTS   AGE
nginx-admin   1/1     Running   0          5m54s
nginx-dev     1/1     Running   0          13s
```

... but not in other namespaces:

```bash
kubectl get pods -n default
```
The output looks like below

```bash
Error from server (Forbidden): pods is forbidden: User "arn:aws:sts::ACCOUNT_ID:assumed-role/k8sTeamATest/botocore-session-1703484518" cannot list resource "pods" in API group "" in the namespace "default"
```

## Conclusion

In this module, we have seen how to configure Amazon EKS to provide finer access to users combining IAM Groups, IAM Roles and EKS access policies. You can create different groups depending on your needs, configure their associated Kubernetes access in your cluster, and simply add or remove users from the group to grant or revoke access to your cluster.

Users will only have to configure their AWS CLI in order to automatically retrieve their associated rights in your cluster.

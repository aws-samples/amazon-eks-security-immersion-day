---
title : "Install Kubernetes Tools"
weight : 23
---

#### Install eksctl
```bash
curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp

sudo mv -v /tmp/eksctl /usr/local/bin
```
Confirm the eksctl command works:

```bash
eksctl version
```
Enable eksctl bash-completion

```bash
eksctl completion bash >> ~/.bash_completion
. /etc/profile.d/bash_completion.sh
. ~/.bash_completion
```

#### Install kubectl
```bash
sudo curl --silent --location -o /usr/local/bin/kubectl \
   https://s3.us-west-2.amazonaws.com/amazon-eks/1.25.6/2023-01-30/bin/linux/amd64/kubectl

sudo chmod +x /usr/local/bin/kubectl
```
#### Install latest awscli
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```
#### Install jq, envsubst (from GNU gettext utilities) and bash-completion
```bash
sudo yum -y install jq gettext bash-completion moreutils
```
#### Install yq for yaml processing
```bash
echo 'yq() {
  docker run --rm -i -v "${PWD}":/workdir mikefarah/yq "$@"
}' | tee -a ~/.bashrc && source ~/.bashrc
```

#### Verify the binaries are in the path and executable
```bash
for command in kubectl jq envsubst aws
  do
    which $command &>/dev/null && echo "$command in path" || echo "$command NOT FOUND"
  done
```
#### Enable kubectl bash_completion
```bash
kubectl completion bash >>  ~/.bash_completion
. /etc/profile.d/bash_completion.sh
. ~/.bash_completion
```

#### Create an AWS KMS Custom Managed Key (CMK) 

Create a CMK for the EKS cluster to use when encrypting your Kubernetes secrets:

```bash
aws kms create-alias --alias-name alias/eksworkshop --target-key-id $(aws kms create-key --query KeyMetadata.Arn --output text)
```

Let's retrieve the ARN of the CMK to input into the create cluster command.

```bash
export MASTER_ARN=$(aws kms describe-key --key-id alias/eksworkshop --query KeyMetadata.Arn --output text)
```

We set the **MASTER_ARN** environment variable to make it easier to refer to the KMS key later.

Now, let's save the **MASTER_ARN** environment variable into the bash_profile

```bash
echo "export MASTER_ARN=${MASTER_ARN}" | tee -a ~/.bash_profile
```

#### Install Session Manager plugin on Linux

1. Download the Session Manager plugin RPM package.
```bash
curl "https://s3.amazonaws.com/session-manager-downloads/plugin/latest/linux_64bit/session-manager-plugin.rpm" -o "session-manager-plugin.rpm"
```
2. Run the install command.
```bash
sudo yum install -y session-manager-plugin.rpm
```
3. Run the following commands to verify that the Session Manager plugin installed successfully.
```bash
session-manager-plugin
```
If the installation was successful, the following message is returned.
```
The Session Manager plugin is installed successfully. Use the AWS CLI to start a session.
```

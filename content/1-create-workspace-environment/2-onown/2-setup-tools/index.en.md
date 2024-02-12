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
/usr/local/bin/eksctl completion bash > /etc/bash_completion.d/eksctl
. /etc/profile.d/bash_completion.sh
```

#### Install kubectl
```bash
sudo curl --silent --location -o /usr/local/bin/kubectl \
   https://s3.us-west-2.amazonaws.com/amazon-eks/1.28.1/2023-09-14/bin/linux/amd64/kubectl

sudo chmod +x /usr/local/bin/kubectl
sudo chmod 755 /usr/local/bin/kubectl 
```

Enable completion for Kubectl

```bash
/usr/local/bin/kubectl completion bash > /etc/bash_completion.d/kubectl
sudo tee /etc/bash_completion.d/kubectl > /dev/null <<< "$(/usr/local/bin/kubectl completion bash)"
. /etc/bash_completion.d/kubectl
. /etc/profile.d/bash_completion.sh
echo "alias k=kubectl" >> ~/.bash_profile
echo "complete -F __start_kubectl k" >> ~/.bash_profile
```

#### Install Helm

```bash
curl -fsSL -o /tmp/helm.tgz https://get.helm.sh/helm-v3.7.1-linux-amd64.tar.gz
tar -C /tmp -xzf /tmp/helm.tgz
sudo mv /tmp/linux-amd64/helm /usr/local/bin/helm
rm -rf /tmp/helm.tgz /tmp/linux-amd64

helm repo add eks https://aws.github.io/eks-charts
helm repo update
```

#### Install [k9s](https://k9scli.io/)

```bash
curl -sS https://webinstall.dev/k9s | bash
```

#### Install yq for yaml processing
```bash
echo 'yq() {
  docker run --rm -i -v "${PWD}":/workdir mikefarah/yq "$@"
}' | tee -a ~/.bashrc && source ~/.bashrc
```

#### Install Kubernetes plugin manager and stern used to stream kubernetes logs

```bash
(
  cd "$(mktemp -d)" &&
  OS="$(uname | tr '[:upper:]' '[:lower:]')" &&
  ARCH="$(uname -m | sed -e 's/x86_64/amd64/' -e 's/\(arm\)\(64\)\?.*/\1\2/' -e 's/aarch64$/arm64/')" &&
  KREW="krew-${OS}_${ARCH}" &&
  curl -fsSLO "https://github.com/kubernetes-sigs/krew/releases/latest/download/${KREW}.tar.gz" &&
  tar zxvf "${KREW}.tar.gz" &&
  ./"${KREW}" install krew
)
echo "export PATH=${KREW_ROOT:-$HOME/.krew}/bin:$PATH" | tee -a ~/.bash_profile
source ~/.bash_profile
kubectl krew install stern
```

#### Verify the binaries are in the path and executable
```bash
for command in kubectl jq envsubst aws
  do
    which $command &>/dev/null && echo "$command in path" || echo "$command NOT FOUND"
  done
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
sudo yum install -y session-manager-plugin.rpm
```

2. Run the following commands to verify that the Session Manager plugin installed successfully.
```bash
session-manager-plugin
```
If the installation was successful, the following message is returned.
```
The Session Manager plugin is installed successfully. Use the AWS CLI to start a session.
```

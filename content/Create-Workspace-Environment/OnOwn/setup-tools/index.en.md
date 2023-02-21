---
title : "Setup and Tools"
weight : 23
---


## Install the required Tools


* Install eksctl
```bash
curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp

sudo mv -v /tmp/eksctl /usr/local/bin
```
* Install kubectl
```bash
sudo curl --silent --location -o /usr/local/bin/kubectl \
   https://amazon-eks.s3.us-west-2.amazonaws.com/1.20.4/2021-04-12/bin/linux/amd64/kubectl

sudo chmod +x /usr/local/bin/kubectl
```
* Install latest awscli
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```
* Install jq, envsubst (from GNU gettext utilities) and bash-completion
```bash
sudo yum -y install jq gettext bash-completion moreutils
```
* Install yq for yaml processing
```bash
echo 'yq() {
  docker run --rm -i -v "${PWD}":/workdir mikefarah/yq "$@"
}' | tee -a ~/.bashrc && source ~/.bashrc
```
* Install c9 to open files in cloud9
```bash
npm install -g c9
```
Below is one example:
```bash
c9 open ~/file.yaml
```
* Install k9s a Kubernetes CLI To Manage Your Clusters In Style!
```bash
curl -sS https://webinstall.dev/k9s | bash
```
* Verify the binaries are in the path and executable
```bash
for command in kubectl jq envsubst aws
  do
    which $command &>/dev/null && echo "$command in path" || echo "$command NOT FOUND"
  done
```
* Enable kubectl bash_completion
```bash

```kubectl completion bash >>  ~/.bash_completion
. /etc/profile.d/bash_completion.sh
. ~/.bash_completion
* Enable some kubernetes aliases
```bash
git clone --depth 1 https://github.com/junegunn/fzf.git ~/.fzf
~/.fzf/install --all
sudo curl https://raw.githubusercontent.com/blendle/kns/master/bin/kns -o /usr/local/bin/kns && sudo chmod +x $_
sudo curl https://raw.githubusercontent.com/blendle/kns/master/bin/ktx -o /usr/local/bin/ktx && sudo chmod +x $_
echo "alias kgn='kubectl get nodes -L beta.kubernetes.io/arch -L eks.amazonaws.com/capacityType -L beta.kubernetes.io/instance-type -L eks.amazonaws.com/nodegroup -L topology.kubernetes.io/zone -L karpenter.sh/provisioner-name -L karpenter.sh/capacity-type'" | tee -a ~/.bashrc
source ~/.bashrc
```
* Configure aws cli with your current region as default.
```bash
export ACCOUNT_ID=$(aws sts get-caller-identity --output text --query Account)

export AWS_REGION=$(curl -s 169.254.169.254/latest/dynamic/instance-identity/document | jq -r '.region')
```
* Check if AWS_REGION is set to desired region
```bash
test -n "$AWS_REGION" && echo AWS_REGION is "$AWS_REGION" || echo AWS_REGION is not set
```
* Save these into bash_profile
```bash
echo "export ACCOUNT_ID=${ACCOUNT_ID}" | tee -a ~/.bash_profile
echo "export AWS_REGION=${AWS_REGION}" | tee -a ~/.bash_profile
aws configure set default.region ${AWS_REGION}
aws configure get default.region
```
* Ensure you are getting the IAM role that you have attached to Cloud9 IDE when you execute the below command
```bash
aws sts get-caller-identity --query Arn | grep eks-blueprints-for-terraform-workshop-admin -q && echo "IAM role valid" || echo "IAM role NOT valid"
```
* If the IAM role is not valid, DO NOT PROCEED. Go back and confirm the steps on this section.
* Increase the disk size on the Cloud9 instance
The following command adds more disk space to the root volume of the EC2 instance that Cloud9 runs on. Once the command completes, it reboots the instance and it could take a minute or two for the IDE to come back online.
```bash
pip3 install --user --upgrade boto3
export instance_id=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
python -c "import boto3
import os
from botocore.exceptions import ClientError 
ec2 = boto3.client('ec2')
volume_info = ec2.describe_volumes(
    Filters=[
        {
            'Name': 'attachment.instance-id',
            'Values': [
                os.getenv('instance_id')
            ]
        }
    ]
)
volume_id = volume_info['Volumes'][0]['VolumeId']
try:
    resize = ec2.modify_volume(    
            VolumeId=volume_id,    
            Size=30
    )
    print(resize)
except ClientError as e:
    if e.response['Error']['Code'] == 'InvalidParameterValue':
        print('ERROR MESSAGE: {}'.format(e))"
if [ $? -eq 0 ]; then
    sudo reboot
fi
```
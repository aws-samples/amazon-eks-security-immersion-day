---
title : "Building a Custom AMI hadrdend with CIS specification hardening script"
weight : 21
---

In this section we will walkthrough the process of building custom ami hardened as per CIS specification benchmark using community provided script. We will be using Hasihcorp [packer](https://www.packer.io/) to build the ami.

Install the Packer tool. Below instructions assume you are using an Amazon Linux based machine to build the AMI.

```bash
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://rpm.releases.hashicorp.com/AmazonLinux/hashicorp.repo
sudo yum -y install packer

```
Clone the repo for building a custom Amazon EKS AMI with CIS hardening script

```bash
cd ~/environment
git clone https://github.com/preetamrebello/amazon-eks-custom-amis
cd ~/environment/amazon-eks-custom-amis
```

Get the default Amazon Virtual Private Cloud (VPC) ID and get one of the subnet IDs. The packer tool will launch a temporary Amazon EC2 Instance in this subnet to create the custom Amazon EKS AMI.

```bash
EKS_VPC_ID=$(eksctl get cluster eksworkshop-eksctl -ojson | jq -r '.[0]["ResourcesVpcConfig"]["VpcId"]')
echo $EKS_VPC_ID
SUBNET_ID=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$EKS_VPC_ID" | jq '.Subnets[0].SubnetId')
SUBNET_ID=`sed -e 's/^"//' -e 's/"$//' <<<"$SUBNET_ID"`
echo $SUBNET_ID

```
Set the variables to AWS Regions and EKS version

```bash
cd ~/environment/amazon-eks-custom-amis
sed  -i '/variable "region"/{n;n;n;s/.*/default  =  "'$AWS_REGION'"/}' variables.pkr.hcl
sed  -i '/variable "eks_version"/{n;n;n;s/.*/default  =  '$EKS_VERSION'/}' variables.pkr.hcl
```

Build the ami it will take around approximately 8-10 minutes to complete the build. In this workshop we are building AMD based architecture. Based on your requirement the appropriate var file can be used.

```bash
cd ~/environment/amazon-eks-custom-amis
packer init -upgrade .
packer build  -var-file=al2_amd64.pkrvars.hcl  -var 'subnet_id='$SUBNET_ID'' .

```

This will be the output after completion of the build

::::expand{header="Check Output"}
```bash

```
::::

Set an environment variable with the above custom Amazon EKS AMI. This will ve used to deploy managed node group
```bash 
export EKS_AMI_ID=$(aws ec2 describe-images    --filters 'Name=tag:Name,Values="amazon-eks*"'  --owners $AWS_ACCOUNT_ID --query 'Images[*].[ImageId]'  --output text)
echo $EKS_AMI_ID
```


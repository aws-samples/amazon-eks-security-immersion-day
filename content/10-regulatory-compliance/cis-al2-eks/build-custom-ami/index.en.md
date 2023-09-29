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
Clone the repo for building a custom Amazon EKS AMI with CIS hardening script. The code used in this solution is available in GitHub. Please clone the repository to prepare for the walkthrough. The hardening scripts by default applies both Level 1 and Level 2 CIS benchmark for Amazon Linux 2.

```bash
cd ~/environment
git clone https://github.com/preetamrebello/amazon-eks-custom-amis
cd ~/environment/amazon-eks-custom-amis
```

Get the default Amazon Virtual Private Cloud (VPC) ID and get one of the subnet IDs. The packer tool will launch a temporary Amazon EC2 Instance in this subnet to create the custom Amazon EKS AMI.

```bash
EKS_VPC_ID=$(eksctl get cluster $EKS_CLUSTER -ojson | jq -r '.[0]["ResourcesVpcConfig"]["VpcId"]')
echo $EKS_VPC_ID
SUBNET_ID=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$EKS_VPC_ID" | jq '.Subnets[0].SubnetId')
SUBNET_ID=`sed -e 's/^"//' -e 's/"$//' <<<"$SUBNET_ID"`
echo $SUBNET_ID

```
Set the variables to AWS Regions and EKS version in packer variables file. The ami is built using the private ip address.

```bash
cd ~/environment/amazon-eks-custom-amis
sed  -i '/variable "region"/{n;n;n;s/.*/default  =  "'$AWS_REGION'"/}' variables.pkr.hcl
sed  -i '/variable "eks_version"/{n;n;n;s/.*/default  =  '$EKS_VERSION'/}' variables.pkr.hcl
sed -i '/variable "associate_public_ip_address"/{n;n;n;s/.*/default  =   true/}' variables.pkr.hcl
```

Build the ami using below commands. It will take approximately 8-10 minutes to complete the build. In this workshop we are building AMD based architecture. Based on your requirement the appropriate var file can be used.

```bash
cd ~/environment/amazon-eks-custom-amis
packer init -upgrade .
packer build  -var-file=al2_amd64.pkrvars.hcl  -var 'subnet_id='$SUBNET_ID'' .

```

This will be the output after completion of the build (Output is truncated)

::::expand{header="Check Output"}
```bash
==> amazon-eks.amazon-ebs.this: Waiting for AMI to become ready...
==> amazon-eks.amazon-ebs.this: Skipping Enable AMI deprecation...
==> amazon-eks.amazon-ebs.this: Modifying attributes on AMI (ami-0aafe4768c171cf05)...
    amazon-eks.amazon-ebs.this: Modifying: description
    amazon-eks.amazon-ebs.this: Modifying: imds_support
==> amazon-eks.amazon-ebs.this: Modifying attributes on snapshot (snap-05545f085bec892a1)...
==> amazon-eks.amazon-ebs.this: Modifying attributes on snapshot (snap-0e7b3720f052a5d65)...
==> amazon-eks.amazon-ebs.this: Adding tags to AMI (ami-0aafe4768c171cf05)...
==> amazon-eks.amazon-ebs.this: Tagging snapshot: snap-05545f085bec892a1
==> amazon-eks.amazon-ebs.this: Tagging snapshot: snap-0e7b3720f052a5d65
==> amazon-eks.amazon-ebs.this: Creating AMI tags
    amazon-eks.amazon-ebs.this: Adding tag: "SourceAMI": "ami-02b4071bb2bda80f3"
    amazon-eks.amazon-ebs.this: Adding tag: "Name": "amazon-eks-1.25-20230928195858"
==> amazon-eks.amazon-ebs.this: Creating snapshot tags
==> amazon-eks.amazon-ebs.this: Terminating the source AWS instance...
==> amazon-eks.amazon-ebs.this: Cleaning up any extra volumes...
==> amazon-eks.amazon-ebs.this: No volumes to clean up, skipping
==> amazon-eks.amazon-ebs.this: Deleting temporary security group...
==> amazon-eks.amazon-ebs.this: Deleting temporary keypair...
Build 'amazon-eks.amazon-ebs.this' finished after 7 minutes 13 seconds.

==> Wait completed after 7 minutes 13 seconds

==> Builds finished. The artifacts of successful builds are:
--> amazon-eks.amazon-ebs.this: AMIs were created:
us-west-2: ami-0aafe4768c171cf05
```
::::

Set an environment variable with the above custom Amazon EKS AMI. This will be used to deploy managed node group
```bash 
export EKS_AMI_ID=$(aws ec2 describe-images    --filters 'Name=tag:Name,Values="amazon-eks*"'  --owners $AWS_ACCOUNT_ID --query 'Images[*].[ImageId]'  --output text)
echo $EKS_AMI_ID
```


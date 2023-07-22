---
title : "Preparing the signing environment"
weight : 21
---


Note that the [rpm package](https://d2hvyiie56hcat.cloudfront.net/linux/amd64/installer/rpm/latest/aws-signer-notation-cli_amd64.rpm) referenced in the [AWS Signer documentation](https://docs.aws.amazon.com/signer/latest/developerguide/image-signing-prerequisites.html) to install the Notation binary and AWS Signer Plugin currently do not support [Amazon Linux 2](https://aws.amazon.com/amazon-linux-2/) at the time of thus writing. However, it is supported on [Amazon Linux 2023](https://aws.amazon.com/linux/amazon-linux-2023/).


* Configure AWS CLI with your current region as default.
```bash
cd ~/environment
export ACCOUNT_ID=$(aws sts get-caller-identity --output text --query Account)
export AWS_REGION=$(curl -s 169.254.169.254/latest/dynamic/instance-identity/document | jq -r '.region')
```

### Create an EC2 Instance with Amazon Linux 2023 AMI

Let us first create an EC2 Instance with latest Amazon Linux 2023 AMI.

```bash
 AL_2023_AMI=$(aws ssm get-parameter --name /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64 --region $AWS_REGION --query "Parameter.Value" --output text)
 echo $AL_2023_AMI
 ```

::::expand{header="Check Output"}
```bash
 ami-06ca3ca175f37dd66
```
::::

Run the below command to create an ssh key to configure the EC2 Instance. We will use this to login into the Instance.

```bash
aws ec2 create-key-pair --region $AWS_REGION  --key-name "al2023-ssh-key"  |  jq -r ".KeyMaterial" > al2023-ssh-key.pem
chmod 400 al2023-ssh-key.pem
```

Run below commands to get the Cloud9 EC2 Instance Id and IAM Role attached to it.

```bash
C9_EC2_INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
echo $C9_EC2_INSTANCE_ID
export C9_EC2_INSTANCE_PROFILE_ARN=$(aws ec2 describe-iam-instance-profile-associations --filters Name=instance-id,Values=$C9_EC2_INSTANCE_ID | jq -r '.IamInstanceProfileAssociations[0].IamInstanceProfile.Arn')
echo $C9_EC2_INSTANCE_PROFILE_ARN

export EKS_CLUSTER_NAME="eksworkshop-eksctl"
EKS_VPC_ID=$(eksctl get cluster $EKS_CLUSTER_NAME -ojson | jq -r '.[0]["ResourcesVpcConfig"]["VpcId"]')
echo $EKS_VPC_ID
export VPC_CIDR=$(aws ec2 describe-vpcs --vpc-ids $EKS_VPC_ID | jq -r '.Vpcs[0].CidrBlock')
echo $VPC_CIDR
SUBNET_ID=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$EKS_VPC_ID" | jq -r '.Subnets[0].SubnetId')
echo $SUBNET_ID
export DEFAULT_SECURITY_GROUP_ID=$(aws ec2 describe-security-groups     --filters Name=vpc-id,Values=$EKS_VPC_ID Name=group-name,Values="default"  | jq -r '.SecurityGroups[0].GroupId')
echo $DEFAULT_SECURITY_GROUP_ID
aws ec2 authorize-security-group-ingress --group-id $DEFAULT_SECURITY_GROUP_ID --protocol tcp --port 22 --cidr $VPC_CIDR
```

::::expand{header="Check Output"}
```bash
i-0d45e819f38a652ea
arn:aws:iam::XXXXXXXXXX:instance-profile/eks-bootstrap-template-ws-Cloud9InstanceProfile-d55IOFoYH6uP
vpc-0d46a9840f5d2e2e7
10.254.0.0/16
sg-0aea8cf2ace665f72
{
    "Return": true,
    "SecurityGroupRules": [
        {
            "SecurityGroupRuleId": "sgr-0f54d4208ec9284be",
            "GroupId": "sg-0aea8cf2ace665f72",
            "GroupOwnerId": "414531612852",
            "IsEgress": false,
            "IpProtocol": "tcp",
            "FromPort": 22,
            "ToPort": 22,
            "CidrIpv4": "10.254.0.0/16"
        }
    ]
}

```
::::

Run the below command to create an EC2 Instance with Amazon Linux 2023 AMI and ssh key pair. Let's call this EC2 Instance as AL2023 Instance.

```bash
AL2023_EC2_INSTANCE_ID=$(aws ec2 run-instances \
    --image-id $AL_2023_AMI \
    --instance-type t3.small \
    --key-name al2023-ssh-key \
    --security-group-ids $DEFAULT_SECURITY_GROUP_ID \
    --subnet-id $SUBNET_ID \
    --iam-instance-profile Arn=$C9_EC2_INSTANCE_PROFILE_ARN \
    --count 1 | jq -r '.Instances[0].InstanceId')
echo  $AL2023_EC2_INSTANCE_ID
```

::::expand{header="Check Output"}
```bash
i-0c80b1c9a2738e89b
```
::::

Let us wait until the EC2 Instance Status becomes Running.

```bash
aws ec2 wait instance-status-ok  --instance-ids $AL2023_EC2_INSTANCE_ID
```

Run below commands to ssh into the AL2023 EC2 Instance.

```bash
export AL2023_EC2_INSTANCE_PRIVATE_IP=$(aws ec2 describe-instances     --instance-ids $AL2023_EC2_INSTANCE_ID | jq -r '.Reservations[0].Instances[0].PrivateDnsName')
echo $AL2023_EC2_INSTANCE_PRIVATE_IP
ssh -i "al2023-ssh-key.pem" ec2-user@$AL2023_EC2_INSTANCE_PRIVATE_IP
```

The above command will ask for user command line input yes/no. Type **yes** and press *Enter*

Ensure that the output from above command looks llke below. From now onwards, all the following commands in this section will be run on the EC2 Instance.

```bash
The authenticity of host 'ip-10-254-142-20.us-west-2.compute.internal (10.254.142.20)' can't be established.
ECDSA key fingerprint is SHA256:6cEcpNxx4LnYQEKgUcZmEw63RgGRfelHaW9Gzcongnc.
ECDSA key fingerprint is MD5:2f:50:72:3f:c5:1f:ae:c1:94:45:64:18:7a:ef:ad:a8.
Are you sure you want to continue connecting (yes/no)? yes
Warning: Permanently added 'ip-10-254-142-20.us-west-2.compute.internal,10.254.142.20' (ECDSA) to the list of known hosts.
   ,     #_
   ~\_  ####_        Amazon Linux 2023
  ~~  \_#####\
  ~~     \###|
  ~~       \#/ ___   https://aws.amazon.com/linux/amazon-linux-2023
   ~~       V~' '->
    ~~~         /
      ~~._.   _/
         _/ _/
       _/m/'
[ec2-user@ip-10-254-142-20 ~]$
```
 
Go to the home directory on the EC2 Instance.

```bash
pwd
```

Ensure that the outout will look like below before proceeding further.

```bash
/home/ec2-user
```

### Download and Install the container-signing tools
Two software packages need to be installed in local environment to sign images:

1. AWS Signer plugin for Notation
2. open source supply chain security program Notation, developed by the [Notary Project](https://notaryproject.dev/)

[AWS Signer provides an installer](https://docs.aws.amazon.com/signer/latest/developerguide/image-signing-prerequisites.html), which installs both the AWS Signer plugin for Notation and the Notation client. The installer includes the following.

* Notation binary and third party license
* AWS Signer plugin binary and third party license
* Notation license
* Trust store and root certificate
* A configurable trust policy

Download the required rpm installer package file to the current directory.

```bash
wget https://d2hvyiie56hcat.cloudfront.net/linux/amd64/installer/rpm/latest/aws-signer-notation-cli_amd64.rpm
```

::::expand{header="Check Output"}
```bash
--2023-07-17 07:26:44--  https://d2hvyiie56hcat.cloudfront.net/linux/amd64/installer/rpm/latest/aws-signer-notation-cli_amd64.rpm
Resolving d2hvyiie56hcat.cloudfront.net (d2hvyiie56hcat.cloudfront.net)... 99.84.216.211, 99.84.216.217, 99.84.216.96, ...
Connecting to d2hvyiie56hcat.cloudfront.net (d2hvyiie56hcat.cloudfront.net)|99.84.216.211|:443... connected.
HTTP request sent, awaiting response... 200 OK
Length: 4321915 (4.1M) [binary/octet-stream]
Saving to: ‘aws-signer-notation-cli_amd64.rpm’

aws-signer-notation-cli 100%[==============================>]   4.12M  9.36MB/s    in 0.4s    

2023-07-17 07:26:46 (9.36 MB/s) - ‘aws-signer-notation-cli_amd64.rpm’ saved [4321915/4321915]
```
::::

Install the package using the following command.

```bash
sudo rpm -U aws-signer-notation-cli_amd64.rpm 
```
::::expand{header="Check Output"}
```bash
No configuration file '/etc/signer-notation-options' found. Using default values.
SIGNER_TRUST_STORE_NAME=aws-signer-ts
NOTATION_INSTALL_PATH=/usr/local/bin
```
::::



### Verify the package installation

After downloading and installing the package, let us verify if the the installation was successful.

Use the following command to display the Notation client version.

```bash
notation version
```

::::expand{header="Check Output"}
```bash
Notation - a tool to sign and verify artifacts.

Version:     1.0.0-rc.7
Go version:  go1.20.4
Git commit:  ebfb9ef707996e1dc11898db8b90faa8e8816ae6
```
::::


Use the following command to list the installed plugins for the Notation client and verify that you see the `com.amazonaws.signer.notation.plugin` plugin.

```bash
notation plugin ls
```

The output will like below.
```bash
NAME                                   DESCRIPTION                      VERSION   CAPABILITIES                                                                                             ERROR   
com.amazonaws.signer.notation.plugin   AWS Signer plugin for Notation   1.0.298   [SIGNATURE_GENERATOR.ENVELOPE SIGNATURE_VERIFIER.TRUSTED_IDENTITY SIGNATURE_VERIFIER.REVOCATION_CHECK]   <nil> 
```

Verify that the Notation directory structure for your operating system was created. For Amazon Linux 2023, the Notation directory structure is created at `.config/notation/`. 

Let us first install the `tree` command line tool in the EC2 Instance.

```bash
sudo yum -y install tree
```

::::expand{header="Check Output"}
```bash
Last metadata expiration check: 8:29:03 ago on Mon Jul 17 00:00:13 2023.
Dependencies resolved.
======================================================================================================
 Package          Architecture       Version                            Repository               Size
======================================================================================================
Installing:
 tree             x86_64             1.8.0-6.amzn2023.0.2               amazonlinux              56 k

Transaction Summary
======================================================================================================
Install  1 Package

Total download size: 56 k
Installed size: 113 k
Downloading Packages:
tree-1.8.0-6.amzn2023.0.2.x86_64.rpm                                  741 kB/s |  56 kB     00:00    
------------------------------------------------------------------------------------------------------
Total                                                                 416 kB/s |  56 kB     00:00     
Running transaction check
Transaction check succeeded.
Running transaction test
Transaction test succeeded.
Running transaction
  Preparing        :                                                                              1/1 
  Installing       : tree-1.8.0-6.amzn2023.0.2.x86_64                                             1/1 
  Running scriptlet: tree-1.8.0-6.amzn2023.0.2.x86_64                                             1/1 
  Verifying        : tree-1.8.0-6.amzn2023.0.2.x86_64                                             1/1 

Installed:
  tree-1.8.0-6.amzn2023.0.2.x86_64                                                                    

Complete!
```
::::

Run the following command to see the Notation directory structure. In the tree output you can clearly see that the AWS Signer plugin is installed, as well as the Notation `truststore` directory, and a Notation `trustpolicy` document.

```bash
tree .config/notation/
```

The output will look like below.

```bash
.config/notation/
├── LICENSE
├── THIRD_PARTY_LICENSES
├── plugins
│   └── com.amazonaws.signer.notation.plugin
│       ├── LICENSE
│       ├── THIRD_PARTY_LICENSES
│       └── notation-com.amazonaws.signer.notation.plugin
├── trustpolicy.json
└── truststore
    └── x509
        └── signingAuthority
            └── aws-signer-ts
                └── aws-signer-notation-root.crt

6 directories, 7 files
```
Let us exit from the Al2023 EC2 Instance.

```bash
exit
```

::::expand{header="Check Output"}
```bash
logout
Connection to ip-10-254-142-20.us-west-2.compute.internal closed.
```
::::

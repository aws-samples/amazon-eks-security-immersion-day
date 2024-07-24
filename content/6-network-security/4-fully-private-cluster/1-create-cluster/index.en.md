---
title : "Create Fully Private EKS Cluster"
weight : 151
---

Once you have logged into the AWS Management Console from your Workshop Studio, you will already have an AWS Cloud9 environment. Your AWS Cloud9 workspace will also have all the required tools installed in it.


#### Create a VPC with Private Subnets with Internet Egress

```bash
curl ':assetUrl{path="/eks-private-vpc.yaml"}' --output eks-private-vpc.yaml
```

```bash
aws cloudformation deploy --template-file eks-private-vpc.yaml --stack-name eks-private-vpc
```

::::expand{header="Check Output"}
```
Waiting for changeset to be created..
Waiting for stack create/update to complete
Successfully created/updated stack - eks-private-vpc
```
::::

```bash
aws ec2 describe-subnets --filters Name=tag:aws:cloudformation:stack-name,Values=eks-private-vpc Name=tag:aws:cloudformation:logical-id,Values=PrivateSubnet* --query "Subnets[*].[SubnetId,VpcId,AvailabilityZone]" --output table
```

```
----------------------------------------------------------------------
|                           DescribeSubnets                          |
+---------------------------+-------------------------+--------------+
|  subnet-0f0dbfbe773d48d6b |  vpc-02cc579cdd679aa3c  |  ap-south-1c |
|  subnet-051cc8911bb59cd8d |  vpc-02cc579cdd679aa3c  |  ap-south-1a |
|  subnet-0904b546818687aef |  vpc-02cc579cdd679aa3c  |  ap-south-1b |
+---------------------------+-------------------------+--------------+
```

We would use Private Subnets on AZ "a","b" and "c" for creating the EKS Cluster worker nodes and another Subnet in AZ "c" for Private Cloud9 instance. We would set the following environment vairables from the values in the above output table.

```bash
export AZ1_SUBNET=$(aws ec2 describe-subnets --filters Name=tag:aws:cloudformation:stack-name,Values=eks-private-vpc Name=tag:aws:cloudformation:logical-id,Values=PrivateSubnet* Name=availability-zone,Values=ap-south-1a --query "Subnets[*].[SubnetId]" --output text)
export AZ2_SUBNET=$(aws ec2 describe-subnets --filters Name=tag:aws:cloudformation:stack-name,Values=eks-private-vpc Name=tag:aws:cloudformation:logical-id,Values=PrivateSubnet* Name=availability-zone,Values=ap-south-1b --query "Subnets[*].[SubnetId]" --output text)
export AZ3_SUBNET=$(aws ec2 describe-subnets --filters Name=tag:aws:cloudformation:stack-name,Values=eks-private-vpc Name=tag:aws:cloudformation:logical-id,Values=PrivateSubnet* Name=availability-zone,Values=ap-south-1c --query "Subnets[*].[SubnetId]" --output text)
export CLOUD9_SUBNET=$(aws ec2 describe-subnets --filters Name=tag:aws:cloudformation:stack-name,Values=eks-private-vpc Name=tag:aws:cloudformation:logical-id,Values=PrivateSubnet* Name=availability-zone,Values=ap-south-1c --query "Subnets[*].[SubnetId]" --output text)
export CLUSTER_VPC=$(aws ec2 describe-subnets --filters Name=tag:aws:cloudformation:stack-name,Values=eks-private-vpc Name=tag:aws:cloudformation:logical-id,Values=PrivateSubnet* Name=availability-zone,Values=ap-south-1c --query "Subnets[*].[VpcId]" --output text)
```



#### Create and Setup Management Cloud9 instance in Private Subnet

* Go to [AWS Cloud9 Console](https://us-west-2.console.aws.amazon.com/cloud9/home?region=us-west-2)
* Select **Create environment**
* Name it **eksworkshop-private**, click Next.
* Choose **t3.small** for instance type 
* Go to **Network Setting** and expand **VPC Setting**
* Select the "EKSSecurityImmersionDayPrivate" as VPC and "EKSSecurityImmersionDayPrivateC" as the Subnet
* Click **Create environment**

When it comes up, customize the environment by:

* Closing the **Welcome tab**
![c9before](/static/images/create-workspace/cloud9-1.png)

* Opening a new **terminal** tab in the main work area
![c9newtab](/static/images/create-workspace/cloud9-2.png)

* Closing the lower work area
![c9newtab](/static/images/create-workspace/cloud9-3.png)

* Your workspace should now look like this
![c9after](/static/images/create-workspace/cloud9-4.png)

#### Attach the IAM role to the AWS Cloud9 workspace

1. Click the grey circle button (in top right corner) and select **Manage EC2 Instance**.

![cloud9Role](/static/images/create-workspace/cloud9-role.png)

2. Select the instance, then choose **Actions / Security / Modify IAM Role**
![c9instancerole](/static/images/create-workspace/c9instancerole.png)

3. Choose **eksworkshop-admin** from the **IAM Role** drop down, and select **Save**
![c9attachrole](/static/images/create-workspace/c9attachrole.png)


#### Update IAM settings for your Workspace

To ensure temporary credentials aren't already in place we will remove
any existing credentials file as well as disabling **AWS managed temporary credentials**:

```bash
aws cloud9 update-environment  --environment-id $C9_PID --managed-credentials-action DISABLE
rm -vf ${HOME}/.aws/credentials
```

#### Install latest awscli
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

Run below commands to set few environment variables.

::alert[If you are [at an AWS event](/1-create-workspace-environment/awsevent), ask your instructor which **AWS region** to use.]{header="Note"}

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
   https://s3.us-west-2.amazonaws.com/amazon-eks/1.28.1/2023-09-14/bin/linux/amd64/kubectl

sudo chmod +x /usr/local/bin/kubectl
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


Run below commands to set few environment variables. Please fetch the subnet and VPC settings from the **Create VPC** section.

```bash
export ACCOUNT_ID=$(aws sts get-caller-identity --output text --query Account)
export AWS_REGION=$(curl -s 169.254.169.254/latest/dynamic/instance-identity/document | jq -r '.region')
export AZS=($(aws ec2 describe-availability-zones --query 'AvailabilityZones[].ZoneName' --output text --region $AWS_REGION))
export AZ1_SUBNET=$(aws ec2 describe-subnets --filters Name=tag:aws:cloudformation:stack-name,Values=eks-private-vpc Name=tag:aws:cloudformation:logical-id,Values=PrivateSubnet* Name=availability-zone,Values=ap-south-1a --query "Subnets[*].[SubnetId]" --output text)
export AZ2_SUBNET=$(aws ec2 describe-subnets --filters Name=tag:aws:cloudformation:stack-name,Values=eks-private-vpc Name=tag:aws:cloudformation:logical-id,Values=PrivateSubnet* Name=availability-zone,Values=ap-south-1b --query "Subnets[*].[SubnetId]" --output text)
export AZ3_SUBNET=$(aws ec2 describe-subnets --filters Name=tag:aws:cloudformation:stack-name,Values=eks-private-vpc Name=tag:aws:cloudformation:logical-id,Values=PrivateSubnet* Name=availability-zone,Values=ap-south-1c --query "Subnets[*].[SubnetId]" --output text)
export CLOUD9_SUBNET=$(aws ec2 describe-subnets --filters Name=tag:aws:cloudformation:stack-name,Values=eks-private-vpc Name=tag:aws:cloudformation:logical-id,Values=PrivateSubnet* Name=availability-zone,Values=ap-south-1c --query "Subnets[*].[SubnetId]" --output text)
export CLUSTER_VPC=$(aws ec2 describe-subnets --filters Name=tag:aws:cloudformation:stack-name,Values=eks-private-vpc Name=tag:aws:cloudformation:logical-id,Values=PrivateSubnet* Name=availability-zone,Values=ap-south-1c --query "Subnets[*].[VpcId]" --output text)
```

Check if AWS_REGION is set to desired region

```bash
test -n "$AWS_REGION" && echo AWS_REGION is "$AWS_REGION" || echo AWS_REGION is not set
```

 Let's save these into bash_profile

```bash
echo "export ACCOUNT_ID=${ACCOUNT_ID}" | tee -a ~/.bash_profile
echo "export AWS_REGION=${AWS_REGION}" | tee -a ~/.bash_profile
echo "export AZS=(${AZS[@]})" | tee -a ~/.bash_profile
aws configure set default.region ${AWS_REGION}
aws configure get default.region
```

**Validate the IAM role**

Use the [GetCallerIdentity](https://docs.aws.amazon.com/cli/latest/reference/sts/get-caller-identity.html) CLI command to validate that the AWS Cloud9 IDE is using the correct IAM role.

```bash
aws sts get-caller-identity --query Arn | grep eksworkshop-admin -q && echo "IAM role valid" || echo "IAM role NOT valid"
```

If the IAM role is not valid, **DO NOT PROCEED**. Go back and confirm the steps on this page.

#### Create a Fully Private EKS Cluster in the VPC created earlier

Create an eksctl deployment file (**eksworkshop-eksctl-private.yaml**) used in creating your cluster using the following syntax:

```bash
cat << EOF > eksworkshop-eksctl-private.yaml
---
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig

metadata:
  name: eksworkshop-eksctl-private
  region: ${AWS_REGION}

privateCluster:
  enabled: true
  additionalEndpointServices:
  - "autoscaling"
  - "logs"

vpc:
  subnets:
    private:
      ${AWS_REGION}a:
        id: ${AZ1_SUBNET}
      ${AWS_REGION}b:
        id: ${AZ2_SUBNET}
      ${AWS_REGION}c:
        id: ${AZ3_SUBNET}

managedNodeGroups:
- name: m1
  instanceType: m5.large
  desiredCapacity: 3
  privateNetworking: true
EOF
```

Next, use the file you created as the input for the eksctl cluster creation.


```bash
eksctl create cluster -f eksworkshop-eksctl-private.yaml
```

Launching Amazon EKS and all the dependencies will take approximately 15 minutes

You can test access to your cluster by running the following command. The output will be a list of worker nodes

```bash
kubectl get nodes
```

You should see below output

```bash
NAME                                           STATUS   ROLES    AGE   VERSION
ip-10-***-***-***.ap-south-1.compute.internal   Ready   <none>   39h   v1.27.7-eks-e71965b
ip-10-***-***-***.ap-south-1.compute.internal   Ready   <none>   39h   v1.27.7-eks-e71965b
ip-10-***-***-***.ap-south-1.compute.internal   Ready   <none>   39h   v1.27.7-eks-e71965b
```

This should setup an EKS cluster with Private Endpoint for the Control Plane. The details of the newly created cluster can be fetched from the above command from kubectl commands. Notice in the output the cluster creation process first enables for the Private and Public endpoint for the API server to initial provisioning of the cluster. Later the public endpoint is delted as as a part of the eksctl command.

eksctl supports creation of fully-private clusters that have no outbound internet access and have only private subnets. VPC endpoints are used to enable private access to AWS services.

The only required field to create a fully-private cluster is privateCluster.enabled. Only private nodegroups (both managed and self-managed) are supported in a fully-private cluster because the cluster's VPC is created without any public subnets. The privateNetworking field must be explicitly set. It is an error to leave privateNetworking unset in a fully-private cluster.



If Karpenter is used for Auto scaling of worker nodes the following considerations are required. 
https://aws.github.io/aws-eks-best-practices/karpenter/#amazon-eks-private-cluster-without-outbound-internet-access


:::code{showCopyAction=true showLineNumbers=false language=yaml}
privateCluster:
  enabled: true
:::

After the EKS cluster was created and since it is a Private Cluster, there would be VPC endpoints created in the Cluster VPC to create PrivateLink with various AWS services. The following VPC endpoints are created behind the scene.

#### List the VPC endpoints created with the EKS clusters for Private access to AWS Servcies


```bash
aws ec2 describe-vpc-endpoints --filter "Name=vpc-id,Values=$CLUSTER_VPC" --query VpcEndpoints[].[VpcId,VpcEndpointId,ServiceName] --output table
```


```
----------------------------------------------------------------------------
|                           DescribeVpcEndpoints                           |
+------------------------+-------------------------------------------------+
|  vpc-02cc579cdd679aa3c |  com.amazonaws.ap-south-1.s3                    |
|  vpc-02cc579cdd679aa3c |  com.amazonaws.ap-south-1.ecr.dkr               |
|  vpc-02cc579cdd679aa3c |  com.amazonaws.ap-south-1.ecr.api               |
|  vpc-02cc579cdd679aa3c |  com.amazonaws.ap-south-1.logs                  |
|  vpc-02cc579cdd679aa3c |  com.amazonaws.ap-south-1.ec2                   |
|  vpc-02cc579cdd679aa3c |  com.amazonaws.ap-south-1.sts                   |
|  vpc-02cc579cdd679aa3c |  com.amazonaws.ap-south-1.autoscaling           ||  
+------------------------+-------------------------------------------------+
```

This Workshop would additionally require these VPC endpoints additionally. We would be creating the same below.
* elasticloadbalancing - For ALB Controller addon to create ELBs
* eks - For Cloud9 to privately query EKS Service APIs
* ssm - EKS Worker nodes to be accessed through SSM without opening SSH ports
* ssmmessages - EKS Worker nodes to be accessed through SSM without opening SSH ports
* ec2messages - EKS Worker nodes to be accessed through SSM without opening SSH ports

#### Create VPC endpoints

Get the Security group used by the existing VPC Endpoints.


```bash
export VPCE_SG=$(aws ec2 describe-vpc-endpoints --filter Name=vpc-id,Values=$CLUSTER_VPC Name=service-name,Values=*ec2 --query VpcEndpoints[].Groups[].GroupId --output text)
```


Create The VPC endpoints.

VPC endpoint for ELB

```bash
aws ec2 create-vpc-endpoint \
    --vpc-id $CLUSTER_VPC \
    --vpc-endpoint-type Interface \
    --service-name com.amazonaws.$AWS_REGION.elasticloadbalancing \
    --subnet-ids $AZ1_SUBNET $AZ2_SUBNET \
    --security-group-id $VPCE_SG \
    --tag-specifications 'ResourceType=vpc-endpoint,Tags=[{Key=service,Value=ELB}]'
```

Check sample output. This will is the JSON representation of the resource created.
::::expand{header="Check Output"}
```
{
    "VpcEndpoint": {
        "VpcEndpointId": "vpce-094bc15d9e29372c0",
        "VpcEndpointType": "Interface",
        "VpcId": "vpc-02cc579cdd679aa3c",
        "ServiceName": "com.amazonaws.ap-south-1.elasticloadbalancing",
        "State": "pending",
        "RouteTableIds": [],
        "SubnetIds": [],
        "Groups": [
            {
                "GroupId": "sg-0c5e7d3c211270caa",
                "GroupName": "default"
            }
        ],
        "IpAddressType": "ipv4",
        "DnsOptions": {
            "DnsRecordIpType": "ipv4"
        },
        "PrivateDnsEnabled": true,
        "RequesterManaged": false,
        "NetworkInterfaceIds": [],
        "DnsEntries": [],
        "CreationTimestamp": "2024-03-03T16:20:14.343000+00:00",
        "Tags": [
            {
                "Key": "service",
                "Value": "ELB"
            }
        ],
        "OwnerId": "728428212153"
    }
}
```
::::

VPC endpoint for EKS

```bash
aws ec2 create-vpc-endpoint \
    --vpc-id $CLUSTER_VPC \
    --vpc-endpoint-type Interface \
    --service-name com.amazonaws.$AWS_REGION.eks \
    --subnet-ids $AZ1_SUBNET $AZ2_SUBNET \
    --security-group-id $VPCE_SG \
    --tag-specifications 'ResourceType=vpc-endpoint,Tags=[{Key=service,Value=EKS}]'
```

VPC endpoint for SSM

```bash
aws ec2 create-vpc-endpoint \
    --vpc-id $CLUSTER_VPC \
    --vpc-endpoint-type Interface \
    --service-name com.amazonaws.$AWS_REGION.ssm \
    --subnet-ids $AZ1_SUBNET $AZ2_SUBNET \
    --security-group-id $VPCE_SG \
    --tag-specifications 'ResourceType=vpc-endpoint,Tags=[{Key=service,Value=SSM}]'
```

VPC endpoint for SSM messages

```bash
aws ec2 create-vpc-endpoint \
    --vpc-id $CLUSTER_VPC \
    --vpc-endpoint-type Interface \
    --service-name com.amazonaws.$AWS_REGION.ssmmessages \
    --subnet-ids $AZ1_SUBNET $AZ2_SUBNET \
    --security-group-id $VPCE_SG \
    --tag-specifications 'ResourceType=vpc-endpoint,Tags=[{Key=service,Value=ssmmessages}]'
```

VPC endpoint for EC2 messages

```bash
aws ec2 create-vpc-endpoint \
    --vpc-id $CLUSTER_VPC \
    --vpc-endpoint-type Interface \
    --service-name com.amazonaws.$AWS_REGION.ec2messages \
    --subnet-ids $AZ1_SUBNET $AZ2_SUBNET \
    --security-group-id $VPCE_SG \
    --tag-specifications 'ResourceType=vpc-endpoint,Tags=[{Key=service,Value=ec2messages}]'
```



```bash
aws eks describe-cluster --name eksworkshop-eksctl-private --query cluster.endpoint
```


This will display the API endpoint of the cluster.

```
"https://AFB4045AF25413FF766AD8CA1FF0CAEA.yl4.ap-south-1.eks.amazonaws.com"
```

Confirm that the API endpoint is private by using the nslookup command. You can see the private IP addressed assigned from the VPC CIDR range.

```bash
nslookup AFB4045AF25413FF766AD8CA1FF0CAEA.yl4.ap-south-1.eks.amazonaws.com
```

````
Server:         172.31.0.2
Address:        172.31.0.2#53

Non-authoritative answer:
Name:   AFB4045AF25413FF766AD8CA1FF0CAEA.yl4.ap-south-1.eks.amazonaws.com
Address: 10.50.153.103
Name:   AFB4045AF25413FF766AD8CA1FF0CAEA.yl4.ap-south-1.eks.amazonaws.com
Address: 10.50.176.167
````

Now both the eksworkshop-private Cloud9 instance is ready for manage the fully private cluster.

#### Test the Private connectivity of the EKS Worker Nodes

* Open AWS management console and search for EC2
* Click on **Instances** on the **EC2 Dashboard**
* Filter with "eksworkshop-eksctl-private" and select and Instance
* Click on the **Connect** button on the top and Select the **Session Manager** tab
![seesionManager](/static/images/fully-private-cluster/sessionManagerConnect.png)
* Click the **Connect** button at the bottom to open the Terminal
![seesionManagerTerminal](/static/images/fully-private-cluster/sessionManagerTerminal.png)

* Try to connect to a public site like www.google.com using curl and it would timeout. 
* Try connecting to the API enpoint of the cluster using curl. You should receive a structured JSON response.
![workerNodeTest](/static/images/fully-private-cluster/workNodeTest.png)

This proves that EKS cluster is fully private with connectivty to the private API endpoint.




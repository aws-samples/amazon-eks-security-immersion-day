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

::::expand{header="Check Output"}
```
----------------------------------------------------------------------
|                           DescribeSubnets                          |
+---------------------------+-------------------------+--------------+
|  subnet-0f0dbfbe773d48d6b |  vpc-02cc579cdd679aa3c  |  us-west-2c |
|  subnet-051cc8911bb59cd8d |  vpc-02cc579cdd679aa3c  |  us-west-2a |
|  subnet-0904b546818687aef |  vpc-02cc579cdd679aa3c  |  us-west-2b |
|  subnet-0c1f95d3789157c84 |  vpc-02cc579cdd679aa3c  |  us-west-2c |
+---------------------------+-------------------------+--------------+
```
::::

Run below commands to set few environment variables. Please fetch the subnet and VPC settings from the **Create VPC** section.

```bash

export PRIVATE_AZS="$(aws ec2 describe-availability-zones --query 'AvailabilityZones[].ZoneName' --output text --region $AWS_REGION)"
export PRIVATE_AZ1_SUBNET=$(aws ec2 describe-subnets --filters Name=tag:aws:cloudformation:stack-name,Values=eks-private-vpc Name=tag:aws:cloudformation:logical-id,Values=PrivateSubnetA Name=availability-zone,Values=${AWS_REGION}a --query "Subnets[*].[SubnetId]" --output text)
export PRIVATE_AZ2_SUBNET=$(aws ec2 describe-subnets --filters Name=tag:aws:cloudformation:stack-name,Values=eks-private-vpc Name=tag:aws:cloudformation:logical-id,Values=PrivateSubnetB Name=availability-zone,Values=${AWS_REGION}b --query "Subnets[*].[SubnetId]" --output text)
export PRIVATE_AZ3_SUBNET=$(aws ec2 describe-subnets --filters Name=tag:aws:cloudformation:stack-name,Values=eks-private-vpc Name=tag:aws:cloudformation:logical-id,Values=PrivateSubnetC Name=availability-zone,Values=${AWS_REGION}c --query "Subnets[*].[SubnetId]" --output text)
export PRIVATE_CLUSTER_VPC=$(aws ec2 describe-subnets --filters Name=tag:aws:cloudformation:stack-name,Values=eks-private-vpc Name=tag:aws:cloudformation:logical-id,Values=PrivateSubnet* Name=availability-zone,Values=${AWS_REGION}c --query "Subnets[0].[VpcId]" --output text)
export PRIVATE_CLUSTER_SG=$(aws ec2 describe-security-groups --filters Name=group-name,Values=*ClusterSharedSecurityGroup* --query "SecurityGroups[*].[GroupId]" --output text)

echo $PRIVATE_AZ1_SUBNET $PRIVATE_AZ2_SUBNET $PRIVATE_AZ3_SUBNET $PRIVATE_CLUSTER_VPC $PRIVATE_CLUSTER_SG
```

 Let's save these into bash_profile

```bash
echo "export PRIVATE_AZS=(${PRIVATE_AZS[@]})" | tee -a ~/.bash_profile
```

1. Create A VPC peering connection between the existing VPC and the new VPC.

* create and accept a VPC peering connection between your VPCs

```bash
PRIVATE_VPC_ID=$(aws ec2 describe-vpcs --filters "Name=tag:aws:cloudformation:stack-name,Values=eks-private-vpc" --query 'Vpcs[0].VpcId' --output text)

export EKS_CLUSTER1_VPC_ID=$(aws cloudformation describe-stacks --stack-name eks-bootstrap-template-ws \
--region $AWS_REGION --output text \
--query 'Stacks[0].Outputs[?OutputKey==`VPC`].OutputValue')

VpcPeeringConnectionId=$(aws ec2 create-vpc-peering-connection --vpc-id $PRIVATE_VPC_ID --peer-vpc-id $EKS_CLUSTER1_VPC_ID --output text --query 'VpcPeeringConnection.VpcPeeringConnectionId')

aws ec2 accept-vpc-peering-connection --vpc-peering-connection-id $VpcPeeringConnectionId
```

::::expand{header="Check Output"}

```bash
{
    "VpcPeeringConnection": {
        "AccepterVpcInfo": {
            "CidrBlock": "10.254.0.0/16",
            "CidrBlockSet": [
                {
                    "CidrBlock": "10.254.0.0/16"
                }
            ],
            "OwnerId": "XXXXXXXXXXXX",
            "PeeringOptions": {
                "AllowDnsResolutionFromRemoteVpc": false,
                "AllowEgressFromLocalClassicLinkToRemoteVpc": false,
                "AllowEgressFromLocalVpcToRemoteClassicLink": false
            },
            "VpcId": "vpc-existingekscluster1",
            "Region": "us-west-2"
        },
        "RequesterVpcInfo": {
            "CidrBlock": "10.50.0.0/16",
            "CidrBlockSet": [
                {
                    "CidrBlock": "10.50.0.0/16"
                }
            ],
            "OwnerId": "XXXXXXXXXXXX",
            "PeeringOptions": {
                "AllowDnsResolutionFromRemoteVpc": false,
                "AllowEgressFromLocalClassicLinkToRemoteVpc": false,
                "AllowEgressFromLocalVpcToRemoteClassicLink": false
            },
            "VpcId": "vpc-newprivateekscluster",
            "Region": "us-west-2"
        },
        "Status": {
            "Code": "provisioning",
            "Message": "Provisioning"
        },
        "Tags": [],
        "VpcPeeringConnectionId": "pcx-0dc858eeb95e4660e"
    }
}
```

::::

* create a route to the Primary EKS cluster VPC in the new Private VPC

```bash
PRIVATE_VPC_RouteTableId=$(aws ec2 describe-route-tables --filter "Name=vpc-id, Values=$PRIVATE_VPC_ID" --query 'RouteTables[0].RouteTableId' --output text)

aws ec2 create-route --route-table-id $PRIVATE_VPC_RouteTableId --destination-cidr-block 10.254.0.0/16 --vpc-peering-connection-id $VpcPeeringConnectionId

aws ec2 describe-route-tables --filters "Name=association.subnet-id,Values=$HOST_SUBNET" --query "RouteTables[0].RouteTableId" --output text

```

::::expand{header="Check Output"}

```bash
{
    "Return": true
}
```

::::

* Allow DNS resolution over the peered VPCs.
  
```bash
aws ec2 modify-vpc-peering-connection-options --vpc-peering-connection-id "pcx-0dc858eeb95e4660e" --requester-peering-connection-options '{"AllowDnsResolutionFromRemoteVpc":true}' --accepter-peering-connection-options '{"AllowDnsResolutionFromRemoteVpc":true}' --region us-west-2
```

::::expand{header="Check Output"}

```bash
{
    "AccepterPeeringConnectionOptions": {
        "AllowDnsResolutionFromRemoteVpc": true
    },
    "RequesterPeeringConnectionOptions": {
        "AllowDnsResolutionFromRemoteVpc": true
    }
}
```

::::


* create a route for the Workshop IDE's Subnet to the new Private VPC.

```bash

MAC=$(TOKEN=`curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600"` && \
curl -H "X-aws-ec2-metadata-token: $TOKEN" -v http://169.254.169.254/latest/meta-data/network/interfaces/macs/) && \
TOKEN=`curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600"` && \
HOST_SUBNET=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" -v http://169.254.169.254/latest/meta-data/network/interfaces/macs/${MAC}/subnet-id)


EKS_CLUSTER1_VPC_PublicA_RouteTableId=$(aws ec2 describe-route-tables --filter "Name=vpc-id,Values=$EKS_CLUSTER1_VPC_ID" "Name=association.subnet-id,Values=$HOST_SUBNET" --query 'RouteTables[0].RouteTableId' --output text)

aws ec2 create-route --route-table-id $EKS_CLUSTER1_VPC_PublicA_RouteTableId --destination-cidr-block 10.50.0.0/16 --vpc-peering-connection-id $VpcPeeringConnectionId
```

::::expand{header="Check Output"}

```bash
{
    "Return": true
}
```

::::

* create Inbound rule for Kubernetes Control Plane Security Group to allow communication from the 2 VPCs

```bash
aws ec2 authorize-security-group-ingress \
    --group-id ${PRIVATE_CLUSTER_SG} \
    --ip-permissions IpProtocol=-1,FromPort=-1,ToPort=-1,IpRanges="[{CidrIp=10.50.0.0/16}]" IpProtocol=-1,FromPort=-1,ToPort=-1,IpRanges="[{CidrIp=10.254.0.0/16}]"
```

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
  version: '1.28'

privateCluster:
  enabled: true
  additionalEndpointServices:
  - "autoscaling"
  - "logs"

vpc:
  securityGroup: "${PRIVATE_CLUSTER_SG}" # this is the ControlPlaneSecurityGroup
  subnets:
    private:
      ${AWS_REGION}a:
        id: ${PRIVATE_AZ1_SUBNET}
      ${AWS_REGION}b:
        id: ${PRIVATE_AZ2_SUBNET}
      ${AWS_REGION}c:
        id: ${PRIVATE_AZ3_SUBNET}
  sharedNodeSecurityGroup: ${PRIVATE_CLUSTER_SG}

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

Launching Amazon EKS and all the dependencies will take approximately 15-20 minutes

::::expand{header="Check Output"}

```bash
2024-10-09 15:15:01 [ℹ]  fully private cluster "eksworkshop-eksctl-private" has been created. For subsequent operations, eksctl must be run from within the cluster's VPC, a peered VPC or some other means like AWS Direct Connect
2024-10-09 15:15:01 [✔]  EKS cluster "eksworkshop-eksctl-private" in "us-west-2" region is ready
```

::::

You can test access to your cluster by running the following command. The output will be a list of worker nodes

```bash
kubectl get nodes
```

You should see below output

```bash
NAME                                          STATUS   ROLES    AGE   VERSION
ip-10-50-132-174.us-west-2.compute.internal   Ready    <none>   62m   v1.28.13-eks-a737599
ip-10-50-164-204.us-west-2.compute.internal   Ready    <none>   63m   v1.28.13-eks-a737599
ip-10-50-214-74.us-west-2.compute.internal    Ready    <none>   62m   v1.28.13-eks-a737599
```

This should setup an EKS cluster with Private Endpoint for the Control Plane. The details of the newly created cluster can be fetched from the above command from kubectl commands. Notice in the output the cluster creation process first enables for the Private and Public endpoint for the API server to initial provisioning of the cluster. Later the public endpoint is deleted as as a part of the eksctl command.

`eksctl` supports creation of fully-private clusters that have no outbound internet access and have only private subnets. VPC endpoints are used to enable private access to AWS services.

The only required field to create a fully-private cluster is `privateCluster.enabled`. Only private node groups (both managed and self-managed) are supported in a fully-private cluster because the cluster's VPC is created without any public subnets. The `privateNetworking` field must be explicitly set. It is an error to leave `privateNetworking` unset in a fully-private cluster.


If Karpenter is used for Auto scaling of worker nodes the following considerations are required. https://aws.github.io/aws-eks-best-practices/karpenter/#amazon-eks-private-cluster-without-outbound-internet-access

:::code{showCopyAction=true showLineNumbers=false language=yaml}
privateCluster:
  enabled: true
:::

After the EKS cluster was created and since it is a Private Cluster, there would be VPC endpoints created in the Cluster VPC to create PrivateLink with various AWS services. The following VPC endpoints are created behind the scene.

#### List the VPC endpoints created with the EKS clusters for Private access to AWS Servcies

```bash
aws ec2 describe-vpc-endpoints --filter "Name=vpc-id,Values=$PRIVATE_CLUSTER_VPC" --query VpcEndpoints[].[VpcId,VpcEndpointId,ServiceName] --output table
```


```
----------------------------------------------------------------------------
|                           DescribeVpcEndpoints                           |
+------------------------+-------------------------------------------------+
|  vpc-02cc579cdd679aa3c |  com.amazonaws.us-west-2.s3                    |
|  vpc-02cc579cdd679aa3c |  com.amazonaws.us-west-2.ecr.dkr               |
|  vpc-02cc579cdd679aa3c |  com.amazonaws.us-west-2.ecr.api               |
|  vpc-02cc579cdd679aa3c |  com.amazonaws.us-west-2.logs                  |
|  vpc-02cc579cdd679aa3c |  com.amazonaws.us-west-2.ec2                   |
|  vpc-02cc579cdd679aa3c |  com.amazonaws.us-west-2.sts                   |
|  vpc-02cc579cdd679aa3c |  com.amazonaws.us-west-2.autoscaling           ||  
+------------------------+-------------------------------------------------+
```

This Workshop would additionally require these VPC endpoints additionally. We would be creating the same below.

* elasticloadbalancing - For ALB Controller addon to create ELBs
* eks - For privately querying EKS Service APIs
* ssm - EKS Worker nodes to be accessed through SSM without opening SSH ports
* ssmmessages - EKS Worker nodes to be accessed through SSM without opening SSH ports
* ec2messages - EKS Worker nodes to be accessed through SSM without opening SSH ports

#### Create VPC endpoints

Get the Security group used by the existing VPC Endpoints.

```bash
export VPCE_SG=$(aws ec2 describe-vpc-endpoints --filter Name=vpc-id,Values=$PRIVATE_CLUSTER_VPC Name=service-name,Values=*ec2 --query VpcEndpoints[].Groups[].GroupId --output text)
```

VPC endpoint for ELB

```bash
aws ec2 create-vpc-endpoint \
    --vpc-id $PRIVATE_CLUSTER_VPC \
    --vpc-endpoint-type Interface \
    --service-name com.amazonaws.$AWS_REGION.elasticloadbalancing \
    --subnet-ids $PRIVATE_AZ1_SUBNET $PRIVATE_AZ2_SUBNET $PRIVATE_AZ3_SUBNET \
    --security-group-id $VPCE_SG \
    --tag-specifications 'ResourceType=vpc-endpoint,Tags=[{Key=service,Value=ELB}]'
```

Check sample output. This will is the JSON representation of the resource created.

::::expand{header="Check Output"}

```bash
{
    "VpcEndpoint": {
        "VpcEndpointId": "vpce-094bc15d9e29372c0",
        "VpcEndpointType": "Interface",
        "VpcId": "vpc-02cc579cdd679aa3c",
        "ServiceName": "com.amazonaws.us-west-2.elasticloadbalancing",
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
    --vpc-id $PRIVATE_CLUSTER_VPC \
    --vpc-endpoint-type Interface \
    --service-name com.amazonaws.$AWS_REGION.eks \
    --subnet-ids $PRIVATE_AZ1_SUBNET $PRIVATE_AZ2_SUBNET $PRIVATE_AZ3_SUBNET \
    --security-group-id $VPCE_SG \
    --tag-specifications 'ResourceType=vpc-endpoint,Tags=[{Key=service,Value=EKS}]'
```

VPC endpoint for SSM

```bash
aws ec2 create-vpc-endpoint \
    --vpc-id $PRIVATE_CLUSTER_VPC \
    --vpc-endpoint-type Interface \
    --service-name com.amazonaws.$AWS_REGION.ssm \
    --subnet-ids $PRIVATE_AZ1_SUBNET $PRIVATE_AZ2_SUBNET $PRIVATE_AZ3_SUBNET \
    --security-group-id $VPCE_SG \
    --tag-specifications 'ResourceType=vpc-endpoint,Tags=[{Key=service,Value=SSM}]'
```

VPC endpoint for SSM messages

```bash
aws ec2 create-vpc-endpoint \
    --vpc-id $PRIVATE_CLUSTER_VPC \
    --vpc-endpoint-type Interface \
    --service-name com.amazonaws.$AWS_REGION.ssmmessages \
    --subnet-ids $PRIVATE_AZ1_SUBNET $PRIVATE_AZ2_SUBNET $PRIVATE_AZ3_SUBNET \
    --security-group-id $VPCE_SG \
    --tag-specifications 'ResourceType=vpc-endpoint,Tags=[{Key=service,Value=ssmmessages}]'
```

VPC endpoint for EC2 messages

```bash
aws ec2 create-vpc-endpoint \
    --vpc-id $PRIVATE_CLUSTER_VPC \
    --vpc-endpoint-type Interface \
    --service-name com.amazonaws.$AWS_REGION.ec2messages \
    --subnet-ids $PRIVATE_AZ1_SUBNET $PRIVATE_AZ2_SUBNET $PRIVATE_AZ3_SUBNET \
    --security-group-id $VPCE_SG \
    --tag-specifications 'ResourceType=vpc-endpoint,Tags=[{Key=service,Value=ec2messages}]'
```

```bash
aws eks describe-cluster --name eksworkshop-eksctl-private --query cluster.endpoint
```

This will display the API endpoint of the cluster.

::::expand{header="Check Output"}

"https://AFB4045AF25413FF766AD8CA1FF0CAEA.yl4.us-west-2.eks.amazonaws.com"

::::

Confirm that the API endpoint is private using the nslookup command. You can see the private IP addresses returned for the control plane endpoint is assigned from the New Private EKS cluster VPC CIDR range after we've created the EKS VPC endpoint.

::::expand{header="Check Output"}

````bash
Server:         10.254.0.2
Address:        10.254.0.2#53

Non-authoritative answer:
Name:   AFB4045AF25413FF766AD8CA1FF0CAEA.yl4.us-west-2.eks.amazonaws.com
Address: 10.50.153.103
Name:   AFB4045AF25413FF766AD8CA1FF0CAEA.yl4.us-west-2.eks.amazonaws.com
Address: 10.50.176.167
````

::::

Now the eksworkshop-private Cloud9 instance is ready to manage the fully private cluster. The three worker nodes can be privately logged into through Session Manager.

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

This proves that EKS cluster is fully private with connectivity to the private API endpoint.

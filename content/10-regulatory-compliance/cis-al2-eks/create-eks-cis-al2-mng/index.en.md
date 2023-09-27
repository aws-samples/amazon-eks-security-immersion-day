---
title : "Create EKS-managed node group with custom build CIS hardened AMI"
weight : 22
---

With the custom ami created and ready for use , we can create a managed node group running Amazon Linux 2 configured to CIS Amazon Linux 2 Benchmark. 


Let us set some environment variables.

```bash
EKS_VPC_ID=$(eksctl get cluster eksworkshop-eksctl -ojson | jq -r '.[0]["ResourcesVpcConfig"]["VpcId"]')
echo $EKS_VPC_ID
EKS_VPC_PRIV_SUBNET1=$(eksctl get cluster eksworkshop-eksctl -ojson | jq -r '.[0]["ResourcesVpcConfig"]["SubnetIds"][0]')
echo $EKS_VPC_PRIV_SUBNET1
EKS_VPC_PRIV_SUBNET2=$(eksctl get cluster eksworkshop-eksctl -ojson | jq -r '.[0]["ResourcesVpcConfig"]["SubnetIds"][1]')
echo $EKS_VPC_PRIV_SUBNET2
EKS_VPC_PRIV_SUBNET3=$(eksctl get cluster eksworkshop-eksctl -ojson | jq -r '.[0]["ResourcesVpcConfig"]["SubnetIds"][2]')
echo $EKS_VPC_PRIV_SUBNET3
EKS_CLUSTER_SEC_GROUP_ID=$(eksctl get cluster eksworkshop-eksctl -ojson | jq -r '.[0]["ResourcesVpcConfig"]["ClusterSecurityGroupId"]')
echo $EKS_CLUSTER_SEC_GROUP_ID
```
Run the below command to create an Amazon EKS Cluster along with a managed node group using custom Amazon EKS AMI.

```bash
cd ~/environment/amazon-eks-custom-amis
cat > cis-al2-mng.yaml <<EOF
---
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
vpc:
  id: $EKS_VPC_ID
  securityGroup: $EKS_CLUSTER_SEC_GROUP_ID
  subnets:
    private:
      private-one:
        id: $EKS_VPC_PRIV_SUBNET1
      private-two:
        id: $EKS_VPC_PRIV_SUBNET2
      private-three:
        id: $EKS_VPC_PRIV_SUBNET3

metadata:
  name: $EKS_CLUSTER
  region: $AWS_REGION
  version:  $EKS_VERSION

managedNodeGroups:
- name: custom-ng-amd
  desiredCapacity: 2
  amiFamily: AmazonLinux2
  ami: $EKS_AMI_ID
  instanceType: m6i.large
  privateNetworking: true
  subnets:
     - private-one
     - private-two
     - private-three
  
  overrideBootstrapCommand: |
      #!/bin/bash
      set -ex
      iptables -I INPUT -p tcp -m tcp --dport 10250 -j ACCEPT
      /etc/eks/bootstrap.sh $EKS_CLUSTER
EOF

```

Create the managed node group
```bash
eksctl create nodegroup --config-file=cis-al2-mng.yaml
```
It will take couple of minutes to create the Amazon EKS managed nodegroup.

check output

::::expand{header="Check Output"}
```bash
vpc-030e4a3055ba71b2c
subnet-021c732a5fb47987d
subnet-0a519601dde1343db
subnet-06b2953cd4cf217a7
sg-006edc1b420a36f44
```
::::

Once the managed nodegroup is created, ensure that custome ami nodes join the cluster:

Run below command to filter only custom ami nodes.

```bash
 kubectl get nodes -l  eks.amazonaws.com/nodegroup=custom-ng-amd

```
The output will look like below.

NAME                             STATUS   ROLES    AGE    VERSION
ip-192-168-1-4.ec2.internal      Ready    <none>   3m7s   v1.26.2-eks-a59e1f0
ip-192-168-34-254.ec2.internal   Ready    <none>   3m7s   v1.26.2-eks-a59e1f0

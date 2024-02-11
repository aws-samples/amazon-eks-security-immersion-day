---
title : "Create EKS-managed node group with EKS CIS AL2 Hardened Custom AMI"
weight : 23
---

With the custom ami created and ready for use, we can create a managed node group running Amazon Linux 2 configured to CIS Amazon Linux 2 Benchmark. 


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
::::expand{header="Check Output"}
```bash
vpc-05cf31aefff9934aa
subnet-08e99c40c0940d870
subnet-0359ff8f81cd0d1d5
subnet-020879b19a498b40b
sg-0589016de7f3d2cee
```
::::

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
  iam:
      attachPolicyARNs:
        - arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy
        - arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy
        - arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
        - arn:aws:iam::aws:policy/AmazonInspector2ManagedCisPolicy
  
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
It will take approximately 10-15 minutes to create the Amazon EKS managed nodegroup.

::::expand{header="Check Output"}
```bash
2024-02-10 20:28:43 [!]  no eksctl-managed CloudFormation stacks found for "eksworkshop-eksctl", will attempt to create nodegroup(s) on non eksctl-managed cluster
2024-02-10 20:28:43 [ℹ]  nodegroup "custom-ng-amd" will use "ami-072199f45f5ae588d" [AmazonLinux2/1.28]
2024-02-10 20:28:43 [ℹ]  2 existing nodegroup(s) (mng-al2,mng-br) will be excluded
2024-02-10 20:28:43 [ℹ]  1 nodegroup (custom-ng-amd) was included (based on the include/exclude rules)
2024-02-10 20:28:43 [ℹ]  will create a CloudFormation stack for each of 1 managed nodegroups in cluster "eksworkshop-eksctl"
2024-02-10 20:28:43 [ℹ]  1 task: { 1 task: { 1 task: { create managed nodegroup "custom-ng-amd" } } }
2024-02-10 20:28:43 [ℹ]  building managed nodegroup stack "eksctl-eksworkshop-eksctl-nodegroup-custom-ng-amd"
2024-02-10 20:28:44 [ℹ]  deploying stack "eksctl-eksworkshop-eksctl-nodegroup-custom-ng-amd"
2024-02-10 20:28:44 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-nodegroup-custom-ng-amd"
2024-02-10 20:29:14 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-nodegroup-custom-ng-amd"
2024-02-10 20:29:47 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-nodegroup-custom-ng-amd"
2024-02-10 20:30:40 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-nodegroup-custom-ng-amd"
2024-02-10 20:32:00 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-nodegroup-custom-ng-amd"
2024-02-10 20:33:43 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-nodegroup-custom-ng-amd"
2024-02-10 20:35:06 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-nodegroup-custom-ng-amd"
2024-02-10 20:36:50 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-nodegroup-custom-ng-amd"
2024-02-10 20:36:50 [ℹ]  no tasks
2024-02-10 20:36:50 [✔]  created 0 nodegroup(s) in cluster "eksworkshop-eksctl"
2024-02-10 20:36:50 [ℹ]  nodegroup "custom-ng-amd" has 2 node(s)
2024-02-10 20:36:50 [ℹ]  node "ip-10-254-144-218.us-west-2.compute.internal" is ready
2024-02-10 20:36:50 [ℹ]  node "ip-10-254-179-164.us-west-2.compute.internal" is ready
2024-02-10 20:36:50 [ℹ]  waiting for at least 2 node(s) to become ready in "custom-ng-amd"
2024-02-10 20:36:50 [ℹ]  nodegroup "custom-ng-amd" has 2 node(s)
2024-02-10 20:36:50 [ℹ]  node "ip-10-254-144-218.us-west-2.compute.internal" is ready
2024-02-10 20:36:50 [ℹ]  node "ip-10-254-179-164.us-west-2.compute.internal" is ready
2024-02-10 20:36:50 [✔]  created 1 managed nodegroup(s) in cluster "eksworkshop-eksctl"
2024-02-10 20:36:50 [ℹ]  checking security group configuration for all nodegroups
2024-02-10 20:36:50 [ℹ]  all nodegroups have up-to-date cloudformation templates
```
::::

Once the managed nodegroup is created, ensure that custome ami nodes join the cluster:

Run below command to filter only custom ami nodes.

```bash
 kubectl get nodes -l  eks.amazonaws.com/nodegroup=custom-ng-amd

```
The output will look like below.

```bash
NAME                                           STATUS   ROLES    AGE     VERSION
ip-10-254-144-218.us-west-2.compute.internal   Ready    <none>   3m25s   v1.28.5-eks-5e0fdde
ip-10-254-179-164.us-west-2.compute.internal   Ready    <none>   3m25s   v1.28.5-eks-5e0fdde
```

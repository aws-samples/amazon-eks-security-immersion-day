---
title : "Create EKS-managed node group with custom build CIS hardened AMI"
weight : 22
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
It will take approximately 10-15 minutes to create the Amazon EKS managed nodegroup.

::::expand{header="Check Output"}
```bash
2023-09-28 20:11:39 [!]  no eksctl-managed CloudFormation stacks found for "eksworkshop-eksctl", will attempt to create nodegroup(s) on non eksctl-managed cluster
2023-09-28 20:11:39 [ℹ]  nodegroup "custom-ng-amd" will use "ami-0aafe4768c171cf05" [AmazonLinux2/1.25]
2023-09-28 20:11:39 [ℹ]  2 existing nodegroup(s) (mng-al2,mng-br) will be excluded
2023-09-28 20:11:39 [ℹ]  1 nodegroup (custom-ng-amd) was included (based on the include/exclude rules)
2023-09-28 20:11:39 [ℹ]  will create a CloudFormation stack for each of 1 managed nodegroups in cluster "eksworkshop-eksctl"
2023-09-28 20:11:39 [ℹ]  1 task: { 1 task: { 1 task: { create managed nodegroup "custom-ng-amd" } } }
2023-09-28 20:11:39 [ℹ]  building managed nodegroup stack "eksctl-eksworkshop-eksctl-nodegroup-custom-ng-amd"
2023-09-28 20:11:40 [ℹ]  deploying stack "eksctl-eksworkshop-eksctl-nodegroup-custom-ng-amd"
2023-09-28 20:11:40 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-nodegroup-custom-ng-amd"
2023-09-28 20:12:10 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-nodegroup-custom-ng-amd"
2023-09-28 20:13:01 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-nodegroup-custom-ng-amd"
2023-09-28 20:14:38 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-nodegroup-custom-ng-amd"
2023-09-28 20:15:56 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-nodegroup-custom-ng-amd"
2023-09-28 20:16:29 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-nodegroup-custom-ng-amd"
2023-09-28 20:17:39 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-nodegroup-custom-ng-amd"
2023-09-28 20:18:35 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-nodegroup-custom-ng-amd"
2023-09-28 20:19:51 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-nodegroup-custom-ng-amd"
2023-09-28 20:19:51 [ℹ]  no tasks
2023-09-28 20:19:51 [✔]  created 0 nodegroup(s) in cluster "eksworkshop-eksctl"
2023-09-28 20:19:51 [ℹ]  nodegroup "custom-ng-amd" has 2 node(s)
2023-09-28 20:19:51 [ℹ]  node "ip-10-254-155-211.us-west-2.compute.internal" is ready
2023-09-28 20:19:51 [ℹ]  node "ip-10-254-192-226.us-west-2.compute.internal" is ready
2023-09-28 20:19:51 [ℹ]  waiting for at least 2 node(s) to become ready in "custom-ng-amd"
2023-09-28 20:19:51 [ℹ]  nodegroup "custom-ng-amd" has 2 node(s)
2023-09-28 20:19:51 [ℹ]  node "ip-10-254-155-211.us-west-2.compute.internal" is ready
2023-09-28 20:19:51 [ℹ]  node "ip-10-254-192-226.us-west-2.compute.internal" is ready
2023-09-28 20:19:51 [✔]  created 1 managed nodegroup(s) in cluster "eksworkshop-eksctl"
2023-09-28 20:19:52 [ℹ]  checking security group configuration for all nodegroups
2023-09-28 20:19:52 [ℹ]  all nodegroups have up-to-date cloudformation templates
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
ip-10-254-155-211.us-west-2.compute.internal   Ready    <none>   5m10s   v1.25.13-eks-43840fb
ip-10-254-192-226.us-west-2.compute.internal   Ready    <none>   5m10s   v1.25.13-eks-43840fb
```

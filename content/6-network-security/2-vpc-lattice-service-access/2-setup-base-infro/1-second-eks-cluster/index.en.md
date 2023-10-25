---
title : "Create Second EKS Cluster"
weight : 10
---

## Setup the Kube Context for First EKS Cluster `eksworkshop-eksctl`

Before creating second cluster, let us first setup environment variables for the first EKS Cluster `eksworkshop-eksctl`

```bash
cd ~/environment
mkdir -p templates
mkdir -p manifests
export EKS_CLUSTER1_NAME=eksworkshop-eksctl
export EKS_CLUSTER1_CONTEXT=$(kubectl config current-context)
echo "export EKS_CLUSTER1_CONTEXT=$EKS_CLUSTER1_CONTEXT" >> ~/.bash_profile
kubectl  --context $EKS_CLUSTER1_CONTEXT get node
```

## Create Second EKS Cluster `eksworkshop-eksctl-2`

**Open a new terminal and run all the below steps in this section.**

#### Create an AWS KMS Custom Managed Key (CMK) 

Create a CMK for the EKS cluster to use when encrypting your Kubernetes secrets:

```bash
cd ~/environment
aws kms create-alias --alias-name alias/eksworkshop --target-key-id $(aws kms create-key --query KeyMetadata.Arn --output text)
```

Let's retrieve the ARN of the CMK to input into the create cluster command.

```bash
export MASTER_ARN=$(aws kms describe-key --key-id alias/eksworkshop --query KeyMetadata.Arn --output text)
echo "MASTER_ARN=$MASTER_ARN"
```
::::expand{header="Check Output"}
```bash
MASTER_ARN=arn:aws:kms:us-west-2:ACCOUNT_ID:key/7a05399d-b303-409a-acd3-5f1dafa5ff82
```
::::

We set the **MASTER_ARN** environment variable to make it easier to refer to the KMS key later.

Now, let's save the **MASTER_ARN** environment variable into the bash_profile

```bash
echo "export MASTER_ARN=${MASTER_ARN}" | tee -a ~/.bash_profile
```

### Create the EKS Cluster using eksctl tool

Create an eksctl deployment file (**eksworkshop.yaml**) used in creating your cluster using the following syntax:

```bash
export AWS_REGION=$(curl -s 169.254.169.254/latest/dynamic/instance-identity/document | jq -r '.region')
export EKS_CLUSTER2_NAME=eksworkshop-eksctl-2
export AZS=($(aws ec2 describe-availability-zones --query 'AvailabilityZones[].ZoneName' --output text --region $AWS_REGION))
echo "AZS=${AZS[@]}"
export EKS_CLUSTER1_VPC_ID=$(eksctl get cluster $EKS_CLUSTER1_NAME -ojson | jq -r '.[0]["ResourcesVpcConfig"]["VpcId"]')
echo "EKS_CLUSTER1_VPC_ID=$EKS_CLUSTER1_VPC_ID"
export EKS_CLUSTER1_VPC_CIDR=$(aws ec2 describe-vpcs --vpc-ids $EKS_CLUSTER1_VPC_ID \
  --query "Vpcs[].CidrBlock" \
  --region $AWS_REGION \
  --output text)
echo "EKS_CLUSTER1_VPC_CIDR=$EKS_CLUSTER1_VPC_CIDR"
cat << EOF > eksworkshop.yaml
---
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig

metadata:
  name: $EKS_CLUSTER2_NAME
  region: ${AWS_REGION}
  version: "1.28"
vpc:
  cidr: $EKS_CLUSTER1_VPC_CIDR

availabilityZones: ["${AZS[0]}", "${AZS[1]}", "${AZS[2]}"]

managedNodeGroups:
- name: mng-al2
  desiredCapacity: 3
  instanceTypes:
  - t3a.large
  - t3.large
  - m4.large
  - m5a.large
  - m5.large
  
# To enable all of the control plane logs, uncomment below:
# cloudWatch:
#  clusterLogging:
#    enableTypes: ["*"]

secretsEncryption:
  keyARN: ${MASTER_ARN}
EOF
```

::::expand{header="Check Output"}
```bash
AZS=us-west-2a us-west-2b us-west-2c us-west-2d
EKS_CLUSTER1_VPC_ID=vpc-0bacccb5d3d4d9cb5
EKS_CLUSTER1_VPC_CIDR=10.254.0.0/16
```
::::

Next, use the file you created as the input for the eksctl cluster creation.


```bash
eksctl create cluster -f eksworkshop.yaml
```

::alert[Launching Amazon EKS and all the dependencies will take approximately 15 minutes. We will come back to this Section Later. Please proceed to next section for now.]{header="Note"}

Once the EKS Cluster is completed, the above eksctl command output looks like below.

::::expand{header="Check Output"}
```bash
2023-10-25 07:02:07 [ℹ]  eksctl version 0.163.0
2023-10-25 07:02:07 [ℹ]  using region us-west-2
2023-10-25 07:02:07 [ℹ]  subnets for us-west-2a - public:10.254.0.0/19 private:10.254.96.0/19
2023-10-25 07:02:07 [ℹ]  subnets for us-west-2b - public:10.254.32.0/19 private:10.254.128.0/19
2023-10-25 07:02:07 [ℹ]  subnets for us-west-2c - public:10.254.64.0/19 private:10.254.160.0/19
2023-10-25 07:02:07 [ℹ]  nodegroup "mng-al2" will use "" [AmazonLinux2/1.28]
2023-10-25 07:02:07 [ℹ]  using Kubernetes version 1.28
2023-10-25 07:02:07 [ℹ]  creating EKS cluster "eksworkshop-eksctl-2" in "us-west-2" region with managed nodes
2023-10-25 07:02:07 [ℹ]  1 nodegroup (mng-al2) was included (based on the include/exclude rules)
2023-10-25 07:02:07 [ℹ]  will create a CloudFormation stack for cluster itself and 0 nodegroup stack(s)
2023-10-25 07:02:07 [ℹ]  will create a CloudFormation stack for cluster itself and 1 managed nodegroup stack(s)
2023-10-25 07:02:07 [ℹ]  if you encounter any issues, check CloudFormation console or try 'eksctl utils describe-stacks --region=us-west-2 --cluster=eksworkshop-eksctl-2'
2023-10-25 07:02:07 [ℹ]  Kubernetes API endpoint access will use default of {publicAccess=true, privateAccess=false} for cluster "eksworkshop-eksctl-2" in "us-west-2"
2023-10-25 07:02:07 [ℹ]  CloudWatch logging will not be enabled for cluster "eksworkshop-eksctl-2" in "us-west-2"
2023-10-25 07:02:07 [ℹ]  you can enable it with 'eksctl utils update-cluster-logging --enable-types={SPECIFY-YOUR-LOG-TYPES-HERE (e.g. all)} --region=us-west-2 --cluster=eksworkshop-eksctl-2'
2023-10-25 07:02:07 [ℹ]  
2 sequential tasks: { create cluster control plane "eksworkshop-eksctl-2", 
    2 sequential sub-tasks: { 
        wait for control plane to become ready,
        create managed nodegroup "mng-al2",
    } 
}
2023-10-25 07:02:07 [ℹ]  building cluster stack "eksctl-eksworkshop-eksctl-2-cluster"
2023-10-25 07:02:08 [ℹ]  deploying stack "eksctl-eksworkshop-eksctl-2-cluster"
2023-10-25 07:02:38 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-2-cluster"
2023-10-25 07:03:08 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-2-cluster"
2023-10-25 07:04:08 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-2-cluster"
2023-10-25 07:05:08 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-2-cluster"
2023-10-25 07:06:08 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-2-cluster"
2023-10-25 07:07:08 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-2-cluster"
2023-10-25 07:08:08 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-2-cluster"
2023-10-25 07:09:08 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-2-cluster"
2023-10-25 07:10:08 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-2-cluster"
2023-10-25 07:11:08 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-2-cluster"
2023-10-25 07:12:08 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-2-cluster"
2023-10-25 07:13:08 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-2-cluster"
2023-10-25 07:15:09 [ℹ]  building managed nodegroup stack "eksctl-eksworkshop-eksctl-2-nodegroup-mng-al2"
2023-10-25 07:15:09 [ℹ]  deploying stack "eksctl-eksworkshop-eksctl-2-nodegroup-mng-al2"
2023-10-25 07:15:09 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-2-nodegroup-mng-al2"
2023-10-25 07:15:39 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-2-nodegroup-mng-al2"
2023-10-25 07:16:22 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-2-nodegroup-mng-al2"
2023-10-25 07:18:02 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-2-nodegroup-mng-al2"
2023-10-25 07:18:02 [ℹ]  waiting for the control plane to become ready
2023-10-25 07:18:02 [✔]  saved kubeconfig as "/home/ec2-user/.kube/config"
2023-10-25 07:18:02 [ℹ]  no tasks
2023-10-25 07:18:02 [✔]  all EKS cluster resources for "eksworkshop-eksctl-2" have been created
2023-10-25 07:18:02 [ℹ]  nodegroup "mng-al2" has 3 node(s)
2023-10-25 07:18:02 [ℹ]  node "ip-10-254-2-86.us-west-2.compute.internal" is ready
2023-10-25 07:18:02 [ℹ]  node "ip-10-254-62-120.us-west-2.compute.internal" is ready
2023-10-25 07:18:02 [ℹ]  node "ip-10-254-73-123.us-west-2.compute.internal" is ready
2023-10-25 07:18:02 [ℹ]  waiting for at least 3 node(s) to become ready in "mng-al2"
2023-10-25 07:18:02 [ℹ]  nodegroup "mng-al2" has 3 node(s)
2023-10-25 07:18:02 [ℹ]  node "ip-10-254-2-86.us-west-2.compute.internal" is ready
2023-10-25 07:18:02 [ℹ]  node "ip-10-254-62-120.us-west-2.compute.internal" is ready
2023-10-25 07:18:03 [ℹ]  node "ip-10-254-73-123.us-west-2.compute.internal" is ready
2023-10-25 07:18:03 [ℹ]  kubectl command should work with "/home/ec2-user/.kube/config", try 'kubectl get nodes'
2023-10-25 07:18:03 [✔]  EKS cluster "eksworkshop-eksctl-2" in "us-west-2" region is ready
```
::::


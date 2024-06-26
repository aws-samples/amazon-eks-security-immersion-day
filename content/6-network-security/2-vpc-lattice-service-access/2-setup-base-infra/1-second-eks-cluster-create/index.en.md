---
title : "Create Second EKS Cluster"
weight : 10
---

## Create folder for the module

```bash
cd ~/environment
mkdir -p templates
mkdir -p manifests
```

## Create Second EKS Cluster `eksworkshop-eksctl-2`

**Open a new terminal and run all the below steps in this section.**

<!-- EKS Pod-Identity is not supported on 1.29 on 02.2024 -->
```bash
export EKS_CLUSTER2_NAME=eksworkshop-eksctl-2
echo "export EKS_CLUSTER2_NAME=$EKS_CLUSTER2_NAME" >> ~/.bash_profile
eksdemo create cluster $EKS_CLUSTER2_NAME --vpc-cidr 10.254.0.0/16 -N 3 --version 1.28 
```

<!--
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
export EKS_CLUSTER2_NAME=eksworkshop-eksctl-2
echo "export EKS_CLUSTER2_NAME=$EKS_CLUSTER2_NAME" >> ~/.bash_profile
export AZS=($(aws ec2 describe-availability-zones --query 'AvailabilityZones[].ZoneName' --output text --region $AWS_REGION))
echo "AZS=${AZS[@]}"
export EKS_CLUSTER1_VPC_ID=$(eksctl get cluster $EKS_CLUSTER1_NAME -ojson | jq -r '.[0]["ResourcesVpcConfig"]["VpcId"]')
echo "EKS_CLUSTER1_VPC_ID=$EKS_CLUSTER1_VPC_ID"
echo "export EKS_CLUSTER1_VPC_ID=$EKS_CLUSTER1_VPC_ID" >> ~/.bash_profile
export EKS_CLUSTER1_VPC_CIDR=$(aws ec2 describe-vpcs --vpc-ids $EKS_CLUSTER1_VPC_ID \
  --query "Vpcs[].CidrBlock" \
  --region $AWS_REGION \
  --output text)
echo "EKS_CLUSTER1_VPC_CIDR=$EKS_CLUSTER1_VPC_CIDR"
cat << EOF > manifests/eksworkshop.yaml
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
  - c5.large
  - m5a.large
  - m5.large

#To enable eks managed addons
addons:
  - name: eks-pod-identity-agent # required for `iam.podIdentityAssociations`
    tags:
      team: eks

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
eksctl create cluster -f manifests/eksworkshop.yaml
```
-->

::alert[Launching Amazon EKS and all the dependencies will take approximately 15 minutes. We will come back to this Section Later. Please proceed to next section for now.]{header="Note"}

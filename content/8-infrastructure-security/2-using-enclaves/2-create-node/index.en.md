---
title : "Create Enclave Node"
weight : 22
---

To begin with, check the existing node group(s) and nodes in the existing cluster

```bash
kubectl get nodes -L eks.amazonaws.com/nodegroup
```

## Create a launch template to launch the enclave-enabled worker nodes

Create user-data file called `eks-enclave-user-data.txt`

```bash
touch eks-enclave-user-data.txt
```

Copy and paste the following content in the user data file `eks-enclave-user-data.txt`, which automates the AWS Nitro Enclaves CLI installation, and preallocates the memory and the vCPUs for enclaves on the instance.

```bash
MIME-Version: 1.0
Content-Type: multipart/mixed; boundary="==MYBOUNDARY=="

--==MYBOUNDARY==
Content-Type: text/x-shellscript; charset="us-ascii"

#!/bin/bash
echo "Running custom user data script"

readonly NE_ALLOCATOR_SPEC_PATH="/etc/nitro_enclaves/allocator.yaml"
# Node resources that will be allocated for Nitro Enclaves
readonly CPU_COUNT=<CPU_COUNT>
readonly MEMORY_MIB=<MEMORY_MIB>

# This step below is needed to install nitro-enclaves-allocator service.
amazon-linux-extras install aws-nitro-enclaves-cli -y

# Update enclave's allocator specification: allocator.yaml
sed -i "s/cpu_count:.*/cpu_count: $CPU_COUNT/g" $NE_ALLOCATOR_SPEC_PATH
sed -i "s/memory_mib:.*/memory_mib: $MEMORY_MIB/g" $NE_ALLOCATOR_SPEC_PATH
# Restart the nitro-enclaves-allocator service to take changes effect.
systemctl restart nitro-enclaves-allocator.service
echo "NE user data script has finished successfully."

--==MYBOUNDARY==--
```

Edit the file `eks-enclave-user-data.txt` content. For the `CPU_COUNT` and `MEMORY_MIB` variables in the user data, specify the number of vCPUs and amount of memory (in MiB) respectively. For the purpose of this module, set the `<CPU_COUNT>` to `4` vCPUs and the `<MEMORY_MIB>` to `768` MiB of memory.

::::expand{header="Expected file output"}
```bash
MIME-Version: 1.0
Content-Type: multipart/mixed; boundary="==MYBOUNDARY=="

--==MYBOUNDARY==
Content-Type: text/x-shellscript; charset="us-ascii"

#!/bin/bash
echo "Running custom user data script"

readonly NE_ALLOCATOR_SPEC_PATH="/etc/nitro_enclaves/allocator.yaml"
# Node resources that will be allocated for Nitro Enclaves
readonly CPU_COUNT=4
readonly MEMORY_MIB=768

# This step below is needed to install nitro-enclaves-allocator service.
amazon-linux-extras install aws-nitro-enclaves-cli -y

# Update enclave's allocator specification: allocator.yaml
sed -i "s/cpu_count:.*/cpu_count: $CPU_COUNT/g" $NE_ALLOCATOR_SPEC_PATH
sed -i "s/memory_mib:.*/memory_mib: $MEMORY_MIB/g" $NE_ALLOCATOR_SPEC_PATH
# Restart the nitro-enclaves-allocator service to take changes effect.
systemctl restart nitro-enclaves-allocator.service
echo "NE user data script has finished successfully."

--==MYBOUNDARY==--
```
::::

Convert the user data to base64.

```bash
export BASE64_RANDOM_OUTPUT=$(base64 -w 0 eks-enclave-user-data.txt && echo)
echo $BASE64_RANDOM_OUTPUT
```

::::expand{header="Check Output"}

```bash
TUlNRS1WZXJzaW9uOiAxLjAKQ29udGVudC1UeXBlOiBtdWx0aXBhcnQvbWl4ZWQ7IGJvdW5kYXJ5PSI9PU1ZQk9VTkRBUlk9PSIKCi0tPT1NWUJPVU5EQVJZPT0KQ29udGVudC1U
eXBlOiB0ZXh0L3gtc2hlbGxzY3JpcHQ7IGNoYXJzZXQ9InVzLWFzY2lpIgoKIyEvYmluL2Jhc2ggLWUKcmVhZG9ubHkgTkVfQUlcy9hbGxvY2F0b3IueWFtbCIKIyBOb2RlIHJlc
291cmNlcyB0aGF0IHdpbGwgYmUgYWxsb2NhdGVkIGZvciBOaXRybyBFbmNsYXZlcwpyZWFkb25seSBDUFVfQ09VTlQ9MgpyZWFkb25seSBNRU1PUllfTUlCPTc2OAoKIyBUaGlzI
Gluc3RhbGwgbml0cm8tZW5jbGF2ZXMtYWxsb2NhdG9yIHNlcnZpY2UuCmFtYXpvbi1saW51eC1leHRyYXMgaW5zdGFsbCBhd3Mtbml0cm8tZW5jbGF2ZXMtY2xpIC15CgojIFVwZ
GF0ZSBlbmNsYXZlJ3MgYWxsb2NhdG9yIHNwZWNpZmljYXRpb246IGFsbG9jYXRvci55YW1sCnNlZCAtaSAicy9jcHVfY291bnQ6LiovY3B1X2NvdW50OiAvZyIgCnNlZCAtaSAic
y9tZW1vcnlfbWliOi4qL21lbW9yeV9taWI6IC9nIiAKIyBSZXN0YXJ0IHRoZSBuaXRyby1lbmNsYXZlcy1hbGxvY2F0b3Igc2VydmljZSB0byB0YWtlIGNoYW5nZXMgZWZmZWN0L
y1lbmNsYXZlcy1hbGxvY2F0b3Iuc2VydmljZQplY2hvICJORSB1c2VyIGRhdGEgc2NyaXB0IGhhcyBmaW5pc2hlZCBzdWNjZXNzZnVsbHkuIgotLT09TVlCT1VOREFSWT09Cgy==
```
::::

Create the launch template

```bash
LAUNCH_TEMPLATE=$(aws ec2 create-launch-template \
    --launch-template-name eksenclaves \
    --version-description 'Using Enclaves with Amazon EKS' \
    --launch-template-data "{\"UserData\":\"$BASE64_RANDOM_OUTPUT\",\"EnclaveOptions\":{\"Enabled\":true},\"InstanceType\": \"m5.2xlarge\",\"TagSpecifications\":[{\"ResourceType\":\"instance\",\"Tags\":[{\"Key\":\"purpose\",\"Value\":\"enclave\"}]}]}" --query 'LaunchTemplate.LaunchTemplateId' --output text)

echo $LAUNCH_TEMPLATE
```

::::expand{header="Check Output"}

```bash
lt-01234567890abcdef
```

::::

## Create a node group in the existing Amazon EKS cluster

Firstly, get the parameters needed to create a new node group from the existing node group in the cluster:

```bash
SUBNETS=(`aws eks describe-cluster --name $EKS_CLUSTER --query 'cluster.resourcesVpcConfig.subnetIds' --output text`)
SUBNET1=${SUBNETS[0]}
SUBNET2=${SUBNETS[1]}
SUBNET3=${SUBNETS[2]}
NODE_ROLE=$(aws eks describe-nodegroup --nodegroup-name mng-al2 --cluster-name ${EKS_CLUSTER} --query 'nodegroup.nodeRole' --output text)
```

Create the node group in the existing Amazon EKS cluster using AWS CLI.  The node group will use `amazon-linux-2023/x86_64/standard` for Amazon Linux 2023 (AL2023) `x86` based instance.

```bash
aws eks create-nodegroup  \
    --cluster-name ${EKS_CLUSTER} \
    --nodegroup-name enclaves \
    --node-role ${NODE_ROLE} \
    --subnets "${SUBNET1}" "${SUBNET2}" "${SUBNET3}" \
    --scaling-config minSize=1,maxSize=2,desiredSize=1 \
    --launch-template id="${LAUNCH_TEMPLATE}" \
    --labels '{"aws-nitro-enclaves-k8s-dp": "enabled"}' \
    --tags '{"workshop-module": "enclaves"}'
```

::::expand{header="Check Output"}

```bash
{
    "nodegroup": {
        "nodegroupName": "enclaves",
        "nodegroupArn": "arn:aws:eks:us-west-2:11111111111:nodegroup/eksworkshop-eksctl/enclaves/94c8bd94-a09c-1231-c14b-df2aacb83d9e",
        "clusterName": "eksworkshop-eksctl",
        "version": "1.28",
        "releaseVersion": "1.28.11-20240817",
        "createdAt": "2024-08-22T17:36:28.985000+00:00",
        "modifiedAt": "2024-08-22T17:36:28.985000+00:00",
        "status": "CREATING",
        "capacityType": "ON_DEMAND",
        "scalingConfig": {
            "minSize": 1,
            "maxSize": 2,
            "desiredSize": 1
        },
        "subnets": [
            "subnet-01234567890abcdef",
            "subnet-02234567890abcdef",
            "subnet-03234567890abcdef"
        ],
        "amiType": "AL2_x86_64",
        "nodeRole": "arn:aws:iam::11111111111:role/eks-bootstrap-template-ws-EKSNodegroupRole-HzYVceH6dJgT",
        "labels": {
            "aws-nitro-enclaves-k8s-dp": "enabled"
        },
        "health": {
            "issues": []
        },
        "updateConfig": {
            "maxUnavailable": 1
        },
        "launchTemplate": {
            "name": "eksenclaves",
            "version": "1",
            "id": "lt-01234567890abcdef"
        },
        "tags": {
            "workshop-module": "enclaves"
        }
    }
}
```

::::

After about 3 minutes, verify the new node group named enclaves with an EC2 instance has been created

```bash
kubectl get nodes -o custom-columns=Name:.metadata.name,Nodegroup:.metadata.labels."eks\.amazonaws\.com/nodegroup" 
```

::::expand{header="Check Output"}

```bash
Name                                           Nodegroup
ip-10-254-133-18.us-west-2.compute.internal    enclaves
ip-10-254-138-215.us-west-2.compute.internal   mng-al2
ip-10-254-168-158.us-west-2.compute.internal   mng-al2
ip-10-254-215-53.us-west-2.compute.internal    mng-al2
```

::::


The new worker node has been labelled `aws-nitro-enclaves-k8s-dp=enabled`. Get Nodes pre-labelled:

```bash
kubectl get nodes -L eks.amazonaws.com/nodegroup -l aws-nitro-enclaves-k8s-dp=enabled
```

::::expand{header="Check Output"}

```bash
NAME                                           STATUS   ROLES    AGE   VERSION               NODEGROUP
ip-10-254-133-18.us-west-2.compute.internal     Ready    <none>   27h   v1.28.8-eks-ae9a62a   enclaves
```

::::

Verify the allocatable resources on the worker node

```bash
kubectl describe node -l aws-nitro-enclaves-k8s-dp=enabled | egrep 'Capacity|Allocatable' -A5
```

::::expand{header="Check Output"}

```bash
Capacity:
  aws.ec2.nitro/nitro_enclaves:  1
  cpu:                           8
  ephemeral-storage:             20959212Ki
  hugepages-1Gi:                 0
  hugepages-2Mi:                 4Gi
--
Allocatable:
  aws.ec2.nitro/nitro_enclaves:  1
  cpu:                           7910m
  ephemeral-storage:             18242267924
  hugepages-1Gi:                 0
  hugepages-2Mi:                 4Gi
```

::::

## Install the Nitro Enclaves Kubernetes device plugin

Deploy the Nitro Enclaves Kubernetes device plugin to the cluster and then enable it on each worker node in the cluster using **kubectl**. The plugin enables the pods on each worker node to access the [Nitro Enclaves device driver](https://docs.kernel.org/virt/ne_overview.html). The plugin is deployed to the Kubernetes cluster as a [daemonset](https://kubernetes.io/docs/concepts/workloads/controllers/daemonset/).

Confirm there is a worker node on which to install the Nitro Enclaves Kubernetes device plugin using the following command. 

```bash
kubectl get node -L aws-nitro-enclaves-k8s-dp
```

::::expand{header="Check example output"}

```bash
NAME                                           STATUS   ROLES    AGE   VERSION               AWS-NITRO-ENCLAVES-K8S-DP
ip-10-254-138-215.us-west-2.compute.internal   Ready    <none>   29h   v1.28.8-eks-ae9a62a   
ip-10-254-168-158.us-west-2.compute.internal    Ready    <none>   29h   v1.28.8-eks-ae9a62a   
ip-10-254-133-18.us-west-2.compute.internal     Ready    <none>   27h   v1.28.8-eks-ae9a62a   enabled
ip-10-254-215-53.us-west-2.compute.internal    Ready    <none>   29h   v1.28.8-eks-ae9a62a  
```

::::

The node with AWS-NITRO-ENCLAVES-K8S-DP marked as **enabled** will be selected by the Nitro Enclaves Kubernetes device plugin.

To deploy the device plugin to your Kubernetes cluster, use the following command:

```bash
kubectl apply -f https://raw.githubusercontent.com/aws/aws-nitro-enclaves-k8s-device-plugin/main/aws-nitro-enclaves-k8s-ds.yaml
```

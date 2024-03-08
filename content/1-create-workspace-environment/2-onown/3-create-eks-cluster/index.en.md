---
title : "Create Amazon EKS Cluster"
weight : 24
---


Create an eksctl deployment file (**eksworkshop.yaml**) used in creating your cluster using the following syntax:

```bash
cat << EOF > eksworkshop.yaml
---
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig

metadata:
  name: eksworkshop-eksctl
  region: ${AWS_REGION}
  version: "1.28"

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

#To enable eks managed addons
# addons:
#   - name: eks-pod-identity-agent # required for `iam.podIdentityAssociations`
#     tags:
#       team: eks

# To enable all of the control plane logs, uncomment below:
# cloudWatch:
#  clusterLogging:
#    enableTypes: ["*"]

secretsEncryption:
  keyARN: ${MASTER_ARN}
EOF
```

Next, use the file you created as the input for the eksctl cluster creation.


```bash
eksctl create cluster -f eksworkshop.yaml
```

Launching Amazon EKS and all the dependencies will take approximately 15 minutes

You can test access to your cluster by running the following command. The output will be a list of worker nodes

```bash
kubectl get nodes
```

You should see below output

```bash
NAME                                           STATUS   ROLES    AGE    VERSION
ip-10-254-128-55.us-west-2.compute.internal    Ready    <none>   3h9m   v1.28.1-eks-43840fb
ip-10-254-180-171.us-west-2.compute.internal   Ready    <none>   3h9m   v1.28.1-eks-43840fb
ip-10-254-217-72.us-west-2.compute.internal    Ready    <none>   3h9m   v1.28.1-eks-43840fb
```

Export variables:

```bash
export EKS_CLUSTER=eksworkshop-eksctl >> ~/.bash_profile
export EKS_CLUSTER1_NAME=eksworkshop-eksctl >> ~/.bash_profile
export EKS_CLUSTER1_CONTEXT=$(kubectl config current-context)
echo "export EKS_CLUSTER1_CONTEXT=$EKS_CLUSTER1_CONTEXT" >> ~/.bash_profile
source ~/.bash_profile
```
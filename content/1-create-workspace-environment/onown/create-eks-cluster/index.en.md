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
  version: "1.27"

availabilityZones: ["${AZS[0]}", "${AZS[1]}", "${AZS[2]}"]

managedNodeGroups:
- name: mng-al2
  desiredCapacity: 3
  instanceType: t3a.large

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
NAME                                           STATUS   ROLES    AGE   VERSION
ip-10-254-141-66.us-west-2.compute.internal    Ready    <none>   12h   v1.27.4-eks-8ccc7ba
ip-10-254-208-115.us-west-2.compute.internal   Ready    <none>   12h   v1.27.4-eks-8ccc7ba
ip-10-254-248-189.us-west-2.compute.internal   Ready    <none>   12h   v1.27.4-eks-8ccc7ba
```

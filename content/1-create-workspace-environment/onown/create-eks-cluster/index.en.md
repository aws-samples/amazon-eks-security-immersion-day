---
title : "Create EKS Cluster"
weight : 24
---


::alert[`eksctl` version must be 0.58.0 or above to deploy EKS 1.21, [click here](/1-create-workspace-environment/onown/setup-tools))) to get the latest version.]{header="WARNING" type="warning"}


Create an eksctl deployment file (**eksworkshop.yaml**) use in creating your cluster using the following syntax:

```bash
cat << EOF > eksworkshop.yaml
---
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig

metadata:
  name: eksworkshop-eksctl
  region: ${AWS_REGION}
  version: "1.25"

availabilityZones: ["${AZS[0]}", "${AZS[1]}", "${AZS[2]}"]

managedNodeGroups:
- name: nodegroup
  desiredCapacity: 3
  instanceType: t3.small
  ssh:
    enableSsm: true

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

Launching EKS and all the dependencies will take approximately 15 minutes


---
title : "Cleanup"
weight : 26
---

Once you have completed this chapter, you can cleanup the files and resources you created by issuing the following commands:

```bash
kubectl delete -f deployment_spec.yaml
```

Delete the enclave node group

```bash
aws eks delete-nodegroup  \
    --cluster-name ${EKS_CLUSTER} \
    --nodegroup-name enclaves
```

Delete the launch template

```bash
aws ec2 delete-launch-template \
    --launch-template-name eksenclaves
```

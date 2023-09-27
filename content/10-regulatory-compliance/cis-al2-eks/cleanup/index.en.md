---
title : "Cleanup"
weight : 28
---

Use these commands to delete the resources created during this post:

Delete the Kubernetes Job and the sample deployment.

```bash
cd cd ~/environment/amazon-eks-custom-amis
 kubectl delete -f nginx-deploy.yaml
```
Check Output
```bash
job.batch "eks-cis-benchmark" deleted
deployment.apps "nginx" deleted
```
::::

Delete Amazon EKS Managed nodegroup

```bash
cd cd ~/environment/amazon-eks-custom-amis
eksctl delete nodegroup -f cluster.yaml --approve --wait
```

::::expand{header="Check Output"}
```bash
2023-03-16 09:30:27 [ℹ]  comparing 0 nodegroups defined in the given config ("br-mng.yaml") against remote state
2023-03-16 09:30:27 [ℹ]  1 nodegroup (bottlerocket-mng) was included (based on the include/exclude rules)
2023-03-16 09:30:27 [ℹ]  will drain 1 nodegroup(s) in cluster "eksworkshop-eksctl"
2023-03-16 09:30:27 [ℹ]  starting parallel draining, max in-flight of 1
2023-03-16 09:30:27 [ℹ]  cordon node "ip-10-254-152-139.us-west-2.compute.internal"
2023-03-16 09:30:27 [✔]  drained all nodes: [ip-10-254-152-139.us-west-2.compute.internal]
2023-03-16 09:30:27 [ℹ]  will delete 1 nodegroups from cluster "eksworkshop-eksctl"
2023-03-16 09:30:27 [ℹ]  1 task: { 1 task: { delete nodegroup "bottlerocket-mng" } }
2023-03-16 09:30:27 [ℹ]  will delete stack "eksctl-eksworkshop-eksctl-nodegroup-bottlerocket-mng"
2023-03-16 09:30:27 [ℹ]  waiting for stack "eksctl-eksworkshop-eksctl-nodegroup-bottlerocket-mng" to get deleted
2023-03-16 09:30:27 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-nodegroup-bottlerocket-mng"
2023-03-16 09:30:57 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-nodegroup-bottlerocket-mng"
2023-03-16 09:31:52 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-nodegroup-bottlerocket-mng"
2023-03-16 09:33:35 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-nodegroup-bottlerocket-mng"
2023-03-16 09:33:35 [ℹ]  will delete 0 nodegroups from auth ConfigMap in cluster "eksworkshop-eksctl"
2023-03-16 09:33:35 [✔]  deleted 1 nodegroup(s) from cluster "eksworkshop-eksctl"
```
::::

Delete the AMI

```bash
aws ec2 deregister-image --image-id $EKS_AMI_ID
```


Delete the repositiory
```bash
cd ~/environment/
rm -rf amazon-eks-custom-amis/
```
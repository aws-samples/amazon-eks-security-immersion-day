---
title : "Cleanup"
weight : 28
---

Use these commands to delete the resources created during this post:

Delete the Kubernetes Job and the sample deployment.

```bash
cd ~/environment/amazon-eks-custom-amis
kubectl delete -f nginx-deploy.yaml
```
Check Output
```bash
deployment.apps "nginx" deleted
```

Delete Amazon EKS Managed nodegroup. This may take around 5 minutes.

```bash
cd ~/environment/amazon-eks-custom-amis
eksctl delete nodegroup -f cis-al2-mng.yaml --approve --wait
```

::::expand{header="Check Output"}
```bash
2024-02-10 22:13:47 [ℹ]  comparing 0 nodegroups defined in the given config ("cis-al2-mng.yaml") against remote state
2024-02-10 22:13:47 [ℹ]  1 nodegroup (custom-ng-amd) was included (based on the include/exclude rules)
2024-02-10 22:13:47 [ℹ]  will drain 1 nodegroup(s) in cluster "eksworkshop-eksctl"
2024-02-10 22:13:47 [ℹ]  starting parallel draining, max in-flight of 1
2024-02-10 22:13:47 [ℹ]  cordon node "ip-10-254-144-218.us-west-2.compute.internal"
2024-02-10 22:13:47 [ℹ]  cordon node "ip-10-254-179-164.us-west-2.compute.internal"
2024-02-10 22:13:47 [✔]  drained all nodes: [ip-10-254-179-164.us-west-2.compute.internal ip-10-254-144-218.us-west-2.compute.internal]
2024-02-10 22:13:47 [ℹ]  will delete 1 nodegroups from cluster "eksworkshop-eksctl"
2024-02-10 22:13:47 [ℹ]  1 task: { 1 task: { delete nodegroup "custom-ng-amd" } }
2024-02-10 22:13:47 [ℹ]  will delete stack "eksctl-eksworkshop-eksctl-nodegroup-custom-ng-amd"
2024-02-10 22:13:47 [ℹ]  waiting for stack "eksctl-eksworkshop-eksctl-nodegroup-custom-ng-amd" to get deleted
2024-02-10 22:13:47 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-nodegroup-custom-ng-amd"
2024-02-10 22:14:17 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-nodegroup-custom-ng-amd"
2024-02-10 22:15:15 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-nodegroup-custom-ng-amd"
2024-02-10 22:16:46 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-nodegroup-custom-ng-amd"
2024-02-10 22:16:46 [✔]  deleted 1 nodegroup(s) from cluster "eksworkshop-eksctl"
```
::::

Delete the AMI

```bash
aws ec2 deregister-image --image-id $EKS_AMI_ID
```


Delete the repository
```bash
cd ~/environment/
rm -rf amazon-eks-custom-amis/
```
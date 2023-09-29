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
2023-09-28 20:43:43 [ℹ]  comparing 0 nodegroups defined in the given config ("cis-al2-mng.yaml") against remote state
2023-09-28 20:43:43 [ℹ]  1 nodegroup (custom-ng-amd) was included (based on the include/exclude rules)
2023-09-28 20:43:43 [ℹ]  will drain 1 nodegroup(s) in cluster "eksworkshop-eksctl"
2023-09-28 20:43:43 [ℹ]  starting parallel draining, max in-flight of 1
2023-09-28 20:43:43 [ℹ]  cordon node "ip-10-254-155-211.us-west-2.compute.internal"
2023-09-28 20:43:43 [ℹ]  cordon node "ip-10-254-192-226.us-west-2.compute.internal"
2023-09-28 20:43:43 [✔]  drained all nodes: [ip-10-254-192-226.us-west-2.compute.internal ip-10-254-155-211.us-west-2.compute.internal]
2023-09-28 20:43:43 [ℹ]  will delete 1 nodegroups from cluster "eksworkshop-eksctl"
2023-09-28 20:43:43 [ℹ]  1 task: { 1 task: { delete nodegroup "custom-ng-amd" } }
2023-09-28 20:43:43 [ℹ]  will delete stack "eksctl-eksworkshop-eksctl-nodegroup-custom-ng-amd"
2023-09-28 20:43:43 [ℹ]  waiting for stack "eksctl-eksworkshop-eksctl-nodegroup-custom-ng-amd" to get deleted
2023-09-28 20:43:43 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-nodegroup-custom-ng-amd"
2023-09-28 20:44:13 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-nodegroup-custom-ng-amd"
2023-09-28 20:45:04 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-nodegroup-custom-ng-amd"
2023-09-28 20:46:08 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-nodegroup-custom-ng-amd"
2023-09-28 20:47:06 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-nodegroup-custom-ng-amd"
2023-09-28 20:47:06 [ℹ]  will delete 0 nodegroups from auth ConfigMap in cluster "eksworkshop-eksctl"
2023-09-28 20:47:06 [✔]  deleted 1 nodegroup(s) from cluster "eksworkshop-eksctl"
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
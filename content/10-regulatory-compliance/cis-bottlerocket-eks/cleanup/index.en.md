---
title : "Cleanup"
weight : 28
---

Use these commands to delete the resources created during this post:

Delete the Kubernetes Job and the sample deployment.

```bash
cd ~/environment/containers-blog-maelstrom/cis-bottlerocket-benchmark-eks/
kubectl delete -f job-eks.yaml
kubectl delete -f deploy-nginx.yaml
```

::::expand{header="Check Output"}
```bash
job.batch "eks-cis-benchmark" deleted
deployment.apps "nginx" deleted
```
::::

Delete the Amazon ECR Repositories

```bash
aws ecr delete-repository --repository-name ${BOOTSTRAP_ECR_REPO} --force
aws ecr delete-repository --repository-name ${VALIDATION_ECR_REPO} --force
```

::::expand{header="Check Output"}
```json
{
    "repository": {
        "repositoryArn": "arn:aws:ecr:us-west-2:XXXXXXXXXX:repository/bottlerocket-cis-bootstrap-image",
        "registryId": "XXXXXXXXXX",
        "repositoryName": "bottlerocket-cis-bootstrap-image",
        "repositoryUri": "XXXXXXXXXX.dkr.ecr.us-west-2.amazonaws.com/bottlerocket-cis-bootstrap-image",
        "createdAt": "2023-03-16T08:55:53+00:00",
        "imageTagMutability": "MUTABLE"
    }
}

{
    "repository": {
        "repositoryArn": "arn:aws:ecr:us-west-2:XXXXXXXXXX:repository/bottlerocket-cis-validation-image",
        "registryId": "XXXXXXXXXX",
        "repositoryName": "bottlerocket-cis-validation-image",
        "repositoryUri": "XXXXXXXXXX.dkr.ecr.us-west-2.amazonaws.com/bottlerocket-cis-validation-image",
        "createdAt": "2023-03-16T09:10:49+00:00",
        "imageTagMutability": "MUTABLE"
    }
}
```
::::


Delete Amazon EKS Managed nodegroup

```bash
cd ~/environment/containers-blog-maelstrom/cis-bottlerocket-benchmark-eks/
eksctl delete nodegroup -f br-mng.yaml --approve --wait
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

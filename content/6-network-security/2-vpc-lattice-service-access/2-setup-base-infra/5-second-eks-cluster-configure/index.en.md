---
title : "Configure Kube Context for Second EKS Cluster"
weight : 14
---

## Setup the Kube Context for Second EKS Cluster `eksworkshop-eksctl-2`

By this time, the Second EKS Cluster creation would have been completed. Go to the other terminal, where you run `eksctl` command earlier and check the status.

::::expand{header="Check Output"}
```bash
2023-10-25 07:02:07 [ℹ]  eksctl version 0.163.0
2023-10-25 07:02:07 [ℹ]  using region us-west-2
2023-10-25 07:02:07 [ℹ]  subnets for us-west-2a - public:10.254.0.0/19 private:10.254.96.0/19
2023-10-25 07:02:07 [ℹ]  subnets for us-west-2b - public:10.254.32.0/19 private:10.254.128.0/19
2023-10-25 07:02:07 [ℹ]  subnets for us-west-2c - public:10.254.64.0/19 private:10.254.160.0/19
2023-10-25 07:02:07 [ℹ]  nodegroup "mng-al2" will use "" [AmazonLinux2/1.28]
2023-10-25 07:02:07 [ℹ]  using Kubernetes version 1.28
2023-10-25 07:02:07 [ℹ]  creating EKS cluster "eksworkshop-eksctl-2" in "us-west-2" region with managed nodes
2023-10-25 07:02:07 [ℹ]  1 nodegroup (mng-al2) was included (based on the include/exclude rules)
2023-10-25 07:02:07 [ℹ]  will create a CloudFormation stack for cluster itself and 0 nodegroup stack(s)
2023-10-25 07:02:07 [ℹ]  will create a CloudFormation stack for cluster itself and 1 managed nodegroup stack(s)
2023-10-25 07:02:07 [ℹ]  if you encounter any issues, check CloudFormation console or try 'eksctl utils describe-stacks --region=us-west-2 --cluster=eksworkshop-eksctl-2'
2023-10-25 07:02:07 [ℹ]  Kubernetes API endpoint access will use default of {publicAccess=true, privateAccess=false} for cluster "eksworkshop-eksctl-2" in "us-west-2"
2023-10-25 07:02:07 [ℹ]  CloudWatch logging will not be enabled for cluster "eksworkshop-eksctl-2" in "us-west-2"
2023-10-25 07:02:07 [ℹ]  you can enable it with 'eksctl utils update-cluster-logging --enable-types={SPECIFY-YOUR-LOG-TYPES-HERE (e.g. all)} --region=us-west-2 --cluster=eksworkshop-eksctl-2'
2023-10-25 07:02:07 [ℹ]  
2 sequential tasks: { create cluster control plane "eksworkshop-eksctl-2", 
    2 sequential sub-tasks: { 
        wait for control plane to become ready,
        create managed nodegroup "mng-al2",
    } 
}
2023-10-25 07:02:07 [ℹ]  building cluster stack "eksctl-eksworkshop-eksctl-2-cluster"
2023-10-25 07:02:08 [ℹ]  deploying stack "eksctl-eksworkshop-eksctl-2-cluster"
2023-10-25 07:02:38 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-2-cluster"
2023-10-25 07:03:08 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-2-cluster"
2023-10-25 07:04:08 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-2-cluster"
2023-10-25 07:05:08 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-2-cluster"
2023-10-25 07:06:08 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-2-cluster"
2023-10-25 07:07:08 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-2-cluster"
2023-10-25 07:08:08 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-2-cluster"
2023-10-25 07:09:08 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-2-cluster"
2023-10-25 07:10:08 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-2-cluster"
2023-10-25 07:11:08 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-2-cluster"
2023-10-25 07:12:08 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-2-cluster"
2023-10-25 07:13:08 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-2-cluster"
2023-10-25 07:15:09 [ℹ]  building managed nodegroup stack "eksctl-eksworkshop-eksctl-2-nodegroup-mng-al2"
2023-10-25 07:15:09 [ℹ]  deploying stack "eksctl-eksworkshop-eksctl-2-nodegroup-mng-al2"
2023-10-25 07:15:09 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-2-nodegroup-mng-al2"
2023-10-25 07:15:39 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-2-nodegroup-mng-al2"
2023-10-25 07:16:22 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-2-nodegroup-mng-al2"
2023-10-25 07:18:02 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-2-nodegroup-mng-al2"
2023-10-25 07:18:02 [ℹ]  waiting for the control plane to become ready
2023-10-25 07:18:02 [✔]  saved kubeconfig as "/home/ec2-user/.kube/config"
2023-10-25 07:18:02 [ℹ]  no tasks
2023-10-25 07:18:02 [✔]  all EKS cluster resources for "eksworkshop-eksctl-2" have been created
2023-10-25 07:18:02 [ℹ]  nodegroup "mng-al2" has 3 node(s)
2023-10-25 07:18:02 [ℹ]  node "ip-10-254-2-86.us-west-2.compute.internal" is ready
2023-10-25 07:18:02 [ℹ]  node "ip-10-254-62-120.us-west-2.compute.internal" is ready
2023-10-25 07:18:02 [ℹ]  node "ip-10-254-73-123.us-west-2.compute.internal" is ready
2023-10-25 07:18:02 [ℹ]  waiting for at least 3 node(s) to become ready in "mng-al2"
2023-10-25 07:18:02 [ℹ]  nodegroup "mng-al2" has 3 node(s)
2023-10-25 07:18:02 [ℹ]  node "ip-10-254-2-86.us-west-2.compute.internal" is ready
2023-10-25 07:18:02 [ℹ]  node "ip-10-254-62-120.us-west-2.compute.internal" is ready
2023-10-25 07:18:03 [ℹ]  node "ip-10-254-73-123.us-west-2.compute.internal" is ready
2023-10-25 07:18:03 [ℹ]  kubectl command should work with "/home/ec2-user/.kube/config", try 'kubectl get nodes'
2023-10-25 07:18:03 [✔]  EKS cluster "eksworkshop-eksctl-2" in "us-west-2" region is ready
```
::::

Run below command to check the current kube context. Ensure that it will show the second EKS cluster context.

```bash
kubectl config current-context
```

The output should show like below.

```bash
i-0cc5291b1d346659f@eksworkshop-eksctl-2.us-west-2.eksctl.io
```

Let us setup environment variables for the second EKS Cluster `eksworkshop-eksctl-2`

```bash
export EKS_CLUSTER2_NAME=eksworkshop-eksctl-2
export EKS_CLUSTER2_VPC_ID=$(eksctl get cluster $EKS_CLUSTER2_NAME -ojson | jq -r '.[0]["ResourcesVpcConfig"]["VpcId"]')
echo "EKS_CLUSTER2_VPC_ID=$EKS_CLUSTER2_VPC_ID"
echo "export EKS_CLUSTER2_VPC_ID=$EKS_CLUSTER2_VPC_ID" >> ~/.bash_profile

export EKS_CLUSTER2_CONTEXT=$(kubectl config current-context)
echo "export EKS_CLUSTER2_CONTEXT=$EKS_CLUSTER2_CONTEXT" >> ~/.bash_profile
kubectl  --context $EKS_CLUSTER2_CONTEXT get node
```

::::expand{header="Check Output"}
```bash
NAME                                          STATUS   ROLES    AGE    VERSION
ip-10-254-2-86.us-west-2.compute.internal     Ready    <none>   119m   v1.28.1-eks-43840fb
ip-10-254-62-120.us-west-2.compute.internal   Ready    <none>   119m   v1.28.1-eks-43840fb
ip-10-254-73-123.us-west-2.compute.internal   Ready    <none>   119m   v1.28.1-eks-43840fb
```
::::

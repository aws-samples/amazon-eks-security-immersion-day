---
title : "Create EKS-managed node group with Bottlerocket AMI"
weight : 22
---

With the bootstrap container created and ready for use in Amazon ECR, we can create a managed node group running Bottlerocket configured to CIS Bottlerocket Benchmark. 


Let us set some environment variables.

```bash
EKS_VPC_ID=$(eksctl get cluster eksworkshop-eksctl -ojson | jq -r '.[0]["ResourcesVpcConfig"]["VpcId"]')
echo $EKS_VPC_ID

EKS_VPC_PRIV_SUBNET1=$(eksctl get cluster eksworkshop-eksctl -ojson | jq -r '.[0]["ResourcesVpcConfig"]["SubnetIds"][0]')
echo $EKS_VPC_PRIV_SUBNET1
EKS_VPC_PRIV_SUBNET2=$(eksctl get cluster eksworkshop-eksctl -ojson | jq -r '.[0]["ResourcesVpcConfig"]["SubnetIds"][1]')
echo $EKS_VPC_PRIV_SUBNET2
EKS_VPC_PRIV_SUBNET3=$(eksctl get cluster eksworkshop-eksctl -ojson | jq -r '.[0]["ResourcesVpcConfig"]["SubnetIds"][2]')
echo $EKS_VPC_PRIV_SUBNET3

EKS_CLUSTER_SEC_GROUP_ID=$(eksctl get cluster eksworkshop-eksctl -ojson | jq -r '.[0]["ResourcesVpcConfig"]["ClusterSecurityGroupId"]')
echo $EKS_CLUSTER_SEC_GROUP_ID
```

::::expand{header="Check Output"}
```bash
vpc-030e4a3055ba71b2c
subnet-021c732a5fb47987d
subnet-0a519601dde1343db
subnet-06b2953cd4cf217a7
sg-006edc1b420a36f44
```
::::

Run the following cat command to insert the environment variables defined earlier into the cluster.yaml file located in the root of the GitHub repository.

```bash
cd ~/environment/containers-blog-maelstrom/cis-bottlerocket-benchmark-eks/
cat > br-mng.yaml <<EOF
---
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
vpc:
  id: $EKS_VPC_ID
  securityGroup: $EKS_CLUSTER_SEC_GROUP_ID
  subnets:
    private:
      private-one:
        id: $EKS_VPC_PRIV_SUBNET1
      private-two:
        id: $EKS_VPC_PRIV_SUBNET2
      private-three:
        id: $EKS_VPC_PRIV_SUBNET3
metadata:
  name: eksworkshop-eksctl
  region: $AWS_REGION
  version: '1.25'

managedNodeGroups:
  - name: bottlerocket-mng
    instanceType: m5.large
    desiredCapacity: 1
    privateNetworking: true
    subnets:
      - private-one
      - private-two
      - private-three
    amiFamily: Bottlerocket
    iam:
       attachPolicyARNs:
          - arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy
          - arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy
          - arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly
          - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
    ssh:
        allow: false
    bottlerocket:
      settings:
        motd: "Hello from eksctl! - custom user data for Bottlerocket"
        bootstrap-containers:
          # 3.4
          cis-bootstrap:
            source: $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$BOOTSTRAP_ECR_REPO:latest
            mode: always
        kernel:
          # 1.5.2
          lockdown: "integrity"
          modules:
            # 1.1.1.1
            udf:
              allowed: false
            # 3.3.1
            sctp:
              allowed: false
          sysctl:
               # 3.1.1
               "net.ipv4.conf.all.send_redirects": "0"
               "net.ipv4.conf.default.send_redirects": "0"
               
               # 3.2.2
               "net.ipv4.conf.all.accept_redirects": "0"
               "net.ipv4.conf.default.accept_redirects": "0"
               "net.ipv6.conf.all.accept_redirects": "0"
               "net.ipv6.conf.default.accept_redirects": "0"
               
               # 3.2.3
               "net.ipv4.conf.all.secure_redirects": "0"
               "net.ipv4.conf.default.secure_redirects": "0"
               
               # 3.2.4
               "net.ipv4.conf.all.log_martians": "1"
               "net.ipv4.conf.default.log_martians": "1"
EOF
```

[Bottlerocket configuration settings](https://github.com/bottlerocket-os/bottlerocket#settings) are passed through to the managed nodes through user data in TOML format as referenced above to include the setting referencing the bootstrap container we created. 

To provision the cluster, run the following:

```bash
eksctl create nodegroup -f br-mng.yaml
```
It will take couple of minutes to create the Amazon EKS managed nodegroup.

::::expand{header="Check Output"}
```bash
2023-03-14 18:14:46 [!]  no eksctl-managed CloudFormation stacks found for "eksworkshop-eksctl", will attempt to create nodegroup(s) on non eksctl-managed cluster
2023-03-14 18:14:46 [ℹ]  nodegroup "bottlerocket-mng" will use "" [Bottlerocket/1.25]
2023-03-14 18:14:46 [ℹ]  2 existing nodegroup(s) (EKSNodegroup-y3DRhRdZRTlm,EKSNodegroupBottlerocket-SfbjgDKn4rVG) will be excluded
2023-03-14 18:14:46 [ℹ]  1 nodegroup (bottlerocket-mng) was included (based on the include/exclude rules)
2023-03-14 18:14:46 [ℹ]  will create a CloudFormation stack for each of 1 managed nodegroups in cluster "eksworkshop-eksctl"
2023-03-14 18:14:46 [ℹ]  1 task: { 1 task: { 1 task: { create managed nodegroup "bottlerocket-mng" } } }
2023-03-14 18:14:46 [ℹ]  building managed nodegroup stack "eksctl-eksworkshop-eksctl-nodegroup-bottlerocket-mng"
2023-03-14 18:14:46 [ℹ]  deploying stack "eksctl-eksworkshop-eksctl-nodegroup-bottlerocket-mng"
2023-03-14 18:14:46 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-nodegroup-bottlerocket-mng"
2023-03-14 18:15:17 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-nodegroup-bottlerocket-mng"
2023-03-14 18:16:08 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-nodegroup-bottlerocket-mng"
2023-03-14 18:17:19 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-nodegroup-bottlerocket-mng"
2023-03-14 18:18:09 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-nodegroup-bottlerocket-mng"
2023-03-14 18:19:01 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-nodegroup-bottlerocket-mng"
2023-03-14 18:19:01 [ℹ]  no tasks
2023-03-14 18:19:01 [✔]  created 0 nodegroup(s) in cluster "eksworkshop-eksctl"
2023-03-14 18:19:01 [ℹ]  nodegroup "bottlerocket-mng" has 1 node(s)
2023-03-14 18:19:01 [ℹ]  node "ip-10-254-177-246.us-west-2.compute.internal" is ready
2023-03-14 18:19:01 [ℹ]  waiting for at least 1 node(s) to become ready in "bottlerocket-mng"
2023-03-14 18:19:01 [ℹ]  nodegroup "bottlerocket-mng" has 1 node(s)
2023-03-14 18:19:01 [ℹ]  node "ip-10-254-177-246.us-west-2.compute.internal" is ready
2023-03-14 18:19:01 [✔]  created 1 managed nodegroup(s) in cluster "eksworkshop-eksctl"
2023-03-14 18:19:01 [ℹ]  checking security group configuration for all nodegroups
2023-03-14 18:19:01 [ℹ]  all nodegroups have up-to-date cloudformation templates
```
::::

Once the managed nodegroup is created, ensure that bottlerocket nodes join the cluster:

Run below command to filter only bottlerocket nodes.

```bash
kubectl get node -leks.amazonaws.com/nodegroup=bottlerocket-mng
```

The output will look like below.

```bash
NAME                            STATUS   ROLES    AGE    VERSION
ip-192-168-28-39.ec2.internal   Ready    <none>   108s   v1.25.6-eks-48e63af
```

Once the managed nodegroup has been provisioned, you can verify the bootstrap container ran successfully on the Bottlerocket host. Since we configured our node group without SSH access, we’ll use [AWS Systems Manager Session Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html) to connect to the Bottlerocket [control container](https://github.com/bottlerocket-os/bottlerocket#control-container), enter the [admin container](https://github.com/bottlerocket-os/bottlerocket#admin-container), and through the admin container obtain access to a host root shell:

Run the below command to create an SSM session with bottlerocket node.

```bash
aws ssm start-session --target $(aws ec2 describe-instances --filters "Name=tag:Name,Values=eksworkshop-eksctl-bottlerocket-mng-Node" | jq -r '.[][0]["Instances"][0]["InstanceId"]')
```

::::expand{header="Check Output"}
```bash
Starting session with SessionId: i-0d45e819f38a652ea-0d75f54772f0f4085
          Welcome to Bottlerocket's control container!
    ╱╲    
   ╱┄┄╲   This container gives you access to the Bottlerocket API,
   │▗▖│   which in turn lets you inspect and configure the system.
  ╱│  │╲  You'll probably want to use the `apiclient` tool for that;
  │╰╮╭╯│  for example, to inspect the system:
    ╹╹
             apiclient -u /settings

You can run `apiclient --help` for usage details, and check the main
Bottlerocket documentation for descriptions of all settings and examples of
changing them.

If you need to debug the system further, you can use the admin container.  The
admin container has more debugging tools installed and allows you to get root
access to the host.  The easiest way to get started is like this, which enables
and enters the admin container using apiclient:

   enter-admin-container

You can also access the admin container through SSH if you have network access.
Just enable the container like this, then SSH to the host:

   enable-admin-container

You can disable the admin container like this:

   disable-admin-container

[ssm-user@control]$ 
```
::::

In the SSM shell, Run the below commands in the same order `enter-admin-container`, `sudo sheltie` and `journalctl -u` as shown below and then followed by `exit`, `exit` and `exit` to return the terminal.

```bash
[ssm-user@control]$ enter-admin-container
[root@admin]# sudo sheltie
bash-5.1# journalctl -u bootstrap-containers@cis-bootstrap.service
Nov 22 15:37:17 ip-192-168-42-35.ec2.internal host-ctr[1598]: time="2022-11-22T15:37:17Z" level=info msg="successfully started container task"
Nov 22 15:37:17 ip-192-168-42-35.ec2.internal host-ctr[1598]: time="2022-11-22T15:37:17Z" level=info msg="container task exited" code=0
Nov 22 15:37:17 ip-192-168-42-35.ec2.internal bootstrap-containers[1711]: 15:37:17 [INFO] bootstrap-containers started
Nov 22 15:37:17 ip-192-168-42-35.ec2.internal bootstrap-containers[1711]: 15:37:17 [INFO] Mode for 'cis-bootstrap' is 'once'
Nov 22 15:37:17 ip-192-168-42-35.ec2.internal bootstrap-containers[1711]: 15:37:17 [INFO] Turning off container 'cis-bootstrap'
Nov 22 15:37:17 ip-192-168-42-35.ec2.internal systemd[1]: Finished bootstrap container cis-bootstrap.

bash-5.1# exit
exit
[root@admin]# exit
exit
[ssm-user@control]$ exit
exit
Exiting session with sessionId: i-0d45e819f38a652ea-09be5b7991b5823d4.
```



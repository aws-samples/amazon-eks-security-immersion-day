---
title : "Create EKS-managed node group with Bottlerocket AMI"
weight : 22
---

With the bootstrap container created and ready for use in Amazon ECR, we can create a managed node group running Bottlerocket configured to CIS Bottlerocket Benchmark. 

Run the following cat command to insert the environment variables defined earlier into the cluster.yaml file located in the root of the GitHub repository.

```bash
cd ~/environment/containers-blog-maelstrom/cis-bottlerocket-benchmark-eks/
cat > br-mng.yaml <<EOF
---
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig

metadata:
  name: eksworkshop-eksctl
  region: $AWS_REGION
  version: '1.25'

managedNodeGroups:
  - name: bottlerocket-mng
    instanceType: m5.large
    desiredCapacity: 1
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
It will take couple of minutes to create the EKS managed nodegroup.

::::expand{header="Check Output"}
```bash
2023-03-10 11:34:17 [ℹ]  nodegroup "bottlerocket-mng" will use "" [Bottlerocket/1.23]
2023-03-10 11:34:20 [ℹ]  7 existing nodegroup(s) (eksworkshop-eksctl-ng,false,mng1,mng2,ng-3f4edeea,ng-8de513ec,self-ng) will be excluded
2023-03-10 11:34:20 [ℹ]  1 nodegroup (bottlerocket-mng) was included (based on the include/exclude rules)
2023-03-10 11:34:20 [ℹ]  will create a CloudFormation stack for each of 1 managed nodegroups in cluster "eksworkshop-eksctl"
2023-03-10 11:34:20 [ℹ]  
2 sequential tasks: { fix cluster compatibility, 1 task: { 1 task: { create managed nodegroup "bottlerocket-mng" } } 
}
2023-03-10 11:34:20 [ℹ]  checking cluster stack for missing resources
2023-03-10 11:34:21 [ℹ]  cluster stack has all required resources
2023-03-10 11:34:25 [ℹ]  building managed nodegroup stack "eksctl-eksworkshop-eksctl-nodegroup-bottlerocket-mng"
2023-03-10 11:34:26 [ℹ]  deploying stack "eksctl-eksworkshop-eksctl-nodegroup-bottlerocket-mng"
2023-03-10 11:34:26 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-nodegroup-bottlerocket-mng"
2023-03-10 11:34:56 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-nodegroup-bottlerocket-mng"
2023-03-10 11:35:35 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-nodegroup-bottlerocket-mng"
2023-03-10 11:37:23 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-nodegroup-bottlerocket-mng"
2023-03-10 11:37:25 [ℹ]  no tasks
2023-03-10 11:37:25 [✔]  created 0 nodegroup(s) in cluster "eksworkshop-eksctl"
2023-03-10 11:37:25 [ℹ]  nodegroup "bottlerocket-mng" has 1 node(s)
2023-03-10 11:37:25 [ℹ]  node "ip-192-168-28-39.ec2.internal" is ready
2023-03-10 11:37:25 [ℹ]  waiting for at least 1 node(s) to become ready in "bottlerocket-mng"
2023-03-10 11:37:25 [ℹ]  nodegroup "bottlerocket-mng" has 1 node(s)
2023-03-10 11:37:25 [ℹ]  node "ip-192-168-28-39.ec2.internal" is ready
2023-03-10 11:37:25 [✔]  created 1 managed nodegroup(s) in cluster "eksworkshop-eksctl"
2023-03-10 11:37:30 [ℹ]  checking security group configuration for all nodegroups
2023-03-10 11:37:30 [ℹ]  all nodegroups have up-to-date cloudformation templates
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
ip-192-168-28-39.ec2.internal   Ready    <none>   108s   v1.23.15-eks-69f0cbf
```

Once the managed nodegroup has been provisioned, you can verify the bootstrap container ran successfully on the Bottlerocket host. Since we configured our node group without SSH access, we’ll use [AWS Systems Manager Session Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html) to connect to the Bottlerocket [control container](https://github.com/bottlerocket-os/bottlerocket#control-container), enter the [admin container](https://github.com/bottlerocket-os/bottlerocket#admin-container), and through the admin container obtain access to a host root shell:

Run the below command to create an SSM session with bottlerocket node.

```bash
aws ssm start-session --target $(aws ec2 describe-instances --filters "Name=tag:Name,Values=bottlerocket-cis-blog-eks-bottlerocket-mng-Node" | jq -r '.[][0]["Instances"][0]["InstanceId"]')
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
bash-5.1# journalctl -u 
bootstrap-containers@cis-bootstrap.service
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



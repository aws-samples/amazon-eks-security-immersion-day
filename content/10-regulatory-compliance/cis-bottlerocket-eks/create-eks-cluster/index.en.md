---
title : "Create Amazon EKS cluster with Amazon EKS-managed node group with Bottlerocket AMI"
weight : 22
---

With the bootstrap container created and ready for use in Amazon ECR, we can create an Amazon EKS cluster with a managed node group running Bottlerocket configured to CIS Bottlerocket Benchmark. 

Run the following cat command to insert the environment variables defined earlier into the cluster.yaml file located in the root of the GitHub repository.

```bash
cd ..
cat > cluster.yaml <<EOF
---
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig

metadata:
  name: bottlerocket-cis-blog-eks
  region: us-west-2
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
eksctl create cluster -f cluster.yaml
```

The cluster provisioning takes 10 to 15 minutes — now would be a great time to grab a cup of coffee.

Once the cluster is created, ensure that kubectl is functional:


```bash
kubectl get nodes
NAME                             STATUS   ROLES    AGE    VERSION
ip-192-168-16-96.ec2.internal   Ready    <none>   4m36s   v1.25.4-eks-4360b32
```

Once the cluster has been provisioned, you can verify the bootstrap container ran successfully on the Bottlerocket host. Since we configured our node group without SSH access, we’ll use [AWS Systems Manager Session Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html) to connect to the Bottlerocket [control container](https://github.com/bottlerocket-os/bottlerocket#control-container), enter the [admin container](https://github.com/bottlerocket-os/bottlerocket#admin-container), and through the admin container obtain access to a host root shell:


```bash
aws ssm start-session --target $(aws ec2 describe-instances --filters "Name=tag:Name,Values=bottlerocket-cis-blog-eks-bottlerocket-mng-Node" | jq -r '.[][0]["Instances"][0]["InstanceId"]')
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



---
title: "Accessing Bottlerocket host"
weight: 21
---

In this section of the workshop, you will scale the pre-existing EKS Bottlerocket Managed Node Group (MNG) and access the node. Bottlerocket improves security posture by removing all shells from the Bottlerocket image. Bottlerocket’s API-first/container-centric approach also helps simplify fleet management. For example, Bottlerocket integrates with AWS Systems Manager, which is collection of services that you can use to view and control your infrastructure on AWS, including Bottlerocket instances.

1. Set environment variable for Bottlerocket MNG

```bash
export BR_MNG_NAME="mng-br"

echo "export BR_MNG_NAME=$BR_MNG_NAME" | tee -a ~/.bash_profile
```

2. Verify the EKS cluster and node groups

```bash
eksctl get cluster -n $EKS_CLUSTER -r $AWS_REGION -o json | jq -M ".[] | {Name,Version,Status,CreatedAt}"
eksctl get nodegroups -c $EKS_CLUSTER -r $AWS_REGION -o json | jq -M ".[] | {Cluster,Name,Status,ImageID,Type}"
```

::::expand{header="Check Output"}

```
{
  "Name": "eksworkshop-eksctl",
  "Version": "1.28",
  "Status": "ACTIVE",
  "CreatedAt": "2024-02-01T23:03:24.669Z"
}
```

```
{
  "Cluster": "eksworkshop-eksctl",
  "Name": "main",
  "Status": "ACTIVE",
  "ImageID": "ami-xxxxxxx",
  "Type": "managed"
}
```

::::

3. Create the EKS Bottlerocket MNG `mng-br`.

```bash
eksctl create nodegroup --cluster $EKS_CLUSTER \
  --region $AWS_REGION --name $BR_MNG_NAME \
  --nodes-min 0 --nodes 1 --nodes-max 2 \
  --node-ami-family Bottlerocket --managed
```

::::expand{header="Check Output"}

```
2024-12-05 08:19:39 [ℹ]  will use version 1.30 for new nodegroup(s) based on control plane version
2024-12-05 08:19:40 [ℹ]  nodegroup "mng-br" will use "" [Bottlerocket/1.30]
2024-12-05 08:19:40 [ℹ]  1 existing nodegroup(s) (main) will be excluded
2024-12-05 08:19:40 [ℹ]  1 nodegroup (mng-br) was included (based on the include/exclude rules)
2024-12-05 08:19:40 [ℹ]  will create a CloudFormation stack for each of 1 managed nodegroups in cluster "eksworkshop-eksctl"
2024-12-05 08:19:41 [ℹ]  
2 sequential tasks: { fix cluster compatibility, 1 task: { 1 task: { create managed nodegroup "mng-br" } } 
}
2024-12-05 08:19:41 [ℹ]  checking cluster stack for missing resources
2024-12-05 08:19:41 [ℹ]  cluster stack has all required resources
2024-12-05 08:19:41 [ℹ]  building managed nodegroup stack "eksctl-eksworkshop-eksctl-nodegroup-mng-br"
2024-12-05 08:19:41 [ℹ]  deploying stack "eksctl-eksworkshop-eksctl-nodegroup-mng-br"
2024-12-05 08:19:41 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-nodegroup-mng-br"
2024-12-05 08:20:11 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-nodegroup-mng-br"
2024-12-05 08:21:10 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-nodegroup-mng-br"
2024-12-05 08:21:44 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-nodegroup-mng-br"
2024-12-05 08:22:40 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-nodegroup-mng-br"
2024-12-05 08:22:40 [ℹ]  no tasks
2024-12-05 08:22:40 [✔]  created 0 nodegroup(s) in cluster "eksworkshop-eksctl"
2024-12-05 08:22:40 [✔]  created 1 managed nodegroup(s) in cluster "eksworkshop-eksctl"
2024-12-05 08:22:40 [ℹ]  checking security group configuration for all nodegroups
2024-12-05 08:22:40 [ℹ]  all nodegroups have up-to-date cloudformation templates
```

::::

4. Check the node status of `mng-br` MNG and wait for `Ready` status.

```bash
while [ "`kubectl get nodes -l eks.amazonaws.com/nodegroup=$BR_MNG_NAME | grep -v STATUS | awk '{print $2}'`" != "Ready" ]
do
  echo -e "`date` - Waiting for the Bottlerocket Node to be ready. Please wait...\n"
  sleep 15
done
echo -e "\nBottlerocket Node is ready. Please proceed with the next steps.\n"
```

::::expand{header="Check Output"}

```
No resources found
Fri Dec 11 06:50:08 UTC 2023 - Waiting for the Bottlerocket Node to be ready. Please wait...

Bottlerocket Node is ready. Please proceed with the next steps.

```

::::

5. Find the Instance ID of the node in `mng-br` MNG.

```bash
export INSTANCE_IP=$(kubectl get nodes -l eks.amazonaws.com/nodegroup=$BR_MNG_NAME -o json | jq -r '.items[0].metadata.annotations."alpha.kubernetes.io/provided-node-ip"')

export INSTANCE_ID=$(aws ec2 describe-instances --filters Name=private-ip-address,Values=$INSTANCE_IP | jq -r '.[][].Instances[].InstanceId')

echo "export INSTANCE_ID=$INSTANCE_ID" | tee -a ~/.bash_profile
```

6. Bottlerocket images do not have an SSH server nor even a shell. Bottlerocket does, however, give you out-of-band access that allows you to launch a shell from a container to explore, debug, manually update, and change settings on the host.

_Bottlerocket image has several [variants](https://bottlerocket.dev/en/os/latest/#/concepts/variants/). Bottlerocket runs [two instances](https://bottlerocket.dev/en/os/latest/#/concepts/components/) of the container runtime, containerd, in order to isolate orchestrator-driven workloads (i.e., customer workloads managed through EKS) from system workloads ( the `admin` and `control` containers). This helps reduce the blast radius of possible problems with the orchestrated workloads and keep the underlying system functional._ On Kubernetes variants, Bottlerocket runs Kubelet to communicate with the Kubernetes control plane and orchestrate container lifecycles.

![bottlerocket_intro](/static/images/infrastructure-security/bottlerocket/bottlerocket_intro.png)

7. Bottlerocket has a `control` container that provides a first-tier host access, where you can make [API](https://bottlerocket.dev/en/os/latest/#/concepts/api-driven/) calls and gain access to some host-level resources. For Kubernetes variants of Bottlerocket images, the `control` container is enabled by default and remote connections are made through AWS SSM. Connect to the Bottlerocket node using AWS CLI.

```bash
aws ssm start-session --target $INSTANCE_ID
```

::::expand{header="Check Output"}

```
Starting session with SessionId: i-04f194f1c2a94affe-0bb0cee34f8ec35d7
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
```

::::

8. Bottlerocket ships with a tool called `apiclient` which provides a command line interface for interacting with the API. List the [host containers](https://github.com/bottlerocket-os/bottlerocket/blob/develop/README.md#custom-host-containers) enabled in the Bottlerocket image variant.

```bash
apiclient get settings.host-containers
```

::::expand{header="Check Output"}

```
{
  "settings": {
    "host-containers": {
      "admin": {
        "enabled": false,
        "source": "328549459982.dkr.ecr.us-west-2.amazonaws.com/bottlerocket-admin:v0.11.1",
        "superpowered": true,
        "user-data": "eyJzc2giOnsiYXV0aG9yaXplZC1rZXlzIjpbXX19"
      },
      "control": {
        "enabled": true,
        "source": "328549459982.dkr.ecr.us-west-2.amazonaws.com/bottlerocket-control:v0.7.5",
        "superpowered": false
      }
    }
  }
}
```

::::

9. Above command returns two host-containers `admin` and `control`. Admin container is designed to provide out-of-band access with elevated privileges. For Kubernetes variants of Bottlerocket images, the `admin` container is not enabled by default, but can be turned on or entered through the `control` container. The best security practice is to disable the `admin` container and only enable it as-needed. For this workshop, you can enable the admin container for testing purposes.

```bash
enable-admin-container
```

::::expand{header="Check Output"}

```
Enabling admin container
The admin container is now enabled - it should pull and start soon, and then you can SSH in or use 'apiclient exec admin bash'.
You can also use 'enter-admin-container' to enable, wait, and connect in one step.
```

::::

10. Access the `admin` container from the control container. We will explore use cases for `admin` container in the remaining labs of this module. `Note:` _As mentioned in the previous command output, you can also use 'enter-admin-container' to enable, wait, and connect in one step._

```bash
enter-admin-container
```

::::expand{header="Check Output"}

```
Confirming admin container is enabled...
Waiting for admin container to start...
Entering admin container
          Welcome to Bottlerocket's admin container!
    ╱╲
   ╱┄┄╲   This container provides access to the Bottlerocket host
   │▗▖│   filesystems (see /.bottlerocket/rootfs) and contains common
  ╱│  │╲  tools for inspection and troubleshooting.  It is based on
  │╰╮╭╯│  Amazon Linux 2, and most things are in the same places you
    ╹╹    would find them on an AL2 host.

To permit more intrusive troubleshooting, including actions that mutate the
running state of the Bottlerocket host, we provide a tool called "sheltie"
(`sudo sheltie`).  When run, this tool drops you into a root shell in the
Bottlerocket host's root filesystem.
```

::::

11. Exit the `admin` container.

```bash
exit
```

::::expand{header="Check Output"}

```
[root@admin]# exit
exit
[ssm-user@control]$
```

::::

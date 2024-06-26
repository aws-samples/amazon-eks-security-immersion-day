---
title : "Accessing Bottlerocket host"
weight : 21
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
eksctl get nodegroup -c $EKS_CLUSTER -n $BR_MNG_NAME -r $AWS_REGION -o json | jq -M ".[] | {Cluster,Name,Status,MaxSize,MinSize,DesiredCapacity,InstanceType,ImageID}"
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
  "Name": "mng-al2",
  "Status": "ACTIVE",
  "ImageID": "AL2_x86_64",
  "Type": "managed"
}
{
  "Cluster": "eksworkshop-eksctl",
  "Name": "mng-br",
  "Status": "ACTIVE",
  "ImageID": "BOTTLEROCKET_x86_64",
  "Type": "managed"
}
```
```
{
  "Cluster": "eksworkshop-eksctl",
  "Name": "mng-br",
  "Status": "ACTIVE",
  "MaxSize": 5,
  "MinSize": 0,
  "DesiredCapacity": 0,
  "InstanceType": "t3a.small",
  "ImageID": "BOTTLEROCKET_x86_64"
}
```
::::

3. Scale the EKS Bottlerocket MNG `mng-br`. First, check if the MNG has nodes.

```bash
if [ `kubectl get nodes -l eks.amazonaws.com/nodegroup=$BR_MNG_NAME -o json | jq -r '.items | length'` -gt 0 ]; then 
  echo -e "\nBottlerocket Managed Node Group has nodes. No need to scale.\n\n"
else
  echo -e "\nBottlerocket Managed Node Group has no nodes. Scaling to one node.\n\n"
  eksctl scale nodegroup -c $EKS_CLUSTER -n $BR_MNG_NAME -r $AWS_REGION --nodes 1
fi
```

::::expand{header="Check Output"}
```
Bottlerocket Managed Node Group has nodes. No need to scale.
```
*or* 
```
Bottlerocket Managed Node Group has no nodes. Scaling to one node.
2023-10-10 18:05:34 [i]  scaling nodegroup "mng-br" in cluster eksworkshop-eksctl
2023-10-10 18:05:34 [i]  initiated scaling of nodegroup
2023-10-10 18:05:34 [i]  to see the status of the scaling run `eksctl get nodegroup --cluster eksworkshop-eksctl --region us-west-2 --name mng-br
```
::::

4. Check the node status of `mng-br` MNG  and wait for `Ready` status.

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

No resources found
Fri Dec 11 06:50:24 UTC 2023 - Waiting for the Bottlerocket Node to be ready. Please wait...

No resources found
Fri Dec 11 06:50:39 UTC 2023 - Waiting for the Bottlerocket Node to be ready. Please wait...

No resources found
Fri Dec 11 06:50:55 UTC 2023 - Waiting for the Bottlerocket Node to be ready. Please wait...

No resources found
Fri Dec 11 06:51:11 UTC 2023 - Waiting for the Bottlerocket Node to be ready. Please wait...

Fri Dec 11 06:51:26 UTC 2023 - Waiting for the Bottlerocket Node to be ready. Please wait...

Bottlerocket Node is ready. Please proceed with the next steps.

```
::::

5. Find the Instance ID of the node in `mng-br` MNG.

```bash
export INSTANCE_IP=$(kubectl get nodes -l eks.amazonaws.com/nodegroup=$BR_MNG_NAME -o json | jq -r '.items[0].metadata.annotations."alpha.kubernetes.io/provided-node-ip"')

export INSTANCE_ID=$(aws ec2 describe-instances --filters Name=private-ip-address,Values=$INSTANCE_IP | jq -r .[][].Instances[].InstanceId)

echo "export INSTANCE_ID=$INSTANCE_ID" | tee -a ~/.bash_profile
```

6. Bottlerocket images do not have an SSH server nor even a shell. Bottlerocket does, however, give you out-of-band access that allows you to launch a shell from a container to explore, debug, manually update, and change settings on the host.

*Bottlerocket image has several [variants](https://bottlerocket.dev/en/os/latest/#/concepts/variants/). Bottlerocket runs [two instances](https://bottlerocket.dev/en/os/latest/#/concepts/components/) of the container runtime, containerd, in order to isolate orchestrator-driven workloads (i.e., customer workloads managed through EKS) from system workloads ( the `admin` and `control` containers). This helps reduce the blast radius of possible problems with the orchestrated workloads and keep the underlying system functional.* On Kubernetes variants, Bottlerocket runs Kubelet to communicate with the Kubernetes control plane and orchestrate container lifecycles.

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

10. Access the `admin` container from the control container. We will explore use cases for `admin` container in the remaining labs of this module. `Note:` *As mentioned in the previous command output, you can also use 'enter-admin-container' to enable, wait, and connect in one step.*

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

---
title : "Exploring Restricted Filesystem"
weight : 24
---

In this section of the workshop, you will explore Bottlerocket's [restricted filesystem](https://bottlerocket.dev/en/os/latest/#/concepts/restricted-filesystem/).

Most containerized workloads need little, if any access to the underlying host filesystem. This, paired with image-based updates, means that much of the filesystem can be immutable. Still, there are some resources like logs, container images, and configuration files that do need to be mutable for a practically operable system. 

Bottlerocket splits the difference by having some storage that is immutable (e.g. root filesystem) and some that is mutable (e.g. container logs), using different protection mechanisms for each filesystem. Additionally, some mutable storage (e.g. configuration in /etc/) in Bottlerocket only exists ephemerally and any changes will not survive a reboot.

1. From the previous lab, you are still connected to `admin` container in the terminal. From the `admin` container terminal, check that the root filesystem is mounted as read-only volume (shown as **ro** in the options).

```bash
findmnt /.bottlerocket/rootfs/
```

::::expand{header="Check Output"}
```
TARGET                SOURCE    FSTYPE OPTIONS
/.bottlerocket/rootfs /dev/dm-0 ext4   ro,relatime,seclabel,stripe=1024
```
::::

2. Inside the `admin` container, run a shell script `sheltie`, to get a full root shell on the Bottlerocket host and access to the root filesystem.

```bash
sudo sheltie
```

3. In the full root shell (`sheltie`), overwrite a block in the `dm_verity_hash`. In Bottlerocket hosts, kernel module `dm-verity` protects the root filesystem from unintended changes at the block level, using a hash tree to provide transparent integrity checking. By running the below command, the hash is corrupted and the host will become inoperable.

```bash
dd if=/dev/zero of=`blkid -t TYPE=DM_verity_hash | cut -d":" -f1` bs=1M count=1
```

::::expand{header="Check Output"}
```
1+0 records in
1+0 records out
1048576 bytes (1.0 MB, 1.0 MiB) copied, 0.00155692 s, 673 MB/s
```
::::

4. It can take few minutes for the host to become inoperable, after executing the `dd` command. For the purposes of this workshop, you can reboot the host and Bottlerocket OS will fail to start successfully.

```bash
reboot
```

::::expand{header="Check Output"}
```
bash-5.1# reboot
bash-5.1# exit


Exiting session with sessionId: i-abcdef4723739-73hf87fiu32e23.
```
::::

5. During host reboot, `kubectl` may show the node status as `Ready` for a minute. Each time the system boots, dm-verity verifies integrity of the root filesystem and will refuse to boot the operating system when there’s an error or evidence of corruption. `kubectl` will start showing the node status as `NotReady` and will not recover.

```bash
for i in {1..10}
do
  kubectl get nodes -l eks.amazonaws.com/nodegroup=$BR_MNG_NAME
  sleep 10
done

aws ssm start-session --target $INSTANCE_ID
```

::::expand{header="Check Output"}
```
NAME                                           STATUS   ROLES    AGE    VERSION
ip-10-254-183-115.us-west-2.compute.internal   Ready    <none>   100s   v1.28.4-eks-d91a302
NAME                                           STATUS   ROLES    AGE    VERSION
ip-10-254-183-115.us-west-2.compute.internal   Ready    <none>   110s   v1.28.4-eks-d91a302
NAME                                           STATUS   ROLES    AGE    VERSION
ip-10-254-183-115.us-west-2.compute.internal   Ready    <none>   2m1s   v1.28.4-eks-d91a302
NAME                                           STATUS     ROLES    AGE     VERSION
ip-10-254-183-115.us-west-2.compute.internal   NotReady   <none>   2m12s   v1.28.4-eks-d91a302
NAME                                           STATUS     ROLES    AGE     VERSION
ip-10-254-183-115.us-west-2.compute.internal   NotReady   <none>   2m22s   v1.28.4-eks-d91a302
NAME                                           STATUS     ROLES    AGE     VERSION
ip-10-254-183-115.us-west-2.compute.internal   NotReady   <none>   2m33s   v1.28.4-eks-d91a302
NAME                                           STATUS     ROLES    AGE     VERSION
ip-10-254-183-115.us-west-2.compute.internal   NotReady   <none>   2m44s   v1.28.4-eks-d91a302
NAME                                           STATUS     ROLES    AGE     VERSION
ip-10-254-183-115.us-west-2.compute.internal   NotReady   <none>   2m54s   v1.28.4-eks-d91a302
NAME                                           STATUS     ROLES    AGE    VERSION
ip-10-254-183-115.us-west-2.compute.internal   NotReady   <none>   3m5s   v1.28.4-eks-d91a302
NAME                                           STATUS     ROLES    AGE     VERSION
ip-10-254-183-115.us-west-2.compute.internal   NotReady   <none>   3m15s   v1.28.4-eks-d91a302

An error occurred (TargetNotConnected) when calling the StartSession operation: i-abcdefxxxxxx is not connected.
```
::::

6. Terminate the inoperable Bottlerocket host. 

```bash
kubectl get nodes -l eks.amazonaws.com/nodegroup=$BR_MNG_NAME | grep NotReady | awk '{print $1}' | xargs kubectl delete node

kubectl get nodes -l eks.amazonaws.com/nodegroup=$BR_MNG_NAME

aws ec2 terminate-instances --instance-ids $INSTANCE_ID --region $AWS_REGION
```

::::expand{header="Check Output"}
```
node "ip-10-254-158-143.us-west-2.compute.internal" deleted

No resources found

{
    "TerminatingInstances": [
        {
            "CurrentState": {
                "Code": 32,
                "Name": "shutting-down"
            },
            "InstanceId": "i-abcdefxxxxxxxx",
            "PreviousState": {
                "Code": 16,
                "Name": "running"
            }
        }
    ]
}
```
::::

7. ASG associated with the `mng-br` MNG will create a replacement EC2 instance. Check the node status of mng-br MNG, wait for Ready status, find the EC2 instance ID and connect to `control` container on the host.

```bash
while [ "`kubectl get nodes -l eks.amazonaws.com/nodegroup=$BR_MNG_NAME | grep -v STATUS | awk '{print $2}'`" != "Ready" ]
do
  echo -e "`date` - Waiting for the Bottlerocket Node to be ready. Please wait...\n"
  sleep 15
done

kubectl get nodes -l eks.amazonaws.com/nodegroup=$BR_MNG_NAME

echo -e "\nBottlerocket Node is ready."

export INSTANCE_IP=$(kubectl get nodes -l eks.amazonaws.com/nodegroup=$BR_MNG_NAME -o json | jq -r '.items[0].metadata.annotations."alpha.kubernetes.io/provided-node-ip"')

export INSTANCE_ID=$(aws ec2 describe-instances --filters Name=private-ip-address,Values=$INSTANCE_IP | jq -r .[][].Instances[].InstanceId)

echo "export INSTANCE_ID=$INSTANCE_ID" | tee -a ~/.bash_profile

aws ssm start-session --target $INSTANCE_ID
```

::::expand{header="Check Output"}
```
No resources found
Fri Dec 12 02:46:13 UTC 2023 - Waiting for the Bottlerocket Node to be ready. Please wait...

No resources found
Fri Dec 12 02:46:28 UTC 2023 - Waiting for the Bottlerocket Node to be ready. Please wait...

No resources found
Fri Dec 12 02:46:44 UTC 2023 - Waiting for the Bottlerocket Node to be ready. Please wait...

No resources found
Fri Dec 12 02:46:59 UTC 2023 - Waiting for the Bottlerocket Node to be ready. Please wait...

No resources found
Fri Dec 12 02:47:15 UTC 2023 - Waiting for the Bottlerocket Node to be ready. Please wait...

No resources found
Fri Dec 12 02:47:31 UTC 2023 - Waiting for the Bottlerocket Node to be ready. Please wait...

No resources found
Fri Dec 12 02:47:46 UTC 2023 - Waiting for the Bottlerocket Node to be ready. Please wait...

Fri Dec 12 02:48:02 UTC 2023 - Waiting for the Bottlerocket Node to be ready. Please wait...

NAME                                          STATUS   ROLES    AGE   VERSION
ip-10-254-222-80.us-west-2.compute.internal   Ready    <none>   25s   v1.28.4-eks-d91a302

Bottlerocket Node is ready.

Starting session with SessionId: i-00b5777feb238788a-0467a0c5badfe0aaf
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

8. Login to the admin container.

```bash
enter-admin-container;exit
```

9. Get a full root shell with `sheltie`

```bash
sudo sheltie
```

10. With Bottlerocket, SELinux runs in enforcing mode by default and the kernel is compiled in such a way that it prevents SELinux from being disabled or from enforcement mode being turned off.

```bash
echo 1 > /sys/fs/selinux/disable
echo 1 > /sys/fs/selinux/enforce

sestatus
```

::::expand{header="Check Output"}
```
bash: echo: write error: Invalid argument
bash: echo: write error: Invalid argument

SELinux status:                 enabled
SELinuxfs mount:                /sys/fs/selinux
SELinux root directory:         /etc/selinux
Loaded policy name:             fortified
Current mode:                   enforcing
Mode from config file:          enforcing
Policy MLS status:              enabled
Policy deny_unknown status:     denied
Memory protection checking:     actual (secure)
Max kernel policy version:      33
```
::::

11. Part of the mutable filesystem, /etc , does not persist through a reboot.

```bash
cat /etc/motd

echo "Attempting local modifications to /etc/motd" > /etc/motd

cat /etc/motd

reboot
```

::::expand{header="Check Output"}
```
Welcome to Bottlerocket!

Attempting local modifications to /etc/motd
```
::::

12. Login to the `control` container on the Bottlerocket host.

```bash
aws ssm start-session --target $INSTANCE_ID
```

13. Login to the `admin` container.

```bash
enter-admin-container
```

14. Switch to full root shell.

```bash
sudo sheltie; exit
```

15. Check the contents of /etc/motd and you will notice that the change to the file in previous steps is reverted.

```bash
cat /etc/motd
```

::::expand{header="Check Output"}
```
Welcome to Bottlerocket!
```
::::

16. Exit out of the full root shell `sheltie` and admin container, and into the `control` container.

```bash
exit
```

::::expand{header="Check Output"}
```
[root@admin]# exit
exit
exit
[ssm-user@control]$
```
::::

17. Disable `admin` container.

```bash
disable-admin-container
```

::::expand{header="Check Output"}
```
[ssm-user@control]$ disable-admin-container 
Disabling admin container
The admin container is now disabled - it should stop soon.
```
::::

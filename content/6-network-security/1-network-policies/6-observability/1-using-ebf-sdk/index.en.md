---
title : "Using eBPF SDK"
weight : 21
---
The latest version of the Amazon VPC CNI ships an SDK that provides an interface to interact with eBPF programs on the node. The SDK is installed when the aws-node is deployed onto the nodes. You can find the SDK binary installed under `/opt/cni/bin` directory on the node. Consider using this SDK when you would like to identify connectivity issue. Make sure eBPF programs are being created for the pods on the node.

Run the below command to connect one of the worker nodes in the EKS Cluster.

```bash
aws ssm start-session --target $(aws ec2 describe-instances --filters "Name=tag:eks:nodegroup-name,Values=mng-al2" | jq -r '.[][0]["Instances"][0]["InstanceId"]')
```


::::expand{header="Check Output"}
```bash
Starting session with SessionId: i-06ffbd08f775157e6-062fff1d92f37bd3d
sh-4.2$ 
```
::::

In the SSM shell, Run the below command to load all eBPF programs managed by Network Policy Agent.


```bash
sudo /opt/cni/bin/aws-eks-na-cli ebpf progs
```

The output will look like below.

```bash
Programs currently loaded : 
Type : 26 ID : 6 Associated maps count : 1
========================================================================================
Type : 26 ID : 8 Associated maps count : 1
========================================================================================
Type : 2 ID : 13 Associated maps count : 6
========================================================================================
Type : 2 ID : 15 Associated maps count : 6
========================================================================================
Type : 2 ID : 16 Associated maps count : 6
========================================================================================
Type : 2 ID : 17 Associated maps count : 6
========================================================================================
Type : 2 ID : 18 Associated maps count : 6
========================================================================================
Type : 2 ID : 19 Associated maps count : 6
========================================================================================
Type : 2 ID : 20 Associated maps count : 6
========================================================================================
Type : 2 ID : 21 Associated maps count : 3
========================================================================================
Type : 5 ID : 22 Associated maps count : 7
========================================================================================
Type : 2 ID : 23 Associated maps count : 6
========================================================================================
Type : 2 ID : 24 Associated maps count : 3
========================================================================================
Type : 2 ID : 25 Associated maps count : 7
========================================================================================
Type : 2 ID : 26 Associated maps count : 7
========================================================================================
Type : 2 ID : 27 Associated maps count : 7
========================================================================================
Type : 17 ID : 28 Associated maps count : 6
========================================================================================
Type : 17 ID : 29 Associated maps count : 6
========================================================================================
Type : 17 ID : 30 Associated maps count : 6
========================================================================================
Type : 5 ID : 31 Associated maps count : 3
========================================================================================
Type : 5 ID : 32 Associated maps count : 3
========================================================================================
Type : 5 ID : 33 Associated maps count : 3
========================================================================================
Type : 5 ID : 34 Associated maps count : 3
========================================================================================
Type : 5 ID : 35 Associated maps count : 3
========================================================================================
Type : 5 ID : 36 Associated maps count : 3
========================================================================================
Type : 5 ID : 37 Associated maps count : 3
========================================================================================
Type : 5 ID : 38 Associated maps count : 7
========================================================================================
Type : 5 ID : 39 Associated maps count : 7
========================================================================================
Type : 5 ID : 40 Associated maps count : 7
========================================================================================
Type : 5 ID : 41 Associated maps count : 7
========================================================================================
Type : 2 ID : 42 Associated maps count : 6
========================================================================================
```


Run the below command to load all eBPF maps managed by Network Policy Agent.

```bash
sudo /opt/cni/bin/aws-eks-na-cli ebpf maps
```

The output will look like below.

```bash
Maps currently loaded : 
Type : 2 ID : 3
Keysize 4 Valuesize 98 MaxEntries 1
========================================================================================
Type : 4 ID : 6
Keysize 4 Valuesize 4 MaxEntries 1024
========================================================================================
Type : 6 ID : 7
Keysize 4 Valuesize 6376 MaxEntries 1
========================================================================================
Type : 6 ID : 8
Keysize 4 Valuesize 7736 MaxEntries 1
========================================================================================
Type : 6 ID : 9
Keysize 4 Valuesize 5320 MaxEntries 1
========================================================================================
Type : 2 ID : 10
Keysize 4 Valuesize 1 MaxEntries 1
========================================================================================
Type : 6 ID : 11
Keysize 4 Valuesize 4104 MaxEntries 1
========================================================================================
Type : 6 ID : 12
Keysize 4 Valuesize 16388 MaxEntries 1
========================================================================================
Type : 1 ID : 13
Keysize 4 Valuesize 48 MaxEntries 10240
========================================================================================
Type : 1 ID : 14
Keysize 4 Valuesize 24 MaxEntries 10240
========================================================================================
Type : 1 ID : 15
Keysize 4 Valuesize 160 MaxEntries 10240
========================================================================================
Type : 1 ID : 16
Keysize 4 Valuesize 8 MaxEntries 10240
========================================================================================
Type : 1 ID : 17
Keysize 4 Valuesize 4 MaxEntries 256
========================================================================================
Type : 2 ID : 19
Keysize 4 Valuesize 13040 MaxEntries 1
========================================================================================
Type : 2 ID : 20
Keysize 4 Valuesize 2292 MaxEntries 1
========================================================================================
Type : 9 ID : 22
Keysize 16 Valuesize 4 MaxEntries 65536
========================================================================================
Type : 27 ID : 23
Keysize 0 Valuesize 0 MaxEntries 262144
========================================================================================
```

Run below command to check out more options for the tool.

```bash
sudo /opt/cni/bin/aws-eks-na-cli --help
```

::::expand{header="Check Output"}

```bash
aws-eks-na-cli CLI can be used to dump eBPF maps,
programs, qdiscs and so on

Usage:
  aws-eks-na-cli [flags]
  aws-eks-na-cli [command]

Available Commands:
  completion  Generate the autocompletion script for the specified shell
  ebpf        Dump all ebpf related data
  help        Help about any command

Flags:
  -h, --help   help for aws-eks-na-cli

Use "aws-eks-na-cli [command] --help" for more information about a command.
```
::::
---
title : "Using Cloud Watch logs"
weight : 22
---


## Network policy logs

Whether connections are allowed or denied by a network policies is logged in flow logs. The network policy logs on each node include the flow logs for every pod that has a network policy. Network policy logs are stored at `/var/log/aws-routed-eni/network-policy-agent.log`. 

Let us login into the worker node using SSM.

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



In the SSM shell, Run the below command to dump all ebpf program related data

```bash
cd /var/log/aws-routed-eni
ls -l
```

The output will look like below.

```bash
total 19132
-rw------- 1 root root    72715 Sep  9 04:44 ebpf-sdk.log
-rw-r--r-- 1 root root      886 Sep  7 11:36 egress-v4-plugin.log
-rw-r--r-- 1 root root     1322 Sep  9 05:20 egress-v6-plugin.log
-rw-r--r-- 1 root root 15663150 Sep  9 10:02 ipamd.log
-rw-r--r-- 1 root root    95036 Sep  9 07:32 network-policy-agent.log
-rw-r--r-- 1 root root     9509 Sep  9 05:20 plugin.log
```

Let us see the logs from the `network-policy-agent.log` file.

```bash
cat network-policy-agent.log
```

The output will look like below,

```json
{"level":"info","timestamp":"2023-09-08T16:50:30.887Z","logger":"controller-runtime.metrics","msg":"Metrics server is starting to listen","addr":":8080"}
{"level":"info","timestamp":"2023-09-08T16:50:30.890Z","logger":"ebpf-client-init","msg":"Validating ","Probe: ":"v4events.bpf.o"}
{"level":"info","timestamp":"2023-09-08T16:50:30.890Z","logger":"ebpf-client-init","msg":"error opening  ","Probe: ":"/host/opt/cni/bin/v4events.bpf.o","error":"open /host/opt/cni/bin/v4events.bpf.o: no such file or directory"}
{"level":"info","timestamp":"2023-09-08T16:50:30.890Z","logger":"ebpf-client-init","msg":"comparing new and existing probes ..."}
{"level":"info","timestamp":"2023-09-08T16:50:30.890Z","logger":"ebpf-client-init","msg":"change detected in event probe binaries.."}
{"level":"info","timestamp":"2023-09-08T16:50:30.890Z","logger":"ebpf-client","msg":"Probe validation Done"}
{"level":"info","timestamp":"2023-09-08T16:50:30.891Z","logger":"cp-util","msg":"Let's install BPF Binaries on to the host path....."}
{"level":"info","timestamp":"2023-09-08T16:50:30.891Z","logger":"cp-util","msg":"Installing BPF Binary..","target":"/host/opt/cni/bin/v4events.bpf.o","source":"v4events.bpf.o"}
{"level":"info","timestamp":"2023-09-08T16:50:30.891Z","logger":"cp-util","msg":"Successfully installed - ","binary":"/host/opt/cni/bin/v4events.bpf.o"}
{"level":"info","timestamp":"2023-09-08T16:50:30.891Z","logger":"cp-util","msg":"Installing BPF Binary..","target":"/host/opt/cni/bin/tc.v4ingress.bpf.o","source":"tc.v4ingress.bpf.o"}
{"level":"info","timestamp":"2023-09-08T16:50:30.891Z","logger":"cp-util","msg":"Successfully installed - ","binary":"/host/opt/cni/bin/tc.v4ingress.bpf.o"}
{"level":"info","timestamp":"2023-09-08T16:50:30.891Z","logger":"cp-util","msg":"Installing BPF Binary..","target":"/host/opt/cni/bin/tc.v4egress.bpf.o","source":"tc.v4egress.bpf.o"}
{"level":"info","timestamp":"2023-09-08T16:50:30.891Z","logger":"cp-util","msg":"Successfully installed - ","binary":"/host/opt/cni/bin/tc.v4egress.bpf.o"}
{"level":"info","timestamp":"2023-09-08T16:50:30.891Z","logger":"cp-util","msg":"Installing BPF Binary..","target":"/host/opt/cni/bin/aws-eks-na-cli","source":"aws-eks-na-cli"}
{"level":"info","timestamp":"2023-09-08T16:50:30.903Z","logger":"cp-util","msg":"Successfully installed - ","binary":"/host/opt/cni/bin/aws-eks-na-cli"}
{"level":"info","timestamp":"2023-09-08T16:50:30.903Z","logger":"ebpf-client","msg":"Copied eBPF binaries to the host directory"}

{"level":"info","timestamp":"2023-09-09T04:44:04.255Z","logger":"ebpf-client","msg":"Copied eBPF binaries to the host directory"}
{"level":"info","timestamp":"2023-09-09T04:44:04.256Z","logger":"ebpf-client","msg":"Total no.of  global maps recovered...","count: ":2}
{"level":"info","timestamp":"2023-09-09T04:44:04.256Z","logger":"ebpf-client","msg":"Global Map..","Name: ":"/sys/fs/bpf/globals/aws/maps/global_aws_conntrack_map","updateEventsProbe: ":false}
{"level":"info","timestamp":"2023-09-09T04:44:04.256Z","logger":"ebpf-client","msg":"Conntrack Map is already present on the node"}
{"level":"info","timestamp":"2023-09-09T04:44:04.256Z","logger":"ebpf-client","msg":"Global Map..","Name: ":"/sys/fs/bpf/globals/aws/maps/global_policy_events","updateEventsProbe: ":false}
{"level":"info","timestamp":"2023-09-09T04:44:04.256Z","logger":"ebpf-client","msg":"Policy event Map is already present on the node ","Recovered FD":11}
{"level":"info","timestamp":"2023-09-09T04:44:04.256Z","logger":"ebpf-client","msg":"Number of probes/maps recovered - ","count: ":0}
{"level":"info","timestamp":"2023-09-09T04:44:04.256Z","logger":"ebpf-client","msg":"Successfully recovered BPF state"}
{"level":"info","timestamp":"2023-09-09T04:44:04.256Z","logger":"ebpf-client","msg":"Derived existing ConntrackMap identifier"}
{"level":"info","timestamp":"2023-09-09T04:44:04.256Z","logger":"ebpf-client","msg":"Initialized Conntrack client"}
{"level":"info","timestamp":"2023-09-09T04:44:04.256Z","logger":"ebpf-client","msg":"Configure Event loop ... "}
{"level":"info","timestamp":"2023-09-09T04:44:04.256Z","logger":"ebpf-client","msg":"Cloudwatch log support is enabled"}
{"level":"info","timestamp":"2023-09-09T04:44:04.376Z","logger":"ebpf-client","msg":"Setup CW","Setting loggroup Name":"/aws/eks/eksworkshop-eksctl/cluster"}
{"level":"info","timestamp":"2023-09-09T04:44:04.419Z","logger":"ebpf-client","msg":"Configured event logging"}
{"level":"info","timestamp":"2023-09-09T04:44:04.419Z","logger":"ebpf-client","msg":"BPF Client initialization done"}
{"level":"info","timestamp":"2023-09-09T04:44:04.419Z","logger":"setup","msg":"starting manager"}
{"level":"info","timestamp":"2023-09-09T04:44:04.423Z","logger":"setup","msg":"Serving metrics on ","port":61680}
{"level":"info","timestamp":"2023-09-09T04:44:04.423Z","msg":"Starting server","kind":"health probe","addr":"[::]:8081"}
{"level":"info","timestamp":"2023-09-09T04:44:04.423Z","msg":"starting server","path":"/metrics","kind":"metrics","addr":"[::]:8080"}
{"level":"info","timestamp":"2023-09-09T04:44:04.424Z","msg":"Starting EventSource","controller":"policyendpoint","controllerGroup":"networking.k8s.aws","controllerKind":"PolicyEndpoint","source":"kind source: *v1alpha1.PolicyEndpoint"}
{"level":"info","timestamp":"2023-09-09T04:44:04.424Z","msg":"Starting Controller","controller":"policyendpoint","controllerGroup":"networking.k8s.aws","controllerKind":"PolicyEndpoint"}
{"level":"info","timestamp":"2023-09-09T04:44:04.536Z","msg":"Starting workers","controller":"policyendpoint","controllerGroup":"networking.k8s.aws","controllerKind":"PolicyEndpoint","worker count":1}
{"level":"info","timestamp":"2023-09-09T05:24:55.322Z","logger":"controllers.policyEndpoints","msg":"Received a new reconcile request","req":{"name":"client-one-deny-egress-dhsw4","namespace":"default"}}
{"level":"info","timestamp":"2023-09-09T05:24:55.323Z","logger":"controllers.policyEndpoints","msg":"Processing Policy Endpoint  ","Name: ":"client-one-deny-egress-dhsw4","Namespace ":"default"}
{"level":"info","timestamp":"2023-09-09T05:28:59.892Z","logger":"controllers.policyEndpoints","msg":"Received a new reconcile request","req":{"name":"client-one-allow-egress-coredns-c88vd","namespace":"default"}}
{"level":"info","timestamp":"2023-09-09T05:28:59.892Z","logger":"controllers.policyEndpoints","msg":"Processing Policy Endpoint  ","Name: ":"client-one-allow-egress-coredns-c88vd","Namespace ":"default"}
{"level":"info","timestamp":"2023-09-09T07:32:13.738Z","logger":"controllers.policyEndpoints","msg":"Received a new reconcile request","req":{"name":"client-one-allow-egress-demo-app-mjj4d","namespace":"default"}}
{"level":"info","timestamp":"2023-09-09T07:32:13.738Z","logger":"controllers.policyEndpoints","msg":"Processing Policy Endpoint  ","Name: ":"client-one-allow-egress-demo-app-mjj4d","Namespace ":"default"}
```

### Send network policy logs to Amazon CloudWatch Logs


You can monitor the network policy logs using services such as Amazon CloudWatch Logs. You can use the following methods to send the network policy logs to CloudWatch Logs.

For EKS clusters, the policy logs will be located under `/aws/eks/cluster-name/cluster/`

### Prerequisites

* Add the following permissions as a stanza or separate policy to the IAM role that you are using for the VPC CNI. 

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": [
                "logs:DescribeLogGroups",
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "*"
        }
    ]
}
```
* enable `enableCloudWatchLogs` in **Optional configuration settings** for Amazon EKS VPC CNI as follows.

![console-cni-config-network-policy-logs](/static/images/6-network-security/1-network-policies/console-cni-config-network-policy-logs.png)






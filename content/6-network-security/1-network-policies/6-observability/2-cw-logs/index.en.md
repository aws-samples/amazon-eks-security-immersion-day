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
{"level":"info","timestamp":"2023-09-10T06:08:29.955Z","logger":"controller-runtime.metrics","msg":"Metrics server is starting to listen","addr":":8080"}
{"level":"info","timestamp":"2023-09-10T06:08:29.956Z","logger":"ebpf-client-init","msg":"Validating ","Probe: ":"v4events.bpf.o"}
{"level":"info","timestamp":"2023-09-10T06:08:29.956Z","logger":"ebpf-client-init","msg":"error opening  ","Probe: ":"/host/opt/cni/bin/v4events.bpf.o","error":"open /host/opt/cni/bin/v4events.bpf.o: no such file or directory"}
{"level":"info","timestamp":"2023-09-10T06:08:29.956Z","logger":"ebpf-client-init","msg":"comparing new and existing probes ..."}
{"level":"info","timestamp":"2023-09-10T06:08:29.957Z","logger":"ebpf-client-init","msg":"change detected in event probe binaries.."}
{"level":"info","timestamp":"2023-09-10T06:08:29.957Z","logger":"ebpf-client","msg":"Probe validation Done"}
{"level":"info","timestamp":"2023-09-10T06:08:29.957Z","logger":"cp-util","msg":"Let's install BPF Binaries on to the host path....."}
{"level":"info","timestamp":"2023-09-10T06:08:29.957Z","logger":"cp-util","msg":"Installing BPF Binary..","target":"/host/opt/cni/bin/v4events.bpf.o","source":"v4events.bpf.o"}
{"level":"info","timestamp":"2023-09-10T06:08:29.958Z","logger":"cp-util","msg":"Successfully installed - ","binary":"/host/opt/cni/bin/v4events.bpf.o"}
{"level":"info","timestamp":"2023-09-10T06:08:29.958Z","logger":"cp-util","msg":"Installing BPF Binary..","target":"/host/opt/cni/bin/tc.v4ingress.bpf.o","source":"tc.v4ingress.bpf.o"}
{"level":"info","timestamp":"2023-09-10T06:08:29.958Z","logger":"cp-util","msg":"Successfully installed - ","binary":"/host/opt/cni/bin/tc.v4ingress.bpf.o"}
{"level":"info","timestamp":"2023-09-10T06:08:29.958Z","logger":"cp-util","msg":"Installing BPF Binary..","target":"/host/opt/cni/bin/tc.v4egress.bpf.o","source":"tc.v4egress.bpf.o"}
{"level":"info","timestamp":"2023-09-10T06:08:29.958Z","logger":"cp-util","msg":"Successfully installed - ","binary":"/host/opt/cni/bin/tc.v4egress.bpf.o"}
{"level":"info","timestamp":"2023-09-10T06:08:29.958Z","logger":"cp-util","msg":"Installing BPF Binary..","target":"/host/opt/cni/bin/aws-eks-na-cli","source":"aws-eks-na-cli"}
{"level":"info","timestamp":"2023-09-10T06:08:29.967Z","logger":"cp-util","msg":"Successfully installed - ","binary":"/host/opt/cni/bin/aws-eks-na-cli"}
{"level":"info","timestamp":"2023-09-10T06:08:29.967Z","logger":"ebpf-client","msg":"Copied eBPF binaries to the host directory"}
{"level":"error","timestamp":"2023-09-10T06:08:29.967Z","logger":"ebpf-client","msg":"failed to recover global maps..","error":"error walking the bpfdirectory lstat /sys/fs/bpf/globals/aws/maps/: no such file or directory","stacktrace":"github.com/aws/aws-network-policy-agent/pkg/ebpf.recoverBPFState\n\t/workspace/pkg/ebpf/bpf_client.go:334\ngithub.com/aws/aws-network-policy-agent/pkg/ebpf.NewBpfClient\n\t/workspace/pkg/ebpf/bpf_client.go:158\ngithub.com/aws/aws-network-policy-agent/controllers.NewPolicyEndpointsReconciler\n\t/workspace/controllers/policyendpoints_controller.go:93\nmain.main\n\t/workspace/main.go:93\nruntime.main\n\t/root/sdk/go1.20.4/src/runtime/proc.go:250"}
{"level":"info","timestamp":"2023-09-10T06:08:29.967Z","logger":"ebpf-client","msg":"Successfully recovered BPF state"}
{"level":"info","timestamp":"2023-09-10T06:08:29.967Z","logger":"ebpf-client","msg":"Install the default global maps"}
{"level":"info","timestamp":"2023-09-10T06:08:29.970Z","logger":"ebpf-client","msg":"Successfully loaded events probe"}
{"level":"info","timestamp":"2023-09-10T06:08:29.970Z","logger":"ebpf-client","msg":"Initialized Conntrack client"}
{"level":"info","timestamp":"2023-09-10T06:08:29.970Z","logger":"ebpf-client","msg":"Configure Event loop ... "}
{"level":"info","timestamp":"2023-09-10T06:08:29.970Z","logger":"ebpf-client","msg":"Cloudwatch log support is enabled"}
{"level":"info","timestamp":"2023-09-10T06:08:30.095Z","logger":"ebpf-client","msg":"Setup CW","Setting loggroup Name":"/aws/eks/eksworkshop-eksctl/cluster"}
{"level":"info","timestamp":"2023-09-10T06:08:30.151Z","logger":"ebpf-client","msg":"Configured event logging"}
{"level":"info","timestamp":"2023-09-10T06:08:30.151Z","logger":"ebpf-client","msg":"BPF Client initialization done"}
{"level":"info","timestamp":"2023-09-10T06:08:30.151Z","logger":"setup","msg":"starting manager"}
{"level":"info","timestamp":"2023-09-10T06:08:30.155Z","logger":"setup","msg":"Serving metrics on ","port":61680}
{"level":"info","timestamp":"2023-09-10T06:08:30.156Z","msg":"Starting server","kind":"health probe","addr":"[::]:8081"}
{"level":"info","timestamp":"2023-09-10T06:08:30.156Z","msg":"starting server","path":"/metrics","kind":"metrics","addr":"[::]:8080"}
{"level":"info","timestamp":"2023-09-10T06:08:30.156Z","msg":"Starting EventSource","controller":"policyendpoint","controllerGroup":"networking.k8s.aws","controllerKind":"PolicyEndpoint","source":"kind source: *v1alpha1.PolicyEndpoint"}
{"level":"info","timestamp":"2023-09-10T06:08:30.156Z","msg":"Starting Controller","controller":"policyendpoint","controllerGroup":"networking.k8s.aws","controllerKind":"PolicyEndpoint"}
{"level":"info","timestamp":"2023-09-10T06:08:30.267Z","msg":"Starting workers","controller":"policyendpoint","controllerGroup":"networking.k8s.aws","controllerKind":"PolicyEndpoint","worker count":1}
{"level":"info","timestamp":"2023-09-11T01:04:21.995Z","logger":"controllers.policyEndpoints","msg":"Received a new reconcile request","req":{"name":"demo-app-deny-all-mmzl8","namespace":"default"}}
{"level":"info","timestamp":"2023-09-11T01:04:21.996Z","logger":"controllers.policyEndpoints","msg":"Processing Policy Endpoint  ","Name: ":"demo-app-deny-all-mmzl8","Namespace ":"default"}
{"level":"info","timestamp":"2023-09-11T01:04:56.759Z","logger":"controllers.policyEndpoints","msg":"Received a new reconcile request","req":{"name":"demo-app-allow-samens-lspct","namespace":"default"}}
{"level":"info","timestamp":"2023-09-11T01:04:56.759Z","logger":"controllers.policyEndpoints","msg":"Processing Policy Endpoint  ","Name: ":"demo-app-allow-samens-lspct","Namespace ":"default"}
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






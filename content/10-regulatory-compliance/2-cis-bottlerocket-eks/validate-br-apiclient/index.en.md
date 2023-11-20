---
title : "Using the Bottlerocket Report API"
weight : 25
---

Bottlerocket uses a built-in administrative API to perform common admin functions. This admin API can be accessed via the `apiclient` CLI from Admin or Control host containers by default. The `report` endpoint of this API can also be used to verify the security posture of the workload against CIS benchmarks. 

First, start a session with Session Manager to connect to the node:

```bash
aws ssm start-session --target $(aws ec2 describe-instances --filters "Name=tag:Name,Values=eksworkshop-eksctl-bottlerocket-mng-Node" | jq -r '.[][0]["Instances"][0]["InstanceId"]')
```

Once connected, we can then run one of two reports using the apiclient, first the CIS benchmark for Bottlerocket can be run using the following command:

```bash
apiclient report cis
```

The output should look something like this:

```
[ssm-user@control]$ apiclient report cis
Benchmark name: CIS Bottlerocket Benchmark
Version: v1.0.0
Reference: https://www.cisecurity.org/benchmark/bottlerocket
Benchmark level: 1
Start time: 2023-11-20T12:17:08.379361248Z

[SKIP] 1.2.1 Ensure software update repositories are configured (Manual)
[PASS] 1.3.1 Ensure dm-verity is configured (Automatic)
[PASS] 1.4.1 Ensure setuid programs do not create core dumps (Automatic)
[PASS] 1.4.2 Ensure address space layout randomization (ASLR) is enabled (Automatic)
[PASS] 1.4.3 Ensure unprivileged eBPF is disabled (Automatic)
[PASS] 1.5.1 Ensure SELinux is configured (Automatic)
[SKIP] 1.6 Ensure updates, patches, and additional security software are installed (Manual)
[PASS] 2.1.1.1 Ensure chrony is configured (Automatic)
[PASS] 3.2.5 Ensure broadcast ICMP requests are ignored (Automatic)
[PASS] 3.2.6 Ensure bogus ICMP responses are ignored (Automatic)
[PASS] 3.2.7 Ensure TCP SYN Cookies is enabled (Automatic)
[SKIP] 3.4.1.3 Ensure IPv4 outbound and established connections are configured (Manual)
[SKIP] 3.4.2.3 Ensure IPv6 outbound and established connections are configured (Manual)
[PASS] 4.1.1.1 Ensure journald is configured to write logs to persistent disk (Automatic)
[PASS] 4.1.2 Ensure permissions on journal files are configured (Automatic)

Passed: 11
Failed: 0
Skipped: 4
Total checks: 15

Compliance check result: PASS
```

Next, the CIS Kubernetes benchmark can be run:

```bash
apiclient report cis-k8s
```

```
[ssm-user@control]$ apiclient report cis-k8s
Benchmark name: CIS Kubernetes Benchmark (Worker Node)
Version: v1.7.1
Reference: https://www.cisecurity.org/benchmark/kubernetes
Benchmark level: 1
Start time: 2023-11-20T12:18:20.637391600Z

[PASS] 4.1.1 Ensure that the kubelet service file permissions are set to 644 or more restrictive (Automatic)
[PASS] 4.1.2 Ensure that the kubelet service file ownership is set to root:root (Automatic)
[SKIP] 4.1.3 If proxy kubeconfig file exists ensure permissions are set to 644 or more restrictive (Manual)
[SKIP] 4.1.4 If proxy kubeconfig file exists ensure ownership is set to root:root (Manual)
[PASS] 4.1.5 Ensure that the —kubeconfig kubelet.conf file permissions are set to 644 or more restrictive (Automatic)
[PASS] 4.1.6 Ensure that the —kubeconfig kubelet.conf file ownership is set to root:root (Automatic)
[PASS] 4.1.7 Ensure that the certificate authorities file permissions are set to 600 or more restrictive (Automatic)
[PASS] 4.1.8 Ensure that the client certificate authorities file ownership is set to root:root (Automatic)
[PASS] 4.1.9 If the kubelet config.yaml configuration file is being used validate permissions set to 600 or more restrictive (Automatic)
[PASS] 4.1.10 If the kubelet config.yaml configuration file is being used validate file ownership is set to root:root (Automatic)
[PASS] 4.2.1 Ensure that the —anonymous-auth argument is set to false (Automatic)
[PASS] 4.2.2 Ensure that the —authorization-mode argument is not set to AlwaysAllow (Automatic)
[PASS] 4.2.3 Ensure that the —client-ca-file argument is set as appropriate (Automatic)
[PASS] 4.2.4 Verify that the —read-only-port argument is set to 0 (Automatic)
[PASS] 4.2.5 Ensure that the —streaming-connection-idle-timeout argument is not set to 0 (Automatic)
[PASS] 4.2.6 Ensure that the —make-iptables-util-chains argument is set to true (Automatic)
[SKIP] 4.2.7 Ensure that the —hostname-override argument is not set (not valid for Bottlerocket) (Manual)
[PASS] 4.2.9 Ensure that the —tls-cert-file and —tls-private-key-file arguments are set as appropriate (Automatic)
[SKIP] 4.2.10 Ensure that the —rotate-certificates argument is not set to false (not valid for Bottlerocket) (Manual)
[PASS] 4.2.11 Verify that the RotateKubeletServerCertificate argument is set to true (Automatic)
[PASS] 4.2.12 Ensure that the Kubelet only makes use of Strong Cryptographic Ciphers (Automatic)
[PASS] 4.2.13 Ensure that a limit is set on pod PIDs (Automatic)

Passed: 18
Failed: 0
Skipped: 4
Total checks: 22

Compliance check result: PASS
```

By default, the guidelines being checked comply with Level 1 of the CIS Benchmark. To include more detail and specific guidance, Level 2 checks can also optionally be evaluated:

```bash
apiclient report cis -l 2
```

To view more details about the CIS benchmarks, you can follow the `Reference` links in the above output. 
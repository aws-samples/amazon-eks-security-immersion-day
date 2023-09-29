---
title : "Validate custom AMI against CIS Benchmark"
weight : 24
---

After deploying a managed node group that adheres to the CIS Benchmark, we can use the commands outlined in the [benchmark document](https://www.cisecurity.org/benchmark/amazon_linux) to verify the configuration. For validation, there are couple of different tools available. 

- Community provided validations scripts

   https://github.com/finalduty/cis-benchmarks-audit

   https://github.com/massyn/centos-cis-benchmark

- Amazon Inspector Classic CIS 1.0 validation for Amazon Linux 2

  [Amazon Inspector Classic](https://docs.aws.amazon.com/inspector/v1/userguide/inspector_introduction.html) currently provides  CIS Certified rules packages to help establish secure configuration postures for [some of the operating systems ](https://docs.aws.amazon.com/inspector/v1/userguide/inspector_cis.html)

- [CIS-CAT pro](https://www.cisecurity.org/cybersecurity-tools/cis-cat-pro) tool for validation 
  This is a licensed tool provided by CIS. The image built in this workshop was validated using this tool and snippet of score and pass/fail checks details is provided below

![CIS-Amazon Linux 2-Benchmark](/static/images/regulatory-compliance/cis-al2-eks/cis-cat-pro-report.png)

  This is list of failed checks

![CIS-Amazon Linux 2-Benchmark](/static/images/regulatory-compliance/cis-al2-eks/cis-cat-pro-fail.png)



#### CIS Scan Results and Exceptions for failed controls

| CIS ID |   CIS Description  | Reason | *Recommendations
| --- | --- | --- | --- |
| 1.1.22  |  Ensure sticky bit is set on all world-writable directories | Directories used by containerd are world-writable in this finding. This is required for the functioning of Kubernetes. There are issues open in kubernetes for this ask https://github.com/awslabs/amazon-eks-ami/issues/846| Potential Operation Impact
| 1.6.1.6 | Ensure no unconfined services exist | Processes flagged in this findings are contaier processes. Investigate any unconfined processes. They may need to have an existing security context assigned to them or a policy built for them.  https://aws.github.io/aws-eks-best-practices/security/docs/runtime/#runtime-security | Potential Operation Impact
|2.1.1.2| Ensure chrony is configured | This is possibily a false postive. Chrony configuration is setup in /etc/chrony.d/ in this case | Run "chronyc tracking" to confirm Chrony is configured and working as expected
| 3.2.1| Ensure IP forwarding is disabled|  IP forwarding is required by Kubernertes |  Potential Operation Impact
|3.5.3.2.3| Ensure iptables rules exist for all open ports | iptables are managed by kube-proxy | Please use network policies to manage communication between pods
| 3.5.3.2.4| Ensure iptables default deny firewall policy | iptables are managed by kube-proxy | Please use network policies to manage communication between pods 
| 3.5.3.3.3 | Ensure ip6tables firewall rules exist for all open ports | iptables are managed by kube-proxy | Please use network policies to manage communication between pods
| 4.2.1.5 | Ensure rsyslog is configured to send logs to a remote log host| Configuration of the remote host setting requires knowledge of end user environment |  Customer can setup this configuration to required Syslog endpoint
| 5.3.2 |  Ensure permissions on SSH private host key files are configured | These permission and group ownership is set for host based authentication | Permissions on SSH private host key files set during instance creation.  Please follow remediation instruction in CIS Benchmark PDF.
| 5.3.4  |Ensure SSH access is limited | This needs to be setup by customer | Customer can setup this access 
| 6.1.10  |Ensure no world writable files exist	Fail| Directories used by containerd are world-writable. This is required for the functioning of Kubernetes| There are issues open in kubernetes for this ask https://github.com/awslabs/amazon-eks-ami/issues/846| Potential Operation Impact
| 6.1.11 | Ensure no unowned files or directories exist	Fail | Directories used by containerd | Potential Operation Impact
| 6.1.12 |  Ensure no ungrouped files or directories exist | Directories used by containerd | Potential Operation Impact
| 6.2.2 | Ensure /etc/shadow password fields are not empty| This is false positive | If any accounts in the /etc/shadow file do not have a password, run the following command to lock the account until it can be determined why it does not have a password: passwd -l <username> Also, check to see if the account is logged in and investigate what it is being used for to determine if it needs to be forced off.
    
*Recommendations can have one of the following reasons:

Potential Operation Impact - Recommendation wasn't applied because it would have a negative effect on the service.

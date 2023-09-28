---
title : "Validate custom AMI against CIS Benchmark"
weight : 24
---

After deploying a managed node group that adheres to the CIS Benchmark, we can use the commands outlined in the benchmark to verify the configuration. For this step, there are couple of different options available. 

Community provided validations scripts
Inspector Classic CIS validation for version 1
CIS-CAT pro tool for validation 
This is a licensed tool provided by CIS. The image built in this workshop was validated using this tool and snippet of score and pass/fail checks details is provided

Recommendations can have one of the following reasons:

Potential Operation Impact - Recommendation wasn't applied because it would have a negative effect on the service.
Covered Elsewhere - Recommendation is covered by another control in AWS .

CIS Scan Results and Exceptions

| CIS ID | CIS Description | Reason | Workaround 
| --- | --- | --- | --- |
| 1.1.22  |  Ensure sticky bit is set on all world-writable directories | Directories used by containerd are world-writable. This is required for the functioning of Kubernetes | There are issues open in kubernetes for this ask https://github.com/awslabs/amazon-eks-ami/issues/846
| 1.6.1.6 | Ensure no unconfined services exist | 1 | 0 | Investigate any unconfined processes found during the audit action. They may need to have an existing security context assigned to them or a policy built for them.  https://aws.github.io/aws-eks-best-practices/security/docs/runtime/#runtime-security
|2.1.1.2| Ensure chrony is configured | This is a false postive. Chrony configuration is setup in /etc/chrony.d/| Run chronyd tracking to confirm Chorny is configured
| 2.1.17 | Ensure nfs-utils is not installed or the nfs-server service is masked | 2 | nfs-utils package is enabled by Kuberenets | 2
 3.2.1| Ensure IP forwarding is disabled| 1 | IP forwarding is required by Kubernertes | 1
|3.5.3.2.3| Ensure iptables rules exist for all open ports	Fail | 3 | **12** | Please use network policies to manage communication between pods
| 3.5.3.2.4| Ensure iptables default deny firewall policy | 2 | IPtables on the worker node is controlled by kube-proxy | Please use network policies to manage communication between pods 
| 3.5.3.3.3 | Ensure ip6tables firewall rules exist for all open ports | 1 | 0 | Please use network policies to manage communication between pods
| 4.2.1.5 | Ensure rsyslog is configured to send logs to a remote log host| 3 | **12** | Customer can setup this configuration to required Syslog endpoint
| 5.3.2 |  Ensure permissions on SSH private host key files are configured | 2 | 0 
| 5.3.4  |Ensure SSH access is limited | 1 | 0 | Customer can setup this access 
| 6.1.10  |Ensure no world writable files exist	Fail| Directories used by containerd are world-writable. This is required for the functioning of Kubernetes| There are issues open in kubernetes for this ask https://github.com/awslabs/amazon-eks-ami/issues/846| 15
| 6.1.11 | Ensure no unowned files or directories exist	Fail | 2 | 0 
| 6.1.12 |  Ensure no ungrouped files or directories exist | 2 | 0 
| 6.2.2 | Ensure /etc/shadow password fields are not empty| This is false positive | If any accounts in the /etc/shadow file do not have a password, run the following command to lock the account until it can be determined why it does not have a password: passwd -l <username> Also, check to see if the account is logged in and investigate what it is being used for to determine if it needs to be forced off.
    


   
  
    
    	




https://kubernetes.io/blog/2022/10/05/current-state-2019-third-party-audit/

CIS ID	CIS Description	Reason	Workaround

---
title : "Validate custom AMI against CIS Benchmark"
weight : 24
---

After deploying a managed node group that adheres to the CIS Benchmark, we can use the commands outlined in the [benchmark document](https://www.cisecurity.org/benchmark/amazon_linux) to verify the configuration. For validation, there are couple of different tools available. 

- [Amazon Inspector - CIS Scan for EC2 ](https://docs.aws.amazon.com/inspector/latest/user/scanning-cis.html) Amazon Inspector performs CIS scans on target Amazon EC2 instances based on the instance tags and scanning schedule you define in a scan configuration. For each targeted instance, Amazon Inspector performs a series of checks on the instance. Each check evaluates whether your system configuration meets a specific CIS Benchmark recommendation. 


- [CIS-CAT pro](https://www.cisecurity.org/cybersecurity-tools/cis-cat-pro) tool for validation 
  This is a licensed tool provided by CIS. 

In this lab we will validate the CIS benchmark hardened EC2 instance using Amazon Inspector.


1. We will enable Amazon Inspector to scan EC2
```bash
aws inspector2 enable --resource-types EC2
```
::::expand{header="Check Output"}
```
{
    "accounts": [
        {
            "accountId": "487725470668",
            "resourceStatus": {
                "ec2": "ENABLING",
                "ecr": "DISABLED",
                "lambda": "DISABLED",
                "lambdaCode": "DISABLED"
            },
            "status": "ENABLED"
        }
    ],
    "failedAccounts": []
}
```
::::
2. Let's go to the [Amazon Inspector console](https://us-west-2.console.aws.amazon.com/inspector/v2/home?region=us-west-2)  and  select On-demand scans "CIS scans". Choose "Create new scan".

![Amazon-Instector-1](/static/images/regulatory-compliance/cis-al2-eks/validatescan-1.png)

3. a. Enter a Scan configuration name.

   b. For Target resource enter the Key and corresponding Value of a tag on the instances that you want to scan. You can specify a total of 25 tags to include in the scan, and for each key, you can specify up to five different values.

   c. Choose a CIS Benchmark level. You can select Level 1 for basic security configurations, or Level 2 for advanced security configurations.

   d. For Target accounts, specify which accounts to include in the scan. A standalone account or member in an organization can select Self to create a scan configuration for their account. An Amazon Inspector delegated administrator can select All accounts to target all accounts within the organization, or select Specify accounts and specify a subset of member accounts to target. The delegated administrator can enter SELF instead of an account ID to create a scan configuration for their own account. 

   e. Choose a Schedule for the scans. Choose between One time scan, which will run as soon as you finish creating the scan configuration, or Recurring scans, which will run at the scheduled time that you choose until it's deleted.

   f. Choose Create to finish creating the scan configuration.

*To grant permissions to run CIS scans, attach the “AmazonSSMManagedInstanceCore” and the “AmazonInspector2ManagedCispolicy” IAM policies to the EC2 instance profile role. We have added these roles while creating the managed node group.*

![Amazon-Instector-1](/static/images/regulatory-compliance/cis-al2-eks/validatescan-2.png)

4. Scan status  will be displayed as "IN_PROGRESS" while the instances are been scanned

![Amazon-Instector-1](/static/images/regulatory-compliance/cis-al2-eks/validatescan-3.png)

5. Once the scan is complete it should display status as "COMPLETED"

![Amazon-Instector-1](/static/images/regulatory-compliance/cis-al2-eks/validatescan-4.png)

6. Click the Scan ARN to see the results

![Amazon-Instector-1](/static/images/regulatory-compliance/cis-al2-eks/validatescan-5.png)

- Snippet of "PASSED" checks

![Amazon-Instector-1](/static/images/regulatory-compliance/cis-al2-eks/validatescan-6.png)

- Snippet of "FAILED" checks

![Amazon-Instector-1](/static/images/regulatory-compliance/cis-al2-eks/validatescan-7.png)







#### CIS Scan Results and Exceptions for failed controls

| CIS ID |   CIS Description  | Reason | *Recommendations
| --- | --- | --- | --- |
| 1.1.22  |  Ensure sticky bit is set on all world-writable directories | Directories used by containerd are world-writable in this finding. This is required for the functioning of Kubernetes. There are issues open in kubernetes for this ask https://github.com/awslabs/amazon-eks-ami/issues/846| Potential Operation Impact
| 1.6.1.6 | Ensure no unconfined services exist | Processes flagged in these findings are container processes. Investigate any unconfined processes. They may need to have an existing security context assigned to them or a policy built for them.  https://aws.github.io/aws-eks-best-practices/security/docs/runtime/#runtime-security | Potential Operation Impact
|2.1.1.2| Ensure chrony is configured | This is possibly a false positive. Chrony configuration is setup in /etc/chrony.d/ in this case | Run "chronyc tracking" to confirm Chrony is configured and working as expected
| 3.2.1| Ensure IP forwarding is disabled|  IP forwarding is required by Kubernetes |  Potential Operation Impact
|3.5.3.2.3| Ensure iptables rules exist for all open ports | iptables are managed by kube-proxy | Please use network policies to manage communication between pods
| 3.5.3.2.4| Ensure iptables default deny firewall policy | iptables are managed by kube-proxy | Please use network policies to manage communication between pods 
| 3.5.3.3.3 | Ensure ip6tables firewall rules exist for all open ports | iptables are managed by kube-proxy | Please use network policies to manage communication between pods
| 4.2.1.5 | Ensure rsyslog is configured to send logs to a remote log host| Configuration of the remote host setting requires knowledge of end user environment |  Customer can setup this configuration to required Syslog endpoint
| 5.3.2 |  Ensure permissions on SSH private host key files are configured | These permission and group ownership is set for host based authentication | Permissions on SSH private host key files set during instance creation.  Please follow remediation instruction in CIS Benchmark PDF.
| 5.3.4  |Ensure SSH access is limited | This needs to be setup by customer | Customer can setup this access 
| 6.1.10  |Ensure no world writable files exist	Fail| Directories used by containerd are world-writable. This is required for the functioning of Kubernetes| There are issues open in Kubernetes for this ask https://github.com/awslabs/amazon-eks-ami/issues/846| Potential Operation Impact
| 6.1.11 | Ensure no unowned files or directories exist	Fail | Directories used by containerd | Potential Operation Impact
| 6.1.12 |  Ensure no ungrouped files or directories exist | Directories used by containerd | Potential Operation Impact

    
*Recommendations can have one of the following reasons:

Potential Operation Impact - Recommendation wasn't applied because it would have a negative effect on the service.

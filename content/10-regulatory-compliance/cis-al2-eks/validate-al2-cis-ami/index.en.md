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

:::code{language=json lineNumberStart=1 highlightLines=6,11 highlightLinesStart=1}
{
    "accounts": [
        {
            "accountId": "872629243257",
            "resourceStatus": {
                "ec2": "ENABLED",
                "ecr": "DISABLED",
                "lambda": "DISABLED",
                "lambdaCode": "DISABLED"
            },
            "status": "ENABLED"
        }
    ],
    "failedAccounts": []
}
:::

::::

:::alert{header="Important" type="warning"}
Amazon Inspector 2 activation may take some time. Make sure Amazon Instector status is Enabled before you proceed.
:::

Setup CIS scan configuration using either AWS CLI or AWS Console once Amazon Inspector status is **ENABLED**
:::::tabs{variant="container"}

::::tab{id="cli" label="Using AWS CLI"}

Run the following command to create the cis scan configuration using AWS CLI

```bash
AWS_ACCOUNT=$(aws sts get-caller-identity --query "Account" --output text)
cd ~/environment
cat > inspector-cis-scan-config.json <<EOF
{
    "scanName":  "security-lab",
    "schedule": {
        "oneTime": {}
    },
    "securityLevel": "LEVEL_2",
    "targets": {
        "accountIds": [
            "$AWS_ACCOUNT"
        ],
        "targetResourceTags": {
            "eks:nodegroup-name":  [ "custom-ng-amd" ]
        }
    }
}
EOF

aws inspector2 create-cis-scan-configuration --cli-input-json file://inspector-cis-scan-config.json

```
::::expand{header="Check Output"}
```
{
    "scanConfigurationArn": "arn:aws:inspector2:us-west-2:872629243257:owner/872629243257/cis-configuration/464bb15d-47d6-47ce-8e97-d95f741a1440"
}
```
::::
::::tab{id="console" label="Using AWS Console"}

1. Let's go to the [Amazon Inspector console](https://console.aws.amazon.com/inspector/v2/home)  and  select On-demand scans "CIS scans". Choose "Create new scan".

![Amazon-Instector-1](/static/images/regulatory-compliance/cis-al2-eks/validatescan-1.png)

2. a. Enter a Scan configuration name.
   ```bash
   security-lab
   ```

   b. For Target resource enter the Key and corresponding Value of a tag on the instances that you want to scan. You can specify a total of 25 tags to include in the scan, and for each key, you can specify up to five different values.
   For this lab specify the below Resource tags:

   **Key**
   ```bash
    eks:nodegroup-name
    ```
    **Value**
    ```bash 
    custom-ng-amd
    ```
   c. Choose a CIS Benchmark level of **LEVEL_2**. 

   You can select Level 1 for basic security configurations, or Level 2 for advanced security configurations.

   d. Select Target account as **Self**.

   For Target accounts, specify which accounts to include in the scan. A standalone account or member in an organization can select Self to create a scan configuration for their account. 

   e. Choose Schedule as **One time** scan, which will run as soon as you finish creating the scan configuration


   f. Choose **Create** to finish creating the scan configuration.
   It will take approtimately 10 minutes to complete scan of two instances

   ![Amazon-Instector-1](/static/images/regulatory-compliance/cis-al2-eks/validatescan-2.png)

::::

:::::
::alert[To grant permissions to run CIS scans, the “AmazonSSMManagedInstanceCore” and the “AmazonInspector2ManagedCispolicy” IAM policies needs to be attached to the EC2 instance profile role. We have added these roles while creating the managed node group.]{header="Note"}


 Let's go to the [Amazon Inspector console](https://console.aws.amazon.com/inspector/v2/home) to check CIS scan status
 
 Scan status  will be displayed as **IN_PROGRESS** while the instances are been scanned

![Amazon-Instector-1](/static/images/regulatory-compliance/cis-al2-eks/validatescan-3.png)

 Once the scan is complete it should display status as  **COMPLETED**

![Amazon-Instector-1](/static/images/regulatory-compliance/cis-al2-eks/validatescan-4.png)

 Click the Scan ARN to see the results

![Amazon-Instector-1](/static/images/regulatory-compliance/cis-al2-eks/validatescan-5.png)

- Snippet of **PASSED** checks

![Amazon-Instector-1](/static/images/regulatory-compliance/cis-al2-eks/validatescan-6.png)

- Snippet of **SKIPPED** checks

The checks that requires manual steps to determine whether a system’s configured state is as expected is skipped in the scan. Manual recommendations are equally important to automated and this should be validated using the assesment steps provided in [ CIS Amazon Linux 2 Benchmark ](https://www.cisecurity.org/benchmark/amazon_linux). 

![Amazon-Instector-1](/static/images/regulatory-compliance/cis-al2-eks/validatescan-8.png)

- Snippet of **FAILED** checks

![Amazon-Instector-1](/static/images/regulatory-compliance/cis-al2-eks/validatescan-7.png)








#### CIS Scan Results and Exceptions for failed controls

The controls that did not pass, along with the rationale and potential remediations, are specified below. To satisfy security and compliance prerequisites, customers can remediate failed controls by adhering to the guidance in the [CIS benchmark for Amazon Linux 2](https://www.cisecurity.org/benchmark/amazon_linux) documentation. After remediating controls, it is advised that applications deployed on Amazon EKS are evaluated to confirm functionality.

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

    
***Recommendations can have one of the following reasons:**

*Potential Operation Impact - Recommendation wasn't applied because it would have a negative effect on the service.*

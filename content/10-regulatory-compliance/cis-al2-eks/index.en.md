---
title : "Building Amazon Linux 2 CIS Benchmark AMIs for Amazon EKS"
weight : 34
---

The [Center for Internet Security (CIS)](https://www.cisecurity.org/) Benchmarks are best practices for the secure configuration of a target system. They define various Benchmarks for the Kubernetes control plane and the data plane. For [Amazon EKS](https://aws.amazon.com/eks/) clusters, it’s strongly recommended to follow the [CIS Amazon EKS Benchmark](https://aws.amazon.com/blogs/containers/introducing-cis-amazon-eks-benchmark/). However, many organizations also need to harden the operating system on the worker nodes for security and compliance purposes. If the data plane of an Amazon EKS cluster uses [ Amazon Linux 2 ](https://aws.amazon.com/amazon-linux-2/?amazon-linux-whats-new.sort-by=item.additionalFields.postDateTime&amazon-linux-whats-new.sort-order=desc) as a node group Operating System, it is recommended to implement the [ CIS Amazon Linux 2 Benchmark ](https://www.cisecurity.org/benchmark/amazon_linux). 
This workshop provides detailed, step-by-step instructions on how you  can build an Amazon EKS Amazon Machine Image (AMI) compliant with the CIS Amazon Linux 2 Benchmarks. It will also provide guidance on how to validate the worker nodes against the Benchmark after deployment.


#### Amazon EKS optimized Amazon Linux 2 AMI hardening process

The CIS Amazon Linux 2 Benchmark defines two profiles for hardening (i.e., Level 1 and Level 2):

1. A Level 1 profile is intended to be practical and prudent, provide a clear security benefit, and not inhibit the utility of the technology beyond acceptable means.
2. A Level 2 profile is intended for environments or use cases where security is paramount, acts as a defense in depth measure, and may negatively inhibit the utility or performance of the technology.

There are two approaches for hardening the Amazon EKS AMI for CIS Benchmark Level 1 or Level 2 profiles.

1. Use the standard Amazon EKS Optimized AMI as a base and add hardening on top of it. This process requires someone to apply all of configuration mentioned in the Amazon Linux 2 CIS Benchmark specification. This workshop addresses this approach and provides step by step instructions on how build an Amazon EKS hardened AMI, leveraging the community provided hardening script

2. Use the Amazon Linux 2 (AL2) CIS Benchmark Level 1 and Level 2 AMI from the AWS Marketplace as a base, and add Amazon EKS specific components on top of it. Please refer the [blog](https://aws.amazon.com/blogs/containers/building-amazon-linux-2-cis-benchmark-amis-for-amazon-eks/) for this approach.


Here is a solution for hardening and validating an Amazon EKS optimized Amazon Linux 2 AMI against Level 2. 



![CIS-Amazon Linux 2-Benchmark](/static/images/regulatory-compliance/cis-al2-eks/cis-al2-soln.png)

#### Amazon EKS optimized Amazon Linux 2 AMI support for CIS Benchmark

The Amazon EKS customized AMI using the hardening  script (as of this writing) can achieve more than 90% of hardening for  Level 1 and 2 recommendations specified in the CIS Benchmark for Amazon Linux 2, it also follows the hardening standards mentioned in  [CIS Amazon EKS Benchmark](https://aws.amazon.com/blogs/containers/introducing-cis-amazon-eks-benchmark/). For the recommendations which are not able to adhere we do have provided reasons or alternative remediation guidelines. Below tabled comprised of Automatic and Manual checks.

| Section Number | Section | Level 1 | Level 2 | Total
| --- | --- | --- | --- | --- |
| 1 | Initial setup | 45 | 7 | 52
| 2 | Services | 27 | 0 | 27
| 3 | Network configuration | 45 | 3 | 48
| 4 | Logging and auditing | 11 | 22 | 33
| 5 | Access, Authentication and Authorization | 47 | 2 | 49
| 6 | System Maintenance | 30 | 1 | 31
|   |                      | 205 | 35 | 240



#### Install Session Manager plugin on Linux

1. Download the Session Manager plugin RPM package.
```bash
cd ~/environment
curl "https://s3.amazonaws.com/session-manager-downloads/plugin/latest/linux_64bit/session-manager-plugin.rpm" -o "session-manager-plugin.rpm"
```
2. Run the install command.
```bash
sudo yum install -y session-manager-plugin.rpm
```
3. Run the following commands to verify that the Session Manager plugin installed successfully.
```bash
session-manager-plugin
```
If the installation was successful, the following message is returned.
```
The Session Manager plugin is installed successfully. Use the AWS CLI to start a session.
```

You’ll also need to configure the following environment variables:

```bash
export AWS_REGION=$(curl -s 169.254.169.254/latest/dynamic/instance-identity/document | jq -r '.region')
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text)
export EKS_VERSION=$(aws eks describe-cluster --name $EKS_CLUSTER  --region $AWS_REGION --query "cluster.version")
echo $EKS_VERSION
```
Make sure you see EKS_VERSION populated before proceeding

::::expand{header="Check Output"}
```bash
"1.28"
```
::::

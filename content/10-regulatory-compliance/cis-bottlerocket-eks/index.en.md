---
title : "Validating Amazon EKS optimized Bottlerocket AMI against the CIS Benchmark"
weight : 34
---

The [Center for Internet Security (CIS)](https://www.cisecurity.org/) Benchmarks are best practices for the secure configuration of a target system. They define various Benchmarks for the Kubernetes control plane and the data plane. For [Amazon EKS](https://aws.amazon.com/eks/) clusters, it’s strongly recommended to follow the [CIS Amazon EKS Benchmark](https://aws.amazon.com/blogs/containers/introducing-cis-amazon-eks-benchmark/). However, many organizations also need to harden the operating system on the worker nodes for security and compliance purposes. [Bottlerocket](https://aws.amazon.com/bottlerocket/) is a Linux-based open-source operating system that is purpose-built by Amazon Web Services for containers. If an organization needs to ensure compliance, the organization must implement the [CIS Benchmark for Bottlerocket](https://www.cisecurity.org/benchmark/bottlerocket). 

In this module, we will have detailed step-by-step instructions on how you can bootstrap an Amazon EKS optimized Bottlerocket Amazon Machine Image (AMI) for the requirements of the [CIS Bottlerocket Benchmarks](https://aws.amazon.com/about-aws/whats-new/2022/08/center-for-internet-security-bottlerocket-available/). It will also illustrates how to continuously validate the worker nodes against the Benchmark after deployment to minimize the risk of security configuration drift.


### Amazon EKS optimized Bottlerocket AMI hardening process

The CIS Bottlerocket Benchmark defines two profiles for hardening (i.e., Level 1 and Level 2):

1. A Level 1 profile is intended to be practical and prudent, provide a clear security benefit, and not inhibit the utility of the technology beyond acceptable means.
2. A Level 2 profile is intended for environments or use cases where security is paramount, acts as a defense in depth measure, and may negatively inhibit the utility or performance of the technology.

Here is a solution for hardening and validating an Amazon EKS optimized Bottlerocket AMI against Level 2.



![CIS-Bottlerocket-Benchmark](/static/images/regulatory-compliance/cis-bottlerocket-eks/CIS-Bottlerocket-Benchmark-1024x514.png)

### Amazon EKS optimized Bottlerocket AMI support for CIS Benchmark

The Amazon EKS optimized Bottlerocket AMI (as of this writing) supports 18 out of 28 Level 1 and 2 recommendations specified in the CIS Benchmark for Bottlerocket, without a need for any additional configuration effort. For the remaining 10 recommendations to adhere to Level 2, six recommendations can be addressed via a bootstrap container and four recommendations can be addressed via kernel sysctl configurations in the user data of the Amazon EKS worker nodes.


| Section Number | Section | Level 1 | Level 2 | Total
| --- | --- | --- | --- | --- |
| 1 | Initial setup | 7 | 3 | 10
| 2 | Services | 1 | 0 | 1
| 3 | Network configuration | 3 | **12** | 15
| 4 | Logging and auditing | 2 | 0 | 2
|   |                      | 13 | 15 | 28


The code used in this solution is available in GitHub. Please clone the repository to prepare for the walkthrough.

```bash
cd ~/environment
git clone https://github.com/aws-samples/containers-blog-maelstrom.git
cd ~/environment/containers-blog-maelstrom/cis-bottlerocket-benchmark-eks/
```

You’ll also need to configure the following environment variables:

```bash
export AWS_REGION=us-west-2 # change the region if it is different from us-west-2
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text)
export CLUSTER_NAME=cis-bottlerocket
export BOOTSTRAP_ECR_REPO=bottlerocket-cis-bootstrap-image
export VALIDATION_ECR_REPO=bottlerocket-cis-validation-image
```

#### Install Session Manager plugin on Linux

1. Download the Session Manager plugin RPM package.
```bash
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


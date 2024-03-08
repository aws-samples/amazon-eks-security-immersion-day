---
title : "Preparing the signing environment"
weight : 21
---

Configure AWS CLI with your current region as default.
```bash
cd ~/environment
export ACCOUNT_ID=$(aws sts get-caller-identity --output text --query Account)
export AWS_REGION=$(curl -s 169.254.169.254/latest/dynamic/instance-identity/document | jq -r '.region')
```

### Download and Install the container-signing tools
Two software packages need to be installed in local environment to sign images:

1. AWS Signer plugin for Notation
2. open source supply chain security program Notation, developed by the [Notary Project](https://notaryproject.dev/)

[AWS Signer provides an installer](https://docs.aws.amazon.com/signer/latest/developerguide/image-signing-prerequisites.html), which installs both the AWS Signer plugin for Notation and the Notation client. The installer includes the following.

* Notation binary and third party license
* AWS Signer plugin binary and third party license
* Notation license
* Trust store and root certificate
* A configurable trust policy

Download the required rpm installer package file to the current directory.

```bash
wget https://d2hvyiie56hcat.cloudfront.net/linux/amd64/installer/rpm/latest/aws-signer-notation-cli_amd64.rpm
```

::::expand{header="Check Output"}
```bash
--2023-07-17 07:26:44--  https://d2hvyiie56hcat.cloudfront.net/linux/amd64/installer/rpm/latest/aws-signer-notation-cli_amd64.rpm
Resolving d2hvyiie56hcat.cloudfront.net (d2hvyiie56hcat.cloudfront.net)... 99.84.216.211, 99.84.216.217, 99.84.216.96, ...
Connecting to d2hvyiie56hcat.cloudfront.net (d2hvyiie56hcat.cloudfront.net)|99.84.216.211|:443... connected.
HTTP request sent, awaiting response... 200 OK
Length: 4321915 (4.1M) [binary/octet-stream]
Saving to: ‘aws-signer-notation-cli_amd64.rpm’

aws-signer-notation-cli 100%[==============================>]   4.12M  9.36MB/s    in 0.4s    

2023-07-17 07:26:46 (9.36 MB/s) - ‘aws-signer-notation-cli_amd64.rpm’ saved [4321915/4321915]
```
::::

Install the package using the following command.

```bash
sudo rpm -U aws-signer-notation-cli_amd64.rpm 
```
::::expand{header="Check Output"}

::::



### Verify the package installation

After downloading and installing the package, let us verify if the the installation was successful.

Use the following command to display the Notation client version.

```bash
notation version
```

::::expand{header="Check Output"}
```bash
Notation - a tool to sign and verify artifacts.

Version:     1.0.0
Go version:  go1.20.7
Git commit:  80e3fc4e2eeb43ac00bc888cf41101f5c56f1535
```
::::


Use the following command to list the installed plugins for the Notation client and verify that you see the `com.amazonaws.signer.notation.plugin` plugin.

```bash
notation plugin ls
```

The output will like below.
```bash
NAME                                   DESCRIPTION                      VERSION   CAPABILITIES                                                                                             ERROR   
com.amazonaws.signer.notation.plugin   AWS Signer plugin for Notation   1.0.298   [SIGNATURE_GENERATOR.ENVELOPE SIGNATURE_VERIFIER.TRUSTED_IDENTITY SIGNATURE_VERIFIER.REVOCATION_CHECK]   <nil> 
```

Verify that the Notation directory structure for your operating system was created. For Amazon Linux 2023, the Notation directory structure is created at `~/.config/notation/`. 

Let us first install the `tree` command line tool in the EC2 Instance.

```bash
sudo yum -y install tree
```

::::expand{header="Check Output"}
```bash
Last metadata expiration check: 8:29:03 ago on Mon Jul 17 00:00:13 2023.
Dependencies resolved.
======================================================================================================
 Package          Architecture       Version                            Repository               Size
======================================================================================================
Installing:
 tree             x86_64             1.8.0-6.amzn2023.0.2               amazonlinux              56 k

Transaction Summary
======================================================================================================
Install  1 Package

Total download size: 56 k
Installed size: 113 k
Downloading Packages:
tree-1.8.0-6.amzn2023.0.2.x86_64.rpm                                  741 kB/s |  56 kB     00:00    
------------------------------------------------------------------------------------------------------
Total                                                                 416 kB/s |  56 kB     00:00     
Running transaction check
Transaction check succeeded.
Running transaction test
Transaction test succeeded.
Running transaction
  Preparing        :                                                                              1/1 
  Installing       : tree-1.8.0-6.amzn2023.0.2.x86_64                                             1/1 
  Running scriptlet: tree-1.8.0-6.amzn2023.0.2.x86_64                                             1/1 
  Verifying        : tree-1.8.0-6.amzn2023.0.2.x86_64                                             1/1 

Installed:
  tree-1.8.0-6.amzn2023.0.2.x86_64                                                                    

Complete!
```
::::

Run the following command to see the Notation directory structure. In the tree output you can clearly see that the AWS Signer plugin is installed, as well as the Notation `truststore` directory, and a Notation `trustpolicy` document.

```bash
tree ~/.config/notation/
```

The output will look like below.

```bash
/home/ec2-user/.config/notation/
├── LICENSE
├── THIRD_PARTY_LICENSES
├── plugins
│   └── com.amazonaws.signer.notation.plugin
│       ├── LICENSE
│       ├── THIRD_PARTY_LICENSES
│       └── notation-com.amazonaws.signer.notation.plugin
├── trustpolicy.json
└── truststore
    └── x509
        └── signingAuthority
            └── aws-signer-ts
                └── aws-signer-notation-root.crt

6 directories, 7 files
```

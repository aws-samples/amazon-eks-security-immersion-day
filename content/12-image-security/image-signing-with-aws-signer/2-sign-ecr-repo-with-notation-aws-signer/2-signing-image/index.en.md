---
title : "Signing container image with Notation CLI"
weight : 22
---

### Create an ECR Repoistory

Let us first create an Amazon ECR private repo and push the Kubernetes pause container image.

Run below commands to set few environmet variables.

```bash
export AWS_REGION=us-west-2
export ACCOUNT_ID=$(aws sts get-caller-identity --output text --query Account)
export IMAGE_REPO="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
export IMAGE_NAME=pause
```

Run the below commands to create the ECR Repo.

```bash
export ECR_REPO_URI=$(aws ecr describe-repositories --repository-name ${IMAGE_NAME}  | jq -r '.repositories[0].repositoryUri')
if [ -z "$ECR_REPO_URI" ]
then
      echo "${IMAGE_REPO}/${IMAGE_NAME} does not exist. So creating it..."
      ECR_REPO_URI=$(aws ecr create-repository \
        --repository-name $IMAGE_NAME\
        --region $AWS_REGION \
        --query 'repository.repositoryUri' \
        --output text)
      echo "ECR_REPO_URI=$ECR_REPO_URI"
else
      echo "${IMAGE_REPO}/${IMAGE_NAME} already exist..."
fi
```

::::expand{header="Check Output"}
```bash
XXXXXXXXXX.dkr.ecr.us-west-2.amazonaws.com/pause does not exist. So creating it...
ECR_REPO_URI=XXXXXXXXXX.dkr.ecr.us-west-2.amazonaws.com/pause
```
::::

Run the below command to pull the Kubernetes pause container image from the public ECR Repo and push it to our private ECR Repo.

```bash
docker pull public.ecr.aws/eks-distro/kubernetes/pause:3.2
docker tag  public.ecr.aws/eks-distro/kubernetes/pause:3.2 ${IMAGE_REPO}/${IMAGE_NAME}
docker push ${IMAGE_REPO}/${IMAGE_NAME}
```

::::expand{header="Check Output"}
```bash
Using default tag: latest
The push refers to repository [XXXXXXXXX.dkr.ecr.us-west-2.amazonaws.com/pause]
ece9f8b4c4aa: Layer already exists 
latest: digest: sha256:33f19d2d8ba5fc17ac1099a840b0feac5f40bc6ac02d99891dbd13b0e204af4e size: 526
```
::::


Ensure that the pause container image is pushed to [Amazon ECE Repo](https://console.aws.amazon.com/ecr/repositories).

![pause-image-1](/static/images/image-security/image-signing/pause-image-1.png)



### Create AWS signing profile

We need to first create an AWS Signer signing profile using the `Notation-OCI-SHA384-ECDSA` signing platform. You can optionally specify a signature validity period using the `--signature-validity-period` parameter. This value may be specified using `DAYS`, `MONTHS`, or `YEARS`. If no validity period is specified, the default value of **135 months (i.e. 11 years and 3 months)** is used. We will use the default option in this lab.

Run the following command to create a AWS Signer signing profile with default validity period.

```bash
export AWS_SIGNING_PROFILE_ARN=$(aws signer put-signing-profile \
    --profile-name notation_test2 \
    --platform-id Notation-OCI-SHA384-ECDSA | jq -r '.arn')
echo $AWS_SIGNING_PROFILE_ARN
```

The output will look like below.

```bash
arn:aws:signer:us-west-2:XXXXXXXXXXX:/signing-profiles/notation_test
```

You can see the newly created Signing profile in the [AWS Signer Console](https://console.aws.amazon.com/signer/home?#/signing-profiles/notation_test).

![aws-signer-profile](/static/images/image-security/image-signing/aws-signer-profile.png)
 
Run the below command to list AWS Signer signing profiles.

```bash
aws signer list-signing-profiles
```
::::expand{header="Check Output"}
```json
{
    "profiles": [
        {
            "profileName": "notation_test",
            "profileVersion": "IrwHQeF7XW",
            "profileVersionArn": "arn:aws:signer:us-west-2:XXXXXXXXXXX:/signing-profiles/notation_test/IrwHQeF7XW",
            "signingMaterial": {},
            "signatureValidityPeriod": {
                "value": 135,
                "type": "MONTHS"
            },
            "platformId": "Notation-OCI-SHA384-ECDSA",
            "platformDisplayName": "Notation for container registries",
            "status": "Active",
            "arn": "arn:aws:signer:us-west-2:XXXXXXXXXXX:/signing-profiles/notation_test",
            "tags": {}
        }
    ]
}
```
::::

With the AWS Signer plugin installed and a signing profile in place, we are almost ready to sign our container images. For this example, we are using the Kubernetes pause container, stored in an Amazon ECR repository. 

The following `notation sign` command uses the container image digest, instead of the image tag. Moreover, it is considered a best practice to use the unique digest, as tags are considered mutable and can be non-deterministic.


### Amazon ECR credentials and CLI tools

Before you can sign an Amazon ECR container image, you need to make sure that the Notation CLI has basic auth credentials to access Amazon ECR registries. There are two options for supplying Amazon ECR basic auth credentials to Notation.

1. Use the notation login command using `aws ecr get-login-password`
2. Use a credential-helper 

We will use the second option in this lab. Credential helpers work below the CLI tools to gather needed credentials and make them available for CLI operations. The [Amazon ECR Docker Credential Helper](https://github.com/awslabs/amazon-ecr-credential-helper) can be used as an alternative to using the `aws ecr get-login-password` command with CLI tools that use Amazon ECR basic auth credentials.

Run the below command to install Amazon ECR Docker Credential Helper and docker on the AL2023 EC2 Instance.

```bash
sudo yum install amazon-ecr-credential-helper docker -y
```

::::expand{header="Check Output"}
```bash
Last metadata expiration check: 2:36:24 ago on Tue Jul 18 00:00:13 2023.
Dependencies resolved.
=======================================================================================================================
 Package                                 Architecture      Version                        Repository              Size
=======================================================================================================================
=======================================================================================================================
Install  1 Package

Total download size: 2.2 M
Installed size: 6.3 M
Downloading Packages:
amazon-ecr-credential-helper-0.6.0-1.amzn2023.x86_64.rpm                                14 MB/s | 2.2 MB     00:00    
-----------------------------------------------------------------------------------------------------------------------
Total                                                                                   11 MB/s | 2.2 MB     00:00     
Running transaction check
Transaction check succeeded.
Running transaction test
Transaction test succeeded.
Running transaction
  Preparing        :                                                                                               1/1 
  Installing       : amazon-ecr-credential-helper-0.6.0-1.amzn2023.x86_64                                          1/1 
  Running scriptlet: amazon-ecr-credential-helper-0.6.0-1.amzn2023.x86_64                                          1/1 
  Verifying        : amazon-ecr-credential-helper-0.6.0-1.amzn2023.x86_64                                          1/1 

Installed:
  amazon-ecr-credential-helper-0.6.0-1.amzn2023.x86_64                                                                 

Complete!
```
::::

To use the Amazon ECR Docker Credential Helper, we need to ensure `docker-credential-ecr-login` and `docker` binaries exists on your `PATH` and configure the ~/.docker/config.json as follows.

Run the following command to create `.docker' folder and create the docker config file.

```bash
mkdir ~/.docker
cat << EOF > ~/.docker/config.json 
{
            "credsStore": "ecr-login"
}
EOF
```

This configures the Docker daemon to use the credential helper for all Amazon ECR registries.


### Signing the Container Image

Run the below tool to get the container image digest using the AWS ECR command line.

```bash
export IMAGE_DIGEST=$(aws ecr describe-images --repository-name ${IMAGE_NAME} | jq -r '.imageDetails[0].imageDigest')
echo $IMAGE_DIGEST
```

::::expand{header="Check Output"}
```bash
sha256:33f19d2d8ba5fc17ac1099a840b0feac5f40bc6ac02d99891dbd13b0e204af4e
```
::::

Run the below `notation` command to sign the container image.
,
```bash
notation sign ${IMAGE_REPO}/${IMAGE_NAME}@$IMAGE_DIGEST \
--plugin com.amazonaws.signer.notation.plugin \
--id $AWS_SIGNING_PROFILE_ARN
```
The output will look like below.

```bash
Successfully signed XXXXXXXXXX.dkr.ecr.us-west-2.amazonaws.com/pause@sha256:33f19d2d8ba5fc17ac1099a840b0feac5f40bc6ac02d99891dbd13b0e204af4e
```

::alert[Even though Amazon ECR supports immutable tags as a repository-level configuration, tag-immutability is not supported with the OCI 1.0 reference specification that is used with this container image signing approach.]{header="Note"}

With the OCI 1.0 reference specification, container image signatures are stored along-side tagged container images in an OCI registry. In an Amazon ECR repository, the signatures are stored as seen in the following screenshot, where the untagged artifact is the actual signature. The Image Index contains a manifest that references the container image signature.


You can see that signature is generated and stored along side the container image in the ECR Repo [Amazon ECE Repo](https://console.aws.amazon.com/ecr/repositories).

![pause-signature](/static/images/image-security/image-signing/pause-signature.png)

Clicking on the `Signature` value in the **Artifact Type** column of the *untagged* artifact indicates that its type is an `application/vnd.cncf.notary.signature`.

You can also see the coresponding Signing job in [AWS Signer Console](https://console.aws.amazon.com/signer/home?#/signing-jobs)

![signing-job](/static/images/image-security/image-signing/signing-job.png)

You can also use AWS Signer CLI to get the list of signing jobs.

```bash
aws signer list-signing-jobs
```

::::expand{header="Check Output"}
```json
{
    "jobs": [
        {
            "jobId": "5808635f-05de-4207-a891-c95f827b50f4",
            "signingMaterial": {},
            "createdAt": "2023-07-18T10:51:39+00:00",
            "status": "Succeeded",
            "isRevoked": false,
            "profileName": "notation_test",
            "profileVersion": "IrwHQeF7XW",
            "platformId": "Notation-OCI-SHA384-ECDSA",
            "platformDisplayName": "Notation for container registries",
            "signatureExpiresAt": "2034-10-18T10:51:39+00:00",
            "jobOwner": "XXXXXXXXXX",
            "jobInvoker": "XXXXXXXXXX"
        }
    ]
}
```
::::




Once the container image is signed, you can inspect the signature including certificate chains and fingerprints with the following `notation inspect` command. 

::alert[Please note we are using the container image digest rather than the image tag, for signing and verifying.]{header="Note"}

```bash
notation inspect "${IMAGE_REPO}/${IMAGE_NAME}@${IMAGE_DIGEST}"
```

::::expand{header="Check Output"}
```bash
inspecting all signatures for signed artifact
XXXXXXXXXX.dkr.ecr.us-west-2.amazonaws.com/pause@sha256:33f19d2d8ba5fc17ac1099a840b0feac5f40bc6ac02d99891dbd13b0e204af4e
└── application/vnd.cncf.notary.signature
    └── sha256:0ce8076b6b08a66563cef8cc7e05ae8c8336ae4a491b36070576c0cd4f12eb7e
        ├── media type: application/jose+json
        ├── signature algorithm: ECDSA-SHA-384
        ├── signed attributes
        │   ├── signingScheme: notary.x509.signingAuthority
        │   ├── signingTime: Tue Jul 18 10:51:39 2023
        │   ├── expiry: Wed Oct 18 10:51:39 2034
        │   ├── io.cncf.notary.verificationPlugin: com.amazonaws.signer.notation.plugin
        │   ├── com.amazonaws.signer.signingProfileVersion: arn:aws:signer:us-west-2:XXXXXXXXXX:/signing-profiles/notation_test/IrwHQeF7XW
        │   └── com.amazonaws.signer.signingJob: arn:aws:signer:us-west-2:XXXXXXXXXX:/signing-jobs/5808635f-05de-4207-a891-c95f827b50f4
        ├── user defined attributes
        │   └── (empty)
        ├── unsigned attributes
        │   └── (empty)
        ├── certificates
        │   ├── SHA256 fingerprint: 32c200384604880d81da16e33b917e35e34b3d4378ec94a97158257e5f8ea776
        │   │   ├── issued to: CN=AWS Signer,OU=AWS Cryptography,O=AWS,L=Seattle,ST=WA,C=US
        │   │   ├── issued by: CN=AWS Signer us-west-2 Code Signing CA G1,OU=Cryptography,O=AWS,ST=WA,C=US
        │   │   └── expiry: Fri Jul 21 08:42:08 2023
        │   ├── SHA256 fingerprint: 2e702af7bc60f5a7a107dfff68bdbe8df35a91d0994136e26ab0f96b3dd92802
        │   │   ├── issued to: CN=AWS Signer us-west-2 Code Signing CA G1,OU=Cryptography,O=AWS,ST=WA,C=US
        │   │   ├── issued by: CN=AWS Signer Code Signing Int CA G1,OU=Cryptography,O=AWS,ST=WA,C=US
        │   │   └── expiry: Tue Apr 30 01:05:25 2024
        │   ├── SHA256 fingerprint: eaaac975dcc0d5d160fca1e39834834f014a238cd224d053670982388ccbfca1
        │   │   ├── issued to: CN=AWS Signer Code Signing Int CA G1,OU=Cryptography,O=AWS,ST=WA,C=US
        │   │   ├── issued by: CN=AWS Signer Code Signing Root CA G1,OU=Cryptography,O=AWS,ST=WA,C=US
        │   │   └── expiry: Thu Oct 28 23:18:32 2027
        │   └── SHA256 fingerprint: 90a87d0543c3f094dbff9589b6649affe2f3d6e0f308799be2258461c686473f
        │       ├── issued to: CN=AWS Signer Code Signing Root CA G1,OU=Cryptography,O=AWS,ST=WA,C=US
        │       ├── issued by: CN=AWS Signer Code Signing Root CA G1,OU=Cryptography,O=AWS,ST=WA,C=US
        │       └── expiry: Tue Oct 27 22:33:22 2122
        └── signed artifact
            ├── media type: application/vnd.docker.distribution.manifest.v2+json
            ├── digest: sha256:33f19d2d8ba5fc17ac1099a840b0feac5f40bc6ac02d99891dbd13b0e204af4e
            └── size: 526
```
::::

In the above command output, we can see a hierarchical view of the signed artifact, as well as the signature and associated certificate chain and certificate fingerprints. This is very helpful in case if we need to troubleshoot and trace the provenance of signature material.








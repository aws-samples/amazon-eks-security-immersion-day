---
title : "Create Private Certificate Authority (PCA) with AWS Certificate Manager(ACM)"
weight : 25
---


::::expand{header="Check Output"}
```bash

```
::::

::::expand{header="Check Output"}
```bash

```
::::


::::expand{header="Check Output"}
```bash

```
::::

## Create Private Certificate Authority (PCA) with AWS Certificate Manager

1. Create ca_config.json file to create the certificate authority.

```bash
cat <<EOT > ca_config.json
{
  "KeyAlgorithm":"RSA_2048",
  "SigningAlgorithm":"SHA256WITHRSA",
  "Subject":{
    "Country":"US",
    "Organization":"Example Corp",
    "OrganizationalUnit":"Sales",
    "State":"WA",
    "Locality":"Seattle",
    "CommonName":"www.vpc-lattice-custom-domain.io.com"
  }
}
EOT
```

2. Create an AWS PCA using the ca_config.json 

```bash
export AWS_REGION=$(curl -s 169.254.169.254/latest/dynamic/instance-identity/document | jq -r '.region')

export CA_ARN=$(aws acm-pca create-certificate-authority --certificate-authority-configuration \
file://ca_config.json --certificate-authority-type "ROOT" \
--idempotency-token $(uuidgen) \
--tags Key=Name,Value=vpc-lattice-custom-domain \
--region $AWS_REGION \
--output text --query CertificateAuthorityArn)
echo "CA_ARN=$CA_ARN"

```

::::expand{header="Check Output"}
```bash
CA_ARN=arn:aws:acm-pca:us-east-1:ACCOUNT_ID:certificate-authority/a28c6663-0102-465b-846b-7ea086fcd6d8
```
::::

3. Generate a certificate signing request (CSR):

```bash
aws acm-pca get-certificate-authority-csr \
--certificate-authority-arn $CA_ARN \
--output text \
--endpoint https://acm-pca.$AWS_REGION.amazonaws.com \
--region $AWS_REGION > ca.csr
```

4. Issue the ROOT certificate using the CSR

```bash
export ROOT_CERT_ARN=$(aws acm-pca issue-certificate \
--certificate-authority-arn ${CA_ARN} \
--csr fileb://ca.csr \
--signing-algorithm SHA256WITHRSA \
--template-arn arn:aws:acm-pca:::template/RootCACertificate/V1 \
--validity Value=10,Type=YEARS \
--region $AWS_REGION \
--output text --query CertificateArn)
sleep 10
echo "ROOT_CERT_ARN=$ROOT_CERT_ARN"
```


::::expand{header="Check Output"}
```bash
ROOT_CERT_ARN=arn:aws:acm-pca:us-east-1:ACCOUNT_ID:certificate-authority/a28c6663-0102-465b-846b-7ea086fcd6d8/certificate/32f91a04f28827dc84932a26056de76b
```
::::

5. Retrieve the root certificate:

```bash
aws acm-pca get-certificate \
--certificate-authority-arn ${CA_ARN} \
--certificate-arn ${ROOT_CERT_ARN} \
--region $AWS_REGION \
--output text > root_cert.pem

```

6. Install the root certificate to the CA:

```bash
aws acm-pca import-certificate-authority-certificate \
--certificate-authority-arn ${CA_ARN} \
--certificate fileb://root_cert.pem \
--region $AWS_REGION 
```

7. Ensure that the CA status changed to **ACTIVE**.

```bash
aws acm-pca describe-certificate-authority --certificate-authority-arn ${CA_ARN} --query CertificateAuthority.Status 
```

::::expand{header="Check Output"}
```bash
"ACTIVE"
```
::::


![acm-pca.png](/static/images/6-network-security/2-vpc-lattice-service-access/acm-pca.png)

## Generate an end user certificate signed with AWS PCA

```bash

export CA_ARN="arn:aws:acm-pca:us-east-1:000474600478:certificate-authority/a28c6663-0102-465b-846b-7ea086fcd6d8"
export HOST=$(aws sts get-caller-identity --query "Account" --output text)
export CERTIFICATE_ARN=$(aws acm request-certificate \
--domain-name "*.vpc-lattice-custom-domain.io" \
--subject-alternative-names $HOST".vpc-lattice-custom-domain.io" \
--certificate-authority-arn $CA_ARN \
--region $AWS_REGION \
--query CertificateArn --output text)
echo "CERTIFICATE_ARN=$CERTIFICATE_ARN"
```

::::expand{header="Check Output"}
```bash
CERTIFICATE_ARN=arn:aws:acm:us-east-1:000474600478:certificate/9b4d1c8e-2a94-4a29-b8c1-d1a51e1105fa
```
::::



export CERTIFICATE_ARN=$(\
aws acm-pca issue-certificate --certificate-authority-arn ${CA_ARN} \
--signing-algorithm "SHA256WITHRSA" \
--validity Value=7,Type="DAYS" --query CertificateArn --output text)

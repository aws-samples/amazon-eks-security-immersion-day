---
title : "Setup ACM PCA Infrastructure"
weight : 12
---

## Create Private Certificate Authority (PCA) with AWS Certificate Manager

1. Create ca_config.json file to create the certificate authority.

```bash
cd ~/environment
cat <<EOT > manifests/ca_config.json
{
  "KeyAlgorithm":"RSA_2048",
  "SigningAlgorithm":"SHA256WITHRSA",
  "Subject":{
    "Country":"US",
    "Organization":"Example Corp",
    "OrganizationalUnit":"Sales",
    "State":"WA",
    "Locality":"Seattle",
    "CommonName":"www.vpc-lattice-custom-domain.io.io"
  }
}
EOT
```

2. Create an AWS ACM PCA using the `manifests/ca_config.json` 

```bash
export CA_ARN=$(aws acm-pca create-certificate-authority --certificate-authority-configuration \
file://manifests/ca_config.json --certificate-authority-type "ROOT" \
--idempotency-token $(uuidgen) \
--tags Key=Name,Value=vpc-lattice-custom-domain \
--region $AWS_REGION \
--output text --query CertificateAuthorityArn)
echo "CA_ARN=$CA_ARN"
echo "export CA_ARN=$CA_ARN" >> ~/.bash_profile
```

::::expand{header="Check Output"}
```bash
CA_ARN=arn:aws:acm-pca:us-west-2:ACCOUNT_ID:certificate-authority/8ef430b4-ccdf-4251-8c2d-96ec9d81f07e
```
::::

3. Generate a certificate signing request (CSR).

```bash
aws acm-pca get-certificate-authority-csr \
--certificate-authority-arn $CA_ARN \
--output text \
--endpoint https://acm-pca.$AWS_REGION.amazonaws.com \
--region $AWS_REGION > manifests/ca.csr
```

4. Issue the ROOT certificate using the CSR

```bash
export ROOT_CERT_ARN=$(aws acm-pca issue-certificate \
--certificate-authority-arn ${CA_ARN} \
--csr fileb://manifests/ca.csr \
--signing-algorithm SHA256WITHRSA \
--template-arn arn:aws:acm-pca:::template/RootCACertificate/V1 \
--validity Value=10,Type=YEARS \
--region $AWS_REGION \
--output text --query CertificateArn)
sleep 10
echo "ROOT_CERT_ARN=$ROOT_CERT_ARN"
echo "export ROOT_CERT_ARN=$ROOT_CERT_ARN" >> ~/.bash_profile
```


::::expand{header="Check Output"}
```bash
ROOT_CERT_ARN=arn:aws:acm-pca:us-west-2:ACCOUNT_ID:certificate-authority/8ef430b4-ccdf-4251-8c2d-96ec9d81f07e/certificate/22b702e74933a57ae855ae9c3b27dbd8
```
::::

5. Retrieve the root certificate:

```bash
aws acm-pca get-certificate \
--certificate-authority-arn ${CA_ARN} \
--certificate-arn ${ROOT_CERT_ARN} \
--region $AWS_REGION \
--output text > manifests/root_cert.pem
```

6. Install the root certificate to the CA.

```bash
aws acm-pca import-certificate-authority-certificate \
--certificate-authority-arn ${CA_ARN} \
--certificate fileb://manifests/root_cert.pem \
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

You can also see the Status in the [AWS PCA Console](https://us-west-2.console.aws.amazon.com/acm-pca/home?region=us-west-2#/certificateAuthorities?arn=&tab=null)

![acm-pca1.png](/static/images/6-network-security/2-vpc-lattice-service-access/acm-pca1.png)

## Generate an end user certificate signed with AWS PCA

```bash
export CERTIFICATE_ARN=$(aws acm request-certificate \
--domain-name "*.vpc-lattice-custom-domain.io" \
--subject-alternative-names $ACCOUNT_ID".vpc-lattice-custom-domain.io" \
--certificate-authority-arn $CA_ARN \
--region $AWS_REGION \
--query CertificateArn --output text)
echo "CERTIFICATE_ARN=$CERTIFICATE_ARN"
echo "export CERTIFICATE_ARN=$CERTIFICATE_ARN" >> ~/.bash_profile
```

::::expand{header="Check Output"}
```bash
CERTIFICATE_ARN=arn:aws:acm:us-west-2:ACCOUNT_ID:certificate/d5ebbf85-9b6a-4501-9bfb-65d638b9c0f2
```
::::


```bash
export STATUS=$(aws acm describe-certificate --certificate-arn $CERTIFICATE_ARN --region $AWS_REGION --output json | jq -r '.Certificate.Status')
echo "STATUS=$STATUS"
```

::::expand{header="Check Output"}
```bash
STATUS=ISSUED
```
::::


Go to [AWS ACM Console](https://us-west-2.console.aws.amazon.com/acm/home?region=us-west-2#/certificates/list) and ensure that Certificate is Issued. 

![acm-cert.png](/static/images/6-network-security/2-vpc-lattice-service-access/acm-cert.png)
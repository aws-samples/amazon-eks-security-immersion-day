---
title : "Digital signature verification using openssl"
weight : 21
---

Digital signature can be attached to any artifact such as a document, binary programs, code, email, container images etc. to vouch for its authenticity.

In this section, we will learn how to create a digital signature for a simple plain text file and verify it using [openssl](https://www.openssl.org/) tool. 

Let us create some environment variables first for various files used in this illustration.

```bash
export SAMPLE_TEXT_FILE_TO_BE_SIGNED="sample_plain_text_file.txt"
export PRIVATE_KEY_FILE="private_key_file.pem"
export PUBLIC_KEY_FILE="public_key_file.pem"
export DIGITAL_SIGNATURE_FILE="sign.sha256"
export DIGITAL_SIGNATURE_BASE64_FILE="sign.sha256.base64"
```

Let us create two folders to represent the Sender and Receiver side for the digital signature creation and verification.

```bash
cd ~/environment
mkdir sender
mkdir receiver
```

## Creating digital signature on the Sender's Side

Go to the Sender folder to create the digital signature.

```bash
cd ~/environment/sender
```
Let us create a sample text file for which we want to create a digital signature.

```bash
cat << EOF > $SAMPLE_TEXT_FILE_TO_BE_SIGNED
This is a sample text content to be signed
EOF
```

Digital signature needs a public and private key pair. When using OpenSSL to create these keys, there are two separate commands: one to create a private key, and another to extract the matching public key from the private one. These key pairs are encoded in base64, and their sizes can be specified during this process. In this example, we will generate a 2048-bit RSA key pair with OpenSSL.

Run the below command to create a private key file.

```bash
openssl genpkey -out $PRIVATE_KEY_FILE -algorithm rsa 2048
```

::::expand{header="Check Output"}
```bash
.......++++++
.........................++++++
```
::::

We can drop the `-algorithm rsa` flag in this example because `genpkey` defaults to the type RSA. The file’s name `private_key_file.pem` is arbitrary, but the [**Privacy Enhanced Mail (PEM)**](https://en.wikipedia.org/wiki/Privacy-Enhanced_Mail) extension pem is customary for the default PEM format. If a larger key size (e.g., 4096) is in order, then the last argument of 2048 could be changed to 4096. But for this exercise, we chose 2048.


You can see the generated private key file, which is in base64 format, using below command.

```bash
cat $PRIVATE_KEY_FILE
```

::::expand{header="Check Output"}
```bash
-----BEGIN PRIVATE KEY-----
MIICdgIBADANBgkqhkiG9w0BAQEFAASCAmAwggJcAgEAAoGBAMNaNPpke535Uw7Y
9PpameS7j/IIi6K6Q2nJUFRer6//wDi1C/CBre8ro8XloubDvRHMKiyMipM2dL5i
jAj4vI60xErHsYPETXTOJDl55uF8s2q950WCY+SwExKUJMaMnP4HZJxfVA+yWvdu
9vxr61bSCp3VwhwEojMTyHszvtHrAgMBAAECgYAuOSL9+Fazq3H2umlE77koQSUv
PMxlhbM7zbGfNQRXHanLATPBBb41MFtBETP5bGlJU8jK37pOWP1IqyK9YLWkmLI+
B93XI0Om1SPQydAoFlAIFuhUiN5NxMR3MpUzCro+mxwZG8uQtkfJs4tXU74qNVBN
vxOZ3f5OZnfrZpK2CQJBAOuOyd1/mGvhseV12rFAzk8IfaYbZAYT6pSiCH9rvE4i
qd3aRMsOTp+tjbGc5K9KxuQdiNqWlmCoeYafCLOES5UCQQDUTjR+j4HFTJMrVRvp
zI7rbtPzhRnPVlKCjQWsHgee0VcpNxGZxnbFHIRHtd3W6togw61dzbh+csr9AL0x
y0d/AkB85bf5Htd1lDTcIrIzO9ZoJ2tf8LQHWPYPmx6AWWJ913lT7ZB+Tfa4SbCQ
lUzX+QEeIN7Yb/IKDCpri9V0QdhFAkBaV60e7hJa0usNVXo7U0C+DrtCtTD2edVC
mKABTgYQHyTn9PcYaMvBtRDVMx7jhayspJfxgskvhcm7P8VCmy4hAkEA6vDdzxn6
SbE4kuv57eJD5DzkNR+MsPE3tDVh/0iDWEwUctQrHL720bMiA353CDP7yH/5d0ub
Gf+UlHIM8igI1Q==
-----END PRIVATE KEY-----
```
::::

Next, run the below openssl command to extract the pair’s public key from the private key.

```bash
openssl rsa -in $PRIVATE_KEY_FILE -outform PEM -pubout -out $PUBLIC_KEY_FILE
```

::::expand{header="Check Output"}
```bash
writing RSA key
```
::::

You can see the generated public key file, which is in base64 format, using below command.

```bash
cat $PUBLIC_KEY_FILE
```

::::expand{header="Check Output"}
```bash
-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDDWjT6ZHud+VMO2PT6Wpnku4/y
CIuiukNpyVBUXq+v/8A4tQvwga3vK6PF5aLmw70RzCosjIqTNnS+YowI+LyOtMRK
x7GDxE10ziQ5eebhfLNqvedFgmPksBMSlCTGjJz+B2ScX1QPslr3bvb8a+tW0gqd
1cIcBKIzE8h7M77R6wIDAQAB
-----END PUBLIC KEY-----
```
::::

So far, we created a public and private key pair using openssl tool.

Let us now sign our sample text file using the private key using the below command.

```bash
openssl dgst -sha256 -sign $PRIVATE_KEY_FILE -out $DIGITAL_SIGNATURE_FILE $SAMPLE_TEXT_FILE_TO_BE_SIGNED
```

You can see that the generated digital signature file is in a binary format and `cat` command shows garbage output.

```bash
cat $DIGITAL_SIGNATURE_FILE
```
::::expand{header="Check Output"}
```bash
(o+n5cA;п+Q;7s:.HhJb_.pmj֯35
                           zBY[=ac,ۈ'_TFIj>zoWQ
```
::::


Run the below command to convert the generated binary signature file to readable version of this file in base64 format.

```bash
openssl enc -base64 -in $DIGITAL_SIGNATURE_FILE -out $DIGITAL_SIGNATURE_BASE64_FILE
```

You can see the readiable (i.e. base64 format) version of the signature file.

```bash
cat $DIGITAL_SIGNATURE_BASE64_FILE
```

::::expand{header="Check Output"}
```bash
wShvK24VNWO5Qbs7yQDQv8YRK/hROzdz/Ls6LkiQ2DjqHWjOEkpiGO0MXy5wbQBq
1q/xS+99Mxq4NQt6Qllb5UDyvZwyPYHdiwZhEhrq6R6HyVtjLNuIm9oQqieIBV8X
VOEc9EXrfeK/GX+WRklqPnoYim9X8vXa0K/GKahRxvY=
```
::::


Let us see the files in the current Sender folder

```bash
ls
```

The output should show like below.

```bash
private_key_file.pem   sign.sha256.base64
public_key_file.pem   sample_plain_text_file.txt  sign.sha256
```

Once the digital signature is created, the Sender shares the following artifacts to the Receiver.

1. The signed artifact i.e. sample text file in this case
2. digital signature associated with the signed artifact
3. public key used for verifying the digital signature

Let us copy above 3 files to the receiver folder.

```bash
cp $SAMPLE_TEXT_FILE_TO_BE_SIGNED ~/environment/receiver
cp $DIGITAL_SIGNATURE_BASE64_FILE ~/environment/receiver
cp $PUBLIC_KEY_FILE ~/environment/receiver
```


## Verifying digital signature on the Receiver's Side

The digital signature verification confirm two things. **First**, the signed artifact has not changed since the signature was attached because it is based, on a cryptographic hash of the document. **Second**, the signature belongs to the person who alone has access to the private key in a pair.

Go to the receiver folder and confirm the required artifacts exists before we start verifying the digital signature.

```bash
cd ~/environment/receiver
ls
```
The output will look like below.

```bash
public_key_file.pem  sample_plain_text_file.txt  sign.sha256.base64
```

Let us first  decodes the base64 signature.

```bash
openssl enc -base64 -d -in $DIGITAL_SIGNATURE_BASE64_FILE -out $DIGITAL_SIGNATURE_FILE
```

Next, run the below command to verify the signature.

```bash
openssl dgst -sha256 -verify $PUBLIC_KEY_FILE -signature $DIGITAL_SIGNATURE_FILE $SAMPLE_TEXT_FILE_TO_BE_SIGNED
```

The output should look like below.

```bash
Verified OK
```

Congratulations !!! You have succefully completed this section to create and verify digital signature using the openssl tool.


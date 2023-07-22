---
title : "Container image verification using Notation CLI"
weight : 21
---

### Configure Notation trustpolicy document

In the previous section, we used the Notation CLI and AWS Signer signing profile to sign a container image. In this section, we will verify the applied container image signature using the Notation CLI. For this process, you will need a valid Notation [trustpolicy](https://notaryproject.dev/docs/tutorials/trust-policy/) document.

As mentioned earlier in the Notation install, the *trustpolicy* was found in the notation directory tree. However, the *trustpolicy* installed at `.config/notation/trustpolicy.json` by the installer is an **empty file**.

Ensure the trustpolicy document is empty and below command does not show any output.

```bash
cat .config/notation/trustpolicy.json
```
 Let us create a valid *trustpolicy* document using below command.

```bash
cat << EOF > ~/.config/notation/trustpolicy.json
{
  "version": "1.0",
  "trustPolicies": [
    {
      "name": "aws-signer-tp",
      "registryScopes": [
        "$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/pause"
      ],
      "signatureVerification": {
        "level": "strict"
      },
      "trustStores": [
        "signingAuthority:aws-signer-ts"
      ],
      "trustedIdentities": [
        "arn:aws:signer:$AWS_REGION:$ACCOUNT_ID:/signing-profiles/notation_test"
      ]
    }
  ]
}
EOF
```

The above Notation *trustpolicy* document configures Notation to verify container image signatures using the AWS Signer signing profile we used in the previous section to sign the container image. As you can see, the *trustpolicy* configures the following items:

* **registryScopes** : Specifies the list of specific registries/repository combinations in scope. It can also support a single wildcard “*” to set all registries/repository combinations.
* **signatureVerification** : configures AWS Signer singing profile revocation checks
* **trustStores** :  Truststores used for verification. In this case, it is `signingAuthority:aws-signer-ts` installed at `~/.config/notation/truststore/x509/signingAuthority/aws-signer-ts/aws-signer-notation-root.crt`. This is root certificate for AWS Signer.
* **trustedIdentities** : Specifies the list of AWS Signer signing profiles.

Next, we need to configure the above *trustpolicy* document with Notation to use for verifying the signatures. 

Run the below `notation policy import` command to import a known-good JSON document.

```bash
notation policy import ~/.config/notation/trustpolicy.json 
```
The above command asks for a user input **y** or **N**. Type **y** and press *Enter*.

::::expand{header="Check Output"}
```bash
Existing trust policy configuration found, do you want to overwrite it? [y/N] y
Trust policy configuration imported successfully.
```
::::

We can also see the imported and configured *trustpolicy* with the `notation policy show` command as below.

```bash
notation policy show
```

::::expand{header="Check Output"}
```bash
{
  "version": "1.0",
  "trustPolicies": [
    {
      "name": "aws-signer-tp",
      "registryScopes": [
        "XXXXXXXXXX.dkr.ecr.us-west-2.amazonaws.com/pause"
      ],
      "signatureVerification": {
        "level": "strict"
      },
      "trustStores": [
        "signingAuthority:aws-signer-ts"
      ],
      "trustedIdentities": [
        "arn:aws:signer:us-west-2:XXXXXXXXXX:/signing-profiles/notation_test"
      ]
    }
  ]
}
```
::::


With the Notation trustpolicy configured, you can now use Notation to verify the container image signature, as seen below.

```bash
notation verify ${IMAGE_REPO}/${IMAGE_NAME}@$IMAGE_DIGEST
```
The output will look like below.

```bash
Successfully verified signature for XXXXXXXXXX.dkr.ecr.us-west-2.amazonaws.com/pause@sha256:33f19d2d8ba5fc17ac1099a840b0feac5f40bc6ac02d99891dbd13b0e204af4e
```

Let us exit from the Al2023 EC2 Instance.

```bash
exit
```

::::expand{header="Check Output"}
```bash
logout
Connection to ip-10-254-142-20.us-west-2.compute.internal closed.
```
::::

Congratlulations !!! You have successfully completed the Module on signing the container image and verifying the sinature using the Notation CLI.






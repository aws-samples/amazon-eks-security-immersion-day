---
title : "Activate Security hub"
weight : 21
---




:::::tabs{variant="container"}

::::tab{id="cli" label="Using AWS CLI"}


Run the below command to enable Security Hub.


```bash
aws securityhub enable-security-hub --no-enable-default-standards
```
There will be no output if there are no errors

Lets enable security standards for foundational security best practices and CIS AWS Foundational benchmark 1.4.0


```bash
aws securityhub batch-enable-standards --standards-subscription-requests '[{"StandardsArn":"arn:aws:securityhub:us-west-2::standards/aws-foundational-security-best-practices/v/1.0.0"},{"StandardsArn":"arn:aws:securityhub:us-west-2::standards/cis-aws-foundations-benchmark/v/1.4.0"}]' 
```

::::expand{header="Check Output"}
```json
{
    "StandardsSubscriptions": [
        {
            "StandardsSubscriptionArn": "arn:aws:securityhub:us-west-2:XXXXXXXXXXXXX:subscription/aws-foundational-security-best-practices/v/1.0.0",
            "StandardsArn": "arn:aws:securityhub:us-west-2::standards/aws-foundational-security-best-practices/v/1.0.0",
            "StandardsStatus": "PENDING"
        },
        {
            "StandardsSubscriptionArn": "arn:aws:securityhub:us-west-2:XXXXXXXXXXXXX:subscription/cis-aws-foundations-benchmark/v/1.4.0",
            "StandardsArn": "arn:aws:securityhub:us-west-2::standards/cis-aws-foundations-benchmark/v/1.4.0",
            "StandardsStatus": "PENDING"
        }
    ]
}
```
::::

::::tab{id="console" label="Using AWS Console"}

In your AWS Console, Search for **SecurityHub** 

![Search for SecurityHub](/static/images/image-security/devsecops-inspector/SecurityHub-search.png)

Click **Get Started**

![Security Hub Get Started](/static/images/image-security/devsecops-inspector/SecurityHub-goto.png)

Unselect **Enable CIS AWS Foundations Benchmark v1.2.0**  and select **Enable CIS AWS Foundations Benchmark v1.4.0**

![Enable Security Hub](/static/images/image-security/devsecops-inspector/SecurityHub-enable.png)

Click on **Enable SecurityHub**

::::
:::::

When you enable SecurityHub for the first time,you will see the following screen

![Security Hub Enabled](/static/images/image-security/devsecops-inspector/SecurityHub-enabled.png)
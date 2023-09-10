---
title : "Activate Security hub"
weight : 21
---

1. Navigate to the [Amazon Inspector console](https://console.aws.amazon.com/inspector/v2/home).
2. Click on **Get Started**
   ![Get Started](/static/images/image-security/devsecops-inspector/Inspector-getstarted.png)
3. Select **Enable Inspector**.
   ![Enable Inspector!](/static/images/image-security/devsecops-inspector/Inspector-Activate.png)



:::::tabs{variant="container"}

::::tab{id="cli" label="Using AWS CLI"}


Run the below command to enable Security Hub.


```bash
aws securityhub enable-security-hub
```

::::

::::tab{id="console" label="Using AWS Console"}

In your AWS Console, Search for SecurityHub

![Search for SecurityHub](/static/images/image-security/devsecops-inspector/SecurityHub-search.png)

Click **Get Started**

![Security Hub Get Started](/static/images/image-security/devsecops-inspector/SecurityHub-goto.png)

Click **Enable SecurityHub**
![Enable Security Hub](/static/images/image-security/devsecops-inspector/SecurityHub-enable.png)


When you enable SecurityHub for the first time,you will see the following screen

![Security Hub Enabled](/static/images/image-security/devsecops-inspector/SecurityHub-enabled.png)

::::

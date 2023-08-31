---
title : "Enabling AWS CloudTrail Insights"
weight : 22
---




:::::tabs{variant="container"}

::::tab{id="cli" label="Using AWS CLI"}

You can also enable Insights on a trail from the AWS Command Line Interface (AWS CLI) by using the put-insight-selectors command:


```bash
aws cloudtrail put-insight-selectors --trail-name eks-cloudtrail --insight-selectors '[{"InsightType": "ApiCallRateInsight"},{"InsightType": "ApiErrorRateInsight"}]'
```

:::expand{header="Check Output"}

```json
{
    "TrailARN": "arn:aws:cloudtrail:us-east-2:XXXXXXXXXXX:trail/eks-cloudtrail",
    "InsightSelectors": [
        {
            "InsightType": "ApiCallRateInsight"
        },
        {
            "InsightType": "ApiErrorRateInsight"
        }
    ]
}
```
:::


You can also verify the Insights status using describe-trails command:
```bash
aws cloudtrail describe-trails --trail-name-list eks-cloudtrail
```


:::expand{header="Check Output"}
![Describe CloudTrail](/static/images/detective-controls/log-insights/describe-cloudtrail-1.png)
:::


::::

::::tab{id="console" label="Using AWS Console"}

Follow these steps to Create New CloudTrail and enable "Insights"

https://console.aws.amazon.com/cloudtrail/home?#create

![Create CloudTrail - Step1](/static/images/detective-controls/log-insights/cloudtrail-create-1.png)

![Create CloudTrail - Step2](/static/images/detective-controls/log-insights/cloudtrail-create-2.png)

![Create CloudTrail - Final](/static/images/detective-controls/log-insights/cloudtrail-create-3.png)


::::

:::::






---

::alert[After you enable CloudTrail Insights for the first time on a trail, it can take up to 36 hours for CloudTrail to deliver the first Insights event, if unusual activity is detected. So the next section is only for your reference if you are running this Module in an AWS Event.]{header="WARNING" type="warning"}

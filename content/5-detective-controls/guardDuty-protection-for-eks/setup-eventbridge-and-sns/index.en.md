---
title : "Setup EventBridge and SNS"
weight : 23
---

In this section we will look at how to be notified for any findings detected by GuardDuty in your EKS cluster. To do this, we will create an Amazon EventBridge rule to filter specific GuardDuty Kubernetes events and send messages to an Amazon SNS topic, which has an email subscription to get an automated email notification.

We will start by creating the Amazon SNS topic and subscribe it with your email address.


:::::tabs{variant="container"}

::::tab{id="cli" label="Using AWS CLI"}

#### Create a SNS Topic

Run the following command to create a SNS Topic

```bash
SNS_TOPIC_ARN=$(aws sns create-topic --name K8sAudit | jq -r '.TopicArn')
echo $SNS_TOPIC_ARN
```
The output will look like below

```bash
arn:aws:sns:us-east-1:XXXXXXXX:K8sAudit
```

#### Create a Subscription for the SNS Topic

Set below environment variable to your email id

```bash
export MY_EMAIL_ID=<my-email@example.com>
```

Run below command to create a SNS Subscription for the above topic

```bash
aws sns subscribe \
    --topic-arn $SNS_TOPIC_ARN \
    --protocol email \
    --notification-endpoint $MY_EMAIL_ID
```
The output looks like below

```bash
{
    "SubscriptionArn": "pending confirmation"
}
```

Check your email you have specified above and confirm the subscription to the SNS topic.

#### Create an Amazon EventBridge rule

Run below command to create a Cloudwatch Event Rule with event pattern set to GuardDuty Findings.

```bash
aws events put-rule \
--name EKSAuditRoute \
--event-pattern \
'{
  "source": ["aws.guardduty"],
  "detail-type": ["GuardDuty Finding"]
}
'
```
The output looks like below
```bash
{
    "RuleArn": "arn:aws:events:us-east-1:XXXXXXXX:rule/EKSAuditRoute"
}
```

Then run below command to update the above Rule to attach a target for the above SNS topic.

```bash
aws events put-targets --rule EKSAuditRoute1 --targets "Id"="1","Arn"="$SNS_TOPIC_ARN"
```

The output looks like below

```bash
{
    "FailedEntryCount": 0,
    "FailedEntries": []
}
```

::::

::::tab{id="console" label="Using AWS Console"}

#### Create a SNS Topic

Got the [SNS AWS Console](console.aws.amazon.com/sns/v3), go to Topics and click **Create Topic**.

![SNSHome](/static/images/detective-controls/SNSHome.png)

Select **Standard** for Type, name it as **K8sAudit**. Keep everything as default and click on the **Create Topic** button.

![CreateTopic](/static/images/detective-controls/CreateTopic.png)

#### Create a Subscription for the SNS Topic

Next, Under the **Subscription** Tab, click **Create Subscription**, choose **Email** for `Protocol` and add your *email address* for the `Endpoint`. Keep everything else as default and click on **Create Subscription**

![CreateSub](/static/images/detective-controls/CreateSub.png)

Check your email you have specified above and confirm the subscription to the SNS topic.

#### Create an Amazon EventBridge rule

Now, let’s create an Amazon EventBridge rule to catch GuardDuty Kubernetes findings and route the messages to the SNS topic.

Search and go to the [Amazon EventBridge Console](console.aws.amazon.com/events). Under **Buses** section, click om **Rules** and click **Create rule**. Name it as **EKSAuditRoute** and leave everything as default and click Next.

![EBridgeRule](/static/images/detective-controls/EBridgeRule.png)

Keep everything as default in `Event source` and `Sample event`. Scroll down to `Event Pattern` and select these options.

`Event source` : **AWS services**
`AWS service` : **GuardDuty**
`Event type` : **GuardDuty Finding**


![EBridgePattern](/static/images/detective-controls/EBridgePattern.png)


The default GuardDuty event pattern matches all the Guardduty findings. Keep it default. You can find more information about Event Pattern rules [here](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-event-patterns.html)
. Click Next.


```bash
{
  "source": ["aws.guardduty"],
  "detail-type": ["GuardDuty Finding"]
}
```

Under Target types, select **AWS service**. Under `Select a target`, pick `SNS topic` and select the topic created at the start of this section. Click Next and click Next again in the Tags section. Review and click on **Create rule**.

![SelectTopic](/static/images/detective-controls/SelectTopic.png)


::::

:::::






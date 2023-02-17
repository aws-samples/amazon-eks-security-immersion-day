---
title : "Setup EventBridge and SNS"
weight : 23
---

In this section we will look at how to be notified for any findings detected by GuardDuty in your EKS cluster. To do this, we will create an Amazon EventBridge rule to filter specific GuardDuty Kubernetes events and send messages to an Amazon SNS topic, which has an email subscription to get an automated email notification.

We will start by creating the Amazon SNS topic and subscribe it with your email address.

Search SNS in on the AWS Console, go to Topics and click **Create Topic**.

![SNSHome](/static/images/detective-controls/SNSHome.png)

Select the Standard topic type, name it as **K8sAudit**. Keep everything as default and create it.

![CreateTopic](/static/images/detective-controls/CreateTopic.png)

Next, under Create Subscription, choose Email as the protocol and add your email address as the endpoint. Keep everything else as default.

![CreateSub](/static/images/detective-controls/CreateSub.png)

Log in to your email you have specified and confirm the subscription to the SNS topic.

Now, let’s create an Amazon EventBridge rule to catch GuardDuty Kubernetes findings and route the messages to the SNS topic.

Search and go to the Amazon EventBridge Console and click Create rule. Name it as ""EKSAuditRoute"" and leave everything as default and click Next.

![EBridgeRule](/static/images/detective-controls/EBridgeRule.png)

Keep everything as default in Event source and Sample event. Scroll down to Event Pattern and select these options.

    Event source : AWS services
    AWS service : GuardDuty
    Event type : GuardDuty Finding


![EBridgePattern](/static/images/detective-controls/EBridgePattern.png)


The default GuardDuty event pattern matches all the Guardduty findings. Let’s customize it as follows. This event pattern will match one of described types. Click Edit pattern and add the following pattern. You can find more information about Event Pattern rules [here](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-event-patterns.html)
. Click Next.


```bash
{
  "source": ["aws.guardduty"],
  "detail": {
      "type": [
            "Persistence:Kubernetes/ContainerWithSensitiveMount", 
            "Policy:Kubernetes/Policy:Kubernetes/AdminAccessToDefaultServiceAccount", 
            "Policy:Kubernetes/AnonymousAccessGranted", 
            "PrivilegeEscalation:Kubernetes/PrivilegedContainer", 
            "Execution:Kubernetes/ExecInKubeSystemPod"
        ]
    }
}
```

![CustomPattern](/static/images/detective-controls/CustomPattern.png)

Under Target types, select AWS service. Under Select a target, pick SNS topic and select the topic created at the start of this section. Click Next and click Next again in the Tags section. Review and create the rule.

![SelectTopic](/static/images/detective-controls/SelectTopic.png)











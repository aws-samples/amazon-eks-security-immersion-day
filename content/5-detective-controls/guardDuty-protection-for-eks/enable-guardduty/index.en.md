---
title : "Enable GuardDuty Findings on EKS"
weight : 21
---



:::::tabs{variant="container"}

::::tab{id="cli" label="Using AWS CLI"}
Run the following command to enable Amazon GuardDuty and then also enable EKS Protection

```bash
aws guardduty create-detector --enable --data-sources Kubernetes={AuditLogs={Enable=true}}
```
The output will look like below
```bash
{

    "DetectorId": "b6b992d6d2f48e64bc59180bfexample"

}
```
::::

::::tab{id="console" label="Using AWS Console"}

In your AWS Console, Search for GuardDuty

![Search for GuardDuty](/static/images/detective-controls/GDSearch.png)

Click **Get Started**

![GDGetStarted](/static/images/detective-controls/GDGetStarted.png)

Click **Enable GuardDuty**
![GDEnabledInAccount](/static/images/detective-controls/GDEnabledInAccount.png)


As per [the update](https://aws.amazon.com/about-aws/whats-new/2022/01/amazon-guardduty-elastic-kubernetes-service-clusters/), Amazon GuardDuty for EKS Protection no longer enabled by default


In the [Amazon GuardDuty console](https://console.aws.amazon.com/guardduty/home), you will see that EKS Protection is disabled.

![GDNewEKSProtectionScreen Disabled](/static/images/detective-controls/GDNewEKSProtectionScreen.png)

Under the **Configuration** tab,  Click on the **EDIT** button.  In the **Edit configuration** page, select **Enable** button, select the checkbox **EKS Audit Log Monitoring** and deselect **EKS Runtime Monitoring - New** checkbox. Click on the **Save Changes** button.

![GDEnableEKSAuditlogs](/static/images/detective-controls/GDEnableEKSAuditlogs.png)

The **EKS Protection** page will look like below.

Go to Findings. You should see there are no findings available yet.

::::

:::::

After EKS Protection in Amazon GuardDuty is enabled, it looks like below in the AWS Console.

![GDEKSAuditlogsEnabled](/static/images/detective-controls/GDEKSAuditlogsEnabled.png)

With Amazon GuardDuty already turned on with protection for your EKS clusters, you are now ready to see it in action. GuardDuty for EKS does not require you to turn on or store EKS Control Plane logs. GuardDuty can look at the EKS cluster audit logs through direct integration. It will look at the audit log activity and report on the new GuardDuty finding types that are specific to your Kubernetes resources.

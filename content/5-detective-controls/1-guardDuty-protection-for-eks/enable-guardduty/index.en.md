---
title : "Enable Amazon GuardDuty Protection for Amazon EKS"
weight : 21
---


::alert[Note that below steps are for configuring EKS Audit Log Monitoring for a standalone account. To configure EKS Audit Log Monitoring in multiple-account environments,you need to use delegated administrator account to manage their member accounts using AWS Organizations. Please refer to the [documentation](https://docs.aws.amazon.com/guardduty/latest/ug/guardduty-eks-audit-log-monitoring.html)]{header="Note"}


:::::tabs{variant="container"}

::::tab{id="cli" label="Using AWS CLI"}
Run the following command to enable Amazon GuardDuty and then also enable EKS Protection for both EKS Audit Log Monitoring and EKS Runtime Monitoring.

Create a configuration file to enable the Amazon EKS protection features.

```bash
cd ~/environment
cat > guardduty-eks-protection-config.json <<EOF
[
  {
    "Name": "EKS_AUDIT_LOGS",
    "Status": "ENABLED",      
    "Name": "EKS_RUNTIME_MONITORING",
    "Status": "ENABLED",
    "AdditionalConfiguration": [
      {
        "Name": "EKS_ADDON_MANAGEMENT",
        "Status": "ENABLED"
      }
    ]
  }
]
EOF
```

Run the below command to enable EKS Protection for Amazon GuardDuty.


```bash
GUARDDUTY_DETECTOR_ID=$(aws guardduty create-detector --enable --features file://guardduty-eks-protection-config.json | jq -r '.DetectorId')
echo $GUARDDUTY_DETECTOR_ID
```

The output will look like below
```bash
b6b992d6d2f48e64bc59180bfexample
```
::::

::::tab{id="console" label="Using AWS Console"}

In your AWS Console, Search for GuardDuty

![Search for GuardDuty](/static/images/detective-controls/GDSearch.png)

Click **Get Started**

![GDGetStarted](/static/images/detective-controls/GDGetStarted.png)

Click **Enable GuardDuty**
![GDEnabledInAccount](/static/images/detective-controls/GDEnabledInAccount.png)


When you enable GuardDuty for the first time (new GuardDuty account), EKS Audit Log Monitoring within EKS Protection is already enabled with a 30-day free trial period.


In the [Amazon GuardDuty console](https://console.aws.amazon.com/guardduty/home), you will see that EKS Audit Log Monitoring is enabled.

![GDNewEKSProtectionScreen-New](/static/images/detective-controls/GDNewEKSProtectionScreen-New.png)

Under the **Configuration** tab,  Click on the **EDIT** button.  In the **Edit configuration** page, select **Enable** button, select the checkboxes for **EKS Audit Log Monitoring**, **EKS Runtime Monitoring** and **Manage agent automatically**. Click on the **Save Changes** button.

![GDEnableEKSAuditlogsandRunTime](/static/images/detective-controls/GDEnableEKSAuditlogsandRunTime.png)

::::

:::::

After EKS Protection in Amazon GuardDuty is enabled, it looks like below in the [AWS GuardDuty Console](https://us-west-2.console.aws.amazon.com/guardduty/home?region=us-west-2#/k8s-protection).

![GDEnabledNew](/static/images/detective-controls/GDEnabledNew.png)

Go to Findings. You should see there are no findings available yet.

![GDNofindings](/static/images/detective-controls/GDNofindings.png)


GuardDuty Findings are automatically sent to EventBridge. You can also export findings to an S3 bucket. New findings are exported within 5 minutes. You can modify the frequency for updated findings below. Update to EventBridge and S3 occurs every 6 hours by default.  Let us change it to 15 mins.

Go to the **Settings** --> **Findings export options** and Click on the Edit.

![GD_settings](/static/images/detective-controls/GD_settings.png)

Select **15 minutes** and Click on **Save Changes**.

![change_settings](/static/images/detective-controls/change_settings.png)


Findings export options

With Amazon GuardDuty already turned on with protection for your EKS clusters, you are now ready to see it in action. GuardDuty for EKS does not require you to turn on or store EKS Control Plane logs. GuardDuty can look at the EKS cluster audit logs through direct integration. It will look at the audit log activity and report on the new GuardDuty finding types that are specific to your Kubernetes resources.
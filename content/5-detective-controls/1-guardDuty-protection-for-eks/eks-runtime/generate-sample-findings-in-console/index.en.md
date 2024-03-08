---
title : "Generating sample findings through the GuardDuty console or API"
weight : 22
---

Choose an access method to learn how to generate sample findings through that method.


:::::tabs{variant="container"}

::::tab{id="console" label="Using AWS Console"}

Use the following procedure to generate sample findings. This process generates one sample finding for each GuardDuty finding type.

1. Open the [GuardDuty console](https://console.aws.amazon.com/guardduty/)
2. In the navigation pane, choose **Settings**.
3. On the **Settings** page, under **Sample findings**, choose **Generate sample findings**.
![GDGenerateSamplefindings](/static/images/detective-controls/GDGenerateSamplefindings.png)
4. In the navigation pane, choose **Findings**. The sample findings are displayed on the **Current findings** page with the prefix **[SAMPLE]**.
![GDSampleFindings](/static/images/detective-controls/GDSampleFindings.png)

::alert[Note the above step generate Sample Findings for all the resource types. Let us apply some filters to see Findings for Amazon EKS]{header="Note"}

5. In the filters list, select key **Resource Type**, select **EKS Cluster** and Click **Apply**

![GDSampleFindingsforEKS](/static/images/detective-controls/GDSampleFindingsforEKSResource.png)

6. Select one of the sample Findings and click on it. You will see Finding Summary details on the right side.

![GDrunetimefinding](/static/images/detective-controls/GDrunetimefinding.png)

::::

::::tab{id="cli" label="Using AWS CLI"}
Run the following command to generate a sample finding.

```bash
aws guardduty create-sample-findings --detector-id $GUARDDUTY_DETECTOR_ID --finding-types "CryptoCurrency:Runtime/BitcoinTool.B"
aws guardduty create-sample-findings --detector-id $GUARDDUTY_DETECTOR_ID --finding-types "Backdoor:Runtime/C&CActivity.B"
aws guardduty create-sample-findings --detector-id $GUARDDUTY_DETECTOR_ID --finding-types "UnauthorizedAccess:Runtime/TorRelay"
```

You can use any of the Finding types as mentioned in the [documentation](https://docs.aws.amazon.com/guardduty/latest/ug/findings-eks-runtime-monitoring.html).


::::

:::::
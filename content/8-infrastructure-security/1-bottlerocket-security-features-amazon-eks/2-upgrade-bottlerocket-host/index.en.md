---
title : "Upgrading Bottlerocket host"
weight : 22
---

Bottlerocket OS update [methods](https://bottlerocket.dev/en/os/latest/#/update/methods/) can be classified into two main categories. You can choose the appropriate OS update method based on your cluster workload requirements.

`Node replacement`:  Bottlerocket clusters can be updated via node replacement, meaning that the existing Bottlerocket nodes will be replaced by new Bottlerocket nodes that run updated software. This requires nodes to be reprovisioned. When running the aws-k8s-* variants of Bottlerocket on EKS, you can use either the EKS Console or eksctl to update your Bottlerocket nodes using the node replacement method. If you use Karpenter for EKS cluster autoscaling, [Drift](https://catalog.workshops.aws/karpenter/en-US/basic-nodepool/drift) will allow node replacements. Changes in Bottlerocket variants (e.g. upgrading k8s version) must be handled through a node replacement.

`In-place updates`: Bottlerocket clusters can be updated in-place, meaning that the existing Bottlerocket nodes will download updated software to use, without re-provisioning the nodes. In this section of the workshop, we will explore the in-place updates using `apiclient`.

::alert[This workshop is frequently updated to use the latest Bottlerocket release and EKS version. In case there are no available Bottlerocket updates while executing this module, please follow along to understand the concepts.]{header=""}

1. In-place updates are supported within the same [Bottlerocket variant](https://bottlerocket.dev/en/os/latest/#/concepts/variants/) (e.g. aws-k8s-1.27). Review the settings available to manage in-place OS updates.

```bash
apiclient get settings.updates
```

::::expand{header="Check Output"}
```
{
  "settings": {
    "updates": {
      "ignore-waves": false,
      "metadata-base-url": "https://updates.bottlerocket.aws/2020-07-07/aws-k8s-1.27/x86_64/",
      "seed": 1625,
      "targets-base-url": "https://updates.bottlerocket.aws/targets/",
      "version-lock": "latest"
    }
  }
}
```
::::

2. Check for available OS versions.

```bash
apiclient update check
```

Based on `version-lock` setting, the `update check` command will show `chosen_update` with the latest version and `update_state` will be **Available**. At the time you are running this workshop, if there are no available updates, `chosen_update` will show **null** and `update_state` will show **Idle**.

::::expand{header="Check Output"}
```
23:47:20 [INFO] Refreshing updates...
{
  "active_partition": {
    "image": {
      "arch": "x86_64",
      "variant": "aws-k8s-1.28",
      "version": "1.19.0"
    },
    "next_to_boot": true
  },
  "available_updates": [
    "1.19.0",
    "1.18.0",
    "1.17.0",
    "1.16.1",
    "1.16.0",
    "1.15.1",
    "1.15.0"
  ],
  "chosen_update": null,
  "most_recent_command": {
    "cmd_status": "Success",
    "cmd_type": "refresh",
    "exit_status": 0,
    "stderr": "",
    "timestamp": "2024-02-07T23:47:21.094234584Z"
  },
  "staging_partition": null,
  "update_state": "Idle"
}
```
::::

3. Check the `update check` command's output in your `control container` (Cloud9 workspace). If `chosen_update` value is **null** and `update_state` is **Idle**, you can skip the commands until `step #5`, however please read through the steps and expected outputs. If `chosen_update` shows a version and `update_state` is **Available**, `apply` the chosen update.

```bash
apiclient update apply
```

Sample output in case of successful update:

```
21:11:32 [INFO] Downloading and applying update to disk...
21:11:37 [INFO] Still waiting for updated status, will wait up to 594.5s longer...
21:11:41 [INFO] Setting the update active so it will apply on the next reboot...
21:11:42 [INFO] Update has been applied and will take effect on next reboot.
```

Sample output when we run `update apply` without an available and chosen update:

```
15:37:54 [INFO] Downloading and applying update to disk...
Failed to apply update: Failed to prepare update.  This could mean that we don't have a list of updates yet or that an update is already applied.  Running 'apiclient update check' will help you find out.  You can cancel an applied ('Ready') update with 'apiclient update cancel' if desired.  Detail: Failed to make prepare request: Status 409 when POSTing /actions/prepare-update: Update action not allowed according to update state
```

4. Check the update status after successfully applying the update. Unlike traditional OS updates that use a package manager to update individual packages, Bottlerocket downloads a full filesystem image and reboots into it.

```bash
apiclient update check
```

Existing version will be in `active_partition` and new version will be in `staging_partition`. `update_state` will be **Ready**.

::::expand{header="Check Output"}
```
21:12:06 [INFO] Refreshing updates...
{
  "active_partition": {
    "image": {
      "arch": "x86_64",
      "variant": "aws-k8s-1.27",
      "version": "1.14.0"
    },
    "next_to_boot": false
  },
  "available_updates": [
    "1.15.0",
    "1.14.3",
    "1.14.2",
    "1.14.1",
    "1.14.0"
  ],
  "chosen_update": {
    "arch": "x86_64",
    "variant": "aws-k8s-1.27",
    "version": "1.15.0"
  },
  "most_recent_command": {
    "cmd_status": "Success",
    "cmd_type": "refresh",
    "exit_status": 0,
    "stderr": "",
    "timestamp": "2023-10-13T21:12:06.374961452Z"
  },
  "staging_partition": {
    "image": {
      "arch": "x86_64",
      "variant": "aws-k8s-1.27",
      "version": "1.15.0"
    },
    "next_to_boot": true
  },
  "update_state": "Ready"
}
```
::::

5. Reboot the OS to activate `staging_partition` (inactive partition) as `active_partition`.

```bash
apiclient reboot
exit
```

::::expand{header="Check Output"}
```
06:21:13 [INFO] Rebooting, goodbye...

Exiting session with sessionId: i-12345999999-abcdexxxxxxxx
```
::::

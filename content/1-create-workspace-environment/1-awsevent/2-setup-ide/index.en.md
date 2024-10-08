---
title: 'Open Workshop IDE'
weight: 23
---

Once you have joined the event. Your Workshop IDE will also have all the required tools installed in it.

Scroll down to the **Event Outputs** table. Copy the URL from the **IdeUrl** field and open it in a new browser tab. You will prompted for a password.

![IDE Url](/static/images/workshop-studio-01.png)

Enter the value from the IdePassword from the outputs and the IDE will load.

![Access IDE](/static/images/visual-studio-01.png)

Once the IDE has loaded, you can open a terminal using the shortcut Ctrl+Shift+~ on Windows/Linux, Command+J on macOS, or by clicking the Toggle Panel icon located at the top right corner; these options will open the integrated terminal, allowing you to run commands directly within the IDE.

![Load IDE](/static/images/visual-studio-02.png)

Open a new terminal using the shortcut Ctrl+Shift+~ on Windows/Linux, Command+J on macOS, or by clicking the Toggle Panel icon located at the top right corner; these options will open the integrated terminal, allowing you to run commands directly within the IDE.

Since we created the environment for you all required tools are already installed.

You can test access to your cluster by running the following command. The output will be a list of worker nodes

```bash
kubectl get nodes
```

You should see below output

```bash
NAME                                           STATUS   ROLES    AGE   VERSION
ip-10-254-128-55.us-west-2.compute.internal    Ready    <none>   88m   v1.28.1-eks-43840fb
ip-10-254-180-171.us-west-2.compute.internal   Ready    <none>   88m   v1.28.1-eks-43840fb
ip-10-254-217-72.us-west-2.compute.internal    Ready    <none>   88m   v1.28.1-eks-43840fb
```
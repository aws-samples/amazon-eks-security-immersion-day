---
title: 'Open Cloud9 Environment'
weight: 23
---

Once you have logged into the AWS Management Console from your Workshop Studio, you will already have an Amazon EKS cluster and AWS Cloud9 environment. Your AWS Cloud9 workspace will also have all the required tools installed in it.

- Navigate to [AWS Cloud9](https://console.aws.amazon.com/cloud9) in AWS Console.
- Select **Shared with me** from the drop-down menu.
- Click on **Open IDE** to open your AWS Cloud9 workspace.


![sign-in](/static/images/create-workspace/cloud9-IDE1.png)

- Closing the **Welcome tab**
  ![c9before](/static/images/create-workspace/cloud9-1.png)

- Opening a new **terminal** tab in the main work area
  ![c9newtab](/static/images/create-workspace/cloud9-2.png)

- Closing the lower work area
  ![c9newtab](/static/images/create-workspace/cloud9-3.png)

- Your workspace should now look like this
  ![c9after](/static/images/create-workspace/cloud9-4.png)

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

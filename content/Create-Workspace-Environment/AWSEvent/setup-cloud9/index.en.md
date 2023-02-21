---
title : "Open Cloud9 Environment"
weight : 23
---

Once you have logged into the AWS Management Console from your Workshop Studio, you will already have an EKS cluster and Cloud9 environment. Your Cloud 9 workspace will also have all the required tools installed in it.


* Navigate to [Cloud 9](https://console.aws.amazon.com/cloud9) in AWS Console.
* Click on **Open IDE** to open your Cloud 9 workspace.

![sign-in](/static/images/cloud9-IDE1.png)

* Close the welcome screen on Cloud 9 and wait for the terminal to be initialized. WS Studio C9 Welcome

![](/static/images/cloud9-IDE2.png)

#### A. Disable Cloud9 AWS temporary credentials

Go to Cloud9

* Open the **Preferences** tab.
* Open the **AWS Settings** and disable **AWS Managed Temporary Credentials**

#### B. Install latest awscli

```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```
#### C. Install yq for yaml processing

```bash
echo 'yq() {
  docker run --rm -i -v "${PWD}":/workdir mikefarah/yq "$@"
}' | tee -a ~/.bashrc && source ~/.bashrc
```

#### D. Confirm EKS Setup

You can test access to your cluster by running the following command. The output will be a list of worker nodes

```bash
kubectl get nodes
```

You should see below output

```bash
NAME                                           STATUS   ROLES    AGE     VERSION
ip-10-254-158-206.us-east-2.compute.internal   Ready    <none>   6h23m   v1.23.13-eks-fb459a0
ip-10-254-166-231.us-east-2.compute.internal   Ready    <none>   6h23m   v1.23.13-eks-fb459a0
ip-10-254-176-243.us-east-2.compute.internal   Ready    <none>   6h23m   v1.23.13-eks-6022eca
ip-10-254-201-2.us-east-2.compute.internal     Ready    <none>   6h23m   v1.23.13-eks-6022eca
```
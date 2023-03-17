---
title : "Open Cloud9 Environment"
weight : 23
---

Once you have logged into the AWS Management Console from your Workshop Studio, you will already have an Amazon EKS cluster and AWS Cloud9 environment. Your AWS Cloud9 workspace will also have all the required tools installed in it.


* Navigate to [AWS Cloud9](https://console.aws.amazon.com/cloud9) in AWS Console.
* Click on **Open IDE** to open your AWS Cloud9 workspace.

![sign-in](/static/images/create-workspace/cloud9-IDE1.png)

* Closing the **Welcome tab**
![c9before](/static/images/create-workspace/cloud9-1.png)

* Opening a new **terminal** tab in the main work area
![c9newtab](/static/images/create-workspace/cloud9-2.png)

* Closing the lower work area
![c9newtab](/static/images/create-workspace/cloud9-3.png)

* Your workspace should now look like this
![c9after](/static/images/create-workspace/cloud9-4.png)

#### A. Disable AWS Cloud9 AWS temporary credentials

Go to AWS Cloud9

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

#### Verify the binaries are in the path and executable
```bash
for command in kubectl jq envsubst aws
  do
    which $command &>/dev/null && echo "$command in path" || echo "$command NOT FOUND"
  done
```
#### D. Confirm Amazon EKS Setup


Set below environment variables
```bash
export ACCOUNT_ID=$(aws sts get-caller-identity --output text --query Account)
export AWS_REGION=$(curl -s 169.254.169.254/latest/dynamic/instance-identity/document | jq -r '.region')
```

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


::alert[If the output from `kubectl` command contains `Kubeconfig user entry is using deprecated API version client.authentication.k8s.io/v1alpha1. Run 'aws eks update-kubeconfig' to update` then run below command to fix it. `aws eks --region $AWS_REGION update-kubeconfig --name eksworkshop-eksctl`]{header="Note"}


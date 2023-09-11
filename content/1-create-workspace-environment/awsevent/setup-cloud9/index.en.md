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

:::::tabs{variant="container"}

::::tab{id="cli" label="Using AWS CLI"}

To ensure temporary credentials aren't already in place we will remove any existing credentials file as well as disabling **AWS managed temporary credentials**:

```bash
aws cloud9 update-environment  --environment-id $C9_PID --managed-credentials-action DISABLE
rm -vf ${HOME}/.aws/credentials
```
::::

::::tab{id="console" label="Using AWS Console"}

Go to AWS Cloud9

* Open the **Preferences** tab.
* Open the **AWS Settings** and disable **AWS Managed Temporary Credentials**

::::

:::::

#### B. Add execution permissions to kubectl

```bash
sudo chmod +x /usr/bin/kubectl
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
NAME                                           STATUS   ROLES    AGE   VERSION
ip-10-254-141-66.us-west-2.compute.internal    Ready    <none>   12h   v1.27.4-eks-8ccc7ba
ip-10-254-208-115.us-west-2.compute.internal   Ready    <none>   12h   v1.27.4-eks-8ccc7ba
ip-10-254-248-189.us-west-2.compute.internal   Ready    <none>   12h   v1.27.4-eks-8ccc7ba
```

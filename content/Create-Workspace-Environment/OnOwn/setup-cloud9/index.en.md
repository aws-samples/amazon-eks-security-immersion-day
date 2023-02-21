---
title : "Setup Cloud9 Environment"
weight : 22
---


## Running the workshop in your AWS Account using EKS Blueprint (Only for self-learning)

This setup will install below add-ons as well, so no need need to install these later in case if they are used.

 * AWS Load Balancer
 * Metrics Server
 * Cluster Autoscaler
 * AWS Cloudwatch Metrics


### Cloud9 setup

* Setup Cloud9 environment using [this setup](https://docs.aws.amazon.com/cloud9/latest/user-guide/tutorials-basic.html). Once your EC2 environment is up and running, perform the remaining steps
* Create an IAM role for your Cloud9 workspace environment
  * Follow [this link to create an IAM role with Administrator access](https://console.aws.amazon.com/iam/home#/roles$new?step=review&commonUseCase=EC2%2BEC2&selectedUseCase=EC2&policies=arn:aws:iam::aws:policy%2FAdministratorAccess&roleName=eks-blueprints-for-terraform-workshop-admin)
  * Confirm that **AWS service** and EC2 are selected, then click Next to view permissions.
  * Confirm that **AdministratorAccess** is checked, then click Next to review.
![iam-role-create-eks-workshop](/static/images/create-workspace/iam-role-create-eks-workshop.png)
* Attach the IAM role to the cloud9 workspace
  * Follow [this link to your cloud9 ec2 instance](https://us-east-1.console.aws.amazon.com/ec2/v2/home?region=us-east-1#Instances:v=3;sort=desc:launchTime) and filter with the name of the instance
![cloud9-ec2](/static/images/create-workspace/cloud9-ec2.png)
  * Select the instance, then choose **Actions / Security / Modify IAM Role**
![cloud9-ec2-modify-iam-role](/static/images/create-workspace/cloud9-ec2-modify-iam-role.png)
  * Choose eks-blueprints-for-terraform-workshop-admin from the IAM Role drop down, and select Save
![cloud9-ec2-update-role](/static/images/create-workspace/cloud9-ec2-update-role.png)
* Disable Cloud9 AWS temporary credentials To ensure temporary credentials aren’t already in place we will also remove any existing credentials file:
```bash
aws cloud9 update-environment  --environment-id $C9_PID --managed-credentials-action DISABLE
rm -vf ${HOME}/.aws/credentials
```
* Check if Cloud9 AWS temporary credentials is disabled
  * Open the **Preferences** tab.
  * Open the **AWS Settings** and see **AWS Managed Temporary Credentials** is **Off**, if not turn it **Off**
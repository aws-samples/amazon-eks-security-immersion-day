---
title : "Setup AWS Cloud9 Environment"
weight : 22
---

### Create a AWS Cloud9 Environment


* Go to [AWS Cloud9 Console](https://us-west-2.console.aws.amazon.com/cloud9/home?region=us-west-2)
* Select **Create environment**
* Name it **eksworkshop**, click Next.
* Choose **t3.small** for instance type, take all default values and click **Create environment**

When it comes up, customize the environment by:

* Closing the **Welcome tab**
![c9before](/static/images/create-workspace/cloud9-1.png)

* Opening a new **terminal** tab in the main work area
![c9newtab](/static/images/create-workspace/cloud9-2.png)

* Closing the lower work area
![c9newtab](/static/images/create-workspace/cloud9-3.png)

* Your workspace should now look like this
![c9after](/static/images/create-workspace/cloud9-4.png)

### Increase the disk size on the AWS Cloud9 instance 

::alert[The following command adds more disk space to the root volume of the EC2 instance that AWS Cloud9 runs on. Once the command completes, we reboot the instance and it could take a minute or two for the IDE to come back online.]{header="Note"}


```bash
pip3 install --user --upgrade boto3
export instance_id=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
python -c "import boto3
import os
from botocore.exceptions import ClientError 
ec2 = boto3.client('ec2')
volume_info = ec2.describe_volumes(
    Filters=[
        {
            'Name': 'attachment.instance-id',
            'Values': [
                os.getenv('instance_id')
            ]
        }
    ]
)
volume_id = volume_info['Volumes'][0]['VolumeId']
try:
    resize = ec2.modify_volume(    
            VolumeId=volume_id,    
            Size=30
    )
    print(resize)
except ClientError as e:
    if e.response['Error']['Code'] == 'InvalidParameterValue':
        print('ERROR MESSAGE: {}'.format(e))"
if [ $? -eq 0 ]; then
    sudo reboot
fi
```

### Create an IAM role for your Workspace 


1. Follow [this deep link to create an IAM role with Administrator access](https://console.aws.amazon.com/iam/home#/roles$new?step=review&commonUseCase=EC2%2BEC2&selectedUseCase=EC2&policies=arn:aws:iam::aws:policy%2FAdministratorAccess&roleName=eksworkshop-admin).
1. Confirm that **AWS service** and **EC2** are selected, then click **Next: Permissions** to view permissions.
1. Confirm that **AdministratorAccess** is checked, then click **Next: Tags** to assign tags.
1. Take the defaults, and click **Next: Review** to review.
1. Enter **eksworkshop-admin** for the Name, and click **Create role**.
![createrole](/static/images/create-workspace/createrole.png)

### Attach the IAM role to the AWS Cloud9 workspace

1. Click the grey circle button (in top right corner) and select **Manage EC2 Instance**.

![cloud9Role](/static/images/create-workspace/cloud9-role.png)

2. Select the instance, then choose **Actions / Security / Modify IAM Role**
![c9instancerole](/static/images/create-workspace/c9instancerole.png)

3. Choose **eksworkshop-admin** from the **IAM Role** drop down, and select **Save**
![c9attachrole](/static/images/create-workspace/c9attachrole.png)


### Update IAM settings for your Workspace

To ensure temporary credentials aren't already in place we will remove
any existing credentials file as well as disabling **AWS managed temporary credentials**:

```bash
aws cloud9 update-environment  --environment-id $C9_PID --managed-credentials-action DISABLE
rm -vf ${HOME}/.aws/credentials
```

#### Install latest awscli
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

Run below commands to set few environment variables.

::alert[If you are [at an AWS event](/1-create-workspace-environment/awsevent), ask your instructor which **AWS region** to use.]{header="Note"}

Install the `jq` utility.

```bash
sudo yum -y install jq
```

Run below commands to set few environment variables.

```bash
export ACCOUNT_ID=$(aws sts get-caller-identity --output text --query Account)
export AWS_REGION=$(curl -s 169.254.169.254/latest/dynamic/instance-identity/document | jq -r '.region')
export AZS=($(aws ec2 describe-availability-zones --query 'AvailabilityZones[].ZoneName' --output text --region $AWS_REGION))

```

Check if AWS_REGION is set to desired region

```bash
test -n "$AWS_REGION" && echo AWS_REGION is "$AWS_REGION" || echo AWS_REGION is not set
```

 Let's save these into bash_profile

```bash
echo "export ACCOUNT_ID=${ACCOUNT_ID}" | tee -a ~/.bash_profile
echo "export AWS_REGION=${AWS_REGION}" | tee -a ~/.bash_profile
echo "export AZS=(${AZS[@]})" | tee -a ~/.bash_profile
aws configure set default.region ${AWS_REGION}
aws configure get default.region
```

**Validate the IAM role**

Use the [GetCallerIdentity](https://docs.aws.amazon.com/cli/latest/reference/sts/get-caller-identity.html) CLI command to validate that the AWS Cloud9 IDE is using the correct IAM role.

```bash
aws sts get-caller-identity --query Arn | grep eksworkshop-admin -q && echo "IAM role valid" || echo "IAM role NOT valid"
```

If the IAM role is not valid, **DO NOT PROCEED**. Go back and confirm the steps on this page.

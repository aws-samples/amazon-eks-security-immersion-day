---
title: 'Managing GuardDuty agent manually'
weight: 24
hidden: true # Don't think we need this page keep it simple (automatic installation)
---

This section describes how you can manage your Amazon EKS add-on agent (GuardDuty agent) after you enable EKS Runtime Monitoring.To use EKS Runtime Monitoring, you must enable EKS Runtime Monitoring and configure the Amazon EKS add-on, aws-guardduty-agent. Performing only one of these two steps will not help GuardDuty detect potential threats or generate findings.

Note that in the previous sections, we chose the option **Manage agent automatically**.

Let first deselect the check box in the Console.

In the [Amazon GuardDuty console](https://console.aws.amazon.com/guardduty/home), Under the **Configuration** tab, Click on the **EDIT** button. In the **Edit configuration** page, select **Enable** button, select the checkboxes for **EKS Audit Log Monitoring**, **EKS Runtime Monitoring** and deslect **Manage agent automatically**. Click on the **Save Changes** button.

![GDDisableAgent](/static/images/detective-controls/GDDisableAgent.png)

Note that If you had configured GuardDuty to manage agent automatically and now deselected this option, GuardDuty will not delete the GuardDuty security agent. To continue receiving the runtime events for your EKS clusters, make sure to deploy the security agent manually.

So, let us first delete the Amazon EKS add-on first before we manually deploy it.

```bash
export GD_EKS_ADDON_NAME="aws-guardduty-agent"
export EKS_CLUSTER_NAME="eksworkshop-eksctl"
eksctl delete addon --cluster $EKS_CLUSTER_NAME --name $GD_EKS_ADDON_NAME
```

::::expand{header="Check Output"}

```bash
2023-06-06 05:36:34 [ℹ]  Kubernetes version "1.25" in use by cluster "eksworkshop-eksctl"
2023-06-06 05:36:34 [ℹ]  deleting addon: aws-guardduty-agent
2023-06-06 05:36:35 [ℹ]  deleted addon: aws-guardduty-agent
2023-06-06 05:36:35 [ℹ]  no associated IAM stacks found
```

::::

::alert[If you add `--preserve` option to the above `eksctl delete addon` command, in addition to Amazon EKS no longer managing the add-on, the add-on software WILL NOT removed from your cluster. That means, it only deletes the EKS add-on 'aws-guardduty-agent' and preserves its resources i.e. you will see pods running in the `amazon-guardduty` namesoace]{header="Note"}

Ensure the Amazon EKS add-on `aws-guardduty-agent` is removed from the EKS Console.

![GDEKSAddonRemoved](/static/images/detective-controls/GDEKSAddonRemoved.png)

Run below commands to ensure there are no `aws-guardduty-agent` pods running in the cluster.

```bash
kubectl get pod -n amazon-guardduty
```

The output will like below.

```bash
No resources found in amazon-guardduty namespace.
```

We also need to delete the automatically created VPC Endpoint.

Run the following to get the VPC Endpoint id.

```bash
export VPC_ENDPOINT=$(aws ec2 describe-vpc-endpoints --filters    Name=service-name,Values=com.amazonaws.${AWS_REGION}.guardduty-data | jq -r '.VpcEndpoints[0].VpcEndpointId')
echo $VPC_ENDPOINT
```

::::expand{header="Check Output"}

```bash
vpce-0116b6cd26efe36f2
```

::::

Run the following to delete the VPC Endpoint.

```bash
aws ec2 delete-vpc-endpoints --vpc-endpoint-ids $VPC_ENDPOINT
```

::::expand{header="Check Output"}

```json
{
  "Unsuccessful": []
}
```

::::

Go to the [Endpoints section in VPC Console](https://us-west-2.console.aws.amazon.com/vpc/home?region=us-west-2#Endpoints:) to ensure that the VPC Endpoint is deleted.

![GDVPCEndpointdeleted](/static/images/detective-controls/GDVPCEndpointdeleted.png)

Since the Amazon EKS add-on agent for GuardDuty is removed the EKS Cluster, you will see **Coverage status** Unhealthy under the **EKS clusters runtime coverage**.

![GDEKSAddonInhealthy](/static/images/detective-controls/GDEKSAddonInhealthy.png)

Now, let us proceed to deploy the Amazon EKS add-on agent for GuardDuty manually in the EKS Cluster.

### Create the VPC End point for Amazon GuardDuty

GuardDuty chose Amazon VPC endpoint to send Runtime event types associated with your Amazon EKS clusters, from the Amazon EKS add-on agent to GuardDuty for various [reasons](https://docs.aws.amazon.com/guardduty/latest/ug/eks-protection-configuration.html).

In this section, we will create an Amazon VPC endpoint for GuardDuty Service.

Run below commands to set environment variables for EKS VPC and Subnets used for the managed Nodegroup. We will need the list of subnets while creating the VPC Endpoint.

```bash
export NODEGROUP_NAME="mng-al2"
EKS_VPC_ID=$(eksctl get cluster $EKS_CLUSTER_NAME -ojson | jq -r '.[0]["ResourcesVpcConfig"]["VpcId"]')
echo $EKS_VPC_ID
export SUBNET_LIST=$(aws eks describe-nodegroup --cluster-name $EKS_CLUSTER_NAME --nodegroup-name $NODEGROUP_NAME  | jq -r '.nodegroup.subnets| join(" ")')
echo $SUBNET_LIST
```

::::expand{header="Check Output"}

```bash
vpc-097b094d65f08d9dd
subnet-03b945dcf434fa62f subnet-009b209f03760d12b subnet-013157237c2d1027f
```

::::

Let us create a security group for VPC Endpoint and allows traffic from `0.0.0.0/0` CIDR for tcp port 443.

```bash
export SECURITY_GROUP_NAME="GuardDutySelfManagedSecurityGroup"
export SECURITY_GROUP_DESC="GuardDutySelfManagedSecurityGroup for VPC Endpoint"
export CIDR_BLOCK="0.0.0.0/0"

export ACCOUNT_ID=$(aws sts get-caller-identity --output text --query Account)
export AWS_REGION=$(curl -s 169.254.169.254/latest/dynamic/instance-identity/document | jq -r '.region')


SECURITY_GROUP_ID=$(aws ec2 create-security-group --group-name $SECURITY_GROUP_NAME --description "$SECURITY_GROUP_DESC" --vpc-id $EKS_VPC_ID | jq --raw-output '.GroupId')
echo $SECURITY_GROUP_ID
aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 443 --cidr $CIDR_BLOCK
```

::::expand{header="Check Output"}

```bash
sg-09d3d0d26c06aa678
{
    "Return": true,
    "SecurityGroupRules": [
        {
            "SecurityGroupRuleId": "sgr-0cb31bc6a5172afc7",
            "GroupId": "sg-09d3d0d26c06aa678",
            "GroupOwnerId": "XXXXXXXXXX",
            "IsEgress": false,
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIpv4": "0.0.0.0/0"
        }
    ]
}
```

::::

Create an IAM policy document for Amazon VPC Endpoint for GuardDuty.

```bash
cd ~/environment
cat > guardduty-vpce-policy.json <<EOF
{
	"Version": "2012-10-17",
	"Statement": [
		{
			"Action": "*",
			"Resource": "*",
			"Effect": "Allow",
			"Principal": "*"
		},
		{
			"Condition": {
				"StringNotEquals": {
					"aws:PrincipalAccount": "$ACCOUNT_ID"
				}
			},
			"Action": "*",
			"Resource": "*",
			"Effect": "Deny",
			"Principal": "*"
		}
	]
}
EOF

```

Let us finally create the Amazon VPC Endpoint for GuardDuty.

```bash
export VPC_ENDPOINT_ID=$(aws ec2 create-vpc-endpoint \
    --vpc-id $EKS_VPC_ID \
    --vpc-endpoint-type Interface \
    --service-name  "com.amazonaws.$AWS_REGION.guardduty-data" \
    --subnet-ids $SUBNET_LIST \
    --security-group-id $SECURITY_GROUP_ID \
    --policy-document file://guardduty-vpce-policy.json |jq -r '.VpcEndpoint.VpcEndpointId')
echo $VPC_ENDPOINT_ID
```

::::expand{header="Check Output"}

```json
vpce-06b39a3d72b7c6f50
```

::::

Go to the [Endpoints section in VPC Console](https://us-west-2.console.aws.amazon.com/vpc/home?region=us-west-2#Endpoints:) to ensure that the VPC Endpoint is created. Wait for few minuts until the Status becomes **Available**.

![GDVPCEndpointcreated](/static/images/detective-controls/GDVPCEndpointcreated.png)

### Deploying GuardDuty security agent

Run the following command to the EKS add-on for GuardDuty Runtime agent.

```bash
aws eks  create-addon --cluster-name $EKS_CLUSTER_NAME --addon-name $GD_EKS_ADDON_NAME
```

::::expand{header="Check Output"}

```json
{
  "addon": {
    "addonName": "aws-guardduty-agent",
    "clusterName": "eksworkshop-eksctl",
    "status": "CREATING",
    "addonVersion": "v1.1.0-eksbuild.1",
    "health": {
      "issues": []
    },
    "addonArn": "arn:aws:eks:us-west-2:XXXXXXXXXX:addon/eksworkshop-eksctl/aws-guardduty-agent/d4c4456e-f919-3798-1cd9-6a93c5015665",
    "createdAt": "2023-06-05T09:23:01.523000+00:00",
    "modifiedAt": "2023-06-05T09:23:01.543000+00:00",
    "tags": {}
  }
}
```

::::

Go to EKS Console and ensure that Amazon GuardDuty EKS Runtime Monitoring EKS Managed Add-on is deployed into the EKS cluster. Wait for few minuts until the Status becomes **Active**.

![GDRuneTimeAgent2](/static/images/detective-controls/GDRuneTimeAgent2.png)

The EKS Runtime Monitoring agent is deployed as Daemonset in the EKS Cluster. Let us check if the pods are running.

```bash
kubectl get pod -n amazon-guardduty
```

The output will look below.

```bash
NAME                        READY   STATUS    RESTARTS   AGE
aws-guardduty-agent-lsz2r   1/1     Running   0          51s
aws-guardduty-agent-m267n   1/1     Running   0          51s
```

Since the Amazon EKS add-on agent for GuardDuty is deployed back into the EKS Cluster, you will see **Coverage status** Healthy under the **EKS clusters runtime coverage**.

![GDAgentHealthy2](/static/images/detective-controls/GDAgentHealthy2.png)

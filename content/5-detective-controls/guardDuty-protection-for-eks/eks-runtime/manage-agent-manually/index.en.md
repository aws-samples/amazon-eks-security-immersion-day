---
title : "Managing GuardDuty agent manually"
weight : 23
---

This section describes how you can manage your Amazon EKS add-on agent (GuardDuty agent) after you enable EKS Runtime Monitoring.To use EKS Runtime Monitoring, you must enable EKS Runtime Monitoring and configure the Amazon EKS add-on, aws-guardduty-agent. Performing only one of these two steps will not help GuardDuty detect potential threats or generate findings.

Note that in the previous sections, we chose the option **Manage agent automatically**.

Let first deselect the check box in the Console.

In the [Amazon GuardDuty console](https://console.aws.amazon.com/guardduty/home), Under the **Configuration** tab,  Click on the **EDIT** button.  In the **Edit configuration** page, select **Enable** button, select the checkboxes for **EKS Audit Log Monitoring**, **EKS Runtime Monitoring** and deslect **Manage agent automatically**. Click on the **Save Changes** button.

![GDDisableAgent](/static/images/detective-controls/GDDisableAgent.png)

Note that If you had configured GuardDuty to manage agent automatically and now deselected this option, GuardDuty will not delete the GuardDuty security agent. To continue receiving the runtime events for your EKS clusters, make sure to deploy the security agent manually.

So, let us first delete the Amazon EKS add-on first before we manually deploy it.

```bash
export GD_EKS_ADDON_NAME="aws-guardduty-agent"
export EKS_CLUSTER_NAME="eksworkshop-eksctl"
eksctl delete addon --cluster $EKS_CLUSTER_NAME --name $GD_EKS_ADDON_NAME --preserve
```

::::expand{header="Check Output"}
```bash
2023-06-05 05:58:07 [ℹ]  Kubernetes version "1.25" in use by cluster "eksworkshop-eksctl"
2023-06-05 05:58:07 [ℹ]  deleting addon "aws-guardduty-agent" and preserving its resources
```
::::

Ensure the Amazon EKS add-on `aws-guardduty-agent` is removed from the EKS Console.


![GDEKSAddonRemoved](/static/images/detective-controls/GDEKSAddonRemoved.png)


Also ensure there are no `aws-guardduty-agent` pods running in  the cluster.

```bash
kubectl get pod -n amazon-guardduty
```

The output will like below.

```bash
No resources found in amazon-guardduty namespace.
```

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
vpc-07b0582bb60208b5c
subnet-0a4a6c1ff326a1126 subnet-050ac1bf99bd314d9 subnet-0ef7fdcbb9d6267b2 subnet-07b479c70ab1410f8 subnet-0f872482299135b0b subnet-01acf8c75ea089ad4
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
sg-0e5a7794b206a7089
```
::::

Create an IAM policy document for Amazon VPC Endpoint for GuardDuty.

```bash
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
aws ec2 create-vpc-endpoint \
    --vpc-id $EKS_VPC_ID \
    --vpc-endpoint-type Interface \
    --service-name  "com.amazonaws.$AWS_REGION.guardduty-data" \
    --subnet-ids $SUBNET_LIST \
    --security-group-id $SECURITY_GROUP_ID \
    --policy-document file://guardduty-vpce-policy.json
```

::::expand{header="Check Output"}
```json
{
    "VpcEndpoint": {
        "VpcEndpointId": "vpce-051ae9742d3cb0289",
        "VpcEndpointType": "Interface",
        "VpcId": "vpc-07b0582bb60208b5c",
        "ServiceName": "com.amazonaws.us-west-2.guardduty-data",
        "State": "pending",
        "PolicyDocument": "{\n\"Version\": \"2012-10-17\",\n\"Statement\": [\n{\n\"Action\": \"*\",\n\"Resource\": \"*\",\n\"Effect\": \"Allow\",\n\"Principal\": \"*\"\n},\n{\n\"Condition\": {\n\"StringNotEquals\": {\n\"aws:PrincipalAccount\": \"XXXXXXXXXX\"\n}\n},\n\"Action\": \"*\",\n\"Resource\": \"*\",\n\"Effect\": \"Deny\",\n\"Principal\": \"*\"\n}\n]\n}",
        "RouteTableIds": [],
        "SubnetIds": [
            "subnet-0a4a6c1ff326a1126",
            "subnet-0ef7fdcbb9d6267b2",
            "subnet-050ac1bf99bd314d9"
        ],
        "Groups": [
            {
                "GroupId": "sg-0e5a7794b206a7089",
                "GroupName": "GuardDutySelfManagedSecurityGroup"
            }
        ],
        "IpAddressType": "ipv4",
        "DnsOptions": {
            "DnsRecordIpType": "ipv4"
        },
        "PrivateDnsEnabled": true,
        "RequesterManaged": false,
        "NetworkInterfaceIds": [
            "eni-067a789fc7eda0265",
            "eni-07e1ad2924e92cb5d",
            "eni-0e5e8a97d4c5468f5"
        ],
        "DnsEntries": [
            {
                "DnsName": "vpce-051ae9742d3cb0289-lzoi6apy.guardduty-data.us-west-2.vpce.amazonaws.com",
                "HostedZoneId": "Z7HUB22UULQXV"
            },
            {
                "DnsName": "vpce-051ae9742d3cb0289-lzoi6apy-us-west-2b.guardduty-data.us-west-2.vpce.amazonaws.com",
                "HostedZoneId": "Z7HUB22UULQXV"
            },
        },
        "PrivateDnsEnabled": true,
        "RequesterManaged": false,
        "NetworkInterfaceIds": [
            "eni-067a789fc7eda0265",
            "eni-07e1ad2924e92cb5d",
            "eni-0e5e8a97d4c5468f5"
        ],
        "DnsEntries": [
            {
                "DnsName": "vpce-051ae9742d3cb0289-lzoi6apy.guardduty-data.us-west-2.vpce.amazonaws.com",
                "HostedZoneId": "Z7HUB22UULQXV"
            },
            {
                "DnsName": "vpce-051ae9742d3cb0289-lzoi6apy-us-west-2b.guardduty-data.us-west-2.vpce.amazonaws.com",
                "HostedZoneId": "Z7HUB22UULQXV"
            },
            {
                "DnsName": "vpce-051ae9742d3cb0289-lzoi6apy-us-west-2c.guardduty-data.us-west-2.vpce.amazonaws.com",
                "HostedZoneId": "Z7HUB22UULQXV"
            },
            {
                "DnsName": "vpce-051ae9742d3cb0289-lzoi6apy-us-west-2a.guardduty-data.us-west-2.vpce.amazonaws.com",
                "HostedZoneId": "Z7HUB22UULQXV"
            },
            {
                "DnsName": "guardduty-data.us-west-2.amazonaws.com",
                "HostedZoneId": "ZONEIDPENDING"
            }
        ],
        "CreationTimestamp": "2023-06-05T09:16:08.185000+00:00",
        "OwnerId": "XXXXXXXXXX"
    }
}
```
::::

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

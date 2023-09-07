---
title : "Managing access to ECR repos using VPC endpoint policies"
weight : 24
---

You can improve the security posture of your VPC by configuring Amazon ECR to use [VPC endpoints](https://docs.aws.amazon.com/AmazonECR/latest/userguide/vpc-endpoints.html).

In this section, you will create **3** [VPC endpoints](https://docs.aws.amazon.com/AmazonECR/latest/userguide/vpc-endpoints.html#ecr-setting-up-vpc-create) - two VPC interface endpoints for ECR and one VPC gateway endpoint for S3. You will control access to VPC interface endpoints using [endpoint policies](https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints-access.html). You will no longer use the **ecrTester** profile for AWS CLI and will operate with the original _AdministratorAccess_ IAM permissions attached to the Cloud9 EC2 Instance IAM Role.

* **com.amazonaws._region_.ecr.dkr** - client commands such as `docker push` and `docker pull` use this endpoint. This endpoint must have [private DNS enabled](https://docs.aws.amazon.com/AmazonECR/latest/userguide/vpc-endpoints.html#ecr-setting-up-vpc-create) and it might take [few minutes](https://docs.aws.amazon.com/vpc/latest/privatelink/interface-endpoints.html#enable-private-dns-names) for the private IP addresses to become available.

* **com.amazonaws._region_.ecr.api** - API actions such as DescribeImages and CreateRepository go to this endpoint.

* **com.amazonaws._region_.s3** for [Amazon S3 gateway endpoint](https://docs.aws.amazon.com/AmazonECR/latest/userguide/vpc-endpoints.html#ecr-setting-up-s3-gateway). The gateway endpoint is required because Amazon ECR uses Amazon S3 to store your image layers.

::alert[When your Cloud9 workspace downloads images from Amazon ECR, it must access Amazon ECR to get the image manifest and then Amazon S3 to download the actual image layers. S3 bucket containing the layers of container images is arn:aws:s3:::prod-_**region**_-starport-layer-bucket]{header=""}

1. Find the Security Group, Subnet, Route Table and VPC IDs of the Cloud9 workspace

```bash
INTERFACE_ID=$(curl --silent http://169.254.169.254/latest/meta-data/network/interfaces/macs/ | head -n 1)
echo $INTERFACE_ID
WORKSPACE_SG_ID=$(curl --silent http://169.254.169.254/latest/meta-data/network/interfaces/macs/${INTERFACE_ID}/security-group-ids | head -n 1)
echo $WORKSPACE_SG_ID
SUBNET_ID=$(curl --silent http://169.254.169.254/latest/meta-data/network/interfaces/macs/${INTERFACE_ID}/subnet-id)
echo $SUBNET_ID
ROUTE_TABLE_ID=$(aws ec2 describe-route-tables \
        --query "RouteTables[*].Associations[?SubnetId=='$SUBNET_ID'].RouteTableId" \
        --region $AWS_REGION \
        --output text)
echo $ROUTE_TABLE_ID
VPC_ID=$(curl --silent http://169.254.169.254/latest/meta-data/network/interfaces/macs/${INTERFACE_ID}/vpc-id)
echo $VPC_ID
```

::::expand{header="Check Output"}
```
02:c6:d3:01:ed:85/
sg-0aa27bb31fbb9c11f
subnet-07a8def3897add985
rtb-0960716696daed2f0
vpc-067fe2e1e7856cbc2
```
::::

2. Create a new security group to use with VPC endpoints

```bash
VPCE_SG_ID=$(aws ec2 create-security-group \
	--group-name ECR_VPCE_SG \
	--description "Security group for ECR VPC Endpoints" \
	--vpc-id $VPC_ID \
	--region $AWS_REGION | jq -r .GroupId)
echo "export VPCE_SG_ID=$VPCE_SG_ID" >> ~/.ecr_security
echo -e "\nSecurity group ID for VPC Endpoints is $VPCE_SG_ID"
```

::::expand{header="Check Output"}
```
Security group ID for VPC Endpoints is sg-0ca620c0e890a7bce
```
::::

3. Add port 443 ingress rule to the new security group, with Cloud9 workspace's security group as source.

```bash
SG_RULE_ID=$(aws ec2 authorize-security-group-ingress \
    --group-id $VPCE_SG_ID \
    --protocol tcp \
    --port 443 \
    --source-group $WORKSPACE_SG_ID \
    --region $AWS_REGION \
    | jq -r .SecurityGroupRules[0].SecurityGroupRuleId)
echo "export SG_RULE_ID=$SG_RULE_ID" >> ~/.ecr_security
echo -e "\nSecurity group rule ID for VPC Endpoints is $SG_RULE_ID"
```

::::expand{header="Check Output"}
```
Security group rule ID for VPC Endpoints is sgr-0843d352a21826643
```
::::

4. Prepare VPC Endpoint policy document, allowing all actions and denying `PutImage` action on `team-a/alpine` repository. We [recommend](https://docs.aws.amazon.com/AmazonECR/latest/userguide/vpc-endpoints.html#ecr-vpc-endpoint-policy) creating a single IAM resource policy and attaching it to both of the Amazon ECR VPC endpoints.

```bash
ECR_VPCE_POLICY=$(echo -n '{"Statement":[{"Action":"ecr:GetAuthorizationToken","Effect":"Allow","Principal":"*","Resource":"*"},{"Action":"*","Effect":"Allow","Principal":"*","Resource":"arn:aws:ecr:'$AWS_REGION':'$ACCOUNT_ID':repository/*","Condition":{"StringEquals":{"aws:PrincipalAccount":["'$ACCOUNT_ID'"]}}},{"Sid":"DenyPutImage","Principal":"*","Action":"ecr:PutImage","Effect":"Deny","Resource":"arn:aws:ecr:'$AWS_REGION':'$ACCOUNT_ID':repository/'$ECR_REPO_A'"}]}')
```

5. Create `com.amazonaws._region_.ecr.dkr` interface type VPC endpoint and apply the endpoint policy document.

```bash
DKR_VPCE_ID=$(aws ec2 create-vpc-endpoint \
    --vpc-id $VPC_ID \
    --vpc-endpoint-type Interface \
    --service-name com.amazonaws.$AWS_REGION.ecr.dkr \
    --policy-document $ECR_VPCE_POLICY \
    --subnet-ids $SUBNET_ID \
    --security-group-id $VPCE_SG_ID \
    --region $AWS_REGION \
    | jq -r .VpcEndpoint.VpcEndpointId)
echo "export DKR_VPCE_ID=$DKR_VPCE_ID" >> ~/.ecr_security
echo -e "\nVPC Endpoint ID for com.amazonaws.$AWS_REGION.ecr.dkr is $DKR_VPCE_ID"
```

::::expand{header="Check Output"}
```
VPC Endpoint ID for com.amazonaws.us-west-2.ecr.dkr is vpce-09dcfba530aed5dd8
```
::::

6. Create `com.amazonaws._region_.ecr.api` interface type VPC endpoint and apply the endpoint policy document.

```bash
API_VPCE_ID=$(aws ec2 create-vpc-endpoint \
    --vpc-id $VPC_ID \
    --vpc-endpoint-type Interface \
    --service-name com.amazonaws.$AWS_REGION.ecr.api \
    --policy-document $ECR_VPCE_POLICY \
    --subnet-ids $SUBNET_ID \
    --security-group-id $VPCE_SG_ID \
    --region $AWS_REGION \
    | jq -r .VpcEndpoint.VpcEndpointId)
echo "export API_VPCE_ID=$API_VPCE_ID" >> ~/.ecr_security
echo -e "\nVPC Endpoint ID for com.amazonaws.$AWS_REGION.ecr.api is $API_VPCE_ID"
```

::::expand{header="Check Output"}
```
VPC Endpoint ID for com.amazonaws.us-west-2.ecr.api is vpce-08fc45864829b35cf
```
::::

7. Create `com.amazonaws._region_.s3` gateway type S3 endpoint

```bash
S3_VPCE_ID=$(aws ec2 create-vpc-endpoint \
    --vpc-id $VPC_ID \
    --vpc-endpoint-type Gateway \
    --service-name com.amazonaws.$AWS_REGION.s3 \
    --route-table-ids $ROUTE_TABLE_ID \
    --region $AWS_REGION \
    | jq -r .VpcEndpoint.VpcEndpointId)
echo "export S3_VPCE_ID=$S3_VPCE_ID" >> ~/.ecr_security
echo -e "\nVPC Endpoint ID for com.amazonaws.$AWS_REGION.s3 is $S3_VPCE_ID"
```

::::expand{header="Check Output"}
```
VPC Endpoint ID for com.amazonaws.us-west-2.s3 is vpce-0026bd036261da9c4
```
::::

Wait until all 3 VPC endpoints show status as 'Available', in the [AWS Console](https://us-west-2.console.aws.amazon.com/vpc/home?region=us-west-2#Endpoints:):

![vpcendpoints](/static/images/image-security/ecr-security-controls/vpc-endpoints.png)


The VPC Endpoint policy document on the above 2 Interface type VPC endpoints looks like belwow in the AWS Console.

```json
{
	"Statement": [
		{
			"Action": "ecr:GetAuthorizationToken",
			"Effect": "Allow",
			"Principal": "*",
			"Resource": "*"
		},
		{
			"Action": "*",
			"Effect": "Allow",
			"Principal": "*",
			"Resource": "arn:aws:ecr:us-west-2:ACOOUNT_ID:repository/*",
			"Condition": {
				"StringEquals": {
					"aws:PrincipalAccount": [
						"ACOOUNT_ID"
					]
				}
			}
		},
		{
			"Sid": "DenyPutImage",
			"Principal": "*",
			"Action": "ecr:PutImage",
			"Effect": "Deny",
			"Resource": "arn:aws:ecr:us-west-2:ACOOUNT_ID:repository/team-a/alpine"
		}
	]
}
```
::alert[VPC Interface Endpoints have private DNS enabled. After you create the VPC interface endpoints, it might take a few minutes for the private IP addresses to become available. If the following commands show public IP addresses or timeout, please try again after 2-3 minutes.]{header="Note"}

8. Check the IP addresses of the ECR URLs. You will see **private** IP addresses from your VPC/subnet assigned to the VPC endpoint ENIs. If you see public IP addresses, please wait and retry the commands.

```bash
host $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com | grep "has address"; echo -e ""
host api.ecr.$AWS_REGION.amazonaws.com | grep "has address"; echo -e ""
```

::::expand{header="Check Output"}
```
ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com has address 10.254.0.54
api.ecr.us-west-2.amazonaws.com has address 10.254.0.226
```
::::

9. Create a new version of a container image and push to `team-a/alpine` repository. IAM policy _AdminstratorAccess_ gives full access to ECR. VPC endpoint policy on `dkr.ecr.<region>.amazonaws.com` endpoint allows all actions and denies `PutImage` access to `team-a/alpine` repository. If there is an explicit _Deny_ in any of the applicable policies, the final decision is **Deny** 

::alert[When an image is pushed and all new image layers have been uploaded, the PutImage API is called once to create or update the image manifest and the tags associated with the image. The command output will show image layer verification or upload will succeed and the PutImage request is denied.]{header=""}

```bash
docker tag alpine:latest $ECR_REPO_URI_A:v2
docker push $ECR_REPO_URI_A:v2
```

The output will look like below:

```
The push refers to repository [ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/team-a/alpine]
78a822fe2a2d: Layer already exists 
denied: User: arn:aws:sts::ACCOUNT_ID:assumed-role/ROLE_NAME/INSTANCE_ID 
is not authorized to perform: ecr:PutImage on resource: 
arn:aws:ecr:us-west-2:012782584163:repository/team-a/alpine 
with an explicit deny in a VPC endpoint policy <--
```

10. List the images in `team-a/alpine` repository. Both IAM policy _AdministratorAccess_ and VPC endpoint policy on `api.ecr.<region>.amazonaws.com` endpoint allow ListImages action and there are no _Deny_ statements for the action, the final decision is **Allow**

```bash
aws ecr list-images \
  --repository-name $ECR_REPO_A \
  --region $AWS_REGION
```

The output will look like below:

```
 {
    "imageIds": [
        {
            "imageDigest": "sha256:25fad2a32ad1f6f510e528448ae1ec69a28ef81916a004d3629874104f8a7f70",
            "imageTag": "v1"
        }
    ]
}
```

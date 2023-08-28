---
title : "Setup ECR VPC Endpoints and Manage ECR access with VPC endpoint policies"
weight : 24
---

You can improve the security posture of your VPC by configuring Amazon ECR to use [VPC endpoints](https://docs.aws.amazon.com/AmazonECR/latest/userguide/vpc-endpoints.html).

In this section, you will create [3 VPC endpoints](https://docs.aws.amazon.com/AmazonECR/latest/userguide/vpc-endpoints.html#ecr-setting-up-vpc-create). You will control access to Docker Registry VPC endpoint using [endpoint policies](https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints-access.html).

* **com.amazonaws._region_.ecr.dkr** for Docker Registry APIs endpoint. Docker client commands such as push and pull use this endpoint. This endpoint must have [private DNS enabled](https://docs.aws.amazon.com/AmazonECR/latest/userguide/vpc-endpoints.html#ecr-setting-up-vpc-create) and it might take [few minutes](https://docs.aws.amazon.com/vpc/latest/privatelink/interface-endpoints.html#enable-private-dns-names) for the private IP addresses to become available.

* **com.amazonaws._region_.ecr.api** for Amazon ECR API endpoint. API actions such as DescribeImages and CreateRepository go to this endpoint.

* **com.amazonaws._region_.s3** for [Amazon S3 gateway endpoint](https://docs.aws.amazon.com/AmazonECR/latest/userguide/vpc-endpoints.html#ecr-setting-up-s3-gateway). The gateway endpoint is required because Amazon ECR uses Amazon S3 to store your image layers.

::alert[When your containers download images from Amazon ECR, they must access Amazon ECR to get the image manifest and then Amazon S3 to download the actual image layers. S3 bucket containing the layers for each Docker image is arn:aws:s3:::prod-_region_-starport-layer-bucket]{header=""}

1. Find the Security Group, Subnet, Route Table and VPC IDs of the Cloud9 workspace

```bash
INTERFACE_ID=$(curl --silent http://169.254.169.254/latest/meta-data/network/interfaces/macs/ | head -n 1)
WORKSPACE_SG_ID=$(curl --silent http://169.254.169.254/latest/meta-data/network/interfaces/macs/${INTERFACE_ID}/security-group-ids | head -n 1)
SUBNET_ID=$(curl --silent http://169.254.169.254/latest/meta-data/network/interfaces/macs/${INTERFACE_ID}/subnet-id)
ROUTE_TABLE_ID=$(aws ec2 describe-route-tables \
        --query "RouteTables[*].Associations[?SubnetId=='$SUBNET_ID'].RouteTableId" \
        --region $AWS_REGION \
        --output text)
VPC_ID=$(curl --silent http://169.254.169.254/latest/meta-data/network/interfaces/macs/${INTERFACE_ID}/vpc-id)
```

2. Create a new security group to use with VPC endpoints

```bash
VPCE_SG_ID=$(aws ec2 create-security-group \
	--group-name ECR_VPCE_SG \
	--description "Security group for ECR VPC Endpoints" \
	--vpc-id $VPC_ID \
	--region $AWS_REGION | jq -r .GroupId)
echo $VPCE_SG_ID
echo "export VPCE_SG_ID=$VPCE_SG_ID" >> ~/.ecr_security
```

3. Add port 443 ingress rule to the new security group, with Cloud9 workspace's security group as source.

```bash
SG_RULE_ID=$(aws ec2 authorize-security-group-ingress \
    --group-id $VPCE_SG_ID \
    --protocol tcp \
    --port 443 \
    --source-group $WORKSPACE_SG_ID \
    --region $AWS_REGION \
    | jq -r .SecurityGroupRules[0].SecurityGroupRuleId)
echo $SG_RULE_ID
echo "export SG_RULE_ID=$SG_RULE_ID" >> ~/.ecr_security
```

4. Prepare VPC Endpoint policy document, allowing all actions and denying `PutImage` action on `team-a/alpine` repository. We [recommend](https://docs.aws.amazon.com/AmazonECR/latest/userguide/vpc-endpoints.html#ecr-vpc-endpoint-policy) creating a single IAM resource policy and attaching it to both of the Amazon ECR VPC endpoints.

```bash
DKR_VPCE_POLICY=$(echo -n '{"Statement":[{"Action":"*","Effect":"Allow","Principal":"*","Resource":"*"},{"Sid":"DenyPutImage","Principal":"*","Action":"ecr:PutImage","Effect":"Deny","Resource":"arn:aws:ecr:'$AWS_REGION':'$ACCOUNT_ID':repository/'$ECR_REPO_A'"}]}')
```

5. Create `com.amazonaws._region_.ecr.dkr` interface type VPC endpoint and apply the endpoint policy document.

```bash
DKR_VPCE_ID=$(aws ec2 create-vpc-endpoint \
    --vpc-id $VPC_ID \
    --vpc-endpoint-type Interface \
    --service-name com.amazonaws.$AWS_REGION.ecr.dkr \
    --policy-document $DKR_VPCE_POLICY \
    --subnet-ids $SUBNET_ID \
    --security-group-id $VPCE_SG_ID \
    --region $AWS_REGION \
    | jq -r .VpcEndpoint.VpcEndpointId)
echo $DKR_VPCE_ID
echo "export DKR_VPCE_ID=$DKR_VPCE_ID" >> ~/.ecr_security
```

6. Create `com.amazonaws._region_.ecr.api` interface type VPC endpoint and apply the endpoint policy document.

```bash
API_VPCE_ID=$(aws ec2 create-vpc-endpoint \
    --vpc-id $VPC_ID \
    --vpc-endpoint-type Interface \
    --service-name com.amazonaws.$AWS_REGION.ecr.api \
    --policy-document $DKR_VPCE_POLICY \
    --subnet-ids $SUBNET_ID \
    --security-group-id $VPCE_SG_ID \
    --region $AWS_REGION \
    | jq -r .VpcEndpoint.VpcEndpointId)
echo $API_VPCE_ID
echo "export API_VPCE_ID=$API_VPCE_ID" >> ~/.ecr_security
```

7. Create `com.amazonaws._region_.s3` gateway type S3 endpoint

```bash
S3_VPCE_ID=$(aws ec2 create-vpc-endpoint \
    --vpc-id $VPC_ID \
    --vpc-endpoint-type Gateway \
    --service-name com.amazonaws.$AWS_REGION.s3 \
    --route-table-ids $ROUTE_TABLE_ID \
    --region $AWS_REGION \
    | jq -r .VpcEndpoint.VpcEndpointId)
echo $S3_VPCE_ID
echo "export S3_VPCE_ID=$S3_VPCE_ID" >> ~/.ecr_security
```

Wait until all 3 VPC endpoints show status as 'Available', in the AWS Console:

![vpcendpoints](/static/images/image-security/ecr-security-controls/vpc-endpoints.png)

::alert[VPC Interface Endpoints have private DNS enabled. After you create the VPC interface endpoints, it might take a few minutes for the private IP addresses to become available. If the following commands show public IP addresses or timeout, please try again after 2-3 minutes.]{header="Note"}

8. Check the IP addresses of the ECR URLs. You will see **private** IP addresses from your VPC/subnet assigned to the VPC endpoint ENIs. If you see public IP addresses, please wait and retry the commands.

```bash
host $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com | grep "has address"; echo -e ""
host api.ecr.$AWS_REGION.amazonaws.com | grep "has address"; echo -e ""
```

9. Create a new version of a docker image and push to `team-a/alpine` repository. VPC endpoint policy on `dkr.ecr.<region>.amazonaws.com` endpoint denies `PutImage` access to `team-a/alpine` repository.

```bash
docker tag alpine:latest $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_A:v2
docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_A:v2
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

10. List the images in `team-a/alpine` repository. No endpoint policy on `api.ecr.<region>.amazonaws.com` endpoint, you can ListImages

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

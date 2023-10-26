---
title : "Usecase 2: Service Connectivity with IAM Auth Access Controls"
weight : 14
---

## Configure IAM Access Auth policy for Service network `app-services-gw`


1. We need to first configure the Auth type for Service network `app-services-gw` to `AWS_IAM` and then configure Auth Access policy.

:::::tabs{variant="container"}

::::tab{id="cli" label="Using AWS CLI"}

1. Run below commands to configure the enable Auth type for Service network `app-services-gw`

```bash
aws vpc-lattice update-service-network --auth-type AWS_IAM \
--service-network-identifier $gatewayARN
```

The output will look like below.

```json
{
    "arn": "arn:aws:vpc-lattice:us-west-2:ACCOUNT_ID:servicenetwork/sn-0cc73287505ac121a",
    "authType": "AWS_IAM",
    "id": "sn-0cc73287505ac121a",
    "name": "app-services-gw"
}
```


2. Configure the Access Auth policy.

```bash
cd ~/environment
cat > manifests/service-network-policy.json <<EOF
{
    "Statement": {
        "Effect": "Allow",
        "Principal": "*",
        "Resource": "*",
        "Condition": {
            "StringNotEqualsIgnoreCase": {
                "aws:PrincipalType": "anonymous"
            }
        },
        "Action": "vpc-lattice-svcs:Invoke"
    }
}
EOF

aws vpc-lattice put-auth-policy \
    --resource-identifier $gatewayARN \
    --policy file://manifests/service-network-policy.json
```

::::expand{header="Check Output"}
```json
{
    "policy": "{\"Version\":\"2008-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Principal\":\"*\",\"Action\":\"vpc-lattice-svcs:Invoke\",\"Resource\":\"*\",\"Condition\":{\"StringNotEqualsIgnoreCase\":{\"aws:PrincipalType\":\"anonymous\"}}}]}",
    "state": "Active"
}
```
::::

::::tab{id="console" label="Using AWS Console"}

1. Go to VPC Lattice Service network `app-services-gw` under **Access** tab in the [Amazon VPC Console](https://us-west-2.console.aws.amazon.com/vpc/home?region=us-west-2#ServiceNetworks:), Under  **Access** tab, and then on **Edit access settings**, select **AWS IAM**, then select **Apply policy template** > **Allow only authenticated access**, Then Click on **Save Changes**.


![gw-access-auth.png](/static/images/6-network-security/2-vpc-lattice-service-access/gw-access-auth.png)

2. Go to VPC Lattice Service `app-services-gw` under **Access** tab in the [Amazon VPC Console](https://us-west-2.console.aws.amazon.com/vpc/home?region=us-west-2#ServiceNetworks:), Under  **Access** tab, and then on **Edit access settings**, select **AWS IAM**, then select **Apply policy template** > **Allow only authenticated access**, Then Click on **Save Changes**.


![service-network-auth-policy.png](/static/images/6-network-security/2-vpc-lattice-service-access/service-network-auth-policy.png)

::::

:::::


## Configure IAM Access Auth policy for Service `app2-app2`

1. First, set the Service auth type is set to `Amazon Web Services_IAM`

Go to VPC Lattice Service `app2-app2` under **Access** tab in the [Amazon VPC Console](https://us-west-2.console.aws.amazon.com/vpc/home?region=us-west-2#Services:), Under  **Access** tab, and then on **Edit access settings**, select **AWS IAM** and Click on **Save Changes**.

![app2-enable-iam](/static/images/6-network-security/2-vpc-lattice-service-access/app2-enable-iam.png)


2. Then, configure the Access Auth policy for for Service 

:::::tabs{variant="container"}

::::tab{id="cli" label="Using AWS CLI"}

Run below commands to configure the Access Auth policy for Service `app2-app2`

```bash
cat > manifests/service-policy.json <<EOF
{
    "Version": "2008-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": "*",
            "Action": "vpc-lattice-svcs:Invoke",
            "Resource": "*",
            "Condition": {
                "StringEquals": {
                    "vpc-lattice-svcs:SourceVpc": [
                        "$EKS_CLUSTER1_VPC_ID",
                        "$EKS_CLUSTER2_VPC_ID"
                    ]
                }
            }
        }
    ]
}
EOF
aws vpc-lattice put-auth-policy \
    --resource-identifier $APP2_SERVICE_ID \
    --policy file://manifests/service-policy.json
```

::::expand{header="Check Output"}
```json
{
    "policy": "{\"Version\":\"2008-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Principal\":\"*\",\"Action\":\"vpc-lattice-svcs:Invoke\",\"Resource\":\"*\",\"Condition\":{\"StringEquals\":{\"vpc-lattice-svcs:SourceVpc\":[\"vpc-0bacccb5d3d4d9cb5\",\"vpc-0eb911dff9689afb6\"]}}}]}",
    "state": "Active"
}
```
::::

::::tab{id="console" label="Using AWS Console"}


Go to VPC Lattice Service `app2-app2` under **Access** tab in the [Amazon VPC Console](https://us-west-2.console.aws.amazon.com/vpc/home?region=us-west-2#Services:), Under  **Access** tab, and then on **Edit access settings**, select **AWS IAM**, then select **Apply policy template** > **Allow only authenticated access**, Then Click on **Save Changes**.


![app2-auth-policy.png](/static/images/6-network-security/2-vpc-lattice-service-access/app2-auth-policy.png)


::::

:::::

## Check service connectivity again from `app1` to `app2` Service


1. Exec into an `app1-v1` pod to check connectivity to `app2` service: 

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/app1-v1 -n app1 -- curl $app2FQDN
```
The output indicates the Access denied as expected.

```bash
AccessDeniedException: User: anonymous is not authorized to perform: vpc-lattice-svcs:Invoke on resource: arn:aws:vpc-lattice:us-west-2:ACCOUNT_ID:service/svc-0e5f3d2b3db4c7962/ because no network-based policy allows the vpc-lattice-svcs:Invoke action
```

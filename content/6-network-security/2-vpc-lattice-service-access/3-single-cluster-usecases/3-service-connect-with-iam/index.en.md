---
title : "Usecase 2: Service Connectivity with IAM Auth Access Controls"
weight : 14
---

Amazon VPC Lattice integrates with AWS IAM to provide same authentication and authorization capabilities that you are familiar with when interacting with AWS services today, but for your own service-to-service communication.

To configure Service access controls, you can use access policies. An access policy is an AWS IAM resource policy that can be associated with a Service network and individual Services. With access policies, you can use the PARC (principal, action, resource, and condition) model to enforce context-specific access controls for Services.

![](/static/images/6-network-security/2-vpc-lattice-service-access/lattice-usecase2.png)

## Configure IAM Access Auth policy for Service network `app-services-gw`


1. We need to first configure the Auth type for Service network `app-services-gw` to `AWS_IAM` and then configure Auth Access policy.

We are going to associate an IAM Auth Policy with our VPC lattice service network. The rule we are going to put is to not accept unauthenticated traffic. To know more about configurations options, you can look at the [documentation](https://docs.aws.amazon.com/vpc-lattice/latest/ug/auth-policies.html).

:::::tabs{variant="container"}

::::tab{id="kube" label="Using New Kubernetes Manifest"}

The gateway api controller integrate with a new CRD named `IAMAuthPolicy` which allows to associate IAM policies to VPC lattice resources through Kubernetes.

```bash
cat << EOF > ~/environment/templates/gateway-policy-template.yaml
#https://github.com/aws/aws-application-networking-k8s/blob/main/docs/api-types/iam-auth-policy.md?plain=1
apiVersion: application-networking.k8s.aws/v1alpha1
kind: IAMAuthPolicy
metadata:
    name: ${GATEWAY_NAME}-iam-auth-policy
    namespace: $GATEWAY_NAMESPACE
spec:
    targetRef:
        group: "gateway.networking.k8s.io"
        kind: Gateway
        name: $GATEWAY_NAME
    policy: |
        {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": "vpc-lattice-svcs:Invoke",
                    "Resource": "*",
                    "Condition": {
                        "StringNotEqualsIgnoreCase": {
                            "aws:PrincipalType": "anonymous"
                        }                        
                    }
                }
            ]
        }
EOF
envsubst < ~/environment/templates/gateway-policy-template.yaml > ~/environment/manifests/${GATEWAY_NAME}-policy.yaml
kubectl --context $EKS_CLUSTER1_CONTEXT apply -f ~/environment/manifests/${GATEWAY_NAME}-policy.yaml
```

::::

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

Run below commands to check the Access Auth policies for Service network `app-services-gw`

```bash
ServicenetworkAccessPolicy=$(aws vpc-lattice get-auth-policy --resource-identifier $gatewayID)
echo gatewayID=$gatewayID && echo "ServicenetworkAccessPolicy=$ServicenetworkAccessPolicy"
```

::::expand{header="Check Output" defaultExpanded=true}
```json
gatewayID=sn-0c8e9eeb6d6b0dc9c
ServicenetworkAccessPolicy={
    "createdAt": "2024-02-07T18:05:18.518000+00:00",
    "lastUpdatedAt": "2024-02-07T18:05:18.670000+00:00",
    "policy": "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Principal\":\"*\",\"Action\":\"vpc-lattice-svcs:Invoke\",\"Resource\":\"*\",\"Condition\":{\"StringNotEqualsIgnoreCase\":{\"aws:PrincipalType\":\"anonymous\"}}}]}",
    "state": "Active"
}
```
::::

Now, with that policy on the gateway, VPC lattice will enforce all flow to be signed using [Sigv4](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_aws-signing.html), the same feature uses to reach AWS services.

If we try again to reach app2 from app1 we should get an error:

```bash
kubectl exec -ti -n app1 deployments/app1-v1 -- curl $app2DNS
```

::::expand{header="Check Output" defaultExpanded=true}
```
AccessDeniedException: User: anonymous is not authorized to perform: vpc-lattice-svcs:Invoke on resource: arn:aws:vpc-lattice:us-west-2:097381749469:service/svc-061f66f60654b5c6f/ because no network-based policy allows the vpc-lattice-svcs:Invoke action
```
::::             


## Configure IAM Access Auth policy for Service `app2-app2`

We can even have more granular control over the IAM auth policies associated with each VPC lattice services. Let's add a policy to restrict traffic only from our 2 VPC of our 2 EKS clusters.

2. Then, configure the Access Auth policy for for Service 

:::::tabs{variant="container"}

::::tab{id="kube" label="Using Kubernetes Manifests"}

Create a new IAM Auth Policy for the service app2:

```bash
export APPNAME=app2
export VERSION=v1
cat << EOF > ~/environment/templates/app-iam-auth-policy.yaml
apiVersion: application-networking.k8s.aws/v1alpha1
kind: IAMAuthPolicy
metadata:
    name: \${APPNAME}-iam-auth-policy
    namespace: \$APPNAME
spec:
    targetRef:
        group: "gateway.networking.k8s.io"
        kind: HTTPRoute
        namespace: \$APPNAME
        name: \$APPNAME
    policy: |
        {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": "arn:aws:iam::\${ACCOUNT_ID}:root"
                    },
                    "Action": "vpc-lattice-svcs:Invoke",
                    "Resource": "*",
                    "Condition": {
                        "StringEquals": {
                            "vpc-lattice-svcs:SourceVpc": [
                                "\$EKS_CLUSTER1_VPC_ID",
                                "\$EKS_CLUSTER2_VPC_ID"
                            ]
                        }
                    }                    
                }
            ]
        }         
EOF
envsubst < ~/environment/templates/app-iam-auth-policy.yaml > ~/environment/manifests/${APPNAME}-iam-auth-policy.yaml
c9  ~/environment/manifests/${APPNAME}-iam-auth-policy.yaml
kubectl apply -f ~/environment/manifests/${APPNAME}-iam-auth-policy.yaml
```

::::

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

First, set the Service auth type is set to `Amazon Web Services_IAM`

Go to VPC Lattice Service `app2-app2` under **Access** tab in the [Amazon VPC Console](https://us-west-2.console.aws.amazon.com/vpc/home?region=us-west-2#Services:), Under  **Access** tab, and then on **Edit access settings**, select **AWS IAM** and Click on **Save Changes**.

![app2-enable-iam](/static/images/6-network-security/2-vpc-lattice-service-access/app2-enable-iam.png)

Go to VPC Lattice Service `app2-app2` under **Access** tab in the [Amazon VPC Console](https://us-west-2.console.aws.amazon.com/vpc/home?region=us-west-2#Services:), Under  **Access** tab, and then on **Edit access settings**, select **AWS IAM**, then select **Apply policy template** > **Allow only authenticated access**, Then Click on **Save Changes**.


![app2-auth-policy.png](/static/images/6-network-security/2-vpc-lattice-service-access/app2-auth-policy.png)


::::

:::::

## Check service connectivity again from `app1` to `app2` Service


1. Exec into an `app1-v1` pod to check connectivity to `app2` service: 

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/app1-v1 -n app1 -- curl $app2DNS
```
The output indicates the Access denied as expected.

```bash
AccessDeniedException: User: anonymous is not authorized to perform: vpc-lattice-svcs:Invoke on resource: arn:aws:vpc-lattice:us-west-2:ACCOUNT_ID:service/svc-0e5f3d2b3db4c7962/ because no network-based policy allows the vpc-lattice-svcs:Invoke action
```

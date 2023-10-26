---
title : "Service Connectivity with IAM based Auth Access Controls"
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

## Configuring IAM Identity for the client i.e. `app1-app1` Service

Amazon VPC Lattice uses AWS Signature Version 4 (SigV4) for client authentication. After the Auth Policy is enabled on the Amazon VPC Lattice Service, it is also necessary to make changes on the service caller side, so that the HTTP requests include the signed `Authorization` header, as well as other headers such as `x-amz-content-sha256`, `x-amz-date` and `x-amz-security-token` when making HTTP requests. The details of [AWS Sig v4 can be found here](https://docs.aws.amazon.com/IAM/latest/UserGuide/create-signed-request.html).

There are multiple options to sign the request for Amazon VPC Lattice services.

   1. **[AWS SDK](https://docs.aws.amazon.com/vpc-lattice/latest/ug/sigv4-authenticated-requests.html)**: This option has the optimal performance, but requires code changes for the application.
   2. **[AWS SIGv4 Proxy Admission Controller](https://github.com/awslabs/aws-sigv4-proxy)**:  This option use AWS SIGv4 Proxy to forward HTTP request and add AWS Sigv4 headers. The details is covered in this [post](https://aws.amazon.com/blogs/containers/application-networking-with-amazon-vpc-lattice-and-amazon-eks/).
   3. **[Kyverno policy engine](https://kyverno.io/)**: It runs as a [dynamic admission controller](https://kubernetes.io/docs/reference/access-authn-authz/extensible-admission-controllers/) and receives mutating admission webhook HTTP callbacks from the API server, and applies matching policies to return results that enforce admission policies. In other words, Kyverno can automatically inject the sidecar and init containers automatically. We will be using ths option in this module.

**AWS SIGv4 Proxy container**: It will automatically sign requests using the credentials obtained by AWS IAM role for Service Account(IRSA) in Amazon EKS. It provides various configuration options including `--name vpc-lattice-svcs`, `--unsigned-payload` flag and logging options. 

The proxy container will listen to port 8080 and run as user `101`. The YAML snippet will look like below.

```yaml
      - name: sigv4proxy
        image: public.ecr.aws/aws-observability/aws-sigv4-proxy:latest
        args: [
          "--unsigned-payload",
          "--log-failed-requests",
          "-v", "--log-signing-process",
          "--name", "vpc-lattice-svcs",
          "--region", "us-west-2",
          "--upstream-url-scheme", "http"
        ]
        ports:
        - containerPort: 8080
          name: proxy
          protocol: TCP
        securityContext:
          runAsUser: 101 
```

**Init container**: It configures the iptables to intercept any traffic from `inventory-ver1` Service going to Amazon VPC Lattice services and redirect traffic to the AWS SigV4 Proxy.

It uses `iptables` utility to route the traffic connecting to Amazon VPC Lattice CIDR `169.254.171.0/24` to `EGRESS_PROXY` chain, and redirect the traffic to local port 8080. To avoid infinite loops when the traffic is sent by the proxy container, it is identified by checking whether the UID is `101` to ensure that it won’t be redirect again. The YAML snippet will look like below.


```yaml
      initContainers: # IPTables rules are updated in init container
      - image: public.ecr.aws/d2c6w7a3/iptables
        name: iptables-init
        securityContext:
          capabilities:
            add:
            - NET_ADMIN
        command: # Adding --uid-owner 101 here to prevent traffic from envoy proxy itself from being redirected, which prevents an infinite loop
        - /bin/sh
        - -c
        - >
          iptables -t nat -N EGRESS_PROXY;
          iptables -t nat -A OUTPUT -p tcp -d 169.254.171.0/24 -j EGRESS_PROXY;
          iptables -t nat -A EGRESS_PROXY -m owner --uid-owner 101 -j RETURN;
          iptables -t nat -A EGRESS_PROXY -p tcp -j REDIRECT --to-ports 8080;
```

### Creating IAM Roles for service accounts(IRSA) for `app1-v1` Service

We will configure the AWS SIGv4 Proxy container to use AWS IAM roles for service accounts (IRSA) so it use the credentials of an AWS IAM role to sign the requests on behalf of the caller service i.e.`app1-v1` Service. 

We will attach `VPCLatticeServicesInvokeAccess` identity-based policy to the AWS IAM role, to grant permissions to the IAM role to call the Amazon VPC Lattice service.

Note that the `app1-v1` Service is running with a default service account in the `app1` namespace.

```bash
export CLUSTER_NAME=eksworkshop-eksctl
export NAMESPACE=app1
export SERVICE_ACCOUNT=default
export SERVICE_ACCOUNT_IAM_ROLE=aws-sigv4-client

eksctl create iamserviceaccount \
  --cluster=$CLUSTER_NAME \
  --namespace=$NAMESPACE \
  --name=$SERVICE_ACCOUNT \
  --role-name=$SERVICE_ACCOUNT_IAM_ROLE \
  --attach-policy-arn=arn:aws:iam::aws:policy/VPCLatticeServicesInvokeAccess \
  --override-existing-serviceaccounts \
  --approve 
```

::::expand{header="Check Output"}
```bash
2023-10-26 06:39:50 [ℹ]  1 existing iamserviceaccount(s) (aws-application-networking-system/gateway-api-controller) will be excluded
2023-10-26 06:39:50 [ℹ]  1 iamserviceaccount (app1/default) was included (based on the include/exclude rules)
2023-10-26 06:39:50 [!]  metadata of serviceaccounts that exist in Kubernetes will be updated, as --override-existing-serviceaccounts was set
2023-10-26 06:39:50 [ℹ]  1 task: { 
    2 sequential sub-tasks: { 
        create IAM role for serviceaccount "app1/default",
        create serviceaccount "app1/default",
    } }2023-10-26 06:39:50 [ℹ]  building iamserviceaccount stack "eksctl-eksworkshop-eksctl-addon-iamserviceaccount-app1-default"
2023-10-26 06:39:50 [ℹ]  deploying stack "eksctl-eksworkshop-eksctl-addon-iamserviceaccount-app1-default"
2023-10-26 06:39:50 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-addon-iamserviceaccount-app1-default"
2023-10-26 06:40:20 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-addon-iamserviceaccount-app1-default"
2023-10-26 06:40:20 [ℹ]  serviceaccount "app1/default" already exists
2023-10-26 06:40:20 [ℹ]  updated serviceaccount "app1/default"
```
::::

Verify that that IAM role is added as annotation to the Service account `default` in the Namespace `app1`

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT -n app1 describe sa default
```

::::expand{header="Check Output"}
```bash
Name:                default
Namespace:           app1
Labels:              app.kubernetes.io/managed-by=eksctl
Annotations:         eks.amazonaws.com/role-arn: arn:aws:iam::ACCOUNT_ID:role/aws-sigv4-client
Image pull secrets:  <none>
Mountable secrets:   <none>
Tokens:              <none>
Events:              <none>
```
::::

---
title : "Implement IAM based Service Authentication"
weight : 23
---

## Check service connectivity from `inventory-ver1` to `rates` Service

Amazon VPC Lattice integrates with AWS IAM to provide same authentication and authorization capabilities that you are familiar with when interacting with AWS services today, but for our own service-to-service communication.

To configure Service access controls, you can use access policies. An access policy is an AWS IAM resource policy that can be associated with a Service network and individual Services. With access policies, you can use the PARC (principal, action, resource, and condition) model to enforce context-specific access controls for Services.

Let us first what access policies are configured for our Amazon VPC Service Network `my-hotel` and Service `rates-default`

1. Check Access Auth policies for Amazon VPC Service network and Service.

:::::tabs{variant="container"}

::::tab{id="cli" label="Using AWS CLI"}

Run below commands to get the Access Auth policies for Service network `my-hotel`

```bash
gatewayARNMessage=$(kubectl get gateway my-hotel -o json | jq -r '.status.conditions[1].message')
echo "gatewayARNMessage=$gatewayARNMessage"

prefix="aws-gateway-arn: "
gatewayARN=${gatewayARNMessage#$prefix}
echo  "gatewayARN=$gatewayARN"

ServicenetworkAccessPolicy=$(aws vpc-lattice get-auth-policy --resource-identifier $gatewayARN)
echo "ServicenetworkAccessPolicy=$ServicenetworkAccessPolicy"
```

The output will look like below, indicating that ServicenetworkAccessPolicy is empty.

```bash
gatewayARNMessage=aws-gateway-arn: arn:aws:vpc-lattice:us-east-1:ACCOUNT_ID:servicenetwork/sn-0813ae7fd8eba09c7
gatewayARN=arn:aws:vpc-lattice:us-east-1:ACCOUNT_ID:servicenetwork/sn-0813ae7fd8eba09c7
ServicenetworkAccessPolicy=
```

Run below commands to get the Access Auth policies for Service  `rates-default`

```bash
ratesdns=$(kubectl get httproute rates -o json | jq -r '.status.parents[].conditions[0].message')
prefix="DNS Name: "
ratesFQDN=${ratesdns#$prefix}
delimiter="."
split1=$(awk -F "${delimiter}" '{print $1}' <<< "$ratesFQDN")
#echo "$split1"
delimiter="-"
split2=$(awk -F "${delimiter}" '{print $3}' <<< "$split1")
#echo "$split2"
export RATES_SERVICE_ID="svc-${split2}"
echo "RATES_SERVICE_ID=$RATES_SERVICE_ID"
ServiceAccessPolicy=$(aws vpc-lattice get-auth-policy --resource-identifier $RATES_SERVICE_ID)
echo "ServiceAccessPolicy=$ServiceAccessPolicy"
```

The output will look like below, indicating that ServicenetworkAccessPolicy is empty.

```bash
RATES_SERVICE_ID=svc-0b1f56d26672bf677
ServiceAccessPolicy=
```

::::


::::tab{id="console" label="Using AWS Console"}


View the Auth policy for VPC Lattice Service network `my-hotel` under **Access** tab in the [Amazon VPC Console](https://us-west-2.console.aws.amazon.com/vpc/home?ServiceNetwork=&region=us-west-2#ServiceNetworks:)

![servicenetworkaccess.png](/static/images/6-network-security/2-vpc-lattice-service-access/servicenetworkaccess.png)


View the Auth policy VPC Lattice Service `rates-default` under **Access** tab in the [Amazon VPC Console](https://us-west-2.console.aws.amazon.com/vpc/home?region=us-west-2#Services:)

![serviceaccess.png](/static/images/6-network-security/2-vpc-lattice-service-access/serviceaccess.png)


::::

:::::

::alert[Authentication and authorization is turned off both at the Service network and service level. Access to all traffic from VPCs associated to the service network is allowed.]{header="Note"}


2. Check Service Inventory Pod access for Service Rates/parking or Service Rates/review by executing into the pod, then curling each service. 

```bash
kubectl get pod
```

::::expand{header="Check Output"}
```bash
NAME                              READY   STATUS    RESTARTS   AGE
inventory-ver1-55ff9bb45d-lbg7x   1/1     Running   0          14h
inventory-ver1-55ff9bb45d-qqh8d   1/1     Running   0          14h
parking-7c89b6b67c-5v69w          1/1     Running   0          15h
parking-7c89b6b67c-s6z9j          1/1     Running   0          15h
review-5846dd8dcc-dh6cz           1/1     Running   0          15h
review-5846dd8dcc-vfs4m           1/1     Running   0          15h
```
::::

3. Run `yum install bind-utils` in the inventory pod for the `nslookup` binary.

```bash
kubectl exec -it deploy/inventory-ver1 -- yum install bind-utils -y
```

::::expand{header="Check Output"}
```bash
Loaded plugins: ovl, priorities
amzn2-core                                   | 3.6 kB     00:00     
(1/3): amzn2-core/2/x86_64/group_gz            | 2.7 kB   00:00     
(2/3): amzn2-core/2/x86_64/updateinfo          | 719 kB   00:00     
(3/3): amzn2-core/2/x86_64/primary_db          |  67 MB   00:00     
Resolving Dependencies
--> Running transaction check
---> Package bind-utils.x86_64 32:9.11.4-26.P2.amzn2.13.5 will be installed
--> Processing Dependency: bind-libs(x86-64) = 32:9.11.4-26.P2.amzn2.13.5 for package: 32:bind-utils-9.11.4-26.P2.amzn2.13.5.x86_64
--> Processing Dependency: bind-libs-lite(x86-64) = 32:9.11.4-26.P2.amzn2.13.5 for package: 32:bind-utils-9.11.4-26.P2.amzn2.13.5.x86_64
--> Processing Dependency: libGeoIP.so.1()(64bit) for package: 32:bind-utils-9.11.4-26.P2.amzn2.13.5.x86_64
--> Processing Dependency: libbind9.so.160()(64bit) for package: 32:bind-utils-9.11.4-26.P2.amzn2.13.5.x86_64
--> Processing Dependency: libdns.so.1102()(64bit) for package: 32:bind-utils-9.11.4-26.P2.amzn2.13.5.x86_64
--> Processing Dependency: libirs.so.160()(64bit) for package: 32:bind-utils-9.11.4-26.P2.amzn2.13.5.x86_64
--> Processing Dependency: libisc.so.169()(64bit) for package: 32:bind-utils-9.11.4-26.P2.amzn2.13.5.x86_64
--> Processing Dependency: libisccfg.so.160()(64bit) for package: 32:bind-utils-9.11.4-26.P2.amzn2.13.5.x86_64
--> Processing Dependency: liblwres.so.160()(64bit) for package: 32:bind-utils-9.11.4-26.P2.amzn2.13.5.x86_64
--> Running transaction check
---> Package GeoIP.x86_64 0:1.5.0-11.amzn2.0.2 will be installed
---> Package bind-libs.x86_64 32:9.11.4-26.P2.amzn2.13.5 will be installed
--> Processing Dependency: bind-license = 32:9.11.4-26.P2.amzn2.13.5 for package: 32:bind-libs-9.11.4-26.P2.amzn2.13.5.x86_64
---> Package bind-libs-lite.x86_64 32:9.11.4-26.P2.amzn2.13.5 will be installed
--> Running transaction check
---> Package bind-license.noarch 32:9.11.4-26.P2.amzn2.13.5 will be installed
--> Finished Dependency Resolution

Dependencies Resolved

====================================================================
 Package        Arch   Version                     Repository  Size
====================================================================
Installing:
 bind-utils     x86_64 32:9.11.4-26.P2.amzn2.13.5  amzn2-core 261 k
Installing for dependencies:
 GeoIP          x86_64 1.5.0-11.amzn2.0.2          amzn2-core 1.1 M
 bind-libs      x86_64 32:9.11.4-26.P2.amzn2.13.5  amzn2-core 159 k
 bind-libs-lite x86_64 32:9.11.4-26.P2.amzn2.13.5  amzn2-core 1.1 M
 bind-license   noarch 32:9.11.4-26.P2.amzn2.13.5  amzn2-core  92 k

Transaction Summary
====================================================================
Install  1 Package (+4 Dependent packages)

Total download size: 2.7 M
Installed size: 6.4 M
Downloading packages:
(1/5): GeoIP-1.5.0-11.amzn2.0.2.x86_64.rpm     | 1.1 MB   00:00     
(2/5): bind-libs-9.11.4-26.P2.amzn2.13.5.x86_6 | 159 kB   00:00     
(3/5): bind-license-9.11.4-26.P2.amzn2.13.5.no |  92 kB   00:00     
(4/5): bind-libs-lite-9.11.4-26.P2.amzn2.13.5. | 1.1 MB   00:00     
(5/5): bind-utils-9.11.4-26.P2.amzn2.13.5.x86_ | 261 kB   00:00     
--------------------------------------------------------------------
Total                                   32 MB/s | 2.7 MB  00:00     
Running transaction check
Running transaction test
Transaction test succeeded
Running transaction
  Installing : GeoIP-1.5.0-11.amzn2.0.2.x86_64                  1/5 
  Installing : 32:bind-license-9.11.4-26.P2.amzn2.13.5.noarch   2/5 
  Installing : 32:bind-libs-lite-9.11.4-26.P2.amzn2.13.5.x86_   3/5 
  Installing : 32:bind-libs-9.11.4-26.P2.amzn2.13.5.x86_64      4/5 
  Installing : 32:bind-utils-9.11.4-26.P2.amzn2.13.5.x86_64     5/5 
  Verifying  : 32:bind-libs-lite-9.11.4-26.P2.amzn2.13.5.x86_   1/5 
  Verifying  : 32:bind-utils-9.11.4-26.P2.amzn2.13.5.x86_64     2/5 
  Verifying  : 32:bind-license-9.11.4-26.P2.amzn2.13.5.noarch   3/5 
  Verifying  : 32:bind-libs-9.11.4-26.P2.amzn2.13.5.x86_64      4/5 
  Verifying  : GeoIP-1.5.0-11.amzn2.0.2.x86_64                  5/5 

Installed:
  bind-utils.x86_64 32:9.11.4-26.P2.amzn2.13.5                      

Dependency Installed:
  GeoIP.x86_64 0:1.5.0-11.amzn2.0.2                                 
  bind-libs.x86_64 32:9.11.4-26.P2.amzn2.13.5                       
  bind-libs-lite.x86_64 32:9.11.4-26.P2.amzn2.13.5                  
  bind-license.noarch 32:9.11.4-26.P2.amzn2.13.5                    

Complete!
```
::::

Run the `nslookup` command in the Inventory Pod to resolve the **ratesFQDN**

```bash
kubectl exec -it deploy/inventory-ver1 -- nslookup $ratesFQDN
```

::::expand{header="Check Output"}
```bash
Server:         10.100.0.10
Address:        10.100.0.10#53

Non-authoritative answer:
Name:   rates-default-0b1f56d26672bf677.7d67968.vpc-lattice-svcs.us-east-1.on.aws
Address: 169.254.171.96
Name:   rates-default-0b1f56d26672bf677.7d67968.vpc-lattice-svcs.us-east-1.on.aws
Address: fd00:ec2:80::a9fe:ab60
```
::::

Notice that the IP `169.254.171.96` for **ratesFQDN** is from `MANAGED_PREFIX=169.254.171.0/24` we saw in the earlier section.


4. Exec into an inventory pod to check connectivity to `parking` and `review` services. Since there are no IAM access policies are configured for either Service network or Service, access to `rates` is allowed from any client from the VPCs associated to the Service network.

```bash
kubectl exec -it deploy/inventory-ver1 -- curl $ratesFQDN/parking $ratesFQDN/review
```

::::expand{header="Check Output"}
```bash
Requsting to Pod(parking-7c89b6b67c-s6z9j): parking handler pod
Requsting to Pod(review-5846dd8dcc-dh6cz): review handler pod
```
::::

## Configure Access Auth policy for Service `rates`


1. First, set the Service auth type is set to `Amazon Web Services_IAM`

Go to VPC Lattice Service `rates-default` under **Access** tab in the [Amazon VPC Console](https://us-west-2.console.aws.amazon.com/vpc/home?region=us-west-2#Services:), Under  **Access** tab, and then on **Edit access settings**, select **AWS IAM** and Click on **Save Changes**.

![enable-iam-type.png](/static/images/6-network-security/2-vpc-lattice-service-access/enable-iam-type.png)

E

2. Then, configure the Access Auth policy for for Service 

:::::tabs{variant="container"}

::::tab{id="cli" label="Using AWS CLI"}

Run below commands to configure the Access Auth policy for Service `rates-default`

```bash
cat > authenticated-auth-policy.json <<EOF
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
        "Action": "*"
    }
}
EOF

aws vpc-lattice put-auth-policy \
    --resource-identifier $RATES_SERVICE_ID \
    --policy file://authenticated-auth-policy.json

```

::::expand{header="Check Output"}
```json
{
    "policy": "{\"Version\":\"2008-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Principal\":\"*\",\"Action\":\"*\",\"Resource\":\"*\",\"Condition\":{\"StringNotEqualsIgnoreCase\":{\"aws:PrincipalType\":\"anonymous\"}}}]}",
    "state": "Active"
}
```
::::

::::tab{id="console" label="Using AWS Console"}


Go to VPC Lattice Service `rates-default` under **Access** tab in the [Amazon VPC Console](https://us-west-2.console.aws.amazon.com/vpc/home?region=us-west-2#Services:), Under  **Access** tab, and then on **Edit access settings**, select **AWS IAM**, then select **Apply policy template** > **Allow only authenticated access**, Then Click on **Save Changes**.


![configue_auth_policy.png](/static/images/6-network-security/2-vpc-lattice-service-access/configue_auth_policy.png)


::::

:::::

## Check service connectivity again from `inventory-ver1` to `rates` Service


1. Exec into an inventory pod to check connectivity to parking and review services: 

```bash
kubectl exec -it deploy/inventory-ver1 -- curl $ratesFQDN/parking $ratesFQDN/review
```
The output indicates the Access denied as expected.

```bash
AccessDeniedException: User: anonymous is not authorized to perform: vpc-lattice-svcs:Invoke on resource: arn:aws:vpc-lattice:us-east-1:ACCOUNT_ID:service/svc-0b1f56d26672bf677/parking because no network-based policy allows the vpc-lattice-svcs:Invoke action
AccessDeniedException: User: anonymous is not authorized to perform: vpc-lattice-svcs:Invoke on resource: arn:aws:vpc-lattice:us-east-1:ACCOUNT_ID:service/svc-0b1f56d26672bf677/review because no network-based policy allows the vpc-lattice-svcs:Invoke action
```




## Configuring IAM Identity for the client i.e. `inventory-ver1` Service

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

### Creating IAM Roles for service accounts(IRSA) for `inventory-ver1` Service

We will configure the AWS SIGv4 Proxy container to use AWS IAM roles for service accounts (IRSA) so it use the credentials of an AWS IAM role to sign the requests on behalf of the caller service i.e.`inventory-ver1` Service. 

We will attach `VPCLatticeServicesInvokeAccess` identity-based policy to the AWS IAM role, to grant permissions to the IAM role to call the Amazon VPC Lattice service.

Note that the `inventory-ver1` Service is running with a default service account `default` in the `default` namespace.

```bash
export CLUSTER_NAME=eksworkshop-eksctl
export NAMESPACE=default
export SERVICE_ACCOUNT=default

eksctl create iamserviceaccount \
  --cluster=$CLUSTER_NAME \
  --namespace=$NAMESPACE \
  --name=$SERVICE_ACCOUNT \
  --attach-policy-arn=arn:aws:iam::aws:policy/VPCLatticeServicesInvokeAccess \
  --override-existing-serviceaccounts \
  --approve 
```

::::expand{header="Check Output"}
```bash
2023-10-20 02:46:59 [ℹ]  1 existing iamserviceaccount(s) (aws-application-networking-system/gateway-api-controller) will be excluded
2023-10-20 02:46:59 [ℹ]  1 iamserviceaccount (default/default) was included (based on the include/exclude rules)
2023-10-20 02:46:59 [!]  metadata of serviceaccounts that exist in Kubernetes will be updated, as --override-existing-serviceaccounts was set
2023-10-20 02:46:59 [ℹ]  1 task: { 
    2 sequential sub-tasks: { 
        create IAM role for serviceaccount "default/default",
        create serviceaccount "default/default",
    } }2023-10-20 02:46:59 [ℹ]  building iamserviceaccount stack "eksctl-eksworkshop-eksctl-addon-iamserviceaccount-default-default"
2023-10-20 02:46:59 [ℹ]  deploying stack "eksctl-eksworkshop-eksctl-addon-iamserviceaccount-default-default"
2023-10-20 02:46:59 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-addon-iamserviceaccount-default-default"
2023-10-20 02:47:29 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-addon-iamserviceaccount-default-default"
2023-10-20 02:47:29 [ℹ]  serviceaccount "default/default" already exists
2023-10-20 02:47:29 [ℹ]  updated serviceaccount "default/default"
```
::::

Verify that that IAM role is added as annotation to the Service account `default` in the Namespace `default`

```bash
kubectl describe sa default
```

::::expand{header="Check Output"}
```bash
Name:                default
Namespace:           default
Labels:              app.kubernetes.io/managed-by=eksctl
Annotations:         eks.amazonaws.com/role-arn: arn:aws:iam::ACCOUNT_ID:role/eksctl-eksworkshop-eksctl-addon-iamserviceacc-Role1-rcrV3KaE3VM4
Image pull secrets:  <none>
Mountable secrets:   <none>
Tokens:              <none>
Events:              <none>
```
::::

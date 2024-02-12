---
title : "Usecase 6: Service Connectivity from Cluster2 to Cluster1"
weight : 11
---


In this section, we will test service connectivity from `app5` in second EKS Cluster to `app1` in the first EKS Cluster.

## Test Service Connectivity from `app5` to `app1` with HTTP and Default Lattice Domain

1. Run `yum install bind-utils tar` in the inventory pod for the `nslookup` and `tar` binary.

```bash
kubectl --context $EKS_CLUSTER2_CONTEXT exec -it deploy/app5-v1 -c app5-v1 -n app5 -- yum install tar bind-utils -y
```

2. Run the `nslookup` command in the `appv5-v1` Pod to resolve the **app1FQDN**

```bash
kubectl --context $EKS_CLUSTER2_CONTEXT exec -it deploy/app5-v1 -n app5 -- nslookup $app1FQDN
```

::::expand{header="Check Output"}
```
Server:         172.20.0.10
Address:        172.20.0.10#53

Non-authoritative answer:
Name:   app1-app1-0df47cf7f9031f04e.7d67968.vpc-lattice-svcs.us-west-2.on.aws
Address: 169.254.171.65
Name:   app1-app1-0df47cf7f9031f04e.7d67968.vpc-lattice-svcs.us-west-2.on.aws
Address: fd00:ec2:80::a9fe:ab41
```
::::


3. Exec into an `app5-v1` pod to check connectivity to `app1` service using custom domain at `HTTP` listener.

```bash
kubectl --context $EKS_CLUSTER2_CONTEXT exec -it deploy/app5-v1 -c app5-v1 -n app5 -- curl $app1FQDN
```

::::expand{header="Check Output"}
```
curl: (28) Failed to connect to app1-app1-0df47cf7f9031f04e.7d67968.vpc-lattice-svcs.us-west-2.on.aws port 80: Connection timed out
command terminated with exit code 28
```
::::

Did you notice that the curl command failed with timed out error?

::alert[To make requests to services in the network, the clients must be in a VPC that is associated with the service network.]{header="Note"}

Let us now associate second EKS Cluster VPC to the Service network.

```bash
aws  vpc-lattice  create-service-network-vpc-association --service-network-identifier $gatewayARN --vpc-identifier $EKS_CLUSTER2_VPC_ID
sleep 15
```

::::expand{header="Check Output"}
```
{
    "arn": "arn:aws:vpc-lattice:us-west-2:ACCOUNT_ID:servicenetworkvpcassociation/snva-0fab4e09dfe2210b2",
    "createdBy": "ACCOUNT_ID",
    "id": "snva-0fab4e09dfe2210b2",
    "status": "CREATE_IN_PROGRESS"
}
```
::::

Ensure that the Second EKS Cluster VPC is now associated with Service nework.

```bash
aws  vpc-lattice  list-service-network-vpc-associations --service-network-identifier $gatewayARN 
```

::::expand{header="Check Output"}
```json
{
    "items": [
        {
            "arn": "arn:aws:vpc-lattice:us-west-2:ACCOUNT_ID:servicenetworkvpcassociation/snva-0dcfe54eb815e6cd5",
            "createdAt": "2023-10-25T10:30:53.642000+00:00",
            "createdBy": "ACCOUNT_ID",
            "id": "snva-0dcfe54eb815e6cd5",
            "lastUpdatedAt": "2023-10-25T10:30:53.642000+00:00",
            "serviceNetworkArn": "arn:aws:vpc-lattice:us-west-2:ACCOUNT_ID:servicenetwork/sn-0cc73287505ac121a",
            "serviceNetworkId": "sn-0cc73287505ac121a",
            "serviceNetworkName": "app-services-gw",
            "status": "ACTIVE",
            "vpcId": "vpc-0bacccb5d3d4d9cb5"
        },
        {
            "arn": "arn:aws:vpc-lattice:us-west-2:ACCOUNT_ID:servicenetworkvpcassociation/snva-0fab4e09dfe2210b2",
            "createdAt": "2023-10-27T05:21:53.057000+00:00",
            "createdBy": "ACCOUNT_ID",
            "id": "snva-0fab4e09dfe2210b2",
            "lastUpdatedAt": "2023-10-27T05:21:53.057000+00:00",
            "serviceNetworkArn": "arn:aws:vpc-lattice:us-west-2:ACCOUNT_ID:servicenetwork/sn-0cc73287505ac121a",
            "serviceNetworkId": "sn-0cc73287505ac121a",
            "serviceNetworkName": "app-services-gw",
            "status": "ACTIVE",
            "vpcId": "vpc-0d054cd4b2a02cc34"
        }
    ]
}
```
::::

![servicenw-vpc.png](/static/images/6-network-security/2-vpc-lattice-service-access/servicenw-vpc.png)

4. Exec into an `app5-v1` pod to check connectivity again to `app1` service using custom domain at `HTTP` listener.

```bash
kubectl --context $EKS_CLUSTER2_CONTEXT exec -it deploy/app5-v1 -c app5-v1 -n app5 -- curl $app1FQDN
```
The `app5` from second EKS cluster should now be able to connect to `app1` in first EKS clsuter.

::::expand{header="Check Output"}
```
Requsting to Pod(app1-v1-7ccbcc48b6-wnltj): Hello from app1-v1
```
::::



## Test Service Connectivity from `app5` to `app4` with HTTPS and Custom Domain 


1. Run the `nslookup` command in the `appv5-v1` Pod to resolve **Custom Domain** for `app4` i.e. `app4.vpc-lattice-custom-domain.io`

```bash
kubectl --context $EKS_CLUSTER2_CONTEXT exec -it deploy/app5-v1 -n app5 -- nslookup app4.vpc-lattice-custom-domain.io
```

Did you notice the error that domain name `app4.vpc-lattice-custom-domain.io` cannot be resolved from second EKS cluster since second EKS cluster VPC is not associated with Route53 Private Hosted Zone.

::::expand{header="Check Output"}
```
Server:         172.20.0.10
Address:        172.20.0.10#53

** server can't find app4.vpc-lattice-custom-domain.io: NXDOMAIN

command terminated with exit code 1
```
::::


![route53-vpc1.png](/static/images/6-network-security/2-vpc-lattice-service-access/route53-vpc1.png)


2. Run below commmand to associate second EKS Cluster VPC to Route53 Private Hosted Zone.

```bash
aws route53 associate-vpc-with-hosted-zone --hosted-zone-id $HOSTED_ZONE_ID --vpc VPCRegion=$AWS_REGION,VPCId=$EKS_CLUSTER2_VPC_ID
```

::::expand{header="Check Output"}
```json
{
    "ChangeInfo": {
        "Id": "/change/C02457751GMVJHJ8PS2F4",
        "Status": "PENDING",
        "SubmittedAt": "2023-10-27T05:50:01.166000+00:00",
        "Comment": ""
    }
}

```
::::

Ensure that the seocond EKS Cluster is associated now.

![route53-vpc2.png](/static/images/6-network-security/2-vpc-lattice-service-access/route53-vpc2.png)


3. Run the `nslookup` command again in the `appv5-v1` Pod to resolve **Custom Domain** for `app4` i.e. `app4.vpc-lattice-custom-domain.io`

```bash
kubectl --context $EKS_CLUSTER2_CONTEXT exec -it deploy/app5-v1 -n app5 -- nslookup app4.vpc-lattice-custom-domain.io
```

The clients in second EKS cluster should now be able to resolve the Custom Domain for services in first EKS Cluster.

::::expand{header="Check Output"}
```
Server:         172.20.0.10
Address:        172.20.0.10#53

Non-authoritative answer:
app4.vpc-lattice-custom-domain.io       canonical name = app4-app4-06d489b63a7bc4295.7d67968.vpc-lattice-svcs.us-west-2.on.aws.
Name:   app4-app4-06d489b63a7bc4295.7d67968.vpc-lattice-svcs.us-west-2.on.aws
Address: 169.254.171.65
Name:   app4-app4-06d489b63a7bc4295.7d67968.vpc-lattice-svcs.us-west-2.on.aws
Address: fd00:ec2:80::a9fe:ab41
```
::::

4. Exec into an `app5-v1` pod to check connectivity to `app4` service using custom domain at `HTTP` listener.

```bash
kubectl --context $EKS_CLUSTER2_CONTEXT exec -it deploy/app5-v1 -c app5-v1 -n app5 -- curl app4.vpc-lattice-custom-domain.io
```

::::expand{header="Check Output"}
```
Requsting to Pod(app4-v1-77dcb6444c-mfjv2): Hello from app4-v1
```
::::

5. Exec into an `app5-v1` pod to check connectivity to `app4` service using custom domain at `HTTPS` listener

```bash
kubectl --context $EKS_CLUSTER2_CONTEXT exec -it deploy/app5-v1 -c app5-v1 -n app5 -- curl https://app4.vpc-lattice-custom-domain.io:443
```

::::expand{header="Check Output"}
```
curl: (60) SSL certificate problem: self signed certificate in certificate chain
More details here: https://curl.se/docs/sslcerts.html

curl failed to verify the legitimacy of the server and therefore could not
establish a secure connection to it. To learn more about this situation and
how to fix it, please visit the web page mentioned above.
command terminated with exit code 60```
::::


::alert[Did you notice that the curl command failed with an SSL error? This is because the client app `app1` does not have the Root CA certificate to validate the Server app `app4` certificate configured with the Gateway ]{header="Note"}

So, let us copy the Root CA certificate generated in the earlier module, to `app5-v1` pod and then try curl again using this certificate.

6. Copy the Root CA certificate to `app5-v1` pod

```bash
APP5_POD_NAME=$(kubectl --context $EKS_CLUSTER2_CONTEXT -n app5 get pods -l=app=app5-v1 -o=jsonpath={.items..metadata.name})
echo "APP5_POD_NAME=$APP5_POD_NAME"
kubectl --context $EKS_CLUSTER2_CONTEXT -n app5 cp manifests/root_cert.pem $APP5_POD_NAME:/app -c app5-v1
kubectl --context $EKS_CLUSTER2_CONTEXT -n app5 exec -it deploy/app5-v1 -c app5-v1  -- ls -l /app
```

::::expand{header="Check Output"}
```
APP5_POD_NAME=app5-v1-5f558c7fb6-c7vsl
-rwxrwxr-x 1 root root 6182155 Sep 20  2021 http-servers
-rw-rw-r-- 1 1000 1000    1383 Oct 27 01:25 root_cert.pem
```
::::

7. Exec into an `app5-v1` pod to check connectivity again to `app4` service using custom domain at `HTTPS` listener, along with Root CA certificate.


```bash
kubectl --context $EKS_CLUSTER2_CONTEXT exec -it deploy/app5-v1 -c app5-v1 -n app5 -- curl --cacert /app/root_cert.pem https://app4.vpc-lattice-custom-domain.io:443
```

We should now see the proper response from the `app4`.

::::expand{header="Check Output"}
```
Requsting to Pod(app4-v1-77dcb6444c-mfjv2): Hello from app4-v1
::::
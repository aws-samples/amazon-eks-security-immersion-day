---
title : "Usecase 6: Service Connectivity from Cluster2 to Cluster1"
weight : 11
---


In this section, we will test service connectivity from `app5` in second EKS Cluster to `app1` in the first EKS Cluster.

![](/static/images/6-network-security/2-vpc-lattice-service-access/lattice-usecase6.png)
- We redeploy app1 with Authentication and custom domain name on HTTPS
- Gateway api controller will create a `DNSEndpoint` object based on the wanted domain name
- We add External-DNS to create DNS records from the HTTPRoute object
- VPC Lattice will deal with TLS termination of our custom domain name, thanks to the Certificat we attached to the `app-service-gw`Gateway.
- We configure app5 with PodIdentity so it has appropriate IAM role to sign request using sigv4
- We also need to associate our Route53 private domain name with VPC of cluster2 so that it can resolve names from it
- We create a kyverno clusterpolicy so that app5 will have the envoy proxy for sigv4 signing.

## Test Service Connectivity from `app5` to `app1` with HTTPS and custom Lattice Domain, and IAM Auth policy enabled

### 1. Redeploy App1 with Authentication and default domain

```bash
export APPNAME=app1
export VERSION=v1
export SOURCE_CLUSTER=$EKS_CLUSTER2_NAME
export SOURCE_NAMESPACE=app5
#First we delete the route, to recreate it with custom domain
kubectl --context $EKS_CLUSTER1_CONTEXT delete -f manifests/$APPNAME-http-default-domain.yaml
#Then we recreate it
envsubst < templates/route-template-https-custom-domain.yaml > manifests/$APPNAME-https-custom-domain.yaml
c9 manifests/$APPNAME-https-custom-domain.yaml
kubectl --context $EKS_CLUSTER1_CONTEXT apply -f manifests/$APPNAME-https-custom-domain.yaml
kubectl --context $EKS_CLUSTER1_CONTEXT  wait --for=jsonpath='{.status.parents[-1:].conditions[-1:].reason}'=ResolvedRefs httproute/$APPNAME -n $APPNAME
```

> Check app1 has been upgraded, with a custom domain name defined, associated CNAME record created in our private Route 53 Hosted zone, and that IAM Auth Policy has been configured to only include flows from VPC1 and VPC2, and to allow flows from EKS cluster 2 from app5 namespace.

### 2. Configure app5 with a Pod Identity so that it can sign requests for VPC Lattice

Install Pod Identity add-on in Cluster2:

```bash
eksdemo create addon eks-pod-identity-agent -c $EKS_CLUSTER2_NAME
```

> Wait for eks-pod-identity to be up and running

### 3. Associate the role to the app1 application

Now we are going to use EKS Api to associate this role to our Role to our application:

```bash
aws eks create-pod-identity-association \
  --cluster-name $EKS_CLUSTER2_NAME \
  --namespace app5 \
  --service-account default \
  --role-arn arn:aws:iam::${AWS_ACCOUNT_ID}:role/aws-sigv4-client
```

> Note: we reuse the existing role `aws-sigv4-client` already associated to app1 in EKS cluster 1.



### 4. Re-deploy app5 so that it Take into account the new Pod Identity

```bash
kubectl --context $EKS_CLUSTER2_CONTEXT -n app5 rollout restart deployment/app5-v1
```

### 5. Run the `nslookup` command in the `appv5-v1` Pod to resolve the custom domain name for app1

```bash
kubectl --context $EKS_CLUSTER2_CONTEXT exec -it deploy/app5-v1 -n app5 -- nslookup app1.vpc-lattice-custom-domain.io
```

::::expand{header="Check Output"}
```
Server:         10.100.0.10
Address:        10.100.0.10#53

** server can't find app1.vpc-lattice-custom-domain.io: NXDOMAIN

command terminated with exit code 1
```
::::

> Did you notice the error that domain name `app4.vpc-lattice-custom-domain.io` cannot be resolved from second EKS cluster since second EKS cluster VPC is not associated with Route53 Private Hosted Zone.

What happen is that our Private Hosted Zone, is not yet associated with the VPC of cluster2.

![route53-vpc1.png](/static/images/6-network-security/2-vpc-lattice-service-access/route53-vpc1.png)


### 6. Run below commmand to associate second EKS Cluster VPC to Route53 Private Hosted Zone.

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


### 7. Check again

```bash
kubectl --context $EKS_CLUSTER2_CONTEXT exec -it deploy/app5-v1 -n app5 -- nslookup app1.vpc-lattice-custom-domain.io
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

::alert[It can take few minutes for DNS to propagate]{header="Note"}



### 8. Exec into an `app5-v1` pod to check connectivity to `app1` service using custom domain on `HTTPS` listener.

You can check you have proper Identity in the app5

```bash
kubectl --context $EKS_CLUSTER2_CONTEXT exec -it deploy/app5-v1 -n app5 -c app5-v1 -- aws sts get-caller-identity
```

::::expand{header="Check Output"}
```
{
    "UserId": "AROAVR5MHJVYTH5XQCUZ7:eks-eksworksho-app5-v1-5d-b1844cc2-f35b-45a7-a0a4-c6245b9bceb4",
    "Account": "012345678910",
    "Arn": "arn:aws:sts::012345678910:assumed-role/aws-sigv4-client/eks-eksworksho-app5-v1-5d-b1844cc2-f35b-45a7-a0a4-c6245b9bceb4"
}
```

> the role name should contain **aws-sigv4-client**
::::


You can also watch the logs of the pod identity controller:

```bash
kubectl stern --context $EKS_CLUSTER2_CONTEXT -n kube-system eks-pod-identity-agent
```

Finally Call App1:

```bash
kubectl --context $EKS_CLUSTER2_CONTEXT exec -it deploy/app5-v1 -n app5 -c app5-v1 -- /bin/bash -c '\
TOKEN=$(cat $AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE) && \
STS=$(curl -s 169.254.170.23/v1/credentials -H "Authorization: $TOKEN") && \
curl -s -k --aws-sigv4 "aws:amz:${AWS_REGION}:vpc-lattice-svcs" --user $(echo $STS | jq ".AccessKeyId" -r):$(echo $STS | jq ".SecretAccessKey" -r) -H "x-amz-content-sha256: UNSIGNED-PAYLOAD" -H "x-amz-security-token: $(echo $STS | jq ".Token" -r)" \
'https://app1.vpc-lattice-custom-domain.io
```


::::expand{header="Check Output"}
```
Requsting to Pod(app1-v1-c86d54576-qzjqn): Hello from app1-v1
```
::::


:::::alert{type="info" header="Congratulation!!"}
You have managed to have TLS connection in both way with IAM signature verification
:::::
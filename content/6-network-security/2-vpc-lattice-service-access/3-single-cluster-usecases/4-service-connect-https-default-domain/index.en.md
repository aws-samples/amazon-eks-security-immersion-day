---
title : "Usecase 3: Service Connectivity with HTTPS on Default Domain and IAM Auth Access Controls"
weight : 15
---

In this section, we will deploy a new service `app3` and configure `HTTPRoute` with `HTTPS` listener with default VPC Lattice Domain. We will then test connectivity from `app1` to `app3`.

![](/static/images/6-network-security/2-vpc-lattice-service-access/lattice-usecase3.png)

## Deploy and register Service `app3` to Service Network `app-services-gw`

### Deploy K8s manifests for Service `app3` in First EKS Cluster

```bash
export APPNAME=app3
export VERSION=v1
envsubst < templates/app-template.yaml > manifests/$APPNAME-$VERSION-deploy.yaml
kubectl  --context $EKS_CLUSTER1_CONTEXT apply -f manifests/$APPNAME-$VERSION-deploy.yaml
```

::::expand{header="Check Output"}
```
namespace/app3 created
deployment.apps/app3-v1 created
service/app3-v1 created
```
::::


```bash
kubectl --context $EKS_CLUSTER1_CONTEXT -n $APPNAME get all
```

::::expand{header="Check Output"}
```
NAME                         READY   STATUS    RESTARTS   AGE
pod/app3-v1-c6f47948-bsfp9   1/1     Running   0          11s

NAME              TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)   AGE
service/app3-v1   ClusterIP   172.20.157.212   <none>        80/TCP    3h44m

NAME                      READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/app3-v1   1/1     1            1           11s

NAME                               DESIRED   CURRENT   READY   AGE
replicaset.apps/app3-v1-c6f47948   1         1         1       11s
```
::::

### Deploy HTTPRoute for Service `app3` with `HTTPS` listener with Default Lattice Domain

```bash
envsubst < templates/route-template-https-default-domain.yaml > manifests/$APPNAME-https-default-domain.yaml
kubectl --context $EKS_CLUSTER1_CONTEXT apply -f manifests/$APPNAME-https-default-domain.yaml
```

::::expand{header="Check Output"}
```
httproute.gateway.networking.k8s.io/app3 created
```
::::

We also deploy the IAM authentication Policy to the app3 service, so both Authentication and HTTPS will be use.

```bash
envsubst < ~/environment/templates/app-iam-auth-policy.yaml > ~/environment/manifests/${APPNAME}-iam-auth-policy.yaml
c9  ~/environment/manifests/${APPNAME}-iam-auth-policy.yaml
kubectl apply -f ~/environment/manifests/${APPNAME}-iam-auth-policy.yaml
```

Theses steps may take 2-3 minutes, run the following command to wait for it to completed.

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT  wait --for=jsonpath='{.status.parents[-1:].conditions[-1:].reason}'=ResolvedRefs httproute/$APPNAME -n $APPNAME
```

::::expand{header="Check Output"}
```
httproute.gateway.networking.k8s.io/app3 condition met
```
::::


View the VPC Lattice Service `app3-app3` in the [Amazon VPC Console](https://us-west-2.console.aws.amazon.com/vpc/home?region=us-west-2#Services:)

![app3-service.png](/static/images/6-network-security/2-vpc-lattice-service-access/app3-service.png)


Note that there are two listeners created one for `HTTP` and other for `HTTPS` under **Routing** Tab for VPC Service `app3-app3` in the Console.

![app3-routes.png](/static/images/6-network-security/2-vpc-lattice-service-access/app3-routes.png)

Also note that both of these listeners are configured with the same Target group `k8s-app3-v1-app3-http-http1`

## Get the DNS Names for `app3` service

1. List the route’s yaml file to see the DNS address (highlighted here on the message line): 

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT get httproute app3 -n app3 -o yaml
```

The `status` field in the above output contains the DNS Name of the Service `message: 'DNS Name: app3-app3-0d04ef71e25199b39.7d67968.vpc-lattice-svcs.us-west-2.on.aws'`

2. Store assigned DNS names to variables.

```bash
app3DNS=$(kubectl --context $EKS_CLUSTER1_CONTEXT get httproute app3 -n app3 -o json | jq -r '.metadata.annotations."application-networking.k8s.aws/lattice-assigned-domain-name"')
echo "app3DNS=$app3DNS"
```

::::expand{header="Check Output"}
```
app3DNS=app3-app3-09b674948b9fb4016.7d67968.vpc-lattice-svcs.us-west-2.on.aws
```
::::

::alert[If the above command returns `null`, wait a little and re-run the command again]{header="Note"}

## Test Service Connectivity from `app1` to `app3` 

1. Run the `nslookup` command in the `app1-v1` Pod to resolve the **app3DNS**

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/app1-v1 -n app1 -c app1-v1 -- nslookup $app3DNS
```

::::expand{header="Check Output"}
```
Server:         172.20.0.10
Address:        172.20.0.10#53

Non-authoritative answer:
Name:   app3-app3-09b674948b9fb4016.7d67968.vpc-lattice-svcs.us-west-2.on.aws
Address: 169.254.171.64
Name:   app3-app3-09b674948b9fb4016.7d67968.vpc-lattice-svcs.us-west-2.on.aws
Address: fd00:ec2:80::a9fe:ab40
```
::::

> Again we can confirm that app3 will be routing through VPC lattice due to IP 169.254.171.64 in the Lattice managed preffix range.

2. Exec into an app1 pod to check connectivity to `app3` service using `HTTPS` listener

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/app1-v1 -n app1 -c app1-v1 -- /bin/bash -c '\
TOKEN=$(cat $AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE) && \
STS=$(curl -s 169.254.170.23/v1/credentials -H "Authorization: $TOKEN") && \
curl -s --aws-sigv4 "aws:amz:${AWS_REGION}:vpc-lattice-svcs" --user $(echo $STS | jq ".AccessKeyId" -r):$(echo $STS | jq ".SecretAccessKey" -r) -H "x-amz-content-sha256: UNSIGNED-PAYLOAD" -H "x-amz-security-token: $(echo $STS | jq ".Token" -r)" \
'https://$app3DNS
```

::::expand{header="Check Output" defaultExpanded=true}
```
Requsting to Pod(app3-v1-69ccf4bf4d-nfqzh): Hello from app3-v1
```
::::

::::alert{type="info" header="Note"}
Again, we use a complexe curl command that simulate how your application can use the AWS SDK to retrieve the Pod Identity and properly sign the request using SigV4 algorythm using the temporary IAM credentials of the pod.

> Here, the request is in HTTPS, and sign with SigV4!
::::


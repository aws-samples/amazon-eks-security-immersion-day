---
title : "Usecase 5: Service Connectivity from Cluster1 to Cluster2"
weight : 11
---


In this section, we will deploy a new service `app5` and configure `HTTPRoute` with `HTTPS` listener with Custom VPC Lattice Domain and IAM Auth activated. We will then test connectivity from `app1` to `app5`.

![](/static/images/6-network-security/2-vpc-lattice-service-access/lattice-usecase5.png)
- We Deploy app5 in second EKS cluster with an HTTPRoute pointing to a custom Domain Name
- Gateway api controller will create a `DNSEndpoint` object based on the wanted domain name
- We add External-DNS to create DNS records from the HTTPRoute object
- VPC Lattice will deal with TLS termination of our custom domain name, thanks to the Certificat we attached to the `app-service-gw`Gateway.  

## Deploy and register Service `app5` to Service Network `app-services-gw`

### Deploy K8s manifests for Service `app5` in Second EKS Cluster

```bash
export APPNAME=app5
export VERSION=v1
envsubst < templates/app-template.yaml > manifests/$APPNAME-$VERSION-deploy.yaml
kubectl  --context $EKS_CLUSTER2_CONTEXT apply -f manifests/$APPNAME-$VERSION-deploy.yaml
```

::::expand{header="Check Output"}
```bash
namespace/app5 created
deployment.apps/app5-v1 created
service/app5-v1 created
```
::::


```bash
kubectl --context $EKS_CLUSTER2_CONTEXT -n $APPNAME get all
```

::::expand{header="Check Output"}
```bash
NAME                           READY   STATUS    RESTARTS   AGE
pod/app5-v1-5f558c7fb6-c7vsl   1/1     Running   0          12s

NAME              TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
service/app5-v1   ClusterIP   172.20.32.235   <none>        80/TCP    13s

NAME                      READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/app5-v1   1/1     1            1           13s

NAME                                 DESIRED   CURRENT   READY   AGE
replicaset.apps/app5-v1-5f558c7fb6   1         1         1       12s
```
::::

### Deploy HTTPRoute for Service `app5` with `HTTPS` listener with Custom  Domain, and IAMAuthPolicy

```bash
envsubst < templates/route-template-https-custom-domain.yaml > manifests/$APPNAME-https-custom-domain.yaml
kubectl --context $EKS_CLUSTER2_CONTEXT apply -f manifests/$APPNAME-https-custom-domain.yaml
```

::::expand{header="Check Output"}
```bash
httproute.gateway.networking.k8s.io/app5 created
iamauthpolicy.application-networking.k8s.aws/app5-iam-auth-policy created
```
::::

This step may take 2-3 minutes, run the following command to wait for it to completed.

```bash
kubectl --context $EKS_CLUSTER2_CONTEXT  wait --for=jsonpath='{.status.parents[-1:].conditions[-1:].reason}'=ResolvedRefs httproute/$APPNAME -n $APPNAME
```

::::expand{header="Check Output"}
```bash
httproute.gateway.networking.k8s.io/app5 condition met
```
::::

View the VPC Lattice Service `app5-app5` in the [Amazon VPC Console](https://us-west-2.console.aws.amazon.com/vpc/home?region=us-west-2#Services:)

![app5-service.png](/static/images/6-network-security/2-vpc-lattice-service-access/app5-service.png)


Note that there are two listeners created one for `HTTP` and other for `HTTPS` under **Routing** Tab for VPC Service `app5-app5` in the Console.

![app5-routes.png](/static/images/6-network-security/2-vpc-lattice-service-access/app5-routes.png)

Also note that both of these listeners are configured with the same Target group `k8s-app5-v1-app5-http-http1`

## Get the DNS Names for `app5` service

### 1. List the route’s yaml file to see the DNS address (highlighted here on the message line): 

```bash
kubectl --context $EKS_CLUSTER2_CONTEXT get httproute $APPNAME -n $APPNAME -o yaml
```

::::expand{header="Check Output"}
```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  annotations:
    application-networking.k8s.aws/lattice-assigned-domain-name: app5-app5-0290b3274559b1c62.7d67968.vpc-lattice-svcs.us-west-2.on.aws
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"gateway.networking.k8s.io/v1beta1","kind":"HTTPRoute","metadata":{"annotations":{},"name":"app5","namespace":"app5"},"spec":{"hostnames":["app5.vpc-lattice-custom-domain.io"],"parentRefs":[{"kind":"Gateway","name":"app-services-gw","namespace":"app-services-gw","sectionName":"http-listener"},{"kind":"Gateway","name":"app-services-gw","namespace":"app-services-gw","sectionName":"https-listener-with-custom-domain"}],"rules":[{"backendRefs":[{"kind":"Service","name":"app5-v1","port":80}],"matches":[{"path":{"type":"PathPrefix","value":"/"}}]}]}}
  creationTimestamp: "2023-10-27T04:39:03Z"
  finalizers:
  - httproute.k8s.aws/resources
  generation: 1
  name: app5
  namespace: app5
  resourceVersion: "18910"
  uid: 32dd5516-e775-4e29-a333-8b9afa2d53d7
spec:
  hostnames:
  - app5.vpc-lattice-custom-domain.io
  parentRefs:
  - group: gateway.networking.k8s.io
    kind: Gateway
    name: app-services-gw
    namespace: app-services-gw
    sectionName: http-listener
  - group: gateway.networking.k8s.io
    kind: Gateway
    name: app-services-gw
    namespace: app-services-gw
    sectionName: https-listener-with-custom-domain
  rules:
  - backendRefs:
    - group: ""
      kind: Service
      name: app5-v1
      port: 80
      weight: 1
    matches:
    - path:
        type: PathPrefix
        value: /
status:
  parents:
  - conditions:
    - lastTransitionTime: "2023-10-27T04:40:13Z"
      message: 'DNS Name: app5-app5-0290b3274559b1c62.7d67968.vpc-lattice-svcs.us-west-2.on.aws'
      observedGeneration: 1
      reason: Accepted
      status: "True"
      type: Accepted
    - lastTransitionTime: "2023-10-27T04:40:13Z"
      message: 'DNS Name: app5-app5-0290b3274559b1c62.7d67968.vpc-lattice-svcs.us-west-2.on.aws'
      observedGeneration: 1
      reason: ResolvedRefs
      status: "True"
      type: ResolvedRefs
    controllerName: application-networking.k8s.aws/gateway-api-controller
    parentRef:
      group: gateway.networking.k8s.io
      kind: Gateway
      name: app-services-gw
      namespace: app-services-gw
      sectionName: http-listener
```
::::

The `status` field in the above output contains the DNS Name of the Service `message: 'DNS Name: app5-app5-0290b3274559b1c62.7d67968.vpc-lattice-svcs.us-west-2.on.aws'`

### 2. Store assigned DNS names to variables.

```bash
app5DNS=$(kubectl --context $EKS_CLUSTER2_CONTEXT get httproute app5 -n app5 -o json | jq -r '.metadata.annotations."application-networking.k8s.aws/lattice-assigned-domain-name"')
echo "app5DNS=$app5DNS"
```

::::expand{header="Check Output"}
```bash
app5DNS=app5-app5-0290b3274559b1c62.7d67968.vpc-lattice-svcs.us-west-2.on.aws
```
::::

::alert[If you have a null in response, wait a little for the HTTPRoute to be properly created and replay the last command.]{header="Note"}

## Install and configure External DNS to manage records automatically

Let's use eksdemo to help us installing ExternalDNS with proper IAM Role for serviceaccount configuration. We also ask External-dns to watch for `service`, `ingress`, and `crd` source type, and we provide Extra configuration so that it watch for `DNSEndpoint` custom ressource definition.

```bash
eksdemo install external-dns -c $EKS_CLUSTER2_NAME --set policy=sync \
  --set "domainFilters[0]=vpc-lattice-custom-domain.io" \
  --set "txtPrefix=lattice" \
  --set "sources[0]=service" --set "sources[1]=ingress" --set "sources[2]=crd" \
  --set "extraArgs[0]=--crd-source-apiversion=externaldns.k8s.io/v1alpha1" \
  --set "extraArgs[1]=--crd-source-kind=DNSEndpoint" \
  --set "extraArgs[2]=--zone-id-filter=$HOSTED_ZONE_ID" \
  --set logLevel=debug
```

If you want, you can open another terminal window and watch for the external-dns controller logs

```bash
kubectl stern --context $EKS_CLUSTER2_CONTEXT -n external-dns external-dns 
```

External-DNS will watch for the DNSEndpoint created by the Gateway api controller in response to the domain name configure in the app4 HTTPRoute object.

You can see the creation in the external-dns logs:

```
external-dns-68c9ff686b-dpfbl external-dns time="2024-02-12T09:22:09Z" level=info msg="Desired change: CREATE app5.vpc-lattice-custom-domain.io CNAME [Id: /hostedzone/Z0996756AKEM45NP2UWJ]"
```

You can see the record in Route 53:

![app5_cname.png](/static/images/6-network-security/2-vpc-lattice-service-access/app5_cname.png)


## Test Service Connectivity from `app1` in Cluster1 to `app5` in Cluster2

### 1. Run the `nslookup` command in the `appv1-v1` Pod to resolve the **app5DNS**

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/app1-v1 -n app1 -- nslookup $app5DNS
```

::::expand{header="Check Output"}
```bash
Server:         172.20.0.10
Address:        172.20.0.10#53

Non-authoritative answer:
Name:   app5-app5-0290b3274559b1c62.7d67968.vpc-lattice-svcs.us-west-2.on.aws
Address: 169.254.171.33
Name:   app5-app5-0290b3274559b1c62.7d67968.vpc-lattice-svcs.us-west-2.on.aws
Address: fd00:ec2:80::a9fe:ab21
```
::::

### 2. Run the `nslookup` command in the `appv1-v1` Pod to resolve **Custom Domain** for `app5` i.e. `app5.vpc-lattice-custom-domain.io`

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/app1-v1 -n app1 -- nslookup app5.vpc-lattice-custom-domain.io
```

Note that domain name `app5.vpc-lattice-custom-domain.io` resolves to `app5` default VPC Lattice generated domain as per the `CNAME` record configuration in the Private Hosted Zone.

::::expand{header="Check Output"}
```bash
Server:         172.20.0.10
Address:        172.20.0.10#53

Non-authoritative answer:
app5.vpc-lattice-custom-domain.io       canonical name = app5-app5-0290b3274559b1c62.7d67968.vpc-lattice-svcs.us-west-2.on.aws.
Name:   app5-app5-0290b3274559b1c62.7d67968.vpc-lattice-svcs.us-west-2.on.aws
Address: 169.254.171.33
Name:   app5-app5-0290b3274559b1c62.7d67968.vpc-lattice-svcs.us-west-2.on.aws
Address: fd00:ec2:80::a9fe:ab21
```
::::


### 3. Exec into an `app1-v1` pod to check connectivity to `app5` service using custom domain at `HTTP` listener, and Sigv4 signature

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/app1-v1 -n app1 -c app1-v1 -- /bin/bash -c 'TOKEN=$(cat $AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE) && STS=$(curl 169.254.170.23/v1/credentials -H "Authorization: $TOKEN") && curl --aws-sigv4 "aws:amz:${AWS_REGION}:vpc-lattice-svcs" --user $(echo $STS | jq ".AccessKeyId" -r):$(echo $STS | jq ".SecretAccessKey" -r) -H "x-amz-content-sha256: UNSIGNED-PAYLOAD" -H "x-amz-security-token: $(echo $STS | jq ".Token" -r)" 'http://app5.vpc-lattice-custom-domain.io
```

::::expand{header="Check Output" defaultExpanded=true}
```bash
Requsting to Pod(app5-v1-5f558c7fb6-c7vsl): Hello from app5-v1
```
::::

::::alert{type="info" header="HTTP OK!"}
Cool, the request is working in HTTP and IAM controls
::::

### 4. Exec into an `app1-v1` pod to check connectivity to `app5` service using custom domain at `HTTPS` listener and Sigv4 signature

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/app1-v1 -n app1 -c app1-v1 -- /bin/bash -c 'TOKEN=$(cat $AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE) && STS=$(curl 169.254.170.23/v1/credentials -H "Authorization: $TOKEN") && curl --aws-sigv4 "aws:amz:${AWS_REGION}:vpc-lattice-svcs" --user $(echo $STS | jq ".AccessKeyId" -r):$(echo $STS | jq ".SecretAccessKey" -r) -H "x-amz-content-sha256: UNSIGNED-PAYLOAD" -H "x-amz-security-token: $(echo $STS | jq ".Token" -r)" 'https://app5.vpc-lattice-custom-domain.io
```

::::expand{header="Check Output"}
```bash
curl: (60) SSL certificate problem: self signed certificate in certificate chain
More details here: https://curl.se/docs/sslcerts.html

curl failed to verify the legitimacy of the server and therefore could not
establish a secure connection to it. To learn more about this situation and
how to fix it, please visit the web page mentioned above.
command terminated with exit code 60```
::::


::alert[Did you notice that the curl command failed with an SSL error? This is because the client app `app1` does not have the Root CA certificate to validate the Server app `app5` certificate configured with the Gateway ]{header="Note"}

So, let us copy the Root CA certificate generated in the earlier module, to `app1-v1` pod and then try curl again using this certificate.

### 6. Copy the Root CA certificate to `app1-v1` pod

If not already done in previous module, create a configmap with the certificat

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT create configmap -n app1 app-root-cert --from-file=/home/ec2-user/environment/manifests/root_cert.pem
```

### 5. Exec into an `app1-v1` pod to check connectivity again to `app5` service using custom domain at `HTTPS` listener, Sigv4 signature and along with Root CA certificate.


```bash
kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/app1-v1 -n app1 -c app1-v1 -- /bin/bash -c 'TOKEN=$(cat $AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE) && STS=$(curl 169.254.170.23/v1/credentials -H "Authorization: $TOKEN") && curl --cacert /cert/root_cert.pem --aws-sigv4 "aws:amz:${AWS_REGION}:vpc-lattice-svcs" --user $(echo $STS | jq ".AccessKeyId" -r):$(echo $STS | jq ".SecretAccessKey" -r) -H "x-amz-content-sha256: UNSIGNED-PAYLOAD" -H "x-amz-security-token: $(echo $STS | jq ".Token" -r)" 'https://app5.vpc-lattice-custom-domain.io
```

We should now see the proper response from the `app5`.

::::expand{header="Check Output" defaultExpanded=true}
```bash
Requsting to Pod(app5-v1-5f558c7fb6-c7vsl): Hello from app5-v1
::::

::::alert{type="info" header="Congratulation!"}
This time we managed to configure our Service with custom domain name and certificat, with a secure connection in TLS, and authorization validated by VPC Lattice IAM policies, working seamlessly across different EKS clusters in different VPCs
::::
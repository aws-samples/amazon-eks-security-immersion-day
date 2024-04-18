---
title : "Usecase 4: Service Connectivity with HTTPS on Custom Domain and IAM Auth Access Controls"
weight : 16
---

In this section, we will deploy a new service `app4` and configure `HTTPRoute` with `HTTPS` listener with Custom VPC Lattice Domain. We will then test connectivity from `app1` to `app4` using the custom domain name and our Private Authority Certificate and Certificate Manager [created in the pre-requisite section](/6-network-security/2-vpc-lattice-service-access/2-setup-base-infra/3-acm-pca)

![](/static/images/6-network-security/2-vpc-lattice-service-access/lattice-usecase4.png)
- We Deploy app4 with an HTTPRoute pointing to a custom Domain Name
- Gateway api controller will create a `DNSEndpoint` object based on the wanted domain name
- We add External-DNS to create DNS records from the HTTPRoute object
- VPC Lattice will deal with TLS termination of our custom domain name, thanks to the Certificat we attached to the `app-service-gw` Gateway.

## Deploy and register Service `app4` to Service Network `app-services-gw`

### Deploy K8s manifests for Service `app4` in First EKS Cluster

```bash
export APPNAME=app4
export VERSION=v1
envsubst < templates/app-template.yaml > manifests/$APPNAME-$VERSION-deploy.yaml
kubectl  --context $EKS_CLUSTER1_CONTEXT apply -f manifests/$APPNAME-$VERSION-deploy.yaml
```

::::expand{header="Check Output"}
```
namespace/app4 unchanged
deployment.apps/app4-v1 configured
service/app4-v1 unchanged
```
::::


```bash
kubectl --context $EKS_CLUSTER1_CONTEXT -n $APPNAME get all
```

::::expand{header="Check Output"}
```
NAME                           READY   STATUS    RESTARTS   AGE
pod/app4-v1-77dcb6444c-mfjv2   1/1     Running   0          7s

NAME              TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
service/app4-v1   ClusterIP   172.20.13.153   <none>        80/TCP    118m

NAME                      READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/app4-v1   1/1     1            1           7s

NAME                                 DESIRED   CURRENT   READY   AGE
replicaset.apps/app4-v1-77dcb6444c   1         1         1       7s
```
::::

### Deploy HTTPRoute for Service `app4` with `HTTPS` listener with Custom Lattice Domain

```bash
export SOURCENAMESPACE=app1
envsubst < templates/route-template-https-custom-domain.yaml > manifests/$APPNAME-https-custom-domain.yaml
c9 manifests/$APPNAME-https-custom-domain.yaml
kubectl --context $EKS_CLUSTER1_CONTEXT apply -f manifests/$APPNAME-https-custom-domain.yaml
```

::::expand{header="Check Output"}
```
httproute.gateway.networking.k8s.io/app4 created
```
::::

Check the HTTPRoute is created:

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT  wait --for=jsonpath='{.status.parents[-1:].conditions[-1:].reason}'=ResolvedRefs httproute/$APPNAME -n $APPNAME
```

::::expand{header="Check Output"}
```
httproute.gateway.networking.k8s.io/app4 condition met
```
::::

View the VPC Lattice Service `app4-app4` in the [Amazon VPC Console](https://us-west-2.console.aws.amazon.com/vpc/home?region=us-west-2#Services:)

![app4-service.png](/static/images/6-network-security/2-vpc-lattice-service-access/app4-service.png)


Note that there are two listeners created one for `HTTP` and other for `HTTPS` under **Routing** Tab for VPC Service `app4-app4` in the Console.

![app4-routes.png](/static/images/6-network-security/2-vpc-lattice-service-access/app4-routes.png)

Also note that both of these listeners are configured with the same Target group `k8s-app4-v1-app4-http-http1`

<!-- This is not needed - to remove
## Get the DNS Names for `app4` service

### 1. List the route’s yaml file to see the DNS address (highlighted here on the message line): 

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT get httproute $APPNAME -n $APPNAME -o yaml
```

::::expand{header="Check Output"}
```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  annotations:
    application-networking.k8s.aws/lattice-assigned-domain-name: app4-app4-06d489b63a7bc4295.7d67968.vpc-lattice-svcs.us-west-2.on.aws
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"gateway.networking.k8s.io/v1beta1","kind":"HTTPRoute","metadata":{"annotations":{},"name":"app4","namespace":"app4"},"spec":{"hostnames":["app4.vpc-lattice-custom-domain.io"],"parentRefs":[{"kind":"Gateway","name":"app-services-gw","namespace":"app-services-gw","sectionName":"http-listener"},{"kind":"Gateway","name":"app-services-gw","namespace":"app-services-gw","sectionName":"https-listener-with-custom-domain"}],"rules":[{"backendRefs":[{"kind":"Service","name":"app4-v1","port":80}],"matches":[{"path":{"type":"PathPrefix","value":"/"}}]}]}}
  creationTimestamp: "2023-10-27T00:49:26Z"
  finalizers:
  - httproute.k8s.aws/resources
  generation: 1
  name: app4
  namespace: app4
  resourceVersion: "525940"
  uid: 9d657b2e-f0bf-4e74-92a7-8b3cdb9fc9d3
spec:
  hostnames:
  - app4.vpc-lattice-custom-domain.io
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
      name: app4-v1
      port: 80
      weight: 1
    matches:
    - path:
        type: PathPrefix
        value: /
status:
  parents:
  - conditions:
    - lastTransitionTime: "2023-10-27T00:50:32Z"
      message: 'DNS Name: app4-app4-06d489b63a7bc4295.7d67968.vpc-lattice-svcs.us-west-2.on.aws'
      observedGeneration: 1
      reason: Accepted
      status: "True"
      type: Accepted
    - lastTransitionTime: "2023-10-27T00:50:32Z"
      message: 'DNS Name: app4-app4-06d489b63a7bc4295.7d67968.vpc-lattice-svcs.us-west-2.on.aws'
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

The `status` field in the above output contains the DNS Name of the Service `message: 'DNS Name: app4-app4-06d489b63a7bc4295.7d67968.vpc-lattice-svcs.us-west-2.on.aws'`

### 2. Store assigned DNS names to variables.

```bash
app4DNS=$(kubectl --context $EKS_CLUSTER1_CONTEXT get httproute app4 -n app4 -o json | jq -r '.metadata.annotations."application-networking.k8s.aws/lattice-assigned-domain-name"')
echo "app4DNS=$app4DNS"
```

::::expand{header="Check Output"}
```
demo3:~/environment $ echo "app4DNS=$app4DNS"
app4DNS=app4-app4-05a7179225d38fd2d.7d67968.vpc-lattice-svcs.us-west-2.on.aws
```
::::

::alert[If you have a null in response, wait a little for the HTTPRoute to be properly created and replay the last command.]{header="Note"}
-->

## Install and configure External DNS to manage records automatically

Let's use eksdemo to help us installing ExternalDNS with proper IAM Role for serviceaccount configuration. We also ask External-dns to watch for `service`, `ingress`, and `crd` source type, and we provide Extra configuration so that it watch for `DNSEndpoint` custom ressource definition.

```bash
eksdemo install external-dns -c $EKS_CLUSTER1_NAME --set policy=sync \
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
kubectl stern --context $EKS_CLUSTER1_CONTEXT -n external-dns external-dns 
```

External-DNS will watch for the DNSEndpoint created by the Gateway api controller in response to the domain name configure in the app4 HTTPRoute object.

You can see the creation in the external-dns logs:

```
external-dns-68c9ff686b-dpfbl external-dns time="2024-02-12T09:22:09Z" level=info msg="Desired change: CREATE app4.vpc-lattice-custom-domain.io CNAME [Id: /hostedzone/Z0996756AKEM45NP2UWJ]"
```

You can see the record in Route 53:

![app4_cname.png](/static/images/6-network-security/2-vpc-lattice-service-access/app4_cname.png)


## Test Service Connectivity from `app1` to `app4` 

#### 1. Run the `nslookup` command in the `appv1-v1` Pod to resolve **Custom Domain** for `app4` i.e. `app4.vpc-lattice-custom-domain.io`

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/app1-v1 -n app1 -- nslookup app4.vpc-lattice-custom-domain.io
```

Note that domain name `app4.vpc-lattice-custom-domain.io` resolves to `app4` default VPC Lattice generated domain as per the `CNAME` record configuration in the Private Hosted Zone, created by external-dns

::::expand{header="Check Output"}
```
Server:         172.20.0.10
Address:        172.20.0.10#53

Non-authoritative answer:
app4.vpc-lattice-custom-domain.io       canonical name = app4-app4-06d489b63a7bc4295.7d67968.vpc-lattice-svcs.us-west-2.on.aws.
Name:   app4-app4-06d489b63a7bc4295.7d67968.vpc-lattice-svcs.us-west-2.on.aws
Address: 169.254.171.33
Name:   app4-app4-06d489b63a7bc4295.7d67968.vpc-lattice-svcs.us-west-2.on.aws
Address: fd00:ec2:80::a9fe:ab21
```
::::

#### 2. Check the DNSEndpoint object generated by the gateway-controller and used by external-dns to configure AWS RouteR3 records:

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT get DNSEndpoint -n app4 -o yaml
```

::::expand{header="Check Output"}
:::code{language=json showCopyAction=false showLineNumbers=false highlightLines='21,23,25'}
apiVersion: v1
items:
- apiVersion: externaldns.k8s.io/v1alpha1
  kind: DNSEndpoint
  metadata:
    creationTimestamp: "2024-04-16T16:47:06Z"
    generation: 1
    name: app4-dns
    namespace: app4
    ownerReferences:
    - apiVersion: gateway.networking.k8s.io/v1beta1
      blockOwnerDeletion: true
      controller: true
      kind: HTTPRoute
      name: app4
      uid: f9cd79e3-0367-4f02-9e62-aed1e366b34c
    resourceVersion: "363570"
    uid: 5ca6440f-c348-475f-b127-586fbc9da68d
  spec:
    endpoints:
    - dnsName: app4.vpc-lattice-custom-domain.io
      recordTTL: 300
      recordType: CNAME
      targets:
      - app4-app4-06c483a5a6d972f1b.7d67968.vpc-lattice-svcs.us-west-2.on.aws
  status:
    observedGeneration: 1
kind: List
metadata:
  resourceVersion: ""
:::
::::

#### 3. Exec into an `app1-v1` pod to check connectivity to `app4` service using custom domain at `HTTP` listener.

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/app1-v1 -c app1-v1 -n app1 -- curl app4.vpc-lattice-custom-domain.io
```

::::expand{header="Check Output"}
```
AccessDeniedException: User: anonymous is not authorized to perform: vpc-lattice-svcs:Invoke on resource: arn:aws:vpc-lattice:us-west-2:382076407153:service/svc-05a7179225d38fd2d/ because no network-based policy allows the vpc-lattice-svcs:Invoke action
```
::::

OK We still have activated our Authentication so we need to use the curl command with integration of SigV4 signature

#### 4. Exec into an `app1-v1` pod to check connectivity to `app4` service using custom domain at `HTTP` listener, with Sigv4 signature

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/app1-v1 -n app1 -c app1-v1 -- /bin/bash -c '\
TOKEN=$(cat $AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE) && \
STS=$(curl -s 169.254.170.23/v1/credentials -H "Authorization: $TOKEN") && \
curl -s --aws-sigv4 "aws:amz:${AWS_REGION}:vpc-lattice-svcs" --user $(echo $STS | jq ".AccessKeyId" -r):$(echo $STS | jq ".SecretAccessKey" -r) -H "x-amz-content-sha256: UNSIGNED-PAYLOAD" -H "x-amz-security-token: $(echo $STS | jq ".Token" -r)" \
'http://app4.vpc-lattice-custom-domain.io
```

::::expand{header="Check Output"}
```
Requsting to Pod(app4-v1-77dcb6444c-mfjv2): Hello from app4-v1
```
::::

## Now test HTTPS Connectivity 

#### 5. Exec into an `app1-v1` pod to check connectivity to `app4` service using custom domain at `HTTPS` listener

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/app1-v1 -c app1-v1 -n app1 -- curl https://app4.vpc-lattice-custom-domain.io:443
```

::::expand{header="Check Output"}
```
curl: (60) SSL certificate problem: self signed certificate in certificate chain
More details here: https://curl.se/docs/sslcerts.html

curl failed to verify the legitimacy of the server and therefore could not
establish a secure connection to it. To learn more about this situation and
how to fix it, please visit the web page mentioned above.
command terminated with exit code 60
```
::::


::alert[Did you notice that the curl command failed with an SSL error? This is because the client app `app1` does not have the Root CA certificate to validate the Server app `app4` certificate configured with the Gateway ]{header="Note"}

So, let us copy the Root CA certificate generated in the earlier module, to `app1-v1` pod and then try curl again using this certificate.

#### 6. Deploy the Root CA certificate to `app1-v1` pod

```bash
export APPNAME=app1
export VERSION=v1

#Load CA_ARN environment variable in the pod
sed -i "s/#addcacert//g" manifests/$APPNAME-$VERSION-deploy.yaml
kubectl  --context $EKS_CLUSTER1_CONTEXT apply -f manifests/$APPNAME-$VERSION-deploy.yaml
```

With this command, we add the environment variable `CA_ARN` in the Application code, something like the following:

:::code{language=json showCopyAction=false showLineNumbers=false highlightLines='8,9'}
...
      containers:
      - name: app1-v1
        image: public.ecr.aws/seb-demo/http-server:v1.10
        env:
        - name: PodName
          value: "Hello from app1-v1"
        - name: CA_ARN
          value: "arn:aws:acm-pca:us-west-2:823571991546:certificate-authority/69015706-ebef-4811-b97a-9586b4b9f938" 
...          
:::

This environment variable is used by our application entrypoint script, and if present, will install the associated certificat in the running container. This is for this call that we added the `AWSCertificateManagerPrivateCAReadOnly` policy to our `aws-sigv4-client` IAM role. 

Our entrypoint script looks like (from app1-v1 container):

```bash
bash-4.2# cat /app/launch_app.sh 
#!/bin/sh

#Add our private CA in our trust store
if [ -n "$CA_ARN" ]; then
  aws acm-pca get-certificate-authority-certificate --certificate-authority-arn $CA_ARN --region $AWS_REGION --output text > /etc/pki/ca-trust/source/anchors/internal.pem
  update-ca-trust extract
fi
```

> Another way to do this could be to create a secret with the certificate and inject it in the pod.

<!--
```bash
export APPNAME=app1
export VERSION=v1

#Create ConfigMap with certificat
kubectl --context $EKS_CLUSTER1_CONTEXT create configmap -n app1 app-root-cert --from-file=/home/ec2-user/environment/manifests/root_cert.pem
#Load configmap in App
sed -i "s/#addcert//g" manifests/$APPNAME-$VERSION-deploy.yaml
kubectl  --context $EKS_CLUSTER1_CONTEXT apply -f manifests/$APPNAME-$VERSION-deploy.yaml
```

::::expand{header="Check Output"}
```
configmap/app-root-cert created
namespace/app1 unchanged
deployment.apps/app1-v1 configured
service/app1-v1 unchanged
```
::::
-->

#### 7. Exec into an `app1-v1` pod to check connectivity again to `app4` service using custom domain at `HTTPS` listener, along with Root CA certificate.

Because the certificat is now part of the trusted ca store of our container, we can call directly our application in https
```bash
kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/app1-v1 -c app1-v1 -n app1 -- \
curl https://app4.vpc-lattice-custom-domain.io
```

The TLS error should have disapear and we should now see the authentication issue

::::expand{header="Check Output"}
```
AccessDeniedException: User: anonymous is not authorized to perform: vpc-lattice-svcs:Invoke on resource: arn:aws:vpc-lattice:us-west-2:382076407153:service/svc-05a7179225d38fd2d/ because no network-based policy allows the vpc-lattice-svcs:Invoke action
```
::::

#### 8. Exec into an `app1-v1` pod to check connectivity again to `app4` service using custom domain at `HTTPS` listener, along with Root CA certificate and Sigv4 signature

We can rely like previously on curl sigv4 feature to sign our request to vpc lattice: 

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/app1-v1 -n app1 -c app1-v1 -- /bin/bash -c '\
TOKEN=$(cat $AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE) && \
STS=$(curl -s 169.254.170.23/v1/credentials -H "Authorization: $TOKEN") && \
curl -s --aws-sigv4 "aws:amz:${AWS_REGION}:vpc-lattice-svcs" --user $(echo $STS | jq ".AccessKeyId" -r):$(echo $STS | jq ".SecretAccessKey" -r) -H "x-amz-content-sha256: UNSIGNED-PAYLOAD" -H "x-amz-security-token: $(echo $STS | jq ".Token" -r)" \
'https://app4.vpc-lattice-custom-domain.io
```

We should now see the proper response from the `app4`.

::::expand{header="Check Output"}
```
Requsting to Pod(app4-v1-85d4d9c455-22fgw): Hello from app4-v1
::::

::::alert{type="info" header="Congratulation!!"}
This time we managed to configure our Service with custom domain name and private certificat, with a secure connection in TLS, and authorization validated by VPC Lattice IAM policies.
::::
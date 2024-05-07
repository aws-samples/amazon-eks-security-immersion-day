---
title : "Usecase 5: Service Connectivity from Cluster1 to Cluster2"
weight : 11
---


In this section, we will deploy a new service `app5` and configure `HTTPRoute` with `HTTPS` listener with Custom VPC Lattice Domain and IAM Auth activated. We will then test connectivity from `app1` to `app5`.

![](/static/images/6-network-security/2-vpc-lattice-service-access/lattice-usecase5.png)
- We Deploy app5 in second EKS cluster with an HTTPRoute pointing to a custom Domain Name
- Gateway api controller will create a `DNSEndpoint` object based on the wanted domain name in `HTTPRoute`
- We add External-DNS to create DNS records from the `DNSEndpoint` object
- VPC Lattice will deal with TLS termination of our custom domain name, thanks to the Certificate we already attached to the `app-service-gw` Gateway.
- We also keep our Kyverno `ClusterPolicy` to inject the envoy proxy in app1

## Deploy and register Service `app5` to Service Network `app-services-gw`

### Deploy K8s manifests for Service `app5` in Second EKS Cluster

```bash
export APPNAME=app5
export VERSION=v1
#Create configmap for Root CA
kubectl --context $EKS_CLUSTER2_CONTEXT create configmap -n app5 app-root-cert --from-file=/home/ec2-user/environment/manifests/root_cert.pem

#Load configmap in App
envsubst < templates/app-template.yaml > manifests/$APPNAME-$VERSION-deploy.yaml
sed -i "s/#addcacert//g" manifests/$APPNAME-$VERSION-deploy.yaml
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
export SOURCE_CLUSTER=$EKS_CLUSTER1_NAME
export SOURCE_NAMESPACE=app1
envsubst < templates/route-template-https-custom-domain.yaml > manifests/$APPNAME-https-custom-domain.yaml
kubectl --context $EKS_CLUSTER2_CONTEXT apply -f manifests/$APPNAME-https-custom-domain.yaml
```

::::expand{header="Check Output"}
```bash
httproute.gateway.networking.k8s.io/app5 created
iamauthpolicy.application-networking.k8s.aws/app5-iam-auth-policy created
```
::::

Check the created HttpRoute: 

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


Note that there are only one listener created for `HTTPS` under **Routing** Tab for VPC Service `app5-app5` in the Console.

![app5-routes.png](/static/images/6-network-security/2-vpc-lattice-service-access/app5-routes.png)

Also note that we only have 1 listener in HTTPS only with Target group `k8s-app5-app5-v1-hroizxutyd`

## Get the DNS Names for `app5` service

### 1. List the route’s yaml file to see the DNS address (highlighted here on the message line): 

```bash
kubectl --context $EKS_CLUSTER2_CONTEXT get httproute $APPNAME -n $APPNAME -o yaml
```

::::expand{header="Check Output"}
:::code{language=yaml showCopyAction=true showLineNumbers=true highlightLines='5,45'}
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
:::
::::

The `status` field in the above output also contains the DNS Name of the Service `message: 'DNS Name: app5-app5-0290b3274559b1c62.7d67968.vpc-lattice-svcs.us-west-2.on.aws'`

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


### 3. Exec into an `app1-v1` pod to check connectivity to `app5` service using custom domain at `HTTPS` listener and Sigv4 signature

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/app1-v1 -n app1 -c app1-v1 -- /bin/bash -c 'curl http://app5.vpc-lattice-custom-domain.io'
```

We should now see the proper response from the `app5`.

::::expand{header="Check Output" defaultExpanded=true}
```bash
Requsting to Pod(app5-v1-5f558c7fb6-c7vsl): Hello from app5-v1
::::

Remember, that we have configured app1 to use the envoy proxy for signing the request. You can verify that envoy is currently creating the signature each time you execute the previous curl by looking at the logs

```bash
kubectl stern --context $EKS_CLUSTER1_CONTEXT -n app1 app1 -c envoy-sigv4 | grep token
```

::alert[App1 was configured in [previous chapter](/6-network-security/2-vpc-lattice-service-access/3-single-cluster-usecases/5-service-connect-https-custom-domain#4.-deploy-the-root-ca-certificate-to-app1-v1-pod) to retrieve the RootCA from our private Certificat Manager ACM, redo this module in case of https error]{header="Info"}


::::alert{type="info" header="Congratulation!"}
This time we managed to configure our Service with custom domain name and certificat, with a secure connection in TLS, and authorization validated by VPC Lattice IAM policies, working seamlessly across different EKS clusters in different VPCs.

We control who can access the vpc lattice with Pod Identity session tags, so that we can allow based on cluster-name, namespace name and service account name, or pod name.
::::


### 4. Exec into an `app2-v1` pod to check connectivity to `app5` service using custom domain at `HTTPS` listener and Sigv4 signature

Restart the app2 application so that our Kyverno cluster policy rule can apply and inject the envoy proxy:

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT rollout restart deployment/app2-v1 -n app2
```

::::alert{type="info" header="In case of Error.."}
If you see an error, in the deployment, that may mean that you didn't activate the Pod Identity association for app2, please follow [this](/6-network-security/2-vpc-lattice-service-access/3-single-cluster-usecases/4-service-connect-https-default-domain#test-service-connectivity-from-app2-to-app3) to activate.
::::

Now try access the app5 service.
```bash
kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/app2-v1 -n app2 -c app2-v1 -- /bin/bash -c 'curl http://app5.vpc-lattice-custom-domain.io'
```

::::expand{header="Check Output"}
```
AccessDeniedException: User: arn:aws:sts::798082067117:assumed-role/aws-sigv4-client/eks-eksworksho-app2-v1-bd-95eec466-e227-49b0-8048-bac5db382a4a is not authorized to perform: vpc-lattice-svcs:Invoke on resource: arn:aws:vpc-lattice:eu-west-1:798082067117:service/svc-0172f5b22a68d46bc/ because no service-based policy allows the vpc-lattice-svcs:Invoke action
```
::::

You should have seen an error.

::::expand{header="Why it has failed ?"}

It has failed this time, because our app5 application has no IAM Policy that allow namespace app2 as the origin.

let's check the actual policy: 

```bash
services=$(aws vpc-lattice list-services)
service=$(echo $services | jq '.items[] | select(.name == "app5-app5")') 
export APP5_SERVICE_ID=$(echo $service | jq -r '.id')
echo APP3_SERVICE_ID=$APP5_SERVICE_ID

aws vpc-lattice get-auth-policy     --resource-identifier $APP5_SERVICE_ID | jq ".policy | fromjson"
```

:::code{language=json showCopyAction=false showLineNumbers=false highlightLines='13,14'}
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::798082067117:root"
      },
      "Action": "vpc-lattice-svcs:Invoke",
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "aws:PrincipalTag/kubernetes-namespace": "app1",
          "aws:PrincipalTag/eks-cluster-name": "eksworkshop-eksctl-1",
          "vpc-lattice-svcs:SourceVpc": [
            "vpc-0a376808f0870acc5",
            "vpc-03054e11d0136f0f0"
          ]
        }
      }
    }
  ]
}
:::

We can see that while we have allowed incomming requests from our both VPC, only applications in namespaces `app1` from cluster `eksworkshop-eksctl-1` has been authorized.

You can also see that this IAM Auth policy has been defined, in the `manifests/app5-https-custom-domain.yaml` file in the `IAMAuthPolicy` object.

You can try update this policy to see if you can make app2 access app5 also.
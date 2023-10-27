---
title : "Usecase 4: Service Connectivity with HTTPS and Custom Domain"
weight : 16
---

In this section, we will deploy a new service `app4` and configure `HTTPRoute` with `HTTPS` listener with Custom VPC Lattice Domain. We will then test connectivity from `app1` to `app4`.


## Deploy and register Service `app4` to Service Network `app-services-gw`

### Deploy K8s manifests for Service `app4` in First EKS Cluster

```bash
export APPNAME=app4
export VERSION=v1
envsubst < templates/app-template.yaml > manifests/$APPNAME-$VERSION-deploy.yaml
kubectl  --context $EKS_CLUSTER1_CONTEXT apply -f manifests/$APPNAME-$VERSION-deploy.yaml
```

::::expand{header="Check Output"}
```bash
namespace/app4 unchanged
deployment.apps/app4-v1 configured
service/app4-v1 unchanged
```
::::


```bash
kubectl --context $EKS_CLUSTER1_CONTEXT -n $APPNAME get all
```

::::expand{header="Check Output"}
```bash
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
export GATEWAY_NAME=app-services-gw
export GATEWAY_NAMESPACE=app-services-gw
export APPNAME=app4
export VERSION=v1
export CUSTOM_DOMAIN_NAME="vpc-lattice-custom-domain.io"
envsubst < templates/route-template-https-custom-domain.yaml > manifests/$APPNAME-https-custom-domain.yaml
kubectl --context $EKS_CLUSTER1_CONTEXT apply -f manifests/$APPNAME-https-custom-domain.yaml
```

::::expand{header="Check Output"}
```bash
httproute.gateway.networking.k8s.io/app4 created
```
::::

This step may take 2-3 minutes, run the following command to wait for it to completed.

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT  wait --for=jsonpath='{.status.parents[-1:].conditions[-1:].reason}'=ResolvedRefs httproute/$APPNAME -n $APPNAME
```

::::expand{header="Check Output"}
```bash
httproute.gateway.networking.k8s.io/app4 condition met
```
::::

::alert[If the above command returns `error: timed out waiting for the condition on httproutes/app4`, run the command once again]{header="Note"}

View the VPC Lattice Service `app4-app4` in the [Amazon VPC Console](https://us-west-2.console.aws.amazon.com/vpc/home?region=us-west-2#Services:)

![app4-service.png](/static/images/6-network-security/2-vpc-lattice-service-access/app4-service.png)


Note that there are two listeners created one for `HTTP` and other for `HTTPS` under **Routing** Tab for VPC Service `app4-app4` in the Console.

![app4-routes.png](/static/images/6-network-security/2-vpc-lattice-service-access/app4-routes.png)

Also note that both of these listeners are configured with the same Target group `k8s-app4-v1-app4-http-http1`

## Get the DNS Names for `app4` service

1. List the route’s yaml file to see the DNS address (highlighted here on the message line): 

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

2. Store assigned DNS names to variables.

```bash
app4DNS=$(kubectl --context $EKS_CLUSTER1_CONTEXT get httproute $APPNAME -n $APPNAME -o json | jq -r '.status.parents[].conditions[0].message')
echo "app4DNS=$app4DNS"
```

::::expand{header="Check Output"}
```bash
app4DNS=DNS Name: app4-app4-06d489b63a7bc4295.7d67968.vpc-lattice-svcs.us-west-2.on.aws
```
::::

3. Remove preceding extra text.

```bash
prefix="DNS Name: "
app4FQDN=${app4DNS#$prefix}
echo "app4FQDN=$app4FQDN"
echo "export app4FQDN=$app4FQDN" >> ~/.bash_profile
```

::::expand{header="Check Output"}
```bash
app4FQDN=app4-app4-06d489b63a7bc4295.7d67968.vpc-lattice-svcs.us-west-2.on.aws
```
::::

## Create CNAME record for app4 custom domain `app4.vpc-lattice-custom-domain.io`

```bash
export APPNAME=app4
export CUSTOM_DOMAIN_NAME="vpc-lattice-custom-domain.io"
cat <<-EOF > manifests/$APPNAME-r53-record.json
{
  "Comment": "CREATE CNAME Record for $APPNAME.$CUSTOM_DOMAIN_NAME",
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "$APPNAME.$CUSTOM_DOMAIN_NAME",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [
          { 
            "Value": "$app4FQDN" 
          }
        ]
      }
    }
  ]
}
EOF
# Change route53 record set
aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch file://manifests/$APPNAME-r53-record.json
```


::::expand{header="Check Output"}
```json
{
    "ChangeInfo": {
        "Id": "/change/C0021990I7F3JHLHICJ4",
        "Status": "PENDING",
        "SubmittedAt": "2023-10-27T01:03:02.996000+00:00",
        "Comment": "CREATE CNAME for app4.vpc-lattice-custom-domain.io"
    }
}
```
::::

![app4_cname.png](/static/images/6-network-security/2-vpc-lattice-service-access/app4_cname.png)


## Test Service Connectivity from `app1` to `app4` 

1. Run `yum install bind-utils tar` in the inventory pod for the `nslookup` and `tar` binary.

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/app1-v1 -c app1-v1 -n app1 -- yum install tar bind-utils -y
```

2. Run the `nslookup` command in the `appv1-v1` Pod to resolve the **app4FQDN**

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/app1-v1 -n app1 -- nslookup $app4FQDN
```

::::expand{header="Check Output"}
```bash
Server:         172.20.0.10
Address:        172.20.0.10#53

Non-authoritative answer:
Name:   app4-app4-06d489b63a7bc4295.7d67968.vpc-lattice-svcs.us-west-2.on.aws
Address: 169.254.171.33
Name:   app4-app4-06d489b63a7bc4295.7d67968.vpc-lattice-svcs.us-west-2.on.aws
Address: fd00:ec2:80::a9fe:ab21
```
::::

3. Run the `nslookup` command in the `appv1-v1` Pod to resolve **Custom Domain** for `app4` i.e. `app4.vpc-lattice-custom-domain.io`

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/app1-v1 -n app1 -- nslookup app4.vpc-lattice-custom-domain.io
```

Note that domain name `app4.vpc-lattice-custom-domain.io` resolves to `app4` default VPC Lattice generated domain as per the `CNAME` record configuration in the Private Hosted Zone.

::::expand{header="Check Output"}
```bash
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


4. Exec into an `app1-v1` pod to check connectivity to `app4` service using custom domain at `HTTP` listener.

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/app1-v1 -c app1-v1 -n app1 -- curl app4.vpc-lattice-custom-domain.io
```

::::expand{header="Check Output"}
```bash
Requsting to Pod(app4-v1-77dcb6444c-mfjv2): Hello from app4-v1
```
::::

5. Exec into an `app1-v1` pod to check connectivity to `app4` service using custom domain at `HTTPS` listener

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/app1-v1 -c app1-v1 -n app1 -- curl https://app4.vpc-lattice-custom-domain.io:443
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


::alert[Did you notice that the curl command failed with an SSL error? This is because the client app `app1` does not have the Root CA certificate to validate the Server app `app4` certificate configured with the Gateway ]{header="Note"}

So, let us copy the Root CA certificate generated in the earlier module, to `app1-v1` pod and then try curl again using this certificate.

6. Copy the Root CA certificate to `app1-v1` pod

```bash
APP1_POD_NAME=$(kubectl --context $EKS_CLUSTER1_CONTEXT -n app1 get pods -l=app=app1-v1 -o=jsonpath={.items..metadata.name})
echo "APP1_POD_NAME=$APP1_POD_NAME"
kubectl --context $EKS_CLUSTER1_CONTEXT -n app1 cp manifests/root_cert.pem $APP1_POD_NAME:/app -c app1-v1
kubectl --context $EKS_CLUSTER1_CONTEXT -n app1 exec -it deploy/app1-v1 -c app1-v1  -- ls -l /app
```

::::expand{header="Check Output"}
```bash
APP1_POD_NAME=app1-v1-7ccbcc48b6-wnltj
-rwxrwxr-x 1 root root 6182155 Sep 20  2021 http-servers
-rw-rw-r-- 1 1000 1000    1383 Oct 27 01:25 root_cert.pem
```
::::

5. Exec into an `app1-v1` pod to check connectivity again to `app4` service using custom domain at `HTTPS` listener, along with Root CA certificate.

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/app1-v1 -c app1-v1 -n app1 -- curl --cacert /app/root_cert.pem https://app4.vpc-lattice-custom-domain.io:443
```

We should now see the proper response from the `app4`.

::::expand{header="Check Output"}
```bash
Requsting to Pod(app4-v1-77dcb6444c-mfjv2): Hello from app4-v1
::::

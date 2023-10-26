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
export VERSION1=v1
export CUSTOM_DOMAIN_NAME="vpc-lattice-custom-domain.io"
envsubst < templates/route-template-https-default-domain.yaml > manifests/$APPNAME-https-default-domain.yaml
kubectl --context $EKS_CLUSTER1_CONTEXT apply -f manifests/$APPNAME-https-default-domain.yaml
```

::::expand{header="Check Output"}
```bash
httproute.gateway.networking.k8s.io/app3 created
```
::::

This step may take 2-3 minutes, run the following command to wait for it to completed.

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT  wait --for=jsonpath='{.status.parents[-1:].conditions[-1:].reason}'=ResolvedRefs httproute/$APPNAME -n $APPNAME
```

::::expand{header="Check Output"}
```bash
httproute.gateway.networking.k8s.io/app3 condition met
```
::::

::alert[If the above command returns `error: timed out waiting for the condition on httproutes/app3`, run the command once again]{header="Note"}

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

::::expand{header="Check Output"}
```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  annotations:
    application-networking.k8s.aws/lattice-assigned-domain-name: app3-app3-0d04ef71e25199b39.7d67968.vpc-lattice-svcs.us-west-2.on.aws
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"gateway.networking.k8s.io/v1beta1","kind":"HTTPRoute","metadata":{"annotations":{},"name":"app3","namespace":"app3"},"spec":{"parentRefs":[{"kind":"Gateway","name":"app-services-gw","namespace":"app-services-gw","sectionName":"http-listener"},{"kind":"Gateway","name":"app-services-gw","namespace":"app-services-gw","sectionName":"https-listener-with-default-domain"}],"rules":[{"backendRefs":[{"kind":"Service","name":"app3-v1","port":80}],"matches":[{"path":{"type":"PathPrefix","value":"/"}}]}]}}
  creationTimestamp: "2023-10-26T08:39:13Z"
  finalizers:
  - httproute.k8s.aws/resources
  generation: 1
  name: app3
  namespace: app3
  resourceVersion: "319291"
  uid: 8231fb66-638e-4bd5-bc99-8108c9d9d3bd
spec:
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
    sectionName: https-listener-with-default-domain
  rules:
  - backendRefs:
    - group: ""
      kind: Service
      name: app3-v1
      port: 80
      weight: 1
    matches:
    - path:
        type: PathPrefix
        value: /
status:
  parents:
  - conditions:
    - lastTransitionTime: "2023-10-26T08:40:19Z"
      message: 'DNS Name: app3-app3-0d04ef71e25199b39.7d67968.vpc-lattice-svcs.us-west-2.on.aws'
      observedGeneration: 1
      reason: Accepted
      status: "True"
      type: Accepted
    - lastTransitionTime: "2023-10-26T08:40:19Z"
      message: 'DNS Name: app3-app3-0d04ef71e25199b39.7d67968.vpc-lattice-svcs.us-west-2.on.aws'
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

The `status` field in the above output contains the DNS Name of the Service `message: 'DNS Name: app3-app3-0d04ef71e25199b39.7d67968.vpc-lattice-svcs.us-west-2.on.aws'`

2. Store assigned DNS names to variables.

```bash
app3DNS=$(kubectl --context $EKS_CLUSTER1_CONTEXT get httproute app3 -n app3 -o json | jq -r '.status.parents[].conditions[0].message')
echo "app3DNS=$app3DNS"
```

::::expand{header="Check Output"}
```bash
app3DNS=DNS Name: app3-app3-0d04ef71e25199b39.7d67968.vpc-lattice-svcs.us-west-2.on.aws
```
::::

3. Remove preceding extra text.

```bash
prefix="DNS Name: "
app3FQDN=${app3DNS#$prefix}
echo "app3FQDN=$app3FQDN"
echo "export app3FQDN=$app3FQDN" >> ~/.bash_profile
```

::::expand{header="Check Output"}
```bash
app3FQDN=app3-app3-0d04ef71e25199b39.7d67968.vpc-lattice-svcs.us-west-2.on.aws
```
::::

## Test Service Connectivity from `app1` to `app3` 

1. Run `yum install bind-utils tar` in the inventory pod for the `nslookup` and `tar` binary.

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/app1-v1 -c app1-v1 -n app1 -- yum install tar bind-utils -y
```

Run the `nslookup` command in the Inventory Pod to resolve the **app3FQDN**

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/app1-v1 -n app1 -- nslookup $app3FQDN
```

::::expand{header="Check Output"}
```bash
Server:         172.20.0.10
Address:        172.20.0.10#53

Non-authoritative answer:
Name:   app2-app2-0e5f3d2b3db4c7962.7d67968.vpc-lattice-svcs.us-west-2.on.aws
Address: 169.254.171.33
Name:   app2-app2-0e5f3d2b3db4c7962.7d67968.vpc-lattice-svcs.us-west-2.on.aws
Address: fd00:ec2:80::a9fe:ab21
```
::::


2. Exec into an app1 pod to check connectivity to `app3` service using `HTTP` listener

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/app1-v1 -c app1-v1 -n app1 -- curl $app3FQDN
```

::::expand{header="Check Output"}
```bash
Requsting to Pod(app3-v1-78b96d8465-hk9k7): Hello from app3-v1
```
::::

3. Exec into an app1 pod to check connectivity to `app3` service using `HTTPS` listener

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/app1-v1 -c app1-v1 -n app1 -- curl https://$app3FQDN:443
```

::::expand{header="Check Output"}
```bash
Requsting to Pod(app3-v1-78b96d8465-hk9k7): Hello from app3-v1
```
::::

---
title : "Service Connectivity in Default VPC Lattice Configuration"
weight : 11
---

In this section, let us deploy two simple services `app1` and `app2` and test connectivity betweem im the default VPC Lattice Configuration.

## Deploy and register Service `app1` to Service Network `app-services-gw`

### Deploy K8s manifests for Service `app1` in First EKS Cluster

```bash
export APPNAME=app1
export VERSION=v1
envsubst < templates/app-template.yaml > manifests/$APPNAME-$VERSION-deploy.yaml
kubectl  --context $EKS_CLUSTER1_CONTEXT apply -f manifests/$APPNAME-$VERSION-deploy.yaml
```

::::expand{header="Check Output"}
```bash
namespace/app1 created
deployment.apps/app1-v1 created
service/app1-v1 created
```
::::


```bash
kubectl --context $EKS_CLUSTER1_CONTEXT -n $APPNAME get all
```

::::expand{header="Check Output"}
```bash
NAME                           READY   STATUS    RESTARTS   AGE
pod/app1-v1-5cc757c998-jl7pb   1/1     Running   0          31s

NAME              TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
service/app1-v1   ClusterIP   172.20.196.64   <none>        80/TCP    31s

NAME                      READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/app1-v1   1/1     1            1           31s

NAME                                 DESIRED   CURRENT   READY   AGE
replicaset.apps/app1-v1-5cc757c998   1         1         1       31s
```
::::

### Deploy HTTPRoute for Service `app1` in First EKS Cluster

```bash
export GATEWAY_NAME=app-services-gw
export GATEWAY_NAMESPACE=app-services-gw
export APPNAME=app1
export VERSION1=v1
export CUSTOM_DOMAIN_NAME="vpc-lattice-custom-domain.io"
envsubst < templates/route-template-http-default-domain.yaml > manifests/$APPNAME-http-default-domain.yaml
kubectl --context $EKS_CLUSTER1_CONTEXT apply -f manifests/$APPNAME-http-default-domain.yaml
```

::::expand{header="Check Output"}
```bash
httproute.gateway.networking.k8s.io/app1 created
```
::::

This step may take 2-3 minutes, run the following command to wait for it to completed.

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT  wait --for=jsonpath='{.status.parents[-1:].conditions[-1:].reason}'=ResolvedRefs httproute/$APPNAME -n $APPNAME
```

::::expand{header="Check Output"}
```bash
httproute.gateway.networking.k8s.io/app1 condition met
```
::::

View the VPC Lattice Service `app1-app1` in the [Amazon VPC Console](https://us-west-2.console.aws.amazon.com/vpc/home?region=us-west-2#Services:)

![route-app1.png](/static/images/6-network-security/2-vpc-lattice-service-access/route-app1.png)


Note that this VPC Service `app1-app1` is associated with VPC Lattice Network `app-services-gw`

![app1-assoc.png](/static/images/6-network-security/2-vpc-lattice-service-access/app1-assoc.png)

Also view the default route created for this VPC Service `app1-app1` in the Console.

![app1-routing.png](/static/images/6-network-security/2-vpc-lattice-service-access/app1-routing.png)

The Pods for the Service `app1` are registered with a Target group `k8s-app1-v1-app1-http-http1` in VPC Lattice.

![app1-tg.png](/static/images/6-network-security/2-vpc-lattice-service-access/app1-tg.png)

Also Note that by default no Access policies are configured at the VPC Lattice Service level. 

![app1-access.png](/static/images/6-network-security/2-vpc-lattice-service-access/app1-access.png)


## Deploy and register Service `app2` to Service Network `app-services-gw`

### Deploy K8s manifests for Service `app2` in First EKS Cluster

```bash
export APPNAME=app2
export VERSION=v1
envsubst < templates/app-template.yaml > manifests/$APPNAME-$VERSION-deploy.yaml
kubectl  --context $EKS_CLUSTER1_CONTEXT apply -f manifests/$APPNAME-$VERSION-deploy.yaml
```

::::expand{header="Check Output"}
```bash
namespace/app2 created
deployment.apps/app2-v1 created
service/app2-v1 created
```
::::


```bash
kubectl --context $EKS_CLUSTER1_CONTEXT -n $APPNAME get all
```

::::expand{header="Check Output"}
```bash
NAME                          READY   STATUS    RESTARTS   AGE
pod/app2-v1-c6978fdbc-fnkw8   1/1     Running   0          36s

NAME              TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
service/app2-v1   ClusterIP   172.20.52.136   <none>        80/TCP    36s

NAME                      READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/app2-v1   1/1     1            1           36s

NAME                                DESIRED   CURRENT   READY   AGE
replicaset.apps/app2-v1-c6978fdbc   1         1         1       36s
```
::::

### Deploy HTTPRoute for Service `app2` in First EKS Cluster

```bash
export GATEWAY_NAME=app-services-gw
export GATEWAY_NAMESPACE=app-services-gw
export APPNAME=app2
export VERSION1=v1
export CUSTOM_DOMAIN_NAME="vpc-lattice-custom-domain.io"
envsubst < templates/route-template-http-default-domain.yaml > manifests/$APPNAME-http-default-domain.yaml
kubectl --context $EKS_CLUSTER1_CONTEXT apply -f manifests/$APPNAME-http-default-domain.yaml
```

::::expand{header="Check Output"}
```bash
httproute.gateway.networking.k8s.io/app2 created
```
::::

This step may take 2-3 minutes, run the following command to wait for it to completed.

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT  wait --for=jsonpath='{.status.parents[-1:].conditions[-1:].reason}'=ResolvedRefs httproute/$APPNAME -n $APPNAME
```

::::expand{header="Check Output"}
```bash
httproute.gateway.networking.k8s.io/app2 condition met
```
::::

::alert[If the above command returns `error: timed out waiting for the condition on httproutes/app2`, run the command once again]{header="Note"}

View the VPC Lattice Service `app2-app2` in the [Amazon VPC Console](https://us-west-2.console.aws.amazon.com/vpc/home?region=us-west-2#Services:)

![route-app2.png](/static/images/6-network-security/2-vpc-lattice-service-access/route-app2.png)


Note that this VPC Service `app2-app2` is associated with VPC Lattice Network `app-services-gw`

![app2-assoc.png](/static/images/6-network-security/2-vpc-lattice-service-access/app2-assoc.png)

Also view the default route created for this VPC Service `app2-app2` in the Console.

![app2-routing.png](/static/images/6-network-security/2-vpc-lattice-service-access/app2-routing.png)

The Pods for the Service `app2` are registered with a Target group `k8s-app1-v1-app1-http-http1` in VPC Lattice.

![app2-tg.png](/static/images/6-network-security/2-vpc-lattice-service-access/app2-tg.png)

Also Note that by default no Access policies are configured at the VPC Lattice Service level. 

![app2-access.png](/static/images/6-network-security/2-vpc-lattice-service-access/app2-access.png)

## Test Connectivity from `app1` to `app2` 

### Get the DNS Names for the `app1` and `app2` services

1. List the `HTTPRoute` objects.

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT get httproute -A
```

::::expand{header="Check Output"}
```bash
NAMESPACE   NAME   HOSTNAMES   AGE
app1        app1               146m
app2        app2               107m
```
::::

2. List the route’s yaml file to see the DNS address (highlighted here on the message line): 

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT get httproute app1 -n app1 -o yaml
```

::::expand{header="Check Output"}
```yaml
kind: HTTPRoute
metadata:
  annotations:
    application-networking.k8s.aws/lattice-assigned-domain-name: app1-app1-0df47cf7f9031f04e.7d67968.vpc-lattice-svcs.us-west-2.on.aws
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"gateway.networking.k8s.io/v1beta1","kind":"HTTPRoute","metadata":{"annotations":{},"name":"app1","namespace":"app1"},"spec":{"parentRefs":[{"kind":"Gateway","name":"app-services-gw","namespace":"app-services-gw","sectionName":"http-listener"}],"rules":[{"backendRefs":[{"kind":"Service","name":"app1-v1","port":80}],"matches":[{"path":{"type":"PathPrefix","value":"/"}}]}]}}
  creationTimestamp: "2023-10-25T11:46:08Z"
  finalizers:
  - httproute.k8s.aws/resources
  generation: 1
  name: app1
  namespace: app1
  resourceVersion: "74464"
  uid: a690169d-79dd-4a55-91e3-497108e325d5
spec:
  parentRefs:
  - group: gateway.networking.k8s.io
    kind: Gateway
    name: app-services-gw
    namespace: app-services-gw
    sectionName: http-listener
  rules:
  - backendRefs:
    - group: ""
      kind: Service
      name: app1-v1
      port: 80
      weight: 1
    matches:
    - path:
        type: PathPrefix
        value: /
status:
  parents:
  - conditions:
    - lastTransitionTime: "2023-10-25T11:47:13Z"
      message: 'DNS Name: app1-app1-0df47cf7f9031f04e.7d67968.vpc-lattice-svcs.us-west-2.on.aws'
      observedGeneration: 1
      reason: Accepted
      status: "True"
      type: Accepted
    - lastTransitionTime: "2023-10-25T11:47:13Z"
      message: 'DNS Name: app1-app1-0df47cf7f9031f04e.7d67968.vpc-lattice-svcs.us-west-2.on.aws'
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

The `status` field in the above output contains the DNS Name of the Service `message: DNS Name: app1-app1-0df47cf7f9031f04e.7d67968.vpc-lattice-svcs.us-west-2.on.aws`

3. Store assigned DNS names to variables.

```bash
app1DNS=$(kubectl --context $EKS_CLUSTER1_CONTEXT get httproute app1 -n app1 -o json | jq -r '.status.parents[].conditions[0].message')
echo "app1DNS=$app1DNS"
app2DNS=$(kubectl --context $EKS_CLUSTER1_CONTEXT get httproute app2 -n app2 -o json | jq -r '.status.parents[].conditions[0].message')
echo "app2DNS=$app2DNS"
```

::::expand{header="Check Output"}
```bash
app1DNS=DNS Name: app1-app1-0df47cf7f9031f04e.7d67968.vpc-lattice-svcs.us-west-2.on.aws
app2DNS=DNS Name: app2-app2-0e5f3d2b3db4c7962.7d67968.vpc-lattice-svcs.us-west-2.on.aws
```
::::

4. Remove preceding extra text.

```bash
prefix="DNS Name: "
app1FQDN=${app1DNS#$prefix}
echo "app1FQDN=$app1FQDN"
app2FQDN=${app2DNS#$prefix}
echo "app2FQDN=$app2FQDN"
```

::::expand{header="Check Output"}
```bash
app1FQDN=app1-app1-0df47cf7f9031f04e.7d67968.vpc-lattice-svcs.us-west-2.on.aws
app2FQDN=app2-app2-0e5f3d2b3db4c7962.7d67968.vpc-lattice-svcs.us-west-2.on.aws
```
::::

### Get the DNS Name for the `app2` service 


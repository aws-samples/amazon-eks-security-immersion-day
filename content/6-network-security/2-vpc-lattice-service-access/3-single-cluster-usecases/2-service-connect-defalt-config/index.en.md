---
title : "Usecase 1: Service Connectivity with HTTP in Default Configuration"
weight : 11
---

In this section, let us deploy two simple services `app1` and `app2` and test connectivity between them in the default VPC Lattice Configuration.

![](/static/images/6-network-security/2-vpc-lattice-service-access/lattice-usecase1.png)

- we create app1 and app2 deployments and services
- We create HTTPRoutes for app1/app2 using template `templates/route-template-http-default-domain.yaml` which uses default VPC lattice configuration for app1 and app2 (in HTTP without authentication)
- We will validate connectivity between app1 and app2 through VPC lattice

## Deploy and register Service `app1` to Service Network `app-services-gw`

### Deploy K8s manifests for Service `app1` in First EKS Cluster

```bash
export APPNAME=app1
export VERSION=v1
envsubst < templates/app-template.yaml > manifests/$APPNAME-$VERSION-deploy.yaml
c9 manifests/$APPNAME-$VERSION-deploy.yaml
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
envsubst < templates/route-template-http-default-domain.yaml > manifests/$APPNAME-http-default-domain.yaml
c9 manifests/$APPNAME-http-default-domain.yaml
kubectl --context $EKS_CLUSTER1_CONTEXT apply -f manifests/$APPNAME-http-default-domain.yaml
```

::::expand{header="Check Output"}
```bash
httproute.gateway.networking.k8s.io/app1 created
```
::::

Check the created `HttpRoute`:

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
envsubst < templates/route-template-http-default-domain.yaml > manifests/$APPNAME-http-default-domain.yaml
kubectl --context $EKS_CLUSTER1_CONTEXT apply -f manifests/$APPNAME-http-default-domain.yaml
```

::::expand{header="Check Output"}
```bash
httproute.gateway.networking.k8s.io/app2 created
```
::::

Check the HttpRoute is createed :

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT  wait --for=jsonpath='{.status.parents[-1:].conditions[-1:].reason}'=ResolvedRefs httproute/$APPNAME -n $APPNAME
```

::::expand{header="Check Output"}
```bash
httproute.gateway.networking.k8s.io/app2 condition met
```
::::

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


## Get the DNS Names for the `app1` and `app2` services

1. List the `HTTPRoute` objects.

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT get httproute -A
```

::::expand{header="Check Output"}
```bash
NAMESPACE   NAME   HOSTNAMES   AGE
app1        app1               13m
app2        app2               2m44s
```
::::

2. List the route’s yaml file to see the DNS address : It appears in the annotations and in the status 

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT get httproute app1 -n app1 -o yaml
```

::::expand{header="Check Output"}
:::code{language=yml showCopyAction=false showLineNumbers=false highlightLines='4'}
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
:::
::::

The `status` field in the above output contains the DNS Name of the Service `message: DNS Name: app1-app1-0df47cf7f9031f04e.7d67968.vpc-lattice-svcs.us-west-2.on.aws`

3. Store assigned DNS names to variables.

```bash
app1DNS=$(kubectl --context $EKS_CLUSTER1_CONTEXT get httproute app1 -n app1 -o json | jq -r '.metadata.annotations."application-networking.k8s.aws/lattice-assigned-domain-name"')
echo "app1DNS=$app1DNS"
app2DNS=$(kubectl --context $EKS_CLUSTER1_CONTEXT get httproute app2 -n app2 -o json | jq -r '.metadata.annotations."application-networking.k8s.aws/lattice-assigned-domain-name"')
echo "app2DNS=$app2DNS"
```

::::expand{header="Check Output" defaultExpanded=true}
```bash
app1DNS=app1-app1-0df47cf7f9031f04e.7d67968.vpc-lattice-svcs.us-west-2.on.aws
app2DNS=app2-app2-0e5f3d2b3db4c7962.7d67968.vpc-lattice-svcs.us-west-2.on.aws
```

::alert[If you have a null in response, wait a little for the HTTPRoute to be properly created and replay the last command.]{header="Note"}


::::

## Test Service Connectivity from `app1` to `app2` 

::alert[Authentication and authorization is turned off both at the Service network and service level. Access to all traffic from VPCs associated to the service network is allowed.]{header="Note"}

We can now validate that the connectivity is working between our pods:

Run the `nslookup` command in the `app1-v1` Pod to resolve the **app2DNS**

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/app1-v1 -c app1-v1 -n app1 -- nslookup $app2DNS
```

::::expand{header="Check Output"}
:::code{language=json showCopyAction=false showLineNumbers=false highlightLines='2'}
Server:         172.20.0.10
Address:        172.20.0.10#53

Non-authoritative answer:
Name:   app2-app2-0e5f3d2b3db4c7962.7d67968.vpc-lattice-svcs.us-west-2.on.aws
Address: 169.254.171.33
Name:   app2-app2-0e5f3d2b3db4c7962.7d67968.vpc-lattice-svcs.us-west-2.on.aws
Address: fd00:ec2:80::a9fe:ab21
```
::::

> Notice that the IP `169.254.171.33` for **app2DNS** is from `MANAGED_PREFIX=169.254.171.0/24` we saw in the earlier section.


Exec into app1 pod to check connectivity to `app2` service. Since there are no IAM access policies are configured for either Service network or Service, access to `app2` is allowed from any client from the VPCs associated to the Service network.
We can also see that the reverse is true, if we try to connect from app2 to app1:

```bash
kubectl exec -ti -n app1 deployments/app1-v1 -- curl $app2DNS && \
kubectl exec -ti -n app2 deployments/app2-v1 -- curl $app1DNS
```

::::expand{header="Check Output" defaultExpanded=true}
```
Requsting to Pod(app2-v1-56f7c48bbf-nl6gg): Hello from app2-v1
Requsting to Pod(app1-v1-7ccbcc48b6-jv499): Hello from app1-v1
```
::::


::alert[We successfully connect from app1 to app2 and from app2 to app1 going through VPC lattice. As this simple use case does not brings lot of value, let's see how we can improve our usage of VPC lattice in next modules]{header="Congratulations."} 

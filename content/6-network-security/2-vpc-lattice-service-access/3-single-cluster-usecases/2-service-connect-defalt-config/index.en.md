---
title : "Usecase 1: Service Connectivity in Default Configuration"
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


## Get the DNS Names for the `app1` and `app2` services

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
echo "export app1FQDN=$app1FQDN" >> ~/.bash_profile
app2FQDN=${app2DNS#$prefix}
echo "app2FQDN=$app2FQDN"
echo "export app2FQDN=$app2FQDN" >> ~/.bash_profile
```

::::expand{header="Check Output"}
```bash
app1FQDN=app1-app1-0df47cf7f9031f04e.7d67968.vpc-lattice-svcs.us-west-2.on.aws
app2FQDN=app2-app2-0e5f3d2b3db4c7962.7d67968.vpc-lattice-svcs.us-west-2.on.aws
```
::::

## Test Service Connectivity from `app1` to `app2` 

Amazon VPC Lattice integrates with AWS IAM to provide same authentication and authorization capabilities that you are familiar with when interacting with AWS services today, but for our own service-to-service communication.

To configure Service access controls, you can use access policies. An access policy is an AWS IAM resource policy that can be associated with a Service network and individual Services. With access policies, you can use the PARC (principal, action, resource, and condition) model to enforce context-specific access controls for Services.

Let us first what access policies are configured for our Amazon VPC Service Network `app-services-gw` and Service `app2-app2`

1. Check Access Auth policies for Amazon VPC Service network and Service.

:::::tabs{variant="container"}

::::tab{id="cli" label="Using AWS CLI"}

Run below commands to get the Access Auth policies for Service network `app-services-gw`

```bash
export GATEWAY_NAME=app-services-gw
export GATEWAY_NAMESPACE=app-services-gw
gatewayARNMessage=$(kubectl --context $EKS_CLUSTER1_CONTEXT get gateway $GATEWAY_NAME -n $GATEWAY_NAMESPACE -o json | jq -r '.status.conditions[1].message')
echo "gatewayARNMessage=$gatewayARNMessage"

prefix="aws-gateway-arn: "
gatewayARN=${gatewayARNMessage#$prefix}
echo  "gatewayARN=$gatewayARN"

ServicenetworkAccessPolicy=$(aws vpc-lattice get-auth-policy --resource-identifier $gatewayARN)
echo "ServicenetworkAccessPolicy=$ServicenetworkAccessPolicy"
```

The output will look like below, indicating that ServicenetworkAccessPolicy is empty.

```bash
gatewayARNMessage=aws-gateway-arn: arn:aws:vpc-lattice:us-west-2:897086008680:servicenetwork/sn-0cc73287505ac121a
gatewayARN=arn:aws:vpc-lattice:us-west-2:897086008680:servicenetwork/sn-0cc73287505ac121a
ServicenetworkAccessPolicy=
```

Run below commands to get the Access Auth policies for Service  `app2-app2`

```bash
split1=$(echo "$app2FQDN" | awk -F'.' '{ print $1 }')
#echo "$split1"
split2=$(echo "$split1" | awk -F'-' '{ print $3 }')
#echo "$split2"
export APP2_SERVICE_ID="svc-${split2}"
echo "APP2_SERVICE_ID=$APP2_SERVICE_ID"
echo "export APP2_SERVICE_ID=$APP2_SERVICE_ID" >> ~/.bash_profile
ServiceAccessPolicy=$(aws vpc-lattice get-auth-policy --resource-identifier $APP2_SERVICE_ID)
echo "ServiceAccessPolicy=$ServiceAccessPolicy"
```

The output will look like below, indicating that ServicenetworkAccessPolicy is empty.

```bash
RATES_SERVICE_ID=svc-0b1f56d26672bf677
ServiceAccessPolicy=
```

::::


::::tab{id="console" label="Using AWS Console"}


View the Auth policy for VPC Lattice Service network `app-services-gw` under **Access** tab in the [Amazon VPC Console](https://us-west-2.console.aws.amazon.com/vpc/home?ServiceNetwork=&region=us-west-2#ServiceNetworks:)

![servicenetworkaccess1.png](/static/images/6-network-security/2-vpc-lattice-service-access/servicenetworkaccess1.png)


View the Auth policy VPC Lattice Service `app2-app2` under **Access** tab in the [Amazon VPC Console](https://us-west-2.console.aws.amazon.com/vpc/home?region=us-west-2#Services:)

![app2-access.png](/static/images/6-network-security/2-vpc-lattice-service-access/app2-access.png)

::::

:::::

::alert[Authentication and authorization is turned off both at the Service network and service level. Access to all traffic from VPCs associated to the service network is allowed.]{header="Note"}


2. Check Service app1 Pod access for Service app2 by executing into the pod, then curling each service. 

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT get pod -n app1
```

::::expand{header="Check Output"}
```bash
NAME                       READY   STATUS    RESTARTS   AGE
app1-v1-5cc757c998-jl7pb   1/1     Running   0          6h18m
```
::::

3. Run `yum install bind-utils tar` in the inventory pod for the `nslookup` and `tar` binary.

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/app1-v1 -n app1 -- yum install tar bind-utils -y
```

::::expand{header="Check Output"}
```bash
Loaded plugins: ovl, priorities
amzn2-core                                                    | 3.6 kB  00:00:00     
(1/3): amzn2-core/2/x86_64/group_gz                           | 2.7 kB  00:00:00     
(2/3): amzn2-core/2/x86_64/updateinfo                         | 729 kB  00:00:00     
(3/3): amzn2-core/2/x86_64/primary_db                         |  67 MB  00:00:00     
Resolving Dependencies
--> Running transaction check
---> Package bind-utils.x86_64 32:9.11.4-26.P2.amzn2.13.5 will be installed
--> Processing Dependency: bind-libs(x86-64) = 32:9.11.4-26.P2.amzn2.13.5 for package  32:bind-utils-9.11.4-26.P2.amzn2.13.5.x86_64
--> Processing Dependency: bind-libs-lite(x86-64) = 32:9.11.4-26.P2.amzn2.13.5 for package: 32:bind-utils-9.11.4-26.P2.amzn2.13.5.x86_64
--> Processing Dependency: libGeoIP.so.1()(64bit) for package: 32:bind-utils-9.11.4-26.P2.amzn2.13.5.x86_64
--> Processing Dependency: libbind9.so.160()(64bit) for package: 32:bind-utils-9.11.4-26.P2.amzn2.13.5.x86_64
--> Processing Dependency: libdns.so.1102()(64bit) for package: 32:bind-utils-9.11.4-26.P2.amzn2.13.5.x86_64
--> Processing Dependency: libirs.so.160()(64bit) for package: 32:bind-utils-9.11.4-26.P2.amzn2.13.5.x86_64
--> Processing Dependency: libisc.so.169()(64bit) for package: 32:bind-utils-9.11.4-26.P2.amzn2.13.5.x86_64
--> Processing Dependency: libisccfg.so.160()(64bit) for package: 32:bind-utils-9.11.4-26.P2.amzn2.13.5.x86_64
--> Processing Dependency: liblwres.so.160()(64bit) for package: 32:bind-utils-9.11.4-26.P2.amzn2.13.5.x86_64
---> Package tar.x86_64 2:1.26-35.amzn2.0.2 will be installed
--> Running transaction check
---> Package GeoIP.x86_64 0:1.5.0-11.amzn2.0.2 will be installed
---> Package bind-libs.x86_64 32:9.11.4-26.P2.amzn2.13.5 will be installed
--> Processing Dependency: bind-license = 32:9.11.4-26.P2.amzn2.13.5 for package: 32:bind-libs-9.11.4-26.P2.amzn2.13.5.x86_64
---> Package bind-libs-lite.x86_64 32:9.11.4-26.P2.amzn2.13.5 will be installed
--> Running transaction check
---> Package bind-license.noarch 32:9.11.4-26.P2.amzn2.13.5 will be installed
--> Finished Dependency Resolution

Dependencies Resolved

=====================================================================================
 Package            Arch       Version                          Repository      Size
=====================================================================================
Installing:
 bind-utils         x86_64     32:9.11.4-26.P2.amzn2.13.5       amzn2-core     261 k
 tar                x86_64     2:1.26-35.amzn2.0.2              amzn2-core     845 k
Installing for dependencies:
 GeoIP              x86_64     1.5.0-11.amzn2.0.2               amzn2-core     1.1 M
 bind-libs          x86_64     32:9.11.4-26.P2.amzn2.13.5       amzn2-core     159 k
 bind-libs-lite     x86_64     32:9.11.4-26.P2.amzn2.13.5       amzn2-core     1.1 M
 bind-license       noarch     32:9.11.4-26.P2.amzn2.13.5       amzn2-core      92 k

Transaction Summary
=====================================================================================
Install  2 Packages (+4 Dependent packages)

Total download size: 3.5 M
Installed size: 9.1 M
Downloading packages:
(1/6): bind-libs-9.11.4-26.P2.amzn2.13.5.x86_64.rpm           | 159 kB  00:00:00     
(2/6): GeoIP-1.5.0-11.amzn2.0.2.x86_64.rpm                    | 1.1 MB  00:00:00     
(3/6): bind-libs-lite-9.11.4-26.P2.amzn2.13.5.x86_64.rpm      | 1.1 MB  00:00:00     
(4/6): bind-license-9.11.4-26.P2.amzn2.13.5.noarch.rpm        |  92 kB  00:00:00     
(5/6): bind-utils-9.11.4-26.P2.amzn2.13.5.x86_64.rpm          | 261 kB  00:00:00     
(6/6): tar-1.26-35.amzn2.0.2.x86_64.rpm                       | 845 kB  00:00:00     
-------------------------------------------------------------------------------------
Total                                                    17 MB/s | 3.5 MB  00:00     
Running transaction check
Running transaction test
Transaction test succeeded
Running transaction
  Installing : GeoIP-1.5.0-11.amzn2.0.2.x86_64                                   1/6 
  Installing : 32:bind-license-9.11.4-26.P2.amzn2.13.5.noarch                    2/6 
  Installing : 32:bind-libs-lite-9.11.4-26.P2.amzn2.13.5.x86_64                  3/6 
  Installing : 32:bind-libs-9.11.4-26.P2.amzn2.13.5.x86_64                       4/6 
  Installing : 32:bind-utils-9.11.4-26.P2.amzn2.13.5.x86_64                      5/6 
  Installing : 2:tar-1.26-35.amzn2.0.2.x86_64                                    6/6 
  Verifying  : 2:tar-1.26-35.amzn2.0.2.x86_64                                    1/6 
  Verifying  : 32:bind-libs-9.11.4-26.P2.amzn2.13.5.x86_64                       2/6 
  Verifying  : 32:bind-libs-lite-9.11.4-26.P2.amzn2.13.5.x86_64                  3/6 
  Verifying  : 32:bind-utils-9.11.4-26.P2.amzn2.13.5.x86_64                      4/6 
  Verifying  : GeoIP-1.5.0-11.amzn2.0.2.x86_64                                   5/6 
  Verifying  : 32:bind-license-9.11.4-26.P2.amzn2.13.5.noarch                    6/6 

Installed:
  bind-utils.x86_64 32:9.11.4-26.P2.amzn2.13.5     tar.x86_64 2:1.26-35.amzn2.0.2    

Dependency Installed:
  GeoIP.x86_64 0:1.5.0-11.amzn2.0.2                                                  
  bind-libs.x86_64 32:9.11.4-26.P2.amzn2.13.5                                        
  bind-libs-lite.x86_64 32:9.11.4-26.P2.amzn2.13.5                                   
  bind-license.noarch 32:9.11.4-26.P2.amzn2.13.5                                     

Complete!
```
::::

Run the `nslookup` command in the Inventory Pod to resolve the **app2FQDN**

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/app1-v1 -n app1 -- nslookup $app2FQDN
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

Notice that the IP `169.254.171.33` for **app2FQDN** is from `MANAGED_PREFIX=169.254.171.0/24` we saw in the earlier section.


4. Exec into an app1 pod to check connectivity to `app2` service. Since there are no IAM access policies are configured for either Service network or Service, access to `app2` is allowed from any client from the VPCs associated to the Service network.

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/app1-v1 -n app1 -- curl $app2FQDN
```

::::expand{header="Check Output"}
```bash
Requsting to Pod(app2-v1-c6978fdbc-fnkw8): Hello from app2-v1
```
::::

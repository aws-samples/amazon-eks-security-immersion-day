---
title : "Template"
weight : 24
---


::::expand{header="Check Output"}
```bash

```
::::

::::expand{header="Check Output"}
```bash

```
::::


::::expand{header="Check Output"}
```bash

```
::::



```bash
# Create a new Gateway Class for AWS VPC lattice provider
export GATEWAY_NAME=my-hotel
export GATEWAY_NAMESPACE=default
cat > $GATEWAY_NAME-gw.yaml <<EOF
apiVersion: gateway.networking.k8s.io/v1beta1
kind: Gateway
metadata:
  name: $GATEWAY_NAME
  namespace: $GATEWAY_NAMESPACE
  annotations:
    application-networking.k8s.aws/lattice-vpc-association: "true"
spec:
  gatewayClassName: amazon-vpc-lattice
  listeners:
  - name: http-listener
    port: 80
    protocol: HTTP
    allowedRoutes:
      kinds:
      - kind: HTTPRoute
      namespaces:
        #from: Same
        #from: All
        from: Selector
        selector:
          matchLabels:
            allow-attachment-to-infra-gw: "true"
  - name: https-listener
    port: 443
    protocol: HTTPS
    allowedRoutes:
      kinds:
      - kind: HTTPRoute
      namespaces:
        #from: Same
        #from: All
        from: Selector
        selector:
          matchLabels:
            allow-attachment-to-infra-gw: "true"
  - name: https-listener-with-custom-domain
    port: 443
    protocol: HTTPS
    allowedRoutes:
      kinds:
      - kind: HTTPRoute
      namespaces:
        #from: Same
        #from: All
        from: Selector
        selector:
          matchLabels:
            allow-attachment-to-infra-gw: "true"    
    tls:
      mode: Terminate
      options:
        application-networking.k8s.aws/certificate-arn: $CERTIFICATE_ARN                  
EOF
kubectl apply -f $GATEWAY_NAME-gw.yaml
```

::::expand{header="Check Output"}
```bash
gateway.gateway.networking.k8s.io/project1-svc-network created
```
::::



```bash
cat > app-template.yaml <<EOF
apiVersion: v1
kind: Namespace
metadata:
  name: \$APPNAME
  labels:
    allow-attachment-to-infra-gw: "true"  
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: \$APPNAME-\$VERSION
  namespace: \$APPNAME
  labels:
    app: \$APPNAME-\$VERSION
spec:
  replicas: 1
  selector:
    matchLabels:
      app: \$APPNAME-\$VERSION
  template:
    metadata:
      labels:
        app: \$APPNAME-\$VERSION
    spec:
      containers:
      - name: \$APPNAME-\$VERSION
        image: public.ecr.aws/x2j8p8w7/http-server:latest
        env:
        - name: PodName
          value: "Hello from \$APPNAME-\$VERSION"


---
apiVersion: v1
kind: Service
metadata:
  name: \$APPNAME-\$VERSION
  namespace: \$APPNAME
spec:
  selector:
    app: \$APPNAME-\$VERSION
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8090
EOF
```
### Create Template for Simple Routing

```bash
cat > route-template-simple-no-tls-custom-domain.yaml <<EOF
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  name: \$APPNAME
  namespace: \$APPNAME
spec:
  hostnames:
  - \$APPNAME.\$CUSTOM_DOMAIN_NAME
  parentRefs:
  - kind: Gateway
    name: \$GATEWAY_NAME
    namespace: \$GATEWAY_NAMESPACE  
    sectionName: http-listener
  rules:
  - backendRefs:
    - name: \$APPNAME-\$VERSION1
      kind: Service
      port: 80
    matches:
      - path:
          type: PathPrefix
          value: /      
EOF
```

### Create Template for Weighted Routing

```bash
cat > route-template-weighted-no-tls-custom-domain.yaml  <<EOF
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  name: \$APPNAME
  namespace: \$APPNAME
spec:
  hostnames:
  - \$APPNAME.\$CUSTOM_DOMAIN_NAME
  parentRefs:
  - kind: Gateway
    name: \$GATEWAY_NAME
    namespace: \$GATEWAY_NAMESPACE  
    sectionName: http-listener
  rules:
  - backendRefs:
    - name: \$APPNAME-\$VERSION1
      kind: Service
      port: 80
      weight: 100
    matches:
      - path:
          type: PathPrefix
          value: /
  - backendRefs:
    - name: \$APPNAME-\$VERSION1
      kind: Service
      port: 80
      weight: 50
    - name: \$APPNAME-\$VERSION2
      kind: Service
      port: 80
      weight: 50 
    matches:
      - path:
          type: PathPrefix
          value: /v2
EOF
```

### Create Template for Simple Routing with TLS

```bash
cat > route-template-simple-tls-default-domain.yaml  <<EOF
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  name: \$APPNAME
  namespace: \$APPNAME
spec:
  parentRefs:
  - kind: Gateway
    name: \$GATEWAY_NAME
    namespace: \$GATEWAY_NAMESPACE  
    sectionName: http-listener
  - kind: Gateway
    name: \$GATEWAY_NAME
    namespace: \$GATEWAY_NAMESPACE  
    sectionName: https-listener    
  rules:
  - backendRefs:
    - name: \$APPNAME-\$VERSION1
      kind: Service
      port: 80
    matches:
      - path:
          type: PathPrefix
          value: /      
EOF
```

### Create Template for Simple Routing with TLS with Custom Domain

```bash
cat > route-template-simple-tls-custom-domain.yaml  <<EOF
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  name: \$APPNAME
  namespace: \$APPNAME
spec:
  hostnames:
  - \$APPNAME.\$CUSTOM_DOMAIN_NAME
  parentRefs:
  - kind: Gateway
    name: \$GATEWAY_NAME
    namespace: \$GATEWAY_NAMESPACE  
    sectionName: http-listener
  - kind: Gateway
    name: \$GATEWAY_NAME
    namespace: \$GATEWAY_NAMESPACE  
    sectionName: https-listener-with-custom-domain   
  rules:
  - backendRefs:
    - name: \$APPNAME-\$VERSION1
      kind: Service
      port: 80
    matches:
      - path:
          type: PathPrefix
          value: /      
EOF
```



### Deploy app1 Version v1

```bash
export APPNAME=app1
export VERSION=v1
envsubst < app-template.yaml > $APPNAME-$VERSION-deploy.yaml
kubectl apply -f $APPNAME-$VERSION-deploy.yaml
```

::::expand{header="Check Output"}
```bash
namespace/app1 created
deployment.apps/app1-v1 created
service/app1-v1 created
```
::::


```bash
kubectl -n $APPNAME get all
```

::::expand{header="Check Output"}
```bash
NAME                           READY   STATUS    RESTARTS   AGE
pod/app1-v1-79bbb5bb49-vffsr   1/1     Running   0          25s

NAME              TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)   AGE
service/app1-v1   ClusterIP   10.100.89.4   <none>        80/TCP    25s

NAME                      READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/app1-v1   1/1     1            1           25s

NAME                                 DESIRED   CURRENT   READY   AGE
replicaset.apps/app1-v1-79bbb5bb49   1         1         1       25s
```
::::

### Deploy Simple Route for app1 

```bash
export GATEWAY_NAME=my-hotel
export GATEWAY_NAMESPACE=default
export APPNAME=app1
export VERSION=v1
export CUSTOM_DOMAIN_NAME="vpc-lattice-custom-domain.io"
envsubst < simple-route-template.yaml > $APPNAME-simple-route.yaml
kubectl apply -f $APPNAME-simple-route.yaml
```

::::expand{header="Check Output"}
```bash
httproute.gateway.networking.k8s.io/app1 created
```
::::

### Deploy app2 Version v1

```bash
export APPNAME=app2
export VERSION=v1
envsubst < app-template.yaml > $APPNAME-$VERSION-deploy.yaml
kubectl apply -f $APPNAME-$VERSION-deploy.yaml
```

::::expand{header="Check Output"}
```bash
namespace/app2 configured
deployment.apps/app2-v1 unchanged
service/app2-v1 unchanged
```
::::

```bash
kubectl -n $APPNAME get all
```

::::expand{header="Check Output"}
```bash
NAME                           READY   STATUS    RESTARTS   AGE
pod/app2-v1-55c4d97b8d-k2qwm   1/1     Running   0          31h

NAME              TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
service/app2-v1   ClusterIP   10.100.63.233   <none>        80/TCP    31h

NAME                      READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/app2-v1   1/1     1            1           31h

NAME                                 DESIRED   CURRENT   READY   AGE
replicaset.apps/app2-v1-55c4d97b8d   1         1         1       31h
```
::::

### Deploy app2 Version v2

```bash
export APPNAME=app2
export VERSION=v2
envsubst < app-template.yaml > $APPNAME-$VERSION-deploy.yaml
kubectl apply -f $APPNAME-$VERSION-deploy.yaml
```

::::expand{header="Check Output"}
```bash
namespace/app2 unchanged
deployment.apps/app2-v2 created
service/app2-v2 created
```
::::

```bash
kubectl -n $APPNAME get all
```

::::expand{header="Check Output"}
```bash
NAME                           READY   STATUS    RESTARTS   AGE
pod/app2-v1-55c4d97b8d-k2qwm   1/1     Running   0          31h
pod/app2-v2-756ff8db7-k9l7x    1/1     Running   0          21s

NAME              TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)   AGE
service/app2-v1   ClusterIP   10.100.63.233    <none>        80/TCP    31h
service/app2-v2   ClusterIP   10.100.199.171   <none>        80/TCP    22s

NAME                      READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/app2-v1   1/1     1            1           31h
deployment.apps/app2-v2   1/1     1            1           22s

NAME                                 DESIRED   CURRENT   READY   AGE
replicaset.apps/app2-v1-55c4d97b8d   1         1         1       31h
replicaset.apps/app2-v2-756ff8db7    1         1         1       22s
```
::::

### Deploy Weighted Route for app2

```bash
export GATEWAY_NAME=my-hotel
export GATEWAY_NAMESPACE=default
export APPNAME=app2
export VERSION1=v1
export VERSION2=v2
export CUSTOM_DOMAIN_NAME="vpc-lattice-custom-domain.io"
envsubst < weighted-route-template.yaml > $APPNAME-weighted-route.yaml
kubectl apply -f $APPNAME-weighted-route.yaml
```

::::expand{header="Check Output"}
```bash
httproute.gateway.networking.k8s.io/app2 created
```
::::


![app2-route.png](/static/images/6-network-security/2-vpc-lattice-service-access/app2-route.png)


## Create Private Hosted Zone

```bash
#export EKS_CLUSTER_NAME=eksworkshop-eksctl
export EKS_CLUSTER_NAME=eks-ref-cluster1
EKS_VPC_ID=$(eksctl get cluster $EKS_CLUSTER_NAME -ojson | jq -r '.[0]["ResourcesVpcConfig"]["VpcId"]')
echo $EKS_VPC_ID

export CUSTOM_DOMAIN_NAME="vpc-lattice-custom-domain.io"
export HOSTED_ZONE_ID=$(aws route53 create-hosted-zone --name $CUSTOM_DOMAIN_NAME \
  --caller-reference $(date "+%Y%m%d%H%M%S") \
  --hosted-zone-config PrivateZone=true \
  --vpc VPCRegion=$AWS_REGION,VPCId=$EKS_VPC_ID |\
  jq -r ".HostedZone.Id")
echo "HOSTED_ZONE_ID=$HOSTED_ZONE_ID"

```

::::expand{header="Check Output"}
```bash
HOSTED_ZONE_ID=/hostedzone/Z01544712PGYXI768N5K0
```
::::


![hostedzone.png](/static/images/6-network-security/2-vpc-lattice-service-access/hostedzone.png)

## Create CNAME record for `app1.vpc-lattice-custom-domain.io`

```bash
export APPNAME=app1
appDNS=$(kubectl -n $APPNAME get httproute $APPNAME -o json | jq -r '.status.parents[].conditions[0].message')
prefix="DNS Name: "
appFQDN=${appDNS#$prefix}
echo "appFQDN=$appFQDN"
```

::::expand{header="Check Output"}
```bash
appFQDN=app1-app1-0755b2a9d1c52a37d.7d67968.vpc-lattice-svcs.us-east-1.on.aws
```
::::


```bash
export APPNAME=app1
export CUSTOM_DOMAIN_NAME="vpc-lattice-custom-domain.io"
cat <<-EOF > create_r53_record.json
{
  "Comment": "CREATE CNAME for $APPNAME.$CUSTOM_DOMAIN_NAME",
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "$APPNAME.$CUSTOM_DOMAIN_NAME",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [
          { 
            "Value": "$appFQDN" 
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
  --change-batch file://create_r53_record.json
```


::::expand{header="Check Output"}
```json
{
    "ChangeInfo": {
        "Id": "/change/C08142403OEW0YULDQ6A5",
        "Status": "PENDING",
        "SubmittedAt": "2023-10-23T17:12:23.097000+00:00",
        "Comment": "CREATE CNAME for app2.vpc-lattice-custom-domain.io"
    }
}
```
::::

![app1_cname.png](/static/images/6-network-security/2-vpc-lattice-service-access/app1_cname.png)


## Create CNAME record for `app2.vpc-lattice-custom-domain.io`

```bash
export APPNAME=app2
appDNS=$(kubectl -n $APPNAME get httproute $APPNAME -o json | jq -r '.status.parents[].conditions[0].message')
prefix="DNS Name: "
appFQDN=${appDNS#$prefix}
echo "appFQDN=$appFQDN"
```

::::expand{header="Check Output"}
```bash
appFQDN=app2-app2-086b708f96f05f156.7d67968.vpc-lattice-svcs.us-east-1.on.aws
```
::::


```bash
export APPNAME=app2
export CUSTOM_DOMAIN_NAME="vpc-lattice-custom-domain.io"
export HOSTED_ZONE_ID=$(aws route53 list-hosted-zones-by-name \
    --dns-name $CUSTOM_DOMAIN_NAME \
    --max-items 1 | \
  jq -r ' .HostedZones | first | .Id');
echo "HOSTED_ZONE_ID=$HOSTED_ZONE_ID"

cat <<-EOF > create_r53_record.json
{
  "Comment": "CREATE CNAME for $APPNAME.$CUSTOM_DOMAIN_NAME",
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "$APPNAME.$CUSTOM_DOMAIN_NAME",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [
          { 
            "Value": "$appFQDN" 
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
  --change-batch file://create_r53_record.json
```


::::expand{header="Check Output"}
```json
{
    "ChangeInfo": {
        "Id": "/change/C01906492QYPQ4P8I45PZ",
        "Status": "PENDING",
        "SubmittedAt": "2023-10-23T11:50:45.663000+00:00",
        "Comment": "CREATE CNAME for app1.vpc-lattice-custom-domain.io"
    }
}
```
::::

![cname-app2.png](/static/images/6-network-security/2-vpc-lattice-service-access/cname-app2.png)



### Test Access from app1 to app2


Run `yum install bind-utils` in the app1 pod for the `nslookup` binary.

```bash
export CLIENT=app1
export CLIENT_VERSION=v1
export SERVER=app2
kubectl -n $CLIENT exec -it deploy/$CLIENT-$CLIENT_VERSION -- yum install bind-utils -y
```

::::expand{header="Check Output"}
```bash
Loaded plugins: ovl, priorities
amzn2-core                                 | 3.6 kB     00:00     
(1/3): amzn2-core/2/x86_64/group_gz          | 2.7 kB   00:00     
(2/3): amzn2-core/2/x86_64/updateinfo        | 729 kB   00:00     
(3/3): amzn2-core/2/x86_64/primary_db        |  67 MB   00:00     
Resolving Dependencies
--> Running transaction check
---> Package bind-utils.x86_64 32:9.11.4-26.P2.amzn2.13.5 will be installed
--> Processing Dependency: bind-libs(x86-64) = 32:9.11.4-26.P2.amzn2.13.5 for package: 32:bind-utils-9.11.4-26.P2.amzn2.13.5.x86_64
--> Processing Dependency: bind-libs-lite(x86-64) = 32:9.11.4-26.P2.amzn2.13.5 for package: 32:bind-utils-9.11.4-26.P2.amzn2.13.5.x86_64
--> Processing Dependency: libGeoIP.so.1()(64bit) for package: 32:bind-utils-9.11.4-26.P2.amzn2.13.5.x86_64
--> Processing Dependency: libbind9.so.160()(64bit) for package: 32:bind-utils-9.11.4-26.P2.amzn2.13.5.x86_64
--> Processing Dependency: libdns.so.1102()(64bit) for package: 32:bind-utils-9.11.4-26.P2.amzn2.13.5.x86_64
--> Processing Dependency: libirs.so.160()(64bit) for package: 32:bind-utils-9.11.4-26.P2.amzn2.13.5.x86_64
--> Processing Dependency: libisc.so.169()(64bit) for package: 32:bind-utils-9.11.4-26.P2.amzn2.13.5.x86_64
--> Processing Dependency: libisccfg.so.160()(64bit) for package: 32:bind-utils-9.11.4-26.P2.amzn2.13.5.x86_64
--> Processing Dependency: liblwres.so.160()(64bit) for package: 32:bind-utils-9.11.4-26.P2.amzn2.13.5.x86_64
--> Running transaction check
---> Package GeoIP.x86_64 0:1.5.0-11.amzn2.0.2 will be installed
---> Package bind-libs.x86_64 32:9.11.4-26.P2.amzn2.13.5 will be installed
--> Processing Dependency: bind-license = 32:9.11.4-26.P2.amzn2.13.5 for package: 32:bind-libs-9.11.4-26.P2.amzn2.13.5.x86_64
---> Package bind-libs-lite.x86_64 32:9.11.4-26.P2.amzn2.13.5 will be installed
--> Running transaction check
---> Package bind-license.noarch 32:9.11.4-26.P2.amzn2.13.5 will be installed
--> Finished Dependency Resolution

Dependencies Resolved

==================================================================
 Package       Arch   Version                    Repository  Size
==================================================================
Installing:
 bind-utils    x86_64 32:9.11.4-26.P2.amzn2.13.5 amzn2-core 261 k
Installing for dependencies:
 GeoIP         x86_64 1.5.0-11.amzn2.0.2         amzn2-core 1.1 M
 bind-libs     x86_64 32:9.11.4-26.P2.amzn2.13.5 amzn2-core 159 k
 bind-libs-lite
               x86_64 32:9.11.4-26.P2.amzn2.13.5 amzn2-core 1.1 M
 bind-license  noarch 32:9.11.4-26.P2.amzn2.13.5 amzn2-core  92 k

Transaction Summary
==================================================================
Install  1 Package (+4 Dependent packages)

Total download size: 2.7 M
Installed size: 6.4 M
Downloading packages:
(1/5): bind-libs-9.11.4-26.P2.amzn2.13.5.x86 | 159 kB   00:00     
(2/5): GeoIP-1.5.0-11.amzn2.0.2.x86_64.rpm   | 1.1 MB   00:00     
(3/5): bind-license-9.11.4-26.P2.amzn2.13.5. |  92 kB   00:00     
(4/5): bind-libs-lite-9.11.4-26.P2.amzn2.13. | 1.1 MB   00:00     
(5/5): bind-utils-9.11.4-26.P2.amzn2.13.5.x8 | 261 kB   00:00     
------------------------------------------------------------------
Total                                 28 MB/s | 2.7 MB  00:00     
Running transaction check
Running transaction test
Transaction test succeeded
Running transaction
  Installing : GeoIP-1.5.0-11.amzn2.0.2.x86_64                1/5 
  Installing : 32:bind-license-9.11.4-26.P2.amzn2.13.5.noar   2/5 
  Installing : 32:bind-libs-lite-9.11.4-26.P2.amzn2.13.5.x8   3/5 
  Installing : 32:bind-libs-9.11.4-26.P2.amzn2.13.5.x86_64    4/5 
  Installing : 32:bind-utils-9.11.4-26.P2.amzn2.13.5.x86_64   5/5 
  Verifying  : 32:bind-libs-lite-9.11.4-26.P2.amzn2.13.5.x8   1/5 
  Verifying  : 32:bind-utils-9.11.4-26.P2.amzn2.13.5.x86_64   2/5 
  Verifying  : 32:bind-license-9.11.4-26.P2.amzn2.13.5.noar   3/5 
  Verifying  : 32:bind-libs-9.11.4-26.P2.amzn2.13.5.x86_64    4/5 
  Verifying  : GeoIP-1.5.0-11.amzn2.0.2.x86_64                5/5 

Installed:
  bind-utils.x86_64 32:9.11.4-26.P2.amzn2.13.5                    

Dependency Installed:
  GeoIP.x86_64 0:1.5.0-11.amzn2.0.2                               
  bind-libs.x86_64 32:9.11.4-26.P2.amzn2.13.5                     
  bind-libs-lite.x86_64 32:9.11.4-26.P2.amzn2.13.5                
  bind-license.noarch 32:9.11.4-26.P2.amzn2.13.5                  

Complete!
```
::::

Run the `nslookup` command in the app1 Pod to resolve the **app2.vpc-lattice-custom-domain.io**

```bash
kubectl -n app1 exec -it deploy/app1-v1 -- nslookup app2.vpc-lattice-custom-domain.io
```

::::expand{header="Check Output"}
```bash
NAME
Server:         10.100.0.10
Address:        10.100.0.10#53

Non-authoritative answer:
app2.vpc-lattice-custom-domain.io       canonical name = app2-app2-086b708f96f05f156.7d67968.vpc-lattice-svcs.us-east-1.on.aws.
Name:   app2-app2-086b708f96f05f156.7d67968.vpc-lattice-svcs.us-east-1.on.aws
Address: 169.254.171.96
Name:   app2-app2-086b708f96f05f156.7d67968.vpc-lattice-svcs.us-east-1.on.aws
Address: fd00:ec2:80::a9fe:ab60
```
::::

Notice that the IP `169.254.171.96` for **ratesFQDN** is from `MANAGED_PREFIX=169.254.171.0/24` we saw in the earlier section.


4. Exec into an `app1` pod to check connectivity to `app2` service.

```bash
kubectl -n app1 exec -it deploy/app1-v1 -- curl app2.vpc-lattice-custom-domain.io
Requsting to Pod(app2-v1-55c4d97b8d-k2qwm): Helloo from app2-v1


kubectl -n $CLIENT exec -it deploy/$CLIENT-$CLIENT_VERSION -- bash

for i in {1..10}; do 
   curl app2.vpc-lattice-custom-domain.io
done



```

::::expand{header="Check Output"}
```bash
Requsting to Pod(app2-v1-55c4d97b8d-k2qwm): Helloo from app2-v1

```
::::


### Deploy app3 Version v1

```bash
export APPNAME=app3
export VERSION=v1
envsubst < app-template.yaml > $APPNAME-$VERSION-deploy.yaml
kubectl apply -f $APPNAME-$VERSION-deploy.yaml
```

::::expand{header="Check Output"}
```bash
namespace/app3 created
deployment.apps/app3-v1 created
service/app3-v1 created
```
::::


```bash
kubectl -n $APPNAME get all
```

::::expand{header="Check Output"}
```bash
NAME                           READY   STATUS    RESTARTS   AGE
pod/app3-v1-57ff48f45f-2rpd5   1/1     Running   0          29s

NAME              TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)   AGE
service/app3-v1   ClusterIP   10.100.34.28   <none>        80/TCP    29s

NAME                      READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/app3-v1   1/1     1            1           29s

NAME                                 DESIRED   CURRENT   READY   AGE
replicaset.apps/app3-v1-57ff48f45f   1         1         1       29s
```
::::

### Deploy Simple TLS Route for app3

```bash
export GATEWAY_NAME=my-hotel
export GATEWAY_NAMESPACE=default
export APPNAME=app3
export VERSION1=v1
envsubst < simple-route-tls-template.yaml > $APPNAME-simple-route-tls.yaml
kubectl apply -f $APPNAME-simple-route-tls.yaml
```

::::expand{header="Check Output"}
```bash
httproute.gateway.networking.k8s.io/app3 created
```
::::


### Test Access from app1 to app3


Run the `nslookup` command in the app1 Pod to resolve the **app2.vpc-lattice-custom-domain.io**

```bash
export APPNAME=app3
appDNS=$(kubectl -n $APPNAME get httproute $APPNAME -o json | jq -r '.status.parents[].conditions[0].message')
prefix="DNS Name: "
appFQDN=${appDNS#$prefix}
echo "appFQDN=$appFQDN"
kubectl -n app1 exec -it deploy/app1-v1 -- nslookup $appFQDN
```

::::expand{header="Check Output"}
```bash
appFQDN=app3-app3-0cf326ed3bf61e4fa.7d67968.vpc-lattice-svcs.us-east-1.on.aws
NAME
Server:         10.100.0.10
Address:        10.100.0.10#53

Non-authoritative answer:
app2.vpc-lattice-custom-domain.io       canonical name = app2-app2-086b708f96f05f156.7d67968.vpc-lattice-svcs.us-east-1.on.aws.
Name:   app2-app2-086b708f96f05f156.7d67968.vpc-lattice-svcs.us-east-1.on.aws
Address: 169.254.171.96
Name:   app2-app2-086b708f96f05f156.7d67968.vpc-lattice-svcs.us-east-1.on.aws
Address: fd00:ec2:80::a9fe:ab60
```
::::

Notice that the IP `169.254.171.96` for **appFQDN** is from `MANAGED_PREFIX=169.254.171.0/24` we saw in the earlier section.


4. Exec into an `app1` pod to check connectivity to `app3` service.

```bash
kubectl -n app1 exec -it deploy/app1-v1 -- curl $appFQDN
Requsting to Pod(app3-v1-57ff48f45f-2rpd5): Helloo from app3-v1

kubectl -n app1 exec -it deploy/app1-v1 -- curl https://$appFQDN:443
Requsting to Pod(app3-v1-57ff48f45f-2rpd5): Helloo from app3-v1
```

::::expand{header="Check Output"}
```bash
Requsting to Pod(app2-v1-55c4d97b8d-k2qwm): Helloo from app2-v1

```
::::

### Deploy app4 Version v1

```bash
export APPNAME=app4
export VERSION=v1
envsubst < app-template.yaml > $APPNAME-$VERSION-deploy.yaml
kubectl apply -f $APPNAME-$VERSION-deploy.yaml
```

::::expand{header="Check Output"}
```bash
namespace/app4 created
deployment.apps/app4-v1 created
service/app4-v1 created
```
::::


```bash
kubectl -n $APPNAME get all
```

::::expand{header="Check Output"}
```bash
NAME                           READY   STATUS    RESTARTS   AGE
pod/app4-v1-7b49c75b74-swpbw   1/1     Running   0          17s

NAME              TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)   AGE
service/app4-v1   ClusterIP   10.100.247.222   <none>        80/TCP    17s

NAME                      READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/app4-v1   1/1     1            1           17s

NAME                                 DESIRED   CURRENT   READY   AGE
replicaset.apps/app4-v1-7b49c75b74   1         1         1       17s
```
::::

### Deploy Simple Route for TLS with Custom Domain for app4

```bash
export GATEWAY_NAME=my-hotel
export GATEWAY_NAMESPACE=default
export APPNAME=app4
export VERSION1=v1
export CUSTOM_DOMAIN_NAME="vpc-lattice-custom-domain.io"
envsubst < route-template-simple-tls-custom-domain.yaml > $APPNAME-simple-tls-custom-domain.yaml
kubectl apply -f $APPNAME-simple-tls-custom-domain.yaml
```

::::expand{header="Check Output"}
```bash
httproute.gateway.networking.k8s.io/app4 created
```
::::


## Create CNAME record for `app4.vpc-lattice-custom-domain.io`

```bash
export APPNAME=app4
appDNS=$(kubectl -n $APPNAME get httproute $APPNAME -o json | jq -r '.status.parents[].conditions[0].message')
prefix="DNS Name: "
appFQDN=${appDNS#$prefix}
echo "appFQDN=$appFQDN"
```

::::expand{header="Check Output"}
```bash
appFQDN=app4-app4-092f6af45b33e1e7d.7d67968.vpc-lattice-svcs.us-east-1.on.aws
```
::::


```bash
export APPNAME=app4
export CUSTOM_DOMAIN_NAME="vpc-lattice-custom-domain.io"
export HOSTED_ZONE_ID=$(aws route53 list-hosted-zones-by-name \
    --dns-name $CUSTOM_DOMAIN_NAME \
    --max-items 1 | \
  jq -r ' .HostedZones | first | .Id');
echo "HOSTED_ZONE_ID=$HOSTED_ZONE_ID"

cat <<-EOF > $APPNAME-create-r53-record.json
{
  "Comment": "CREATE CNAME for $APPNAME.$CUSTOM_DOMAIN_NAME",
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "$APPNAME.$CUSTOM_DOMAIN_NAME",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [
          { 
            "Value": "$appFQDN" 
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
  --change-batch file://$APPNAME-create-r53-record.json
```

::::expand{header="Check Output"}
```json
{
    "ChangeInfo": {
        "Id": "/change/C0179382AFRGFZ1R4A6H",
        "Status": "PENDING",
        "SubmittedAt": "2023-10-24T06:56:02.878000+00:00",
        "Comment": "CREATE CNAME for app4.vpc-lattice-custom-domain.io"
    }
}
```
::::

![cname_app4.png](/static/images/6-network-security/2-vpc-lattice-service-access/cname_app4.png)


### Test Access from app1 to app4


Run the `nslookup` command in the app1 Pod to resolve the **app4.vpc-lattice-custom-domain.io**

```bash
export appFQDN=app4.vpc-lattice-custom-domain.io
kubectl -n app1 exec -it deploy/app1-v1 -- nslookup $appFQDN

kubectl cp /<path-to-your-file>/<file-name> <pod-name>:<fully-qualified-file-name> -c <container-name>

 RUN yum install -y tar

kubectl -n app1 exec -it deploy/app1-v1 -- yum install tar -y

jp:~/.../vpclattice/workshop (main) $ kubectl -n app1 exec -it deploy/app1-v1 -- bash
bash-4.2# ls /app
http-servers  root_cert.pem
bash-4.2# ls -l /app
total 6044
-rwxrwxr-x. 1 root root 6182155 Sep 20  2021 http-servers
-rw-rw-r--. 1 1000 1000    1387 Oct 24 07:35 root_cert.pem
bash-4.2# exit
exit
jp:~/.../vpclattice/workshop (main)


kubectl -n app1 cp ./root_cert.pem app1-v1-79bbb5bb49-hc4gx:/app -c app1-v1

```

::::expand{header="Check Output"}
```bash
Server:         10.100.0.10
Address:        10.100.0.10#53

Non-authoritative answer:
app4.vpc-lattice-custom-domain.io       canonical name = app4-app4-092f6af45b33e1e7d.7d67968.vpc-lattice-svcs.us-east-1.on.aws.
Name:   app4-app4-092f6af45b33e1e7d.7d67968.vpc-lattice-svcs.us-east-1.on.aws
Address: 169.254.171.96
Name:   app4-app4-092f6af45b33e1e7d.7d67968.vpc-lattice-svcs.us-east-1.on.aws
Address: fd00:ec2:80::a9fe:ab60
```
::::

Notice that the IP `169.254.171.96` for **appFQDN** is from `MANAGED_PREFIX=169.254.171.0/24` we saw in the earlier section.


4. Exec into an `app1` pod to check connectivity to `app4` service.

```bash
kubectl -n app1 exec -it deploy/app1-v1 -- curl $appFQDN
Requsting to Pod(app4-v1-7b49c75b74-swpbw): Helloo from app4-v1

curl.exe --cacert ca-bundle.crt https://www.google.com


kubectl -n app1 exec -it deploy/app1-v1 -- curl https://$appFQDN:443

kubectl -n app1 exec -it deploy/app1-v1 -- curl --cacert /app/root_cert.pem https://$appFQDN:443

Requsting to Pod(app4-v1-7b49c75b74-swpbw): Helloo from app4-v1

```

::::expand{header="Check Output"}
```bash
Requsting to Pod(app2-v1-55c4d97b8d-k2qwm): Helloo from app2-v1
curl: (60) SSL certificate problem: self signed certificate in certificate chain
More details here: https://curl.se/docs/sslcerts.html

curl failed to verify the legitimacy of the server and therefore could not
establish a secure connection to it. To learn more about this situation and
how to fix it, please visit the web page mentioned above.
command terminated with exit code 60
```
::::

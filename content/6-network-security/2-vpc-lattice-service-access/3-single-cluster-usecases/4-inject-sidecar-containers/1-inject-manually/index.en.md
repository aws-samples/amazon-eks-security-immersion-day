---
title : "Inject manually"
weight : 21
---

In this section, let us re-deploy the client Service `app1-v1` Deployment by manually adding Init and SIGV4 Proxy containers.

```yaml
cat > manifests/app1-v1-deploy-manual-update.yaml <<EOF
apiVersion: v1
kind: Namespace
metadata:
  name: app1
  labels:
    allow-attachment-to-infra-gw: "true"  
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app1-v1
  namespace: app1
  labels:
    app: app1-v1
    
spec:
  replicas: 1
  selector:
    matchLabels:
      app: app1-v1
  template:
    metadata:
      labels:
        app: app1-v1
    spec:
      serviceAccountName: default
      initContainers: # IPTables rules are updated in init container
      - image: public.ecr.aws/d2c6w7a3/iptables
        name: iptables-init
        securityContext:
          capabilities:
            add:
            - NET_ADMIN
        command: # Adding --uid-owner 101 here to prevent traffic from aws-sigv4-proxy proxy itself from being redirected, which prevents an infinite loop
        - /bin/sh
        - -c
        - >
          iptables -t nat -N EGRESS_PROXY;
          iptables -t nat -A OUTPUT -p tcp -d 169.254.171.0/24 -j EGRESS_PROXY;
          iptables -t nat -A EGRESS_PROXY -m owner --uid-owner 101 -j RETURN;
          iptables -t nat -A EGRESS_PROXY -p tcp -j REDIRECT --to-ports 8080;    
      containers:
      - name: app1-v1
        image: public.ecr.aws/x2j8p8w7/http-server:latest
        env:
        - name: PodName
          value: "Hello from app1-v1"
      - name: sigv4proxy
        image: public.ecr.aws/aws-observability/aws-sigv4-proxy:latest
        args: [
          "--unsigned-payload",
          "--log-failed-requests",
          "-v", "--log-signing-process",
          "--name", "vpc-lattice-svcs",
          "--region", "$AWS_REGION",
          "--upstream-url-scheme", "http"
        ]
        ports:
        - containerPort: 8080
          name: proxy
          protocol: TCP
        securityContext:
          runAsUser: 101
---
apiVersion: v1
kind: Service
metadata:
  name: app1-v1
  namespace: app1
spec:
  selector:
    app: app1-v1
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8090
EOF
kubectl --context $EKS_CLUSTER1_CONTEXT apply -f manifests/app1-v1-deploy-manual-update.yaml
```

::::expand{header="Check Output"}
```bash
deployment.apps/inventory-ver1 configured
```
::::

Ensure that client Service `inventory-ver1` pods are re-deployed with Init and SIGV4 Proxy containers.

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT -n app1 get pod
```
Notice that `app1-v1` Service pods shows two containers as `2/2`.

```bash 
NAME                      READY   STATUS    RESTARTS   AGE
app1-v1-df98f6c96-zql6d   2/2     Running   0          32s
```

Run `yum install bind-utils tar` in the inventory pod for the `nslookup` and `tar` binaries.

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/app1-v1 -c app1-v1 -n app1 -- yum install tar bind-utils -y
```

::::expand{header="Check Output"}
```bash
Loaded plugins: ovl, priorities
amzn2-core                                                                   | 3.6 kB  00:00:00     
(1/3): amzn2-core/2/x86_64/group_gz                                          | 2.7 kB  00:00:00     
(2/3): amzn2-core/2/x86_64/updateinfo                                        | 729 kB  00:00:00     
(3/3): amzn2-core/2/x86_64/primary_db                                        |  67 MB  00:00:00     
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

====================================================================================================
 Package                Arch           Version                             Repository          Size
====================================================================================================
Installing:
 bind-utils             x86_64         32:9.11.4-26.P2.amzn2.13.5          amzn2-core         261 k
 tar                    x86_64         2:1.26-35.amzn2.0.2                 amzn2-core         845 k
Installing for dependencies:
 GeoIP                  x86_64         1.5.0-11.amzn2.0.2                  amzn2-core         1.1 M
 bind-libs              x86_64         32:9.11.4-26.P2.amzn2.13.5          amzn2-core         159 k
 bind-libs-lite         x86_64         32:9.11.4-26.P2.amzn2.13.5          amzn2-core         1.1 M
 bind-license           noarch         32:9.11.4-26.P2.amzn2.13.5          amzn2-core          92 k

Transaction Summary
====================================================================================================
Install  2 Packages (+4 Dependent packages)

Total download size: 3.5 M
Installed size: 9.1 M
Downloading packages:
(1/6): bind-libs-9.11.4-26.P2.amzn2.13.5.x86_64.rpm                          | 159 kB  00:00:00     
(2/6): GeoIP-1.5.0-11.amzn2.0.2.x86_64.rpm                                   | 1.1 MB  00:00:00     
(3/6): bind-license-9.11.4-26.P2.amzn2.13.5.noarch.rpm                       |  92 kB  00:00:00     
(4/6): bind-utils-9.11.4-26.P2.amzn2.13.5.x86_64.rpm                         | 261 kB  00:00:00     
(5/6): bind-libs-lite-9.11.4-26.P2.amzn2.13.5.x86_64.rpm                     | 1.1 MB  00:00:00     
(6/6): tar-1.26-35.amzn2.0.2.x86_64.rpm                                      | 845 kB  00:00:00     
----------------------------------------------------------------------------------------------------
Total                                                                17 MB/s | 3.5 MB  00:00:00     
Running transaction check
Running transaction test
Transaction test succeeded
Running transaction
  Installing : GeoIP-1.5.0-11.amzn2.0.2.x86_64                                                  1/6 
  Installing : 32:bind-license-9.11.4-26.P2.amzn2.13.5.noarch                                   2/6 
  Installing : 32:bind-libs-lite-9.11.4-26.P2.amzn2.13.5.x86_64                                 3/6 
  Installing : 32:bind-libs-9.11.4-26.P2.amzn2.13.5.x86_64                                      4/6 
  Installing : 32:bind-utils-9.11.4-26.P2.amzn2.13.5.x86_64                                     5/6 
  Installing : 2:tar-1.26-35.amzn2.0.2.x86_64                                                   6/6 
  Verifying  : 2:tar-1.26-35.amzn2.0.2.x86_64                                                   1/6 
  Verifying  : 32:bind-libs-9.11.4-26.P2.amzn2.13.5.x86_64                                      2/6 
  Verifying  : 32:bind-libs-lite-9.11.4-26.P2.amzn2.13.5.x86_64                                 3/6 
  Verifying  : 32:bind-utils-9.11.4-26.P2.amzn2.13.5.x86_64                                     4/6 
  Verifying  : GeoIP-1.5.0-11.amzn2.0.2.x86_64                                                  5/6 
  Verifying  : 32:bind-license-9.11.4-26.P2.amzn2.13.5.noarch                                   6/6 

Installed:
  bind-utils.x86_64 32:9.11.4-26.P2.amzn2.13.5            tar.x86_64 2:1.26-35.amzn2.0.2           

Dependency Installed:
  GeoIP.x86_64 0:1.5.0-11.amzn2.0.2                 bind-libs.x86_64 32:9.11.4-26.P2.amzn2.13.5    
  bind-libs-lite.x86_64 32:9.11.4-26.P2.amzn2.13.5  bind-license.noarch 32:9.11.4-26.P2.amzn2.13.5 

Complete!
```
::::

Run the `nslookup` command in the `app1-v1` Pod to resolve the **app2FQDN**

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/app1-v1 -c app1-v1 -n app1 -- nslookup $app2FQDN
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

Notice that the IP `169.254.171.33` for **ratesFQDN** is from `MANAGED_PREFIX=169.254.171.0/24` we saw in the earlier section.


Exec into an `app1-v1` pod to check connectivity to `app2`service. 

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/app1-v1 -c app1-v1 -n app1 -- curl -v $app2FQDN
```

::::expand{header="Check Output"}
```bash
*   Trying 169.254.171.33:80...
* Connected to app2-app2-0e5f3d2b3db4c7962.7d67968.vpc-lattice-svcs.us-west-2.on.aws (169.254.171.33) port 80 (#0)
> GET / HTTP/1.1
> Host: app2-app2-0e5f3d2b3db4c7962.7d67968.vpc-lattice-svcs.us-west-2.on.aws
> User-Agent: curl/7.76.1
> Accept: */*
> 
* Mark bundle as not supporting multiuse
< HTTP/1.1 200 OK
< Content-Length: 62
< Content-Type: text/plain; charset=utf-8
< Date: Thu, 26 Oct 2023 06:56:48 GMT
< 
Requsting to Pod(app2-v1-c6978fdbc-fnkw8): Hello from app2-v1
* Connection #0 to host app2-app2-0e5f3d2b3db4c7962.7d67968.vpc-lattice-svcs.us-west-2.on.aws left intact
```
::::

Since we are signing the requests using the sigv4proxy proxy container, access to `app2` is now allowed. The logs from the `app1-v1` does not show the SIGV4 authentication headers. For that, let us look at the sigv4proxy container logs.


```bash
kubectl --context $EKS_CLUSTER1_CONTEXT logs  deploy/app1-v1 -n app1 -c sigv4proxy
```


::::expand{header="Check Output"}
```bash
time="2023-10-26T06:50:27Z" level=info msg="Stripping headers []" StripHeaders="[]"
time="2023-10-26T06:50:27Z" level=info msg="Listening on :8080" port=":8080"
time="2023-10-26T06:56:04Z" level=debug msg="Initial request dump:" request="GET / HTTP/1.1\r\nHost: app2-app2-0e5f3d2b3db4c7962.7d67968.vpc-lattice-svcs.us-west-2.on.aws\r\nAccept: */*\r\nUser-Agent: curl/7.76.1\r\n\r\n"
time="2023-10-26T06:56:04Z" level=info msg="DEBUG: Request Signature:\n---[ CANONICAL STRING  ]-----------------------------\nGET\n/\n\nhost:app2-app2-0e5f3d2b3db4c7962.7d67968.vpc-lattice-svcs.us-west-2.on.aws\nx-amz-content-sha256:UNSIGNED-PAYLOAD\nx-amz-date:20231026T065604Z\nx-amz-security-token:IQoJb3JpZ2luX2VjEEcaCXVzLXdlc3QtMiJGMEQCIEPnRDtPuc99gKsEgi+9kpAN9rJ07Q8gkwdxcVmajBljAiAWvv506xNlrEVR0Eqw6fwd0dMh0cgmt0sRdfI/40sMGiruBAhwEAIaDDg5NzA4NjAwODY4MCIMVbx6EfKR0Xw/hw0RKssEptK+yfKpsTWUtiYkFzELrHPcMW8I8jBKPKMRdNDHjBrO5uZcUAVtqqeDsz1mcjlIHlq1nvHfueYmf9oYKtR19Ww9bEmDr6pFUBHOxip8SfWDqDZlm7gifx7q1Is1LpyGIE9C7aX2VCSp7o4b8vqv2XgvU9O0mpKbHizjuIoE1GxK8+oOGeiTyw83YOLCsI9oRgfcX9Kkzj0AgivI9YI+RXNgAwGygu4OaZjMGmQ5hZ+RWJ0CZHCqdSAJ6TdYxb9DdoWkRYOLt/3A5Lc2ZoPxUGcOXXSKRVnBZ0B918Zas3LUz+0+gLAr9pMzA9miA3UG0ofji0Zmws0EKgX1CS+2ZVpQUZXfUuWRBJbJOfV2bhZ0qkob3rgK7046RsMaO2BtMOUjbVMcO+/Wyh4bFs36F3hMvyme+i+ZR1co8XHuw1qR1R322dbndK2mgF7hrrHh0RRTHlcWghq3a6x6OEUhC9+WOARScPGFfmHvqjLlOMAYa/T3mRi30jFSRL3nnj3ak4ySC+w3nnVM3GJFx2YDZdC2zJ0RF3BDQ0Y2keoCvNjDyXh0CnvJvGppWxhJm+owGdxMvU/5WkQ7Tbpn2TgEC+ITj5oQG/Up5J06e5gNhit5NghdcykpQ9tVAyCITw52+a/xFTm0IlHXFHd9GQzbv0F5fZFEFCkejDlrHO0PjWhrVEl0EMSQdCIcHzbDulTeYRWjNVTCu0XAswMQzJ1sALSEUe9HtxaSItSNez6bBxwa4F0WI7EHdZKsojGlr+C+CWsA94v8B67gdPwwhJvoqQY6mwGpOxIObeUr4jmKUBEs0It9f7fJVcDVas9XEmxsNPO9++EeQEqIR+Nf/cKmcUI0eDGYv9ZizSpJqmHpAPc0zxBlHyaJhY4WJSVgN1n+Kf6y74j/tujSPnZhNnGzTTFZjszuUj6tttVZuJ4gM9WZeuMugeI3XkyWP6AUDhhTmD1rJg1j6iPI3V1PvLTEkDDn49UhDfPBm/tiU5Dhcg==\n\nhost;x-amz-content-sha256;x-amz-date;x-amz-security-token\nUNSIGNED-PAYLOAD\n---[ STRING TO SIGN ]--------------------------------\nAWS4-HMAC-SHA256\n20231026T065604Z\n20231026/us-west-2/vpc-lattice-svcs/aws4_request\na9ad703a2c3c4191391016ed99f056dcfc7a0e55cc9f490c296bc4d5bd288239\n-----------------------------------------------------"
time="2023-10-26T06:56:04Z" level=debug msg="signed request" region=us-west-2 service=vpc-lattice-svcs
time="2023-10-26T06:56:04Z" level=debug msg="proxying request" request="GET / HTTP/1.1\r\nHost: app2-app2-0e5f3d2b3db4c7962.7d67968.vpc-lattice-svcs.us-west-2.on.aws\r\nAccept: */*\r\nAuthorization: AWS4-HMAC-SHA256 Credential=ASIA5BXT6FVUJTHDTNHU/20231026/us-west-2/vpc-lattice-svcs/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date;x-amz-security-token, Signature=ee062e35c1427c5c6ffeb34c869cd7d7ca0361f187035b51c1effdbc4e6d5a19\r\nUser-Agent: curl/7.76.1\r\nX-Amz-Content-Sha256: UNSIGNED-PAYLOAD\r\nX-Amz-Date: 20231026T065604Z\r\nX-Amz-Security-Token: IQoJb3JpZ2luX2VjEEcaCXVzLXdlc3QtMiJGMEQCIEPnRDtPuc99gKsEgi+9kpAN9rJ07Q8gkwdxcVmajBljAiAWvv506xNlrEVR0Eqw6fwd0dMh0cgmt0sRdfI/40sMGiruBAhwEAIaDDg5NzA4NjAwODY4MCIMVbx6EfKR0Xw/hw0RKssEptK+yfKpsTWUtiYkFzELrHPcMW8I8jBKPKMRdNDHjBrO5uZcUAVtqqeDsz1mcjlIHlq1nvHfueYmf9oYKtR19Ww9bEmDr6pFUBHOxip8SfWDqDZlm7gifx7q1Is1LpyGIE9C7aX2VCSp7o4b8vqv2XgvU9O0mpKbHizjuIoE1GxK8+oOGeiTyw83YOLCsI9oRgfcX9Kkzj0AgivI9YI+RXNgAwGygu4OaZjMGmQ5hZ+RWJ0CZHCqdSAJ6TdYxb9DdoWkRYOLt/3A5Lc2ZoPxUGcOXXSKRVnBZ0B918Zas3LUz+0+gLAr9pMzA9miA3UG0ofji0Zmws0EKgX1CS+2ZVpQUZXfUuWRBJbJOfV2bhZ0qkob3rgK7046RsMaO2BtMOUjbVMcO+/Wyh4bFs36F3hMvyme+i+ZR1co8XHuw1qR1R322dbndK2mgF7hrrHh0RRTHlcWghq3a6x6OEUhC9+WOARScPGFfmHvqjLlOMAYa/T3mRi30jFSRL3nnj3ak4ySC+w3nnVM3GJFx2YDZdC2zJ0RF3BDQ0Y2keoCvNjDyXh0CnvJvGppWxhJm+owGdxMvU/5WkQ7Tbpn2TgEC+ITj5oQG/Up5J06e5gNhit5NghdcykpQ9tVAyCITw52+a/xFTm0IlHXFHd9GQzbv0F5fZFEFCkejDlrHO0PjWhrVEl0EMSQdCIcHzbDulTeYRWjNVTCu0XAswMQzJ1sALSEUe9HtxaSItSNez6bBxwa4F0WI7EHdZKsojGlr+C+CWsA94v8B67gdPwwhJvoqQY6mwGpOxIObeUr4jmKUBEs0It9f7fJVcDVas9XEmxsNPO9++EeQEqIR+Nf/cKmcUI0eDGYv9ZizSpJqmHpAPc0zxBlHyaJhY4WJSVgN1n+Kf6y74j/tujSPnZhNnGzTTFZjszuUj6tttVZuJ4gM9WZeuMugeI3XkyWP6AUDhhTmD1rJg1j6iPI3V1PvLTEkDDn49UhDfPBm/tiU5Dhcg==\r\n\r\n"
time="2023-10-26T06:56:48Z" level=debug msg="Initial request dump:" request="GET / HTTP/1.1\r\nHost: app2-app2-0e5f3d2b3db4c7962.7d67968.vpc-lattice-svcs.us-west-2.on.aws\r\nAccept: */*\r\nUser-Agent: curl/7.76.1\r\n\r\n"
time="2023-10-26T06:56:48Z" level=info msg="DEBUG: Request Signature:\n---[ CANONICAL STRING  ]-----------------------------\nGET\n/\n\nhost:app2-app2-0e5f3d2b3db4c7962.7d67968.vpc-lattice-svcs.us-west-2.on.aws\nx-amz-content-sha256:UNSIGNED-PAYLOAD\nx-amz-date:20231026T065648Z\nx-amz-security-token:IQoJb3JpZ2luX2VjEEcaCXVzLXdlc3QtMiJGMEQCIEPnRDtPuc99gKsEgi+9kpAN9rJ07Q8gkwdxcVmajBljAiAWvv506xNlrEVR0Eqw6fwd0dMh0cgmt0sRdfI/40sMGiruBAhwEAIaDDg5NzA4NjAwODY4MCIMVbx6EfKR0Xw/hw0RKssEptK+yfKpsTWUtiYkFzELrHPcMW8I8jBKPKMRdNDHjBrO5uZcUAVtqqeDsz1mcjlIHlq1nvHfueYmf9oYKtR19Ww9bEmDr6pFUBHOxip8SfWDqDZlm7gifx7q1Is1LpyGIE9C7aX2VCSp7o4b8vqv2XgvU9O0mpKbHizjuIoE1GxK8+oOGeiTyw83YOLCsI9oRgfcX9Kkzj0AgivI9YI+RXNgAwGygu4OaZjMGmQ5hZ+RWJ0CZHCqdSAJ6TdYxb9DdoWkRYOLt/3A5Lc2ZoPxUGcOXXSKRVnBZ0B918Zas3LUz+0+gLAr9pMzA9miA3UG0ofji0Zmws0EKgX1CS+2ZVpQUZXfUuWRBJbJOfV2bhZ0qkob3rgK7046RsMaO2BtMOUjbVMcO+/Wyh4bFs36F3hMvyme+i+ZR1co8XHuw1qR1R322dbndK2mgF7hrrHh0RRTHlcWghq3a6x6OEUhC9+WOARScPGFfmHvqjLlOMAYa/T3mRi30jFSRL3nnj3ak4ySC+w3nnVM3GJFx2YDZdC2zJ0RF3BDQ0Y2keoCvNjDyXh0CnvJvGppWxhJm+owGdxMvU/5WkQ7Tbpn2TgEC+ITj5oQG/Up5J06e5gNhit5NghdcykpQ9tVAyCITw52+a/xFTm0IlHXFHd9GQzbv0F5fZFEFCkejDlrHO0PjWhrVEl0EMSQdCIcHzbDulTeYRWjNVTCu0XAswMQzJ1sALSEUe9HtxaSItSNez6bBxwa4F0WI7EHdZKsojGlr+C+CWsA94v8B67gdPwwhJvoqQY6mwGpOxIObeUr4jmKUBEs0It9f7fJVcDVas9XEmxsNPO9++EeQEqIR+Nf/cKmcUI0eDGYv9ZizSpJqmHpAPc0zxBlHyaJhY4WJSVgN1n+Kf6y74j/tujSPnZhNnGzTTFZjszuUj6tttVZuJ4gM9WZeuMugeI3XkyWP6AUDhhTmD1rJg1j6iPI3V1PvLTEkDDn49UhDfPBm/tiU5Dhcg==\n\nhost;x-amz-content-sha256;x-amz-date;x-amz-security-token\nUNSIGNED-PAYLOAD\n---[ STRING TO SIGN ]--------------------------------\nAWS4-HMAC-SHA256\n20231026T065648Z\n20231026/us-west-2/vpc-lattice-svcs/aws4_request\naf4f1875822274fc8c3487f8b4375a2c52bbf41fdd728977acd2f4f36f15280a\n-----------------------------------------------------"
time="2023-10-26T06:56:48Z" level=debug msg="signed request" region=us-west-2 service=vpc-lattice-svcs
time="2023-10-26T06:56:48Z" level=debug msg="proxying request" request="GET / HTTP/1.1\r\nHost: app2-app2-0e5f3d2b3db4c7962.7d67968.vpc-lattice-svcs.us-west-2.on.aws\r\nAccept: */*\r\nAuthorization: AWS4-HMAC-SHA256 Credential=ASIA5BXT6FVUJTHDTNHU/20231026/us-west-2/vpc-lattice-svcs/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date;x-amz-security-token, Signature=3e7ffa46dd1b6879777bd1317e8ce7763fcc6da7d58d3953a142ebe201c9cee6\r\nUser-Agent: curl/7.76.1\r\nX-Amz-Content-Sha256: UNSIGNED-PAYLOAD\r\nX-Amz-Date: 20231026T065648Z\r\nX-Amz-Security-Token: IQoJb3JpZ2luX2VjEEcaCXVzLXdlc3QtMiJGMEQCIEPnRDtPuc99gKsEgi+9kpAN9rJ07Q8gkwdxcVmajBljAiAWvv506xNlrEVR0Eqw6fwd0dMh0cgmt0sRdfI/40sMGiruBAhwEAIaDDg5NzA4NjAwODY4MCIMVbx6EfKR0Xw/hw0RKssEptK+yfKpsTWUtiYkFzELrHPcMW8I8jBKPKMRdNDHjBrO5uZcUAVtqqeDsz1mcjlIHlq1nvHfueYmf9oYKtR19Ww9bEmDr6pFUBHOxip8SfWDqDZlm7gifx7q1Is1LpyGIE9C7aX2VCSp7o4b8vqv2XgvU9O0mpKbHizjuIoE1GxK8+oOGeiTyw83YOLCsI9oRgfcX9Kkzj0AgivI9YI+RXNgAwGygu4OaZjMGmQ5hZ+RWJ0CZHCqdSAJ6TdYxb9DdoWkRYOLt/3A5Lc2ZoPxUGcOXXSKRVnBZ0B918Zas3LUz+0+gLAr9pMzA9miA3UG0ofji0Zmws0EKgX1CS+2ZVpQUZXfUuWRBJbJOfV2bhZ0qkob3rgK7046RsMaO2BtMOUjbVMcO+/Wyh4bFs36F3hMvyme+i+ZR1co8XHuw1qR1R322dbndK2mgF7hrrHh0RRTHlcWghq3a6x6OEUhC9+WOARScPGFfmHvqjLlOMAYa/T3mRi30jFSRL3nnj3ak4ySC+w3nnVM3GJFx2YDZdC2zJ0RF3BDQ0Y2keoCvNjDyXh0CnvJvGppWxhJm+owGdxMvU/5WkQ7Tbpn2TgEC+ITj5oQG/Up5J06e5gNhit5NghdcykpQ9tVAyCITw52+a/xFTm0IlHXFHd9GQzbv0F5fZFEFCkejDlrHO0PjWhrVEl0EMSQdCIcHzbDulTeYRWjNVTCu0XAswMQzJ1sALSEUe9HtxaSItSNez6bBxwa4F0WI7EHdZKsojGlr+C+CWsA94v8B67gdPwwhJvoqQY6mwGpOxIObeUr4jmKUBEs0It9f7fJVcDVas9XEmxsNPO9++EeQEqIR+Nf/cKmcUI0eDGYv9ZizSpJqmHpAPc0zxBlHyaJhY4WJSVgN1n+Kf6y74j/tujSPnZhNnGzTTFZjszuUj6tttVZuJ4gM9WZeuMugeI3XkyWP6AUDhhTmD1rJg1j6iPI3V1PvLTEkDDn49UhDfPBm/tiU5Dhcg==\r\n\r\n"
```
::::

From the above logs, we can verify sigv4proxy container sign the request and adds the headers `Authorization`, `x-amz-content-sha256`, `x-amz-date` and `x-amz-security-token`

Before moving to the next section, let us undo the manual changes to the `app1-v1` deployment by deleting the deployment and the re-deploy the original configuration.

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT delete deploy app1-v1 -n app1
```

::::expand{header="Check Output"}
```bash
deployment.apps "app1-v1" deleted
```
::::

Re-deploy the `app-v1` deployment.

```bash
cd ~/environment
kubectl --context $EKS_CLUSTER1_CONTEXT apply -f manifests/app1-v1-deploy.yaml
```

::::expand{header="Check Output"}
```bash
namespace/app1 unchanged
deployment.apps/app1-v1 created
service/app1-v1 unchanged
```
::::

Ensure that `app1-v1` service pods now has only one main application containers.

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT get pod -n app1
```

::::expand{header="Check Output"}
```bash
NAME                       READY   STATUS    RESTARTS   AGE
app1-v1-5cc757c998-9trw5   1/1     Running   0          31s
```
::::


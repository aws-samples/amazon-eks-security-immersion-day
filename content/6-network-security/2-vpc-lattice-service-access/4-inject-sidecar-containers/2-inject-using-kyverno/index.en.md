---
title : "Inject using Kyverno"
weight : 22
---

## Install Kyvernon Policy Engine

Let us install the Kyverno policy engine and associated configurations into the EKS cluster using using this [Helm](https://helm.sh/)

```bash
helm repo add kyverno https://kyverno.github.io/kyverno/
helm repo update
helm install kyverno --namespace kyverno kyverno/kyverno --create-namespace
```

::::expand{header="Check Output"}

```bash
"kyverno" has been added to your repositories
Hang tight while we grab the latest from your chart repositories...
...Successfully got an update from the "kyverno" chart repository
...Successfully got an update from the "eks" chart repository
Update Complete. ⎈Happy Helming!⎈
NAME: kyverno
LAST DEPLOYED: Fri Oct 20 16:27:01 2023
NAMESPACE: kyverno
STATUS: deployed
REVISION: 1
NOTES:
Chart version: 3.0.5
Kyverno version: v1.10.3

Thank you for installing kyverno! Your release is named kyverno.

The following components have been installed in your cluster:
- CRDs
- Admission controller
- Reports controller
- Cleanup controller
- Background controller


⚠️  WARNING: Setting the admission controller replica count below 3 means Kyverno is not running in high availability mode.

💡 Note: There is a trade-off when deciding which approach to take regarding Namespace exclusions. Please see the documentation at https://kyverno.io/docs/installation/#security-vs-operability to understand the risks.
```

::::

Ensure the kyverno is installed and running fine.

```bash
kubectl get all -n kyverno
```

::::expand{header="Check Output"}

```bash
NAME                                                 READY   STATUS    RESTARTS   AGE
pod/kyverno-admission-controller-6f54d4786f-b2trw    1/1     Running   0          101s
pod/kyverno-background-controller-696c6d575c-cbqkt   1/1     Running   0          101s
pod/kyverno-cleanup-controller-79dd5858df-czchx      1/1     Running   0          101s
pod/kyverno-reports-controller-5fcd875795-vft9w      1/1     Running   0          101s

NAME                                            TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)    AGE
service/kyverno-background-controller-metrics   ClusterIP   172.20.80.199    <none>        8000/TCP   101s
service/kyverno-cleanup-controller              ClusterIP   172.20.231.160   <none>        443/TCP    101s
service/kyverno-cleanup-controller-metrics      ClusterIP   172.20.73.130    <none>        8000/TCP   101s
service/kyverno-reports-controller-metrics      ClusterIP   172.20.207.215   <none>        8000/TCP   101s
service/kyverno-svc                             ClusterIP   172.20.26.173    <none>        443/TCP    101s
service/kyverno-svc-metrics                     ClusterIP   172.20.206.40    <none>        8000/TCP   101s

NAME                                            READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/kyverno-admission-controller    1/1     1            1           101s
deployment.apps/kyverno-background-controller   1/1     1            1           101s
deployment.apps/kyverno-cleanup-controller      1/1     1            1           101s
deployment.apps/kyverno-reports-controller      1/1     1            1           101s

NAME                                                       DESIRED   CURRENT   READY   AGE
replicaset.apps/kyverno-admission-controller-6f54d4786f    1         1         1       101s
replicaset.apps/kyverno-background-controller-696c6d575c   1         1         1       101s
replicaset.apps/kyverno-cleanup-controller-79dd5858df      1         1         1       101s
replicaset.apps/kyverno-reports-controller-5fcd875795      1         1         1       101s

NAME                                                      SCHEDULE       SUSPEND   ACTIVE   LAST SCHEDULE   AGE
cronjob.batch/kyverno-cleanup-admission-reports           */10 * * * *   False     0        <none>          101s
cronjob.batch/kyverno-cleanup-cluster-admission-reports   */10 * * * *   False     0        <none>          101s
```

::::


Now we would like to make use of Kyverno to . For Clusters with Kyverno 

Let us create a Kyverno `ClusterPolicy` to inject sidecar and init containers automatically by annotating the deployment with `vpc-lattices-svcs.amazonaws.com/agent-inject` set to `true`. Note this annotation is configured in the below `ClusterPolicy`.

```bash
cat > kyverno-cluster-policy.yaml <<EOF
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: inject-sidecar
  annotations:
    policies.kyverno.io/title: Inject Sidecar Container
spec:
  rules:
  - name: inject-sidecar
    match:
      any:
      - resources:
          kinds:
          - Deployment
    mutate:
      patchStrategicMerge:
        spec:
          template:
            metadata:
              annotations:
                (vpc-lattices-svcs.amazonaws.com/agent-inject): "true"
            spec:
              initContainers: # IPTables rules are updated in init container
              - image: public.ecr.aws/d2c6w7a3/iptables
                name: iptables-init
                securityContext:
                  capabilities:
                    add:
                    - NET_ADMIN
                command: # Adding --uid-owner 101 here to prevent traffic from envoy proxy itself from being redirected, which prevents an infinite loop
                - /bin/sh
                - -c
                - >
                  iptables -t nat -N EGRESS_PROXY;
                  iptables -t nat -A OUTPUT -p tcp -d 169.254.171.0/24 -j EGRESS_PROXY;
                  iptables -t nat -A EGRESS_PROXY -m owner --uid-owner 101 -j RETURN;
                  iptables -t nat -A EGRESS_PROXY -p tcp -j REDIRECT --to-ports 8080;
              containers: 
              - name: sigv4proxy
                env:
                 - name: AWS_REGION
                   value: "$AWS_REGION"
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
EOF
kubectl apply -f kyverno-cluster-policy.yaml
```

::::expand{header="Check Output"}
```bash
clusterpolicy.kyverno.io/inject-sidecar created
```
::::

Ensure that Kyvero ClusterPolicy is configured properly.

```bash
kubectl get ClusterPolicy 
```

::::expand{header="Check Output"}
```bash
NAME             BACKGROUND   VALIDATE ACTION   READY   AGE    MESSAGE
inject-sidecar   true         Audit             True    109s   Ready
```
::::

Let us first delete the `inventory-ver1` deployment, annotate it and then re-deploy it.

```bash
kubectl delete deploy inventory-ver1
```

::::expand{header="Check Output"}
```bash
deployment.apps "inventory-ver1" deleted
```
::::

Annotate the pod template in the `inventory-ver1` deployment with `vpc-lattices-svcs.amazonaws.com/agent-inject=true`

```yaml
cat > inventory-ver1-updated-automatic.yaml <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: inventory-ver1
  labels:
    app: inventory-ver1
spec:
  replicas: 2
  selector:
    matchLabels:
      app: inventory-ver1
  template:
    metadata:
      annotations:
       vpc-lattices-svcs.amazonaws.com/agent-inject: "true"    
      labels:
        app: inventory-ver1
    spec:
      containers:
      - name: inventory-ver1
        image: public.ecr.aws/x2j8p8w7/http-server:latest
        env:
        - name: PodName
          value: "Inventory-ver1 handler pod"
EOF
kubectl apply -f inventory-ver1-updated-automatic.yaml
```

::::expand{header="Check Output"}
```bash
deployment.apps/inventory-ver1 created
```
::::

Ensure that client Service `inventory-ver1` pods are re-deployed with Init and SIGV4 Proxy containers.

```bash
kubectl get pod
```
Notice that `inventory-ver1` Service pods shows two containers as `2/2`.

```bash 
NAME                             READY   STATUS    RESTARTS   AGE
inventory-ver1-9d69ffc4d-x9gpn   2/2     Running   0          6m12s
inventory-ver1-9d69ffc4d-zp8b2   2/2     Running   0          6m21s
parking-7c89b6b67c-94hps         1/1     Running   0          16h
parking-7c89b6b67c-clm6w         1/1     Running   0          16h
review-5846dd8dcc-9clvl          1/1     Running   0          16h
review-5846dd8dcc-zhqnd          1/1     Running   0          16h
``` 

Run `yum install bind-utils` in the inventory pod for the `nslookup` binary.

```bash
kubectl exec -it deploy/inventory-ver1 -c inventory-ver1 -- yum install bind-utils -y
```

::::expand{header="Check Output"}
```bash
Loaded plugins: ovl, priorities
amzn2-core                                                                             | 3.6 kB  00:00:00     
(1/3): amzn2-core/2/x86_64/group_gz                                                    | 2.7 kB  00:00:00     
(2/3): amzn2-core/2/x86_64/updateinfo                                                  | 729 kB  00:00:00     
(3/3): amzn2-core/2/x86_64/primary_db                                                  |  67 MB  00:00:00     
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

==============================================================================================================
 Package                  Arch             Version                                 Repository            Size
==============================================================================================================
Installing:
 bind-utils               x86_64           32:9.11.4-26.P2.amzn2.13.5              amzn2-core           261 k
Installing for dependencies:
 GeoIP                    x86_64           1.5.0-11.amzn2.0.2                      amzn2-core           1.1 M
 bind-libs                x86_64           32:9.11.4-26.P2.amzn2.13.5              amzn2-core           159 k
 bind-libs-lite           x86_64           32:9.11.4-26.P2.amzn2.13.5              amzn2-core           1.1 M
 bind-license             noarch           32:9.11.4-26.P2.amzn2.13.5              amzn2-core            92 k

Transaction Summary
==============================================================================================================
Install  1 Package (+4 Dependent packages)

Total download size: 2.7 M
Installed size: 6.4 M
Downloading packages:
(1/5): bind-libs-9.11.4-26.P2.amzn2.13.5.x86_64.rpm                                    | 159 kB  00:00:00     
(2/5): GeoIP-1.5.0-11.amzn2.0.2.x86_64.rpm                                             | 1.1 MB  00:00:00     
(3/5): bind-license-9.11.4-26.P2.amzn2.13.5.noarch.rpm                                 |  92 kB  00:00:00     
(4/5): bind-utils-9.11.4-26.P2.amzn2.13.5.x86_64.rpm                                   | 261 kB  00:00:00     
(5/5): bind-libs-lite-9.11.4-26.P2.amzn2.13.5.x86_64.rpm                               | 1.1 MB  00:00:00     
--------------------------------------------------------------------------------------------------------------
Total                                                                          13 MB/s | 2.7 MB  00:00:00     
Running transaction check
Running transaction test
Transaction test succeeded
Running transaction
  Installing : GeoIP-1.5.0-11.amzn2.0.2.x86_64                                                            1/5 
  Installing : 32:bind-license-9.11.4-26.P2.amzn2.13.5.noarch                                             2/5 
  Installing : 32:bind-libs-lite-9.11.4-26.P2.amzn2.13.5.x86_64                                           3/5 
  Installing : 32:bind-libs-9.11.4-26.P2.amzn2.13.5.x86_64                                                4/5 
  Installing : 32:bind-utils-9.11.4-26.P2.amzn2.13.5.x86_64                                               5/5 
  Verifying  : 32:bind-libs-lite-9.11.4-26.P2.amzn2.13.5.x86_64                                           1/5 
  Verifying  : 32:bind-utils-9.11.4-26.P2.amzn2.13.5.x86_64                                               2/5 
  Verifying  : 32:bind-license-9.11.4-26.P2.amzn2.13.5.noarch                                             3/5 
  Verifying  : 32:bind-libs-9.11.4-26.P2.amzn2.13.5.x86_64                                                4/5 
  Verifying  : GeoIP-1.5.0-11.amzn2.0.2.x86_64                                                            5/5 

Installed:
  bind-utils.x86_64 32:9.11.4-26.P2.amzn2.13.5                                                                

Dependency Installed:
  GeoIP.x86_64 0:1.5.0-11.amzn2.0.2                      bind-libs.x86_64 32:9.11.4-26.P2.amzn2.13.5         
  bind-libs-lite.x86_64 32:9.11.4-26.P2.amzn2.13.5       bind-license.noarch 32:9.11.4-26.P2.amzn2.13.5      

Complete!
```
::::

Run the `nslookup` command in the Inventory Pod to resolve the **ratesFQDN**

```bash
kubectl exec -it deploy/inventory-ver1 -c inventory-ver1 -- nslookup $ratesFQDN
```

::::expand{header="Check Output"}
```bash
Server:         172.20.0.10
Address:        172.20.0.10#53

Non-authoritative answer:
Name:   rates-default-01faa878ea99fc2c8.7d67968.vpc-lattice-svcs.us-west-2.on.aws
Address: 169.254.171.1
Name:   rates-default-01faa878ea99fc2c8.7d67968.vpc-lattice-svcs.us-west-2.on.aws
Address: fd00:ec2:80::a9fe:ab01
```
::::

Notice that the IP `169.254.171.1` for **ratesFQDN** is from `MANAGED_PREFIX=169.254.171.0/24` we saw in the earlier section.


Exec into an inventory pod to check connectivity to `parking` and `review` services. 

```bash
kubectl exec -it deploy/inventory-ver1 -c inventory-ver1 -- curl -v $ratesFQDN/parking $ratesFQDN/review
```

::::expand{header="Check Output"}
```bash
Defaulted container "inventory-ver1" out of: inventory-ver1, sigv4proxy, iptables-init (init)
*   Trying 169.254.171.1:80...
* Connected to rates-default-01faa878ea99fc2c8.7d67968.vpc-lattice-svcs.us-west-2.on.aws (169.254.171.1) port 80 (#0)
> GET /parking HTTP/1.1
> Host: rates-default-01faa878ea99fc2c8.7d67968.vpc-lattice-svcs.us-west-2.on.aws
> User-Agent: curl/7.76.1
> Accept: */*
> 
* Mark bundle as not supporting multiuse
< HTTP/1.1 200 OK
< Content-Length: 64
< Content-Type: text/plain; charset=utf-8
< Date: Fri, 20 Oct 2023 04:28:45 GMT
< 
Requsting to Pod(parking-7c89b6b67c-clm6w): parking handler pod
* Connection #0 to host rates-default-01faa878ea99fc2c8.7d67968.vpc-lattice-svcs.us-west-2.on.aws left intact
* Found bundle for host rates-default-01faa878ea99fc2c8.7d67968.vpc-lattice-svcs.us-west-2.on.aws: 0x1a7ff20 [serially]
* Can not multiplex, even if we wanted to!
* Re-using existing connection! (#0) with host rates-default-01faa878ea99fc2c8.7d67968.vpc-lattice-svcs.us-west-2.on.aws
* Connected to rates-default-01faa878ea99fc2c8.7d67968.vpc-lattice-svcs.us-west-2.on.aws (169.254.171.1) port 80 (#0)
> GET /review HTTP/1.1
> Host: rates-default-01faa878ea99fc2c8.7d67968.vpc-lattice-svcs.us-west-2.on.aws
> User-Agent: curl/7.76.1
> Accept: */*
> 
* Mark bundle as not supporting multiuse
< HTTP/1.1 200 OK
< Content-Length: 62
< Content-Type: text/plain; charset=utf-8
< Date: Fri, 20 Oct 2023 04:28:45 GMT
< 
Requsting to Pod(review-5846dd8dcc-zhqnd): review handler pod
* Connection #0 to host rates-default-01faa878ea99fc2c8.7d67968.vpc-lattice-svcs.us-west-2.on.aws left intact
```
::::

Since we are signing the requests using the sigv4proxy proxy container, access to `rates` is now allowed. The logs from the `inventory-ver1` does not show the SIGV4 authentication headers. For that, let us look at the sigv4proxy container logs.


```bash
kubectl logs -f deploy/inventory-ver1 -c sigv4proxy
```


::::expand{header="Check Output"}
```bash
Found 2 pods, using pod/inventory-ver1-9d69ffc4d-zp8b2
time="2023-10-20T04:09:29Z" level=info msg="Stripping headers []" StripHeaders="[]"
time="2023-10-20T04:09:29Z" level=info msg="Listening on :8080" port=":8080"
time="2023-10-20T04:27:06Z" level=debug msg="Initial request dump:" request="GET /parking HTTP/1.1\r\nHost: rates-default-01faa878ea99fc2c8.7d67968.vpc-lattice-svcs.us-west-2.on.aws\r\nAccept: */*\r\nUser-Agent: curl/7.76.1\r\n\r\n"
time="2023-10-20T04:27:06Z" level=info msg="DEBUG: Request Signature:\n---[ CANONICAL STRING  ]-----------------------------\nGET\n/parking\n\nhost:rates-default-01faa878ea99fc2c8.7d67968.vpc-lattice-svcs.us-west-2.on.aws\nx-amz-content-sha256:UNSIGNED-PAYLOAD\nx-amz-date:20231020T042706Z\nx-amz-security-token:IQoJb3JpZ2luX2VjELX//////////wEaCXVzLXdlc3QtMiJGMEQCIFvw3cGOPPEEQyxIKBCkMR2iZjQzY0phrjyEPNLgP9u5AiAuGxASz25sdTAIKljHaPQSSWD54yi+ACZN+5b9JrrmXyr6BAjO//////////8BEAIaDDgwNDMzNTM2MDczMSIMrw4AvfCj4v8yzjUmKs4ExJktUyzXK2X1HKojTnmCprAck8XBeHCGxZpLvOrq7C6FLxqeTFGj/PGeBGj5pS6WoaZ6L6YHA82f0rPLi8LE3eINTjDUqo2f85U0CdcydImJrKyLdvhHK3UdyxWHzuz7iREgNggOqhbE/XRXUID072TAozMOWPmhkfaxGygy3t3hVky5q18OgoCx+dRP6ZRHEkeMbDtVw2KwhHHp81MTVIYHqVO5TlRMq5jk3lHfn+7GY8lWT35ZZCe4b9IqCbrY25bWJG6DNwMP7CuJGMnY4RVHHJNDoYUVsNsSfIv4+UR+fdnsFIp580m0sotocPV0QvAmjMwtq+D70YZbvz2qmNMAJ076/gqBpkzipF9LGynJ1W5DCscXPLJo3xYeQoflntXINpkllt9qJjt5JQSS0IQpVvF+eF3OCMUvn3T7gVGrK2PETv1oG9gjw4IZ2/C1ChVh3WCqQjEufYHBuBzrr/BpcuxUYFO6Ib1C9KUKZYP9RL1yLyU3us0O+CRUhpTsp73TN+evaW96I61XZBN9EN6WLwrlxurshvU5pvJR+4lTWNUknCH/4GuC0HSO456m+/JTqDfu3Bgf9/Hh2pSm3xaALNYOCYVbAglT7YmIh0a9SSJhxnMXy85DiH3Q1Jdw9QkoRtF030a9jvh7Mi/Ag5NvT3NUiezrieiZPYBAFAjlw/colNg8kjhUl0SV0Gb8euwTr0wsUZ2o5zOUs5bZLUnNRA6FDqw/6x3MPFnaXAhSSlGV96Qaxv9mNp5+aTp0uGFQswEIuEvEbVBJq4owmoPIqQY6mwGRfFG/CphqeZbb70RKhWOAh41aC8F9zJIR1wTORXCJbOp2bDsf03VJHyucTKbNFmLMFVc6ZwiMusgBVKYyGX7JF0xM0pwSyCZPzpigbVMJnq8tqd2CtSlWMbhDryPE0rVLFO/BjC+lcy6UrF2KEWs8snECrOadFSBHwDk4R4bRfk2H7s+8Tnt08dWF6ZEhFtZkUFe9UJ4uo1Ztlg==\n\nhost;x-amz-content-sha256;x-amz-date;x-amz-security-token\nUNSIGNED-PAYLOAD\n---[ STRING TO SIGN ]--------------------------------\nAWS4-HMAC-SHA256\n20231020T042706Z\n20231020/us-west-2/vpc-lattice-svcs/aws4_request\n4d4531d5afd4e95059f82f491e899620ca06d68e78f06e8ab0f00a5438d4fbcb\n-----------------------------------------------------"
time="2023-10-20T04:27:06Z" level=debug msg="signed request" region=us-west-2 service=vpc-lattice-svcs
time="2023-10-20T04:27:06Z" level=debug msg="proxying request" request="GET /parking HTTP/1.1\r\nHost: rates-default-01faa878ea99fc2c8.7d67968.vpc-lattice-svcs.us-west-2.on.aws\r\nAccept: */*\r\nAuthorization: AWS4-HMAC-SHA256 Credential=ASIA3WRQ7TLN2BVILLTW/20231020/us-west-2/vpc-lattice-svcs/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date;x-amz-security-token, Signature=108f565a177d9cddcf638fc1d693f3a8e7fe22bebce98fe1951a3bcaa1a0b6d0\r\nUser-Agent: curl/7.76.1\r\nX-Amz-Content-Sha256: UNSIGNED-PAYLOAD\r\nX-Amz-Date: 20231020T042706Z\r\nX-Amz-Security-Token: IQoJb3JpZ2luX2VjELX//////////wEaCXVzLXdlc3QtMiJGMEQCIFvw3cGOPPEEQyxIKBCkMR2iZjQzY0phrjyEPNLgP9u5AiAuGxASz25sdTAIKljHaPQSSWD54yi+ACZN+5b9JrrmXyr6BAjO//////////8BEAIaDDgwNDMzNTM2MDczMSIMrw4AvfCj4v8yzjUmKs4ExJktUyzXK2X1HKojTnmCprAck8XBeHCGxZpLvOrq7C6FLxqeTFGj/PGeBGj5pS6WoaZ6L6YHA82f0rPLi8LE3eINTjDUqo2f85U0CdcydImJrKyLdvhHK3UdyxWHzuz7iREgNggOqhbE/XRXUID072TAozMOWPmhkfaxGygy3t3hVky5q18OgoCx+dRP6ZRHEkeMbDtVw2KwhHHp81MTVIYHqVO5TlRMq5jk3lHfn+7GY8lWT35ZZCe4b9IqCbrY25bWJG6DNwMP7CuJGMnY4RVHHJNDoYUVsNsSfIv4+UR+fdnsFIp580m0sotocPV0QvAmjMwtq+D70YZbvz2qmNMAJ076/gqBpkzipF9LGynJ1W5DCscXPLJo3xYeQoflntXINpkllt9qJjt5JQSS0IQpVvF+eF3OCMUvn3T7gVGrK2PETv1oG9gjw4IZ2/C1ChVh3WCqQjEufYHBuBzrr/BpcuxUYFO6Ib1C9KUKZYP9RL1yLyU3us0O+CRUhpTsp73TN+evaW96I61XZBN9EN6WLwrlxurshvU5pvJR+4lTWNUknCH/4GuC0HSO456m+/JTqDfu3Bgf9/Hh2pSm3xaALNYOCYVbAglT7YmIh0a9SSJhxnMXy85DiH3Q1Jdw9QkoRtF030a9jvh7Mi/Ag5NvT3NUiezrieiZPYBAFAjlw/colNg8kjhUl0SV0Gb8euwTr0wsUZ2o5zOUs5bZLUnNRA6FDqw/6x3MPFnaXAhSSlGV96Qaxv9mNp5+aTp0uGFQswEIuEvEbVBJq4owmoPIqQY6mwGRfFG/CphqeZbb70RKhWOAh41aC8F9zJIR1wTORXCJbOp2bDsf03VJHyucTKbNFmLMFVc6ZwiMusgBVKYyGX7JF0xM0pwSyCZPzpigbVMJnq8tqd2CtSlWMbhDryPE0rVLFO/BjC+lcy6UrF2KEWs8snECrOadFSBHwDk4R4bRfk2H7s+8Tnt08dWF6ZEhFtZkUFe9UJ4uo1Ztlg==\r\n\r\n"
time="2023-10-20T04:27:06Z" level=debug msg="Initial request dump:" request="GET /review HTTP/1.1\r\nHost: rates-default-01faa878ea99fc2c8.7d67968.vpc-lattice-svcs.us-west-2.on.aws\r\nAccept: */*\r\nUser-Agent: curl/7.76.1\r\n\r\n"
time="2023-10-20T04:27:06Z" level=info msg="DEBUG: Request Signature:\n---[ CANONICAL STRING  ]-----------------------------\nGET\n/review\n\nhost:rates-default-01faa878ea99fc2c8.7d67968.vpc-lattice-svcs.us-west-2.on.aws\nx-amz-content-sha256:UNSIGNED-PAYLOAD\nx-amz-date:20231020T042706Z\nx-amz-security-token:IQoJb3JpZ2luX2VjELX//////////wEaCXVzLXdlc3QtMiJGMEQCIFvw3cGOPPEEQyxIKBCkMR2iZjQzY0phrjyEPNLgP9u5AiAuGxASz25sdTAIKljHaPQSSWD54yi+ACZN+5b9JrrmXyr6BAjO//////////8BEAIaDDgwNDMzNTM2MDczMSIMrw4AvfCj4v8yzjUmKs4ExJktUyzXK2X1HKojTnmCprAck8XBeHCGxZpLvOrq7C6FLxqeTFGj/PGeBGj5pS6WoaZ6L6YHA82f0rPLi8LE3eINTjDUqo2f85U0CdcydImJrKyLdvhHK3UdyxWHzuz7iREgNggOqhbE/XRXUID072TAozMOWPmhkfaxGygy3t3hVky5q18OgoCx+dRP6ZRHEkeMbDtVw2KwhHHp81MTVIYHqVO5TlRMq5jk3lHfn+7GY8lWT35ZZCe4b9IqCbrY25bWJG6DNwMP7CuJGMnY4RVHHJNDoYUVsNsSfIv4+UR+fdnsFIp580m0sotocPV0QvAmjMwtq+D70YZbvz2qmNMAJ076/gqBpkzipF9LGynJ1W5DCscXPLJo3xYeQoflntXINpkllt9qJjt5JQSS0IQpVvF+eF3OCMUvn3T7gVGrK2PETv1oG9gjw4IZ2/C1ChVh3WCqQjEufYHBuBzrr/BpcuxUYFO6Ib1C9KUKZYP9RL1yLyU3us0O+CRUhpTsp73TN+evaW96I61XZBN9EN6WLwrlxurshvU5pvJR+4lTWNUknCH/4GuC0HSO456m+/JTqDfu3Bgf9/Hh2pSm3xaALNYOCYVbAglT7YmIh0a9SSJhxnMXy85DiH3Q1Jdw9QkoRtF030a9jvh7Mi/Ag5NvT3NUiezrieiZPYBAFAjlw/colNg8kjhUl0SV0Gb8euwTr0wsUZ2o5zOUs5bZLUnNRA6FDqw/6x3MPFnaXAhSSlGV96Qaxv9mNp5+aTp0uGFQswEIuEvEbVBJq4owmoPIqQY6mwGRfFG/CphqeZbb70RKhWOAh41aC8F9zJIR1wTORXCJbOp2bDsf03VJHyucTKbNFmLMFVc6ZwiMusgBVKYyGX7JF0xM0pwSyCZPzpigbVMJnq8tqd2CtSlWMbhDryPE0rVLFO/BjC+lcy6UrF2KEWs8snECrOadFSBHwDk4R4bRfk2H7s+8Tnt08dWF6ZEhFtZkUFe9UJ4uo1Ztlg==\n\nhost;x-amz-content-sha256;x-amz-date;x-amz-security-token\nUNSIGNED-PAYLOAD\n---[ STRING TO SIGN ]--------------------------------\nAWS4-HMAC-SHA256\n20231020T042706Z\n20231020/us-west-2/vpc-lattice-svcs/aws4_request\ndbf3738014e1e48be3d6af1e49d62806bce585c378891c0451ca2310a681f5e6\n-----------------------------------------------------"
```
::::

From the above logs, we can verify sigv4proxy container sign the request and adds the headers `Authorization`, `x-amz-content-sha256`, `x-amz-date` and `x-amz-security-token`

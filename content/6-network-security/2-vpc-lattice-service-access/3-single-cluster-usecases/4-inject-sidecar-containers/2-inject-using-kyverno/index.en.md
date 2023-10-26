---
title : "Inject using Kyverno"
weight : 22
---

## Install Kyvernon Policy Engine

Let us install the Kyverno policy engine and associated configurations into the EKS cluster using using this [Helm](https://helm.sh/)

```bash
helm repo add kyverno https://kyverno.github.io/kyverno/
helm repo update
helm install kyverno --kube-context $EKS_CLUSTER1_CONTEXT --namespace kyverno kyverno/kyverno --create-namespace
```

::::expand{header="Check Output"}

```bash
NAME: kyverno
LAST DEPLOYED: Thu Oct 26 07:07:51 2023
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
kubectl --context $EKS_CLUSTER1_CONTEXT get all -n kyverno
```

::::expand{header="Check Output"}

```bash
pod/kyverno-admission-controller-6f54d4786f-pqk7h    1/1     Running   0          38s
pod/kyverno-background-controller-696c6d575c-s94d6   1/1     Running   0          38s
pod/kyverno-cleanup-controller-79dd5858df-5ng2x      1/1     Running   0          38s
pod/kyverno-reports-controller-5fcd875795-qx4wj      1/1     Running   0          38s

NAME                                            TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)    AGE
service/kyverno-background-controller-metrics   ClusterIP   172.20.49.212    <none>        8000/TCP   39s
service/kyverno-cleanup-controller              ClusterIP   172.20.194.233   <none>        443/TCP    39s
service/kyverno-cleanup-controller-metrics      ClusterIP   172.20.221.198   <none>        8000/TCP   39s
service/kyverno-reports-controller-metrics      ClusterIP   172.20.83.241    <none>        8000/TCP   39s
service/kyverno-svc                             ClusterIP   172.20.244.9     <none>        443/TCP    39s
service/kyverno-svc-metrics                     ClusterIP   172.20.253.222   <none>        8000/TCP   39s

NAME                                            READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/kyverno-admission-controller    1/1     1            1           39s
deployment.apps/kyverno-background-controller   1/1     1            1           39s
deployment.apps/kyverno-cleanup-controller      1/1     1            1           39s
deployment.apps/kyverno-reports-controller      1/1     1            1           39s

NAME                                                       DESIRED   CURRENT   READY   AGE
replicaset.apps/kyverno-admission-controller-6f54d4786f    1         1         1       39s
replicaset.apps/kyverno-background-controller-696c6d575c   1         1         1       39s
replicaset.apps/kyverno-cleanup-controller-79dd5858df      1         1         1       39s
replicaset.apps/kyverno-reports-controller-5fcd875795      1         1         1       39s

NAME                                                      SCHEDULE       SUSPEND   ACTIVE   LAST SCHEDULE   AGE
cronjob.batch/kyverno-cleanup-admission-reports           */10 * * * *   False     0        <none>          39s
cronjob.batch/kyverno-cleanup-cluster-admission-reports   */10 * * * *   False     0        <none>          39s
```

::::


Let us create a Kyverno `ClusterPolicy` to inject sidecar and init containers automatically by annotating the deployment with `vpc-lattices-svcs.amazonaws.com/agent-inject` set to `true`. Note this annotation is configured in the below `ClusterPolicy`.

```bash
cat > manifests/kyverno-cluster-policy.yaml <<EOF
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
kubectl --context $EKS_CLUSTER1_CONTEXT apply -f manifests/kyverno-cluster-policy.yaml
```

::::expand{header="Check Output"}
```bash
clusterpolicy.kyverno.io/inject-sidecar created
```
::::

Ensure that Kyvero ClusterPolicy is configured properly.

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT get ClusterPolicy 
```

::::expand{header="Check Output"}
```bash
NAME             BACKGROUND   VALIDATE ACTION   READY   AGE   MESSAGE
inject-sidecar   true         Audit             True    38s   Ready
```
::::

Let us first delete the `app1-v1` deployment and then re-deploy it.

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT delete deploy app1-v1 -n app1
```

::::expand{header="Check Output"}
```bash
deployment.apps "app1-v1" deleted
```
::::

::alert[Note that the required annotation `vpc-lattices-svcs.amazonaws.com/agent-inject=true` is already configured in the pod template within the deployment spec in the `templates/app-template.yaml`]{header="Note"}


```yaml
kubectl --context $EKS_CLUSTER1_CONTEXT apply -f manifests/app1-v1-deploy.yaml
```

::::expand{header="Check Output"}
```bash
namespace/app1 unchanged
deployment.apps/app1-v1 created
service/app1-v1 unchanged
```
::::

Ensure that client Service `app1-v1` pods are re-deployed with Init and SIGV4 Proxy containers.

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT get pod -n app1
```
Notice that `app1-v1` Service pods shows two containers as `2/2`.

```bash 
NAME                       READY   STATUS    RESTARTS   AGE
app1-v1-85df49c9bc-9flkr   2/2     Running   0          34s
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
(4/6): bind-libs-lite-9.11.4-26.P2.amzn2.13.5.x86_64.rpm                     | 1.1 MB  00:00:00     
(5/6): bind-utils-9.11.4-26.P2.amzn2.13.5.x86_64.rpm                         | 261 kB  00:00:00     
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


Exec into an `app1-v1` pod to check connectivity to `app2` service. 

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
< Content-Length: 63
< Content-Type: text/plain; charset=utf-8
< Date: Thu, 26 Oct 2023 07:25:47 GMT
< 
Requsting to Pod(app2-v1-56f7c48bbf-jwx4s): Hello from app2-v1
* Connection #0 to host app2-app2-0e5f3d2b3db4c7962.7d67968.vpc-lattice-svcs.us-west-2.on.aws left intact
```
::::

Since we are signing the requests using the sigv4proxy proxy container, access to `app2` is now allowed. The logs from the `app1-v1` does not show the SIGV4 authentication headers. For that, let us look at the sigv4proxy container logs.


```bash
kubectl --context $EKS_CLUSTER1_CONTEXT logs  deploy/app1-v1 -n app1 -c sigv4proxy
```


::::expand{header="Check Output"}
```bash
time="2023-10-26T07:22:31Z" level=info msg="Stripping headers []" StripHeaders="[]"
time="2023-10-26T07:22:31Z" level=info msg="Listening on :8080" port=":8080"
time="2023-10-26T07:25:47Z" level=debug msg="Initial request dump:" request="GET / HTTP/1.1\r\nHost: app2-app2-0e5f3d2b3db4c7962.7d67968.vpc-lattice-svcs.us-west-2.on.aws\r\nAccept: */*\r\nUser-Agent: curl/7.76.1\r\n\r\n"
time="2023-10-26T07:25:47Z" level=info msg="DEBUG: Request Signature:\n---[ CANONICAL STRING  ]-----------------------------\nGET\n/\n\nhost:app2-app2-0e5f3d2b3db4c7962.7d67968.vpc-lattice-svcs.us-west-2.on.aws\nx-amz-content-sha256:UNSIGNED-PAYLOAD\nx-amz-date:20231026T072547Z\nx-amz-security-token:IQoJb3JpZ2luX2VjEEgaCXVzLXdlc3QtMiJHMEUCIHr8VVRlxJfdzdcC7eohhQ1vHENc5PX6XtWmxSsQNCtUAiEAmdEd/j4lthvGiCdxG6PZKbv9fcTaSpOZThJIJIOaL4kq7gQIcRACGgw4OTcwODYwMDg2ODAiDKzaERmv3Qm0ynATqirLBPdhyf1ig1u5MHIQC9pjpzO0h18q+J41LM4oWWVfmmGmiXDOAB/bCyRfb4HsYUa9MXKLBGlfJMwYzHqHje+lFFiOTYsvihkJSedbI8i3E+0qF/7QOwfXeTuSo9ETJfypntU6KhrfuaiaIVChMo2Zf6yCxBJNPqOA8BdDKafG6aSGy4+evKhr3d901OhbswL/awTgEbW2nQTyS73JRSGzLIz4YWFFIJJqUKJvf46rd36RcUUGZYGa3NiXCN5nMUx6Ra2/6jDo7cqKIWit5/fR6MxH2+mLg19fJKrOO76ykbqy9uIE+UbrhMh+j39lYJ6QiE8V/aA+FTGoYGC2KwqX0AEgnMKTRKlkUPccQ0INQykBW04O9pTnf9sHTmZ5OxJN7kX+vh0KdnG1jnru0WAr8qlNp/cjhaOl8UUZugGzUR9LBsq555hX5CeLLaH/LssUQ7adiL5oDoC06FYf9JsiprSfwydIu1JRXiedHANH3Szeqs/Gbi1PyvPtiz81swNo6o8l8dkELBOZwGHktqblDnHguzRAIePZJuOUh+HAI0uXfrf4/r62sLr2HlTiWki/56MmCWYHs8BefXaxOQVey/p9ATik6DlF8M/4Tdx2R88x9qR8+BUo/2dMpUiJ7VmntoeZqJfEO3vgiRqXZlWW4OExsWqEj5xcFcrG7K51oWEif0lqrU8/bXGijo/ob/5ZSy6ZB8Xog2EPsmOhxfzBnQGnQKb8Ch1pxlBsHkagAJieNuWDSAEJQYXcm9oetcRWoDZLrXNCufF4wDIuMPuo6KkGOpoBIoOitYQDY0fMdynLhVxvFPlZUXhsLFeiiUHB8fzAMk/ek+5ER7Si6lFL5nQnIsWTjio77mP6wpTaPiWaD5VRzaudFRkE+h1IRBuQbHz1JQ3bhXutwCgZ/cYc3X65yIQPwnRShgZ77PSbhCKbadPVWX9lwKmcWAlAETJ2GQIBQk7OHis1ecN55QBH0k6sZ8Iwbw41DHIoVKCxrg==\n\nhost;x-amz-content-sha256;x-amz-date;x-amz-security-token\nUNSIGNED-PAYLOAD\n---[ STRING TO SIGN ]--------------------------------\nAWS4-HMAC-SHA256\n20231026T072547Z\n20231026/us-west-2/vpc-lattice-svcs/aws4_request\n95f0fc09d833aeacbcb2b2c29cc95ff8f2fba713481cabb0e5c1bf48df85cf65\n-----------------------------------------------------"
time="2023-10-26T07:25:47Z" level=debug msg="signed request" region=us-west-2 service=vpc-lattice-svcs
time="2023-10-26T07:25:47Z" level=debug msg="proxying request" request="GET / HTTP/1.1\r\nHost: app2-app2-0e5f3d2b3db4c7962.7d67968.vpc-lattice-svcs.us-west-2.on.aws\r\nAccept: */*\r\nAuthorization: AWS4-HMAC-SHA256 Credential=ASIA5BXT6FVUEGG7EW5U/20231026/us-west-2/vpc-lattice-svcs/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date;x-amz-security-token, Signature=b31acfc797a322b2ccd16e5892d7d4e92ff28555538ad50e849fe943c10bd1ee\r\nUser-Agent: curl/7.76.1\r\nX-Amz-Content-Sha256: UNSIGNED-PAYLOAD\r\nX-Amz-Date: 20231026T072547Z\r\nX-Amz-Security-Token: IQoJb3JpZ2luX2VjEEgaCXVzLXdlc3QtMiJHMEUCIHr8VVRlxJfdzdcC7eohhQ1vHENc5PX6XtWmxSsQNCtUAiEAmdEd/j4lthvGiCdxG6PZKbv9fcTaSpOZThJIJIOaL4kq7gQIcRACGgw4OTcwODYwMDg2ODAiDKzaERmv3Qm0ynATqirLBPdhyf1ig1u5MHIQC9pjpzO0h18q+J41LM4oWWVfmmGmiXDOAB/bCyRfb4HsYUa9MXKLBGlfJMwYzHqHje+lFFiOTYsvihkJSedbI8i3E+0qF/7QOwfXeTuSo9ETJfypntU6KhrfuaiaIVChMo2Zf6yCxBJNPqOA8BdDKafG6aSGy4+evKhr3d901OhbswL/awTgEbW2nQTyS73JRSGzLIz4YWFFIJJqUKJvf46rd36RcUUGZYGa3NiXCN5nMUx6Ra2/6jDo7cqKIWit5/fR6MxH2+mLg19fJKrOO76ykbqy9uIE+UbrhMh+j39lYJ6QiE8V/aA+FTGoYGC2KwqX0AEgnMKTRKlkUPccQ0INQykBW04O9pTnf9sHTmZ5OxJN7kX+vh0KdnG1jnru0WAr8qlNp/cjhaOl8UUZugGzUR9LBsq555hX5CeLLaH/LssUQ7adiL5oDoC06FYf9JsiprSfwydIu1JRXiedHANH3Szeqs/Gbi1PyvPtiz81swNo6o8l8dkELBOZwGHktqblDnHguzRAIePZJuOUh+HAI0uXfrf4/r62sLr2HlTiWki/56MmCWYHs8BefXaxOQVey/p9ATik6DlF8M/4Tdx2R88x9qR8+BUo/2dMpUiJ7VmntoeZqJfEO3vgiRqXZlWW4OExsWqEj5xcFcrG7K51oWEif0lqrU8/bXGijo/ob/5ZSy6ZB8Xog2EPsmOhxfzBnQGnQKb8Ch1pxlBsHkagAJieNuWDSAEJQYXcm9oetcRWoDZLrXNCufF4wDIuMPuo6KkGOpoBIoOitYQDY0fMdynLhVxvFPlZUXhsLFeiiUHB8fzAMk/ek+5ER7Si6lFL5nQnIsWTjio77mP6wpTaPiWaD5VRzaudFRkE+h1IRBuQbHz1JQ3bhXutwCgZ/cYc3X65yIQPwnRShgZ77PSbhCKbadPVWX9lwKmcWAlAETJ2GQIBQk7OHis1ecN55QBH0k6sZ8Iwbw41DHIoVKCxrg==\r\n\r\n"
WSParticipantRole:~/environment $ 
```
::::

From the above logs, we can verify sigv4proxy container sign the request and adds the headers `Authorization`, `x-amz-content-sha256`, `x-amz-date` and `x-amz-security-token`


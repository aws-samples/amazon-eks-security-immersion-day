---
title : "Inject using Kyverno"
weight : 12
---

We are going to dynamically inject the sigv4 sidecar proxy with Kyverno

![](/static/images/6-network-security/2-vpc-lattice-service-access/lattice-usecase3-3.png)

## Install Kyverno Policy Engine

Kyverno is a security tool for kubernetes that can enforce security guardrails when deploying application and that can also mutate objects before they are stored into etcd database. We are going to leverage it's mutation capability to dynamically inject the sigv4-proxy to the required pods.

Let us install the Kyverno policy engine and associated configurations into the EKS cluster using using [eksdemo](https://github.com/awslabs/eksdemo)

```bash
eksdemo install policy kyverno -c $EKS_CLUSTER1_NAME
```

::::expand{header="Check Output"}
```
Downloading Chart: https://kyverno.github.io/kyverno/kyverno-v2.5.2.tgz
Helm installing...
2024/02/20 14:26:36 creating 1 resource(s)
2024/02/20 14:26:37 creating 32 resource(s)
Using chart version "v2.5.2", installed "policy-kyverno" version "v1.7.2" in namespace "kyverno"
NOTES:
Chart version: v2.5.2
Kyverno version: v1.7.2

Thank you for installing kyverno! Your release is named policy-kyverno.
⚠️  WARNING: Setting replicas count below 3 means Kyverno is not running in high availability mode.

💡 Note: There is a trade-off when deciding which approach to take regarding Namespace exclusions. Please see the documentation at https://kyverno.io/docs/installation/#security-vs-operability to understand the risks.
```

::::

Ensure the kyverno is installed and running fine.

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT get all -n kyverno
```

::::expand{header="Check Output"}
```
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
                image: public.ecr.aws/seb-demo/aws-sigv4-proxy:latest
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
```
clusterpolicy.kyverno.io/inject-sidecar created
```
::::


Ensure that Kyvero ClusterPolicy is configured properly.

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT get ClusterPolicy 
```

::::expand{header="Check Output"}
```
NAME                   ADMISSION   BACKGROUND   VALIDATE ACTION   READY   AGE   MESSAGE
inject-sidecar         true        true         Audit             True    58s   Ready
```
::::

Let us first force the `app1-v1` deployment to redeploy.

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT rollout restart deployment/app1-v1 -n app1
```

::::expand{header="Check Output"}
```
deployment.apps/app1-v1 restarted
```
::::

::alert[Note that the required annotation `vpc-lattices-svcs.amazonaws.com/agent-inject=true` is already configured in the pod template within the deployment spec in the `templates/app-template.yaml`]{header="Note"}

Ensure that client Service `app1-v1` pods are re-deployed with Init and SIGV4 Proxy containers.

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT get pod -n app1
```
Notice that `app1-v1` Service pods shows two containers as `2/2`.

```bash 
NAME                       READY   STATUS    RESTARTS   AGE
app1-v1-85df49c9bc-9flkr   2/2     Running   0          34s
``` 

Exec into an `app1-v1` pod to check connectivity to `app2` service. 

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/app1-v1 -c app1-v1 -n app1 -- curl -s $app2DNS
```

::::expand{header="Check Output"}
```
Requsting to Pod(app2-v1-5df5598b86-jfjlj): Hello from app2-v1
```
::::

Since we are signing the requests using the sigv4proxy proxy container, access to `app2` is now again allowed. The logs from the `app1-v1` does not show the SIGV4 authentication headers. For that, let us look at the sigv4proxy container logs.


```bash
kubectl --context $EKS_CLUSTER1_CONTEXT logs  deploy/app1-v1 -n app1 -c sigv4proxy
```


::::expand{header="Check Output"}
```
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

::::alert{type="info" header="Note:"}
The Signing sidecar was automatically added to our application thanks to the Kyverno `ClusterPolicy`, so we can benefit from Sigv4 signature used by VPC lattice without application changes. 


While this setup is possible, we recommend for better performances to integrate the Sigv4 signature directly into your code with the AWS SDKs, so you do not need a sidecar proxy container for the signature.
::::
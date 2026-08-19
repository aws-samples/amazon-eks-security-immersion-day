---
title : "Use a Proxy to implement SIGv4"
weight : 11
---

As an alternative, in the case of you are not able to change your application code to integrate with AWS SDK in order to sign the request, you can rely on a sidecar Proxy to do the work without changing your application.

By relying on **[AWS SIGv4 Proxy container](https://github.com/awslabs/aws-sigv4-proxy)**: you can delegate automatically the requests's signing by using the credentials obtained by AWS IAM role of Pod Identity in Amazon EKS. It provides various configuration options including `--name vpc-lattice-svcs`, `--unsigned-payload` flag and logging options. 

The proxy container will listen on port 8080 and run as user `101`. The YAML snippet will look like below.

```yaml
      - name: sigv4proxy
        image: public.ecr.aws/aws-observability/aws-sigv4-proxy:latest
        args: [
          "--unsigned-payload",
          "--log-failed-requests",
          "-v", "--log-signing-process",
          "--name", "vpc-lattice-svcs",
          "--region", "us-west-2",
          "--upstream-url-scheme", "http"
        ]
        ports:
        - containerPort: 8080
          name: proxy
          protocol: TCP
        securityContext:
          runAsUser: 101 
```

We also need an **Init container**: It configures the iptables to intercept any traffic from `app1` Service going to Amazon VPC Lattice services and redirect traffic to the AWS SigV4 Proxy.

It uses `iptables` utility to route the traffic connecting to Amazon VPC Lattice CIDR `169.254.171.0/24` to `EGRESS_PROXY` chain, and redirect the traffic to local port 8080. To avoid infinite loops when the traffic is sent by the proxy container, it is identified by checking whether the UID is `101` to ensure that it won’t be redirect again. The YAML snippet will look like below.

We uses an ini container to setup the appropriate iptables routing rules:

```yaml
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
```

## Inject manually

In this section, let us re-deploy the client Service `app1-v1` Deployment by manually adding Init and SIGV4 Proxy containers.

![](/static/images/6-network-security/2-vpc-lattice-service-access/lattice-usecase3-2.png)

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
        image: public.ecr.aws/seb-demo/http-server:latest
        env:
        - name: PodName
          value: "Hello from app1-v1"
      - name: sigv4proxy
        image: public.ecr.aws/seb-demo/aws-sigv4-proxy
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
```
deployment.apps/app1-v1 configured
```
::::

Ensure that client Service `app1-v1` pods are re-deployed with Init and SIGV4 Proxy containers.

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT -n app1 get pod
```
Notice that `app1-v1` Service pods shows two containers as `2/2`.

```
NAME                      READY   STATUS    RESTARTS   AGE
app1-v1-df98f6c96-zql6d   2/2     Running   0          32s
```

Exec into an `app1-v1` pod to check connectivity to `app2`service. 

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/app1-v1 -c app1-v1 -n app1 -- curl $app2DNS
```

::::expand{header="Check Output"}
```
Requsting to Pod(app2-v1-56f7c48bbf-nl6gg): Hello from app2-v1
```
::::

Since we are signing the requests using the sigv4proxy proxy container, access to `app2` is now allowed. The logs from the `app1-v1` does not show the SIGV4 authentication headers. For that, let us look at the sigv4proxy container logs.


```bash
kubectl --context $EKS_CLUSTER1_CONTEXT logs  deploy/app1-v1 -n app1 -c sigv4proxy
```


::::expand{header="Check Output"}
```
time="2023-10-26T06:50:27Z" level=info msg="Stripping headers []" StripHeaders="[]"
time="2023-10-26T06:50:27Z" level=info msg="Listening on :8080" port=":8080"
time="2023-10-26T06:56:04Z" level=debug msg="Initial request dump:" request="GET / HTTP/1.1\r\nHost: app2-app2-0e5f3d2b3db4c7962.7d67968.vpc-lattice-svcs.us-west-2.on.aws\r\nAccept: */*\r\nUser-Agent: curl/7.76.1\r\n\r\n"
time="2023-10-26T06:56:04Z" level=info msg="DEBUG: Request Signature:\n---[ CANONICAL STRING  ]-----------------------------\nGET\n/\n\nhost:app2-app2-0e5f3d2b3db4c7962.7d67968.vpc-lattice-svcs.us-west-2.on.aws\nx-amz-content-sha256:UNSIGNED-PAYLOAD\nx-amz-date:20231026T065604Z\nx-amz-security-token:REDACTED\n\nhost;x-amz-content-sha256;x-amz-date;x-amz-security-token\nUNSIGNED-PAYLOAD\n---[ STRING TO SIGN ]--------------------------------\nAWS4-HMAC-SHA256\n20231026T065604Z\n20231026/us-west-2/vpc-lattice-svcs/aws4_request\na9ad703a2c3c4191391016ed99f056dcfc7a0e55cc9f490c296bc4d5bd288239\n-----------------------------------------------------"
time="2023-10-26T06:56:04Z" level=debug msg="signed request" region=us-west-2 service=vpc-lattice-svcs
time="2023-10-26T06:56:04Z" level=debug msg="proxying request" request="GET / HTTP/1.1\r\nHost: app2-app2-0e5f3d2b3db4c7962.7d67968.vpc-lattice-svcs.us-west-2.on.aws\r\nAccept: */*\r\nAuthorization: AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/20231026/us-west-2/vpc-lattice-svcs/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date;x-amz-security-token, Signature=REDACTED\r\nUser-Agent: curl/7.76.1\r\nX-Amz-Content-Sha256: UNSIGNED-PAYLOAD\r\nX-Amz-Date: 20231026T065604Z\r\nX-Amz-Security-Token: REDACTED\r\n\r\n"
time="2023-10-26T06:56:48Z" level=debug msg="Initial request dump:" request="GET / HTTP/1.1\r\nHost: app2-app2-0e5f3d2b3db4c7962.7d67968.vpc-lattice-svcs.us-west-2.on.aws\r\nAccept: */*\r\nUser-Agent: curl/7.76.1\r\n\r\n"
time="2023-10-26T06:56:48Z" level=info msg="DEBUG: Request Signature:\n---[ CANONICAL STRING  ]-----------------------------\nGET\n/\n\nhost:app2-app2-0e5f3d2b3db4c7962.7d67968.vpc-lattice-svcs.us-west-2.on.aws\nx-amz-content-sha256:UNSIGNED-PAYLOAD\nx-amz-date:20231026T065648Z\nx-amz-security-token:REDACTED\n\nhost;x-amz-content-sha256;x-amz-date;x-amz-security-token\nUNSIGNED-PAYLOAD\n---[ STRING TO SIGN ]--------------------------------\nAWS4-HMAC-SHA256\n20231026T065648Z\n20231026/us-west-2/vpc-lattice-svcs/aws4_request\naf4f1875822274fc8c3487f8b4375a2c52bbf41fdd728977acd2f4f36f15280a\n-----------------------------------------------------"
time="2023-10-26T06:56:48Z" level=debug msg="signed request" region=us-west-2 service=vpc-lattice-svcs
time="2023-10-26T06:56:48Z" level=debug msg="proxying request" request="GET / HTTP/1.1\r\nHost: app2-app2-0e5f3d2b3db4c7962.7d67968.vpc-lattice-svcs.us-west-2.on.aws\r\nAccept: */*\r\nAuthorization: AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/20231026/us-west-2/vpc-lattice-svcs/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date;x-amz-security-token, Signature=REDACTED\r\nUser-Agent: curl/7.76.1\r\nX-Amz-Content-Sha256: UNSIGNED-PAYLOAD\r\nX-Amz-Date: 20231026T065648Z\r\nX-Amz-Security-Token: REDACTED\r\n\r\n"
```
::::

From the above logs, we can verify sigv4proxy container sign the request and adds the headers `Authorization`, `x-amz-content-sha256`, `x-amz-date` and `x-amz-security-token`

Before moving to the next section, let us undo the manual changes to the `app1-v1` deployment by deleting the deployment and then re-deploy the original configuration.

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT delete deploy app1-v1 -n app1
```

::::expand{header="Check Output"}
```
deployment.apps "app1-v1" deleted
```
::::

Re-deploy the `app-v1` deployment.

```bash
cd ~/environment
kubectl --context $EKS_CLUSTER1_CONTEXT apply -f manifests/app1-v1-deploy.yaml
```

::::expand{header="Check Output"}
```
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
```
NAME                       READY   STATUS    RESTARTS   AGE
app1-v1-5cc757c998-9trw5   1/1     Running   0          31s
```
::::


Now the flows between app1 and app2 is not working again through VPC lattice

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/app1-v1 -c app1-v1 -n app1 -- curl $app2DNS

```

::::expand{header="Check Output" defaultExpanded=true}
```
AccessDeniedException: User: anonymous is not authorized to perform: vpc-lattice-svcs:Invoke on resource: arn:aws:vpc-lattice:us-west-2:097381749469:service/svc-061f66f60654b5c6f/ because no network-based policy allows the vpc-lattice-svcs:Invoke action
```
::::
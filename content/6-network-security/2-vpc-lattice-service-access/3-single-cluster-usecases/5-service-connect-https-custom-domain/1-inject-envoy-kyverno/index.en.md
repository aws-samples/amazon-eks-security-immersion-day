---
title : "Use envoy proxy to sign requests"
weight : 26
---

In this module let's see how we can use envoy proxy to do the signv4 signature of our requests and proxify https requests to VPC lattice, and again we will rely on Kyverno to dynamically inject the sidecar configuration into the application pod

![](/static/images/6-network-security/2-vpc-lattice-service-access/lattice-usecase4-kyverno.png)

First, check that Kyverno is installed:

```bash
eksdemo install policy kyverno -c $EKS_CLUSTER1_NAME
```

::::expand{header="Check Output"}
```
Downloading Chart: https://kyverno.github.io/kyverno/kyverno-v2.5.2.tgz
Helm installing...
Error: helm install failed: cannot re-use a name that is still in use
```
::::

Let us create a Kyverno ClusterPolicy to inject envoy sidecar and init containers automatically by annotating the target deployment with `vpc-lattices-svcs.amazonaws.com/agent-inject` set to `true`. Note this annotation is configured in the below ClusterPolicy.

```bash
cat > manifests/kyverno-cluster-policy-envoy.yaml <<EOF
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: inject-sidecar-envoy
  annotations:
    policies.kyverno.io/title: Inject Envoy Sidecar Container
spec:
  rules:
  - name: inject-sidecar-envoy
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
                command: # Adding --uid-owner 0 (envoy) here to prevent traffic from envoy proxy itself from being redirected, which prevents an infinite loop
                - /bin/sh
                - -c
                - >
                  iptables -t nat -N EGRESS_PROXY;
                  iptables -t nat -A OUTPUT -p tcp -d 169.254.171.0/24 -j EGRESS_PROXY;
                  iptables -t nat -A EGRESS_PROXY -m owner --gid-owner 0 -j RETURN;
                  iptables -t nat -A EGRESS_PROXY -p tcp -j REDIRECT --to-ports 8080;
                  iptables -t nat -L -n -v;
              containers: 
              - name: envoy-sigv4
                image: public.ecr.aws/seb-demo/envoy-sigv4:v0.5
                securityContext:
                  runAsGroup: 0
                env:
                - name: APP_DOMAIN
                  value: "vpc-lattice-custom-domain.io"
                - name: CA_ARN
                  value: "$CA_ARN"                   
                                
                args: [
                    "-l", "info"
                ]
                ports:
                - containerPort: 8080
                  name: proxy
                  protocol: TCP
EOF
kubectl --context $EKS_CLUSTER1_CONTEXT apply -f manifests/kyverno-cluster-policy-envoy.yaml
```

Let's force restart of our app1:

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT rollout restart deployment/app1-v1 -n app1
```

No try again to connect to our service:


```bash
kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/app1-v1 -n app1 -c app1-v1 -- /bin/bash -c '\
curl http://app4.vpc-lattice-custom-domain.io'
```

::::expand{header="Check Output" defaultExpanded=true}
```
Requsting to Pod(app4-v1-85d4d9c455-7hwmx): Hello from app4-v1
```
::::

You can see the logs of the envoy proxy computing the sigv4 signature by looking at the logs:

```bash
kubectl stern --context $EKS_CLUSTER1_CONTEXT -n app1 app1 -c envoy-sigv4 --tail=10 | grep token
```


::::alert{type="info" header="Congratulation!!"}
With this setup, we do not need to make any change into our application code:
- We let our app connect to the remote application in HTTP. (note: the app4 service does not listen on HTTP) 
- The iptable rule, redirect the traffic to the envoy proxy in HTTP (using local host)
- Envoy proxy sign the request, and proxify it to the lattice service in HTTPS, using PCA certificate, installed by the docker entrypoint.
- VPC Lattice receive the request in HTTPS with valid sigv4 signature. It verify the signature, extract the IAM session tags, and checks with the service IAM Policy that the entity is allowed to access the service.
- The app4 service receive an HTTP request from the VPC Lattice service, and can respond to the requester through VPC lattice.
::::
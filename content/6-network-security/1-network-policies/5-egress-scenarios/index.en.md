---
title : "Egress Traffic Scenarios"
weight : 24
---



WSParticipantRole:~/environment $ kubectl get netpol -A
No resources found


## Scenario #6: Deny all egress from client-one pod

In this scenario, we will block all the egress traffic from a **client-one** pod

![sc6-deny-egress-from-client-one](/static/images/6-network-security/1-network-policies/sc6-deny-egress-from-client-one.png)

### Deploy the Network Policy

Before applying the network policy, let us see how the configuration looks like.

```bash
cat policies/06-deny-egress-from-client-one.yaml
```

The output will look like below

```yaml
kind: NetworkPolicy
apiVersion: networking.k8s.io/v1
metadata:
  name: client-one-deny-egress
spec:
  podSelector:
    matchLabels:
      app: client-one
  egress: []
  policyTypes:
  - Egress
```

The `client-one-deny-egress` network policy selects the `client-one` application pods using the `podSelector` configuration which uses the pod labels i.e. `app: client-one`. The `Egress` configuration inside the `policyTypes` field is empty and **does not** have any egress traffic, which means all egress / outgoing traffic is blocked from the `client-one` pod.

Let us apply the `client-one-deny-egress` network policy.

```bash
kubectl apply -f policies/06-deny-egress-from-client-one.yaml
```

::::expand{header="Check Output"}
```bash
networkpolicy.networking.k8s.io/client-one-deny-egress created
```
::::

### Verify connectivity between the client-one and demo-app pods in the same namespace

Test the connectivity from **client-one** pod to **demo-app** pod with in same `default` namespace.

```bash
kubectl exec -it client-one -- curl --max-time 3 demo-app
```
You would see below response for each command, indicating timeout error, as client-one pod is **not able to lookup/resolve** the demo-app service ip address.

::::expand{header="Check Output"}
```bash
curl: (28) Resolving timed out after 3000 milliseconds
command terminated with exit code 28
```
::::

## Scenario #7: Allow egress to a specific port(53) on coredns from client-one pod

In this scenario, we will allow egress traffic to a specific **port(53)** on **coredns** from **client-one** pod

![sc7-egree-to-coredns](/static/images/6-network-security/1-network-policies/sc7-egree-to-coredns.png)

### Deploy the Network Policy

Before applying the network policy, let us see how the configuration looks like.

```bash
cat policies/07-allow-egress-to-coredns.yaml
```

The output will look like below

```yaml
kind: NetworkPolicy
apiVersion: networking.k8s.io/v1
metadata:
  name: client-one-allow-egress-coredns
spec:
  podSelector:
    matchLabels:
      app: client-one
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: kube-system
      podSelector:
        matchLabels:
          k8s-app: kube-dns
    ports:
    - port: 53
      protocol: UDP
```

The `client-one-allow-egress-coredns` network policy configires `egress` section with `namespaceSelector`, `podSelector` and `ports` to select a specific port/protocol for the `kube-dns` pod in the `kube-system` namespace.

Let us apply the `client-one-allow-egress-coredns` network policy.

```bash
kubectl apply -f policies/07-allow-egress-to-coredns.yaml
```

::::expand{header="Check Output"}
```bash
networkpolicy.networking.k8s.io/client-one-allow-egress-coredns created
```
::::

### Verify connectivity between the client-one and demo-app pods in the same namespace

Test the connectivity from **client-one** pod to **demo-app** pod with in same `default` namespace.

```bash
kubectl exec -it client-one -- curl --max-time 3 -v demo-app
```
Now, **client-one** app pod is able to communicate with **coredn** pod in `kube-system` namespace to resolve the service ip of **demo-app**, but failed to connect to **demo-app** due to missing egress rule.

::::expand{header="Check Output"}
```bash
* processing: demo-app
*   Trying 172.20.107.125:80...
* Connection timed out after 3003 milliseconds
* Closing connection
curl: (28) Connection timed out after 3003 milliseconds
command terminated with exit code 28
```
::::


## Scenario #8: Allow egress to coredna and demo-app from client-one pod


In this scenario, we will block all the egress traffic from **client-one** pod to **coredns** and **demo-app(())
]
![sc8-allow-egress-coredns-demo-app](/static/images/6-network-security/1-network-policies/sc8-allow-egress-coredns-demo-app.png)

### Deploy the Network Policy

Before applying the network policy, let us see how the configuration looks like.

```bash
cat policies/08-allow-egress-to-demo-app.yaml
```

The output will look like below

```yaml
kind: NetworkPolicy
apiVersion: networking.k8s.io/v1
metadata:
  name: client-one-allow-egress-demo-app
spec:
  podSelector:
    matchLabels:
      app: client-one
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: kube-system
      podSelector:
        matchLabels:
          k8s-app: kube-dns
    ports:
    - port: 53
      protocol: UDP
  - to:
    - podSelector:
        matchLabels:
          app: demo-app
    ports:
    - port: 80
      protocol: TCP
```

The `client-one-allow-egress-demo-app` network policy includes one more `to` section inside the `egress` configuration to use `podSelector` to select **demo-app** pods.

Let us apply the `client-one-allow-egress-demo-app` network policy.

```bash
kubectl apply -f policies/08-allow-egress-to-demo-app.yaml
```

::::expand{header="Check Output"}
```bash
networkpolicy.networking.k8s.io/client-one-allow-egress-demo-app created
```
::::

### Verify connectivity between the client-one and demo-app pods in the same namespace

Test the connectivity from **client-one** pod to **demo-app** pod with in same `default` namespace.

```bash
kubectl exec -it client-one -- curl --max-time 3 demo-app
```
You would see below response indicating a successful API i.e. **client-one** is able to resolve the ip address and connect to the **demo-app** on port 80 successfully.

::::expand{header="Check Output"}
```bash
<!DOCTYPE html>
<html>
  <head>
    <title>Welcome to Amazon EKS!</title>
    <style>
        html {color-scheme: light dark;}
        body {width: 35em; margin: 0 auto; font-family: Tahoma, Verdana, Arial, sans-serif;}
    </style>
  </head>
  <body>
    <h1>Welcome to Amazon EKS!</h1>
    <p>If you see this page, you are able successfully access the web application as the network policy allows.</p>
    <p>For online documentation and installation instructions please refer to
      <a href="https://docs.aws.amazon.com/eks/latest/userguide/eks-networking.html">Amazon EKS Networking</a>.<br/><br/>
      The migration guides are available at
      <a href="https://docs.aws.amazon.com/eks/latest/userguide/eks-networking.html">Amazon EKS Network Policy Migration</a>.
    </p>
    <p><em>Thank you for using Amazon EKS.</em></p>
</body>
</html>
```
::::




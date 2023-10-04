---
title : "Ingress Traffic Scenarios"
weight : 23
---

## Scenario #1: Deny/Block all the ingress traffic to Demo app

In this scenario, we will block the all the traffic from all clients to the **demo-app** in `default` namesapce.

![sc2-deny-all](/static/images/6-network-security/1-network-policies/sc2-deny-all.png)

### Deploy the Network Policy

Before applying the network policy, let us see how the configuration looks like.

```bash
cat policies/01-deny-all-ingress.yaml
```

The output will look like below

```yaml
kind: NetworkPolicy
apiVersion: networking.k8s.io/v1
metadata:
  name: demo-app-deny-all
spec:
  podSelector:
    matchLabels:
      app: demo-app
  policyTypes:
  - Ingress
```

The `demo-app-deny-all` network policy selects the `demo-app` application pods using the `podSelector` configuration which uses the pod labels i.e. `app: demo-app`. The `Ingress` configuration inside the `policyTypes` field is empty and **does not** have any ingress traffic, which means all traffic is blocked to the `demo-app` pod.

Let us apply the `demo-app-deny-all` network policy.

```bash
kubectl apply -f policies/01-deny-all-ingress.yaml
```

::::expand{header="Check Output"}
```bash
networkpolicy.networking.k8s.io/demo-app-deny-all created
```
::::

### Verify connectivity between the pods in the same namespace

Test the connectivity from **client pod** to **demo-app** pod with in same `default` namespace.

```bash
kubectl exec -it client-one -- curl --max-time 3 demo-app
kubectl exec -it client-two -- curl --max-time 3 demo-app
```
You would see below response for each command, indicating timeout error.

::::expand{header="Check Output"}
```bash
curl: (28) Connection timed out after 3001 milliseconds
command terminated with exit code 28
```
::::

### Verify connectivity between the pods across namespaces

Test the connectivity from **another client pod** from `another-ns` namespace to **demo-app** pod in the `default` namespace.

```bash
kubectl exec -it another-client-one -n another-ns -- curl --max-time 3 demo-app.default
kubectl exec -it another-client-two -n another-ns -- curl --max-time 3 demo-app.default
```
You would see below response for each command, indicating timeout error.

::::expand{header="Check Output"}
```bash
curl: (28) Connection timed out after 3001 milliseconds
command terminated with exit code 28
```
::::

## Scenario #2: Allow ingress traffic from within same (default) namespace to Demo app

In this scenario, we will allow the traffic from all clients from within the same name (`default`) namespace to the **demo-app**.

![sc3-allow-same-ns](/static/images/6-network-security/1-network-policies/sc3-allow-same-ns.png)

### Deploy the Network Policy

Before applying the network policy, let us see how the configuration looks like.

```bash
cat policies/02-allow-ingress-from-samens.yaml
```

```yaml
kind: NetworkPolicy
apiVersion: networking.k8s.io/v1
metadata:
  name: demo-app-allow-samens
spec:
  podSelector:
    matchLabels:
      app: demo-app
  ingress:
  - from:
      - namespaceSelector:
          matchLabels:
            kubernetes.io/metadata.name: default
```
The `demo-app-allow-samens` network policy configures `ingress`  block with the `namespaceSelector` field in the `from` section, to select the `default` namespace using the labels `kubernetes.io/metadata.name: default`. Using `namespaceSelector` allows to apply the configuration to all the pods in the selected namespace.


Let us apply the `demo-app-allow-samens` network policy.

```bash
kubectl apply -f policies/02-allow-ingress-from-samens.yaml
```

::::expand{header="Check Output"}
```bash
networkpolicy.networking.k8s.io/demo-app-allow-samens created
```
::::

### Verify connectivity between the pods in the same namespace

Test the connectivity from **client pod** to **demo-app** pod with in same `default` namespace.

```bash
kubectl exec -it client-one -- curl --max-time 3 demo-app
kubectl exec -it client-two -- curl --max-time 3 demo-app
```
You would see below response for each command, indicating successful API call.

::::expand{header="Check Output"}
```html
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

### Verify connectivity between the pods across namespaces

Test the connectivity from **another client pod** from `another-ns` namespace to **demo-app** pod in the `default` namespace.

```bash
kubectl exec -it another-client-one -n another-ns -- curl --max-time 3 demo-app.default
kubectl exec -it another-client-two -n another-ns -- curl --max-time 3 demo-app.default
```
You would see below response for each command, indicating timeout error. This is expecected since the ingress traffic to `demo-app` is allowed only from `default` namespace.

::::expand{header="Check Output"}
```bash
curl: (28) Connection timed out after 3001 milliseconds
command terminated with exit code 28
```
::::

**Let us delete the `demo-app-allow-samens` NetworkPolicy before proceeding to the next scenario.**

```bash
kubectl delete -f policies/02-allow-ingress-from-samens.yaml
```

::::expand{header="Check Output"}
```bash
networkpolicy.networking.k8s.io "demo-app-allow-samens" deleted
```
::::


## Scenario #3: Allow ingress traffic from only client-one in default namespace to Demo app

In this scenario, we will allow traffic from a specific client i.e. **client-one** in `default` namespace to the **demo-app**.

![sc4-allow-from-client-one](/static/images/6-network-security/1-network-policies/sc4-allow-from-client-one.png)

### Deploy the Network Policy

Before applying the network policy, let us see how the configuration looks like.

```bash
cat policies/03-allow-ingress-from-samens-client-one.yaml
```

```yaml
kind: NetworkPolicy
apiVersion: networking.k8s.io/v1
metadata:
  name: demo-app-allow-samens-client-one
spec:
  podSelector:
    matchLabels:
      app: demo-app
  ingress:
  - from:
      - podSelector:
          matchLabels:
            app: client-one
```

The `demo-app-allow-samens-client-one` network policy configures `ingress`  block with the `podSelector` field in the `from` section, to select a specific pod using the labels `app: client-one`.

Let us apply the `demo-app-allow-samens` network policy.

```bash
kubectl apply -f policies/03-allow-ingress-from-samens-client-one.yaml
```

::::expand{header="Check Output"}
```bash
networkpolicy.networking.k8s.io/demo-app-allow-samens-client-one created
```
::::

### Verify connectivity from client-one pod to demo-app in the same namespace

Test the connectivity from **client pod** to **demo-app** pod with in same `default` namespace.

```bash
kubectl exec -it client-one -- curl --max-time 3 demo-app
```
You would see below response for above command, indicating successful API call.

::::expand{header="Check Output"}
```html
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

### Verify connectivity from **client-two** pod to demo-app in the same namespace


```bash
kubectl exec -it client-two -- curl --max-time 3 demo-app
```

You would see below response for above command, indicating timeout error as expected.

::::expand{header="Check Output"}
```bash
curl: (28) Connection timed out after 3001 milliseconds
command terminated with exit code 28
```
::::

### Verify connectivity from **another client** to demo-app across namespaces


```bash
kubectl exec -it another-client-one -n another-ns -- curl --max-time 3 demo-app.default
kubectl exec -it another-client-two -n another-ns -- curl --max-time 3 demo-app.default
```

You would see below response for above command, indicating timeout error as expected.

::::expand{header="Check Output"}
```bash
curl: (28) Connection timed out after 3001 milliseconds
command terminated with exit code 28
```
::::

## Scenario #4: Allow ingress traffic from another-ns namespace to demo-app in default namespace

In this scenario, we will allow traffic from all pods in `another-ns` namespace to the **demo-app** in the `default` namespace.

![sc5-allow-from-another-ns](/static/images/6-network-security/1-network-policies/sc5-allow-from-another-ns.png)

### Deploy the Network Policy

Before applying the network policy, let us see how the configuration looks like.

```bash
cat policies/04-allow-ingress-from-xns.yaml
```

```yaml
kind: NetworkPolicy
apiVersion: networking.k8s.io/v1
metadata:
  name: demo-app-allow-another-ns
spec:
  podSelector:
    matchLabels:
      app: demo-app
  ingress:
  - from:
      - namespaceSelector:
          matchLabels:
            kubernetes.io/metadata.name: another-ns
```

The `demo-app-allow-another-ns` network policy configures `ingress`  block with the `namespaceSelector` field in the `from` section, to select the `default` namespace using the labels `kubernetes.io/metadata.name: another-ns`. Using `namespaceSelector` allows to apply the configuration to all the pods in the `another-ns` namespace.

Let us apply the `demo-app-allow-another-ns` network policy.

```bash
kubectl apply -f policies/04-allow-ingress-from-xns.yaml
```

::::expand{header="Check Output"}
```bash
networkpolicy.networking.k8s.io/demo-app-allow-another-ns created
```
::::

### Verify connectivity from client-one pod to demo-app in the same namespace

Test the connectivity from **client pod** to **demo-app** pod with in same `default` namespace.

```bash
kubectl exec -it client-one -- curl --max-time 3 demo-app
```
You would see below response for above command, indicating successful API call.

::::expand{header="Check Output"}
```html
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

**But wait, why is this successful even though we did not explicitly configure to allow ingress traffic from **client-one** appp in `default` namespace?**

This is because the Network Policies are additive which means all the policies applied so far are considered for contollring traffic. The `demo-app-allow-samens-client-one` NetworkPolicy we applied in the previous Scenario still exists in the Cluster and allows to traffic from **client-one** pod.

Run the below comman to how check how many NetworkPolicy objects are configured so far in the Cluster.

```bash
kubectl get netpol -A
```

The ouput will show as below.

```bash
NAMESPACE   NAME                               POD-SELECTOR   AGE
default     demo-app-allow-another-ns          app=demo-app   7m37s
default     demo-app-allow-samens-client-one   app=demo-app   28m
default     demo-app-deny-all                  app=demo-app   87m
```

### Verify connectivity from **client-two** pod to demo-app in the same namespace

```bash
kubectl exec -it client-two -- curl --max-time 3 demo-app
```

You would see below response for above command, indicating timeout error as expected.

::::expand{header="Check Output"}
```bash
curl: (28) Connection timed out after 3001 milliseconds
command terminated with exit code 28
```
::::

### Verify connectivity from **another client** to demo-app across namespaces


```bash
kubectl exec -it another-client-one -n another-ns -- curl --max-time 3 demo-app.default
kubectl exec -it another-client-two -n another-ns -- curl --max-time 3 demo-app.default
```

You would see below response for above command, indicating successful API call due to the `demo-app-allow-another-ns` network policy.

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

Let us delete the `demo-app-allow-another-ns` network policy.

```bash
kubectl delete -f policies/04-allow-ingress-from-xns.yaml
```

::::expand{header="Check Output"}
```bash
networkpolicy.networking.k8s.io "demo-app-allow-another-ns" deleted
```
::::

Let us also delete the `demo-app-allow-samens-client-one` NetworkPolicy from the previous Scenario.

```bash
kubectl delete -f policies/03-allow-ingress-from-samens-client-one.yaml
```

::::expand{header="Check Output"}
```bash
networkpolicy.networking.k8s.io "demo-app-allow-samens-client-one" deleted
```
::::

Let us now check how many Network Policies exists in the CLuster at this point.

```bash
kubectl get netpol -A
```

The ouput will show as below, which indicates there is only one **deny all** policy `demo-app-deny-all`.

```bash
NAMESPACE   NAME                POD-SELECTOR   AGE
default     demo-app-deny-all   app=demo-app   97m
```


## Scenario #5: Allow ingress traffic from another-client-one in another-ns namespace to demo-app in default namespace

In this scenario, we will allow traffic from a specific client **another-client-one** from `another-ns` namespace to the **demo-app** in the `default` namespace.

![sc6-allow-from-another-client-one](/static/images/6-network-security/1-network-policies/sc6-allow-from-another-client-one.png)

### Deploy the Network Policy

Before applying the network policy, let us see how the configuration looks like.

```bash
cat policies/05-allow-ingress-from-xns-client-one.yaml
```

```yaml
kind: NetworkPolicy
apiVersion: networking.k8s.io/v1
metadata:
  name: demo-app-allow-another-client
spec:
  podSelector:
    matchLabels:
      app: demo-app
  ingress:
  - from:
      - podSelector:
          matchLabels:
            app: another-client-one
        namespaceSelector:
          matchLabels:
            kubernetes.io/metadata.name: another-ns
```

The `demo-app-allow-another-client` network policy configures `ingress` block with both the `namespaceSelector` and the `podSelector` fields in the `from` section, to select a specific client using labels `app: another-client-one` in the `another-ns` namespace.

Let us apply the `demo-app-allow-another-client` network policy.

```bash
kubectl apply -f policies/05-allow-ingress-from-xns-client-one.yaml
```

::::expand{header="Check Output"}
```bash
networkpolicy.networking.k8s.io/demo-app-allow-another-client created
```
::::


### Verify connectivity from **client** pods to demo-app in the same namespace

```bash
kubectl exec -it client-one -- curl --max-time 3 demo-app
kubectl exec -it client-two -- curl --max-time 3 demo-app
```

You would see below response for above command, indicating timeout error as expected.

::::expand{header="Check Output"}
```bash
curl: (28) Connection timed out after 3001 milliseconds
command terminated with exit code 28
```
::::

### Verify connectivity from **another-client-one** to demo-app across namespaces

```bash
kubectl exec -it another-client-one -n another-ns -- curl --max-time 3 demo-app.default
```

You would see below response for above command, indicating successful API call due to the `demo-app-allow-another-client` network policy.

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


### Verify connectivity from **another-client-two** to demo-app across namespaces

```bash
kubectl exec -it another-client-two -n another-ns -- curl --max-time 3 demo-app.default
```

You would see below response for above command, indicating timeout error as expected.

::::expand{header="Check Output"}
```bash
curl: (28) Connection timed out after 3001 milliseconds
command terminated with exit code 28
```
::::


Let us delete the `demo-app-allow-another-client` network policy.

```bash
kubectl delete -f policies/05-allow-ingress-from-xns-client-one.yaml
```

::::expand{header="Check Output"}
```bash
networkpolicy.networking.k8s.io "demo-app-allow-another-client" deleted
```
::::

Let us also delete the `demo-app-deny-all` NetworkPolicy from the Scenario #2.

```bash
kubectl delete -f policies/01-deny-all-ingress.yaml
```

::::expand{header="Check Output"}
```bash
networkpolicy.networking.k8s.io "demo-app-deny-all" deleted
```
::::

Let us now check how many Network Policies exists in the CLuster at this point.

```bash
kubectl get netpol -A
```

The ouput should show empty, which means there are no Network Policies in the Cluster.

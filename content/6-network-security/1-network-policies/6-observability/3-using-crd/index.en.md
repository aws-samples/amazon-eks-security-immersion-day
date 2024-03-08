---
title : "Using PolicyEndpoint CRD"
weight : 23
---

PolicyEndpoint CRD needs to be installed in the cluster. Installing Network Policy Controller will automatically install the CRD.

Run below command to see new CRDs created by Amazon EKS VPC CNI.

```bash
kubectl get crd
```

The output will look like below. Note that Amazon VPC CNI uses a new CRD `policyendpoints.networking.k8s.aws` to implement the Network Policies.

```bash
NAME                                         CREATED AT
cninodes.vpcresources.k8s.aws                2023-09-07T11:26:26Z
eniconfigs.crd.k8s.amazonaws.com             2023-09-07T11:26:23Z
policyendpoints.networking.k8s.aws           2023-09-07T11:26:27Z
securitygrouppolicies.vpcresources.k8s.aws   2023-09-07T11:26:26Z
```

Let us check for `policyendpoints` objects in the Cluster.

```bash
kubectl get policyendpoints -A
```

The output will look like below

```bash
NAMESPACE   NAME                                     AGE
default     client-one-allow-egress-coredns-c88vd    4h49m
default     client-one-allow-egress-demo-app-mjj4d   166m
default     client-one-deny-egress-dhsw4             4h53m
```

Let us also check for the Network policies in the Cluster.proceeding further.

```bash
kubectl get netpol -A
```

The output will look like below.

```bash
NAMESPACE   NAME                               POD-SELECTOR     AGE
default     client-one-allow-egress-coredns    app=client-one   4h51m
default     client-one-allow-egress-demo-app   app=client-one   168m
default     client-one-deny-egress             app=client-one   4h55m
```
 
Note that for every `NetworkPolicy` object, the `Network Policy Controller` creates a corresponding `PolicyEndpoint` object and sends it to the `Policy Node Agent` to configure the traffic controls on that node.

Let us see how `PolicyEndpoint` object configuration looks like.

```bash
kubectl get policyendpoints  client-one-deny-egress-dhsw4 -oyaml
```

The output will look like below.

```yaml
apiVersion: networking.k8s.aws/v1alpha1
kind: PolicyEndpoint
metadata:
  creationTimestamp: "2023-09-09T05:24:55Z"
  generateName: client-one-deny-egress-
  generation: 1
  name: client-one-deny-egress-dhsw4
  namespace: default
  ownerReferences:
  - apiVersion: networking.k8s.io/v1
    blockOwnerDeletion: true
    controller: true
    kind: NetworkPolicy
    name: client-one-deny-egress
    uid: 7a917042-e5d9-4750-bf4a-27c7a5c14028
  resourceVersion: "399313"
  uid: 25094180-c2ab-4464-b990-6401b77fcfd0
spec:
  podIsolation:
  - Egress
  podSelector:
    matchLabels:
      app: client-one
  podSelectorEndpoints:
  - hostIP: 10.254.179.200
    name: client-one
    namespace: default
    podIP: 10.254.169.255
  policyRef:
    name: client-one-deny-egress
    namespace: default
```

Notice the `podSelectorEndpoints` section which translated the Network Policy configuration to individual pod IPs.

Let us see one more example.

```bash
kubectl get policyendpoints  client-one-allow-egress-demo-app-mjj4d -oyaml
```

```yaml
apiVersion: networking.k8s.aws/v1alpha1
kind: PolicyEndpoint
metadata:
  creationTimestamp: "2023-09-09T07:32:13Z"
  generateName: client-one-allow-egress-demo-app-
  generation: 1
  name: client-one-allow-egress-demo-app-mjj4d
  namespace: default
  ownerReferences:
  - apiVersion: networking.k8s.io/v1
    blockOwnerDeletion: true
    controller: true
    kind: NetworkPolicy
    name: client-one-allow-egress-demo-app
    uid: 85bdb8cd-abeb-4d47-a521-058d00ca143d
  resourceVersion: "422188"
  uid: 7a847614-280d-4956-acb9-052a3d3a4c25
spec:
  egress:
  - cidr: 172.20.0.10
    ports:
    - port: 53
      protocol: UDP
  - cidr: 10.254.214.115
    ports:
    - port: 80
      protocol: TCP
  - cidr: 172.20.107.125
    ports:
    - port: 80
      protocol: TCP
  - cidr: 10.254.216.11
    ports:
    - port: 53
      protocol: UDP
  - cidr: 10.254.215.2
    ports:
    - port: 53
      protocol: UDP
  podIsolation:
  - Ingress
  - Egress
  podSelector:
    matchLabels:
      app: client-one
  podSelectorEndpoints:
  - hostIP: 10.254.179.200
    name: client-one
    namespace: default
    podIP: 10.254.169.255
  policyRef:
    name: client-one-allow-egress-demo-app
    namespace: default
```
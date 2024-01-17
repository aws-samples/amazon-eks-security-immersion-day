---
title : "Deploy Sample Micro Services"
weight : 22
---

In this section, we will setup **single-cluster/VPC service-to-service communications** usecase. It configures two routes (`rates` and `inventory`) and three services (`parking`, `review`, and `inventory-1`).

![usecase1.png](/static/images/6-network-security/2-vpc-lattice-service-access/usecase1.png)

1. Create the Kubernetes `Gateway` object **my-hotel**

Let us see how the configuration looks like.

```bash
cat examples/my-hotel-gateway.yaml
```

The output will look like below.

```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: Gateway
metadata:
  name: my-hotel
  annotations:
    application-networking.k8s.aws/lattice-vpc-association: "true"
spec:
  gatewayClassName: amazon-vpc-lattice
  listeners:
  - name: http
    protocol: HTTP
    port: 80
```

The above configuration creates Kubernetes `Gateway` object **my-hotel** which creates a `Service Network` in Amazon VPC Lattice.

::alert[By default, the Gateway (Lattice Service Network) is not associated with cluster's VPC. To associate a Gateway (Lattice Service Network) to VPC, `my-hotel-gateway.yaml` includes the following annotation. ]{header="Note"}

Apply the configuration.

```bash
kubectl apply -f examples/my-hotel-gateway.yaml
```

::::expand{header="Check Output"}
```bash
gateway.gateway.networking.k8s.io/my-hotel created
```
::::

2. Verify that `my-hotel` Gateway is created (this could take about five minutes): 

```bash
kubectl get gateway 
```

::::expand{header="Check Output"}
```bash
NAME       CLASS                ADDRESS   PROGRAMMED   AGE
my-hotel   amazon-vpc-lattice             True         87s
```
::::

3. Once the Gateway is created, find the VPC Lattice Service Network.

```bash
kubectl get gateway my-hotel -o yaml
```

::::expand{header="Check Output"}
```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: Gateway
metadata:
  annotations:
    application-networking.k8s.aws/lattice-vpc-association: "true"
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"gateway.networking.k8s.io/v1beta1","kind":"Gateway","metadata":{"annotations":{"application-networking.k8s.aws/lattice-vpc-association":"true"},"name":"my-hotel","namespace":"default"},"spec":{"gatewayClassName":"amazon-vpc-lattice","listeners":[{"name":"http","port":80,"protocol":"HTTP"}]}}
  creationTimestamp: "2023-10-17T11:45:59Z"
  finalizers:
  - gateway.k8s.aws/resources
  generation: 1
  name: my-hotel
  namespace: default
  resourceVersion: "300193"
  uid: 7f84485a-3ba0-483b-aa4c-fe262a37102e
spec:
  gatewayClassName: amazon-vpc-lattice
  listeners:
  - allowedRoutes:
      namespaces:
        from: Same
    name: http
    port: 80
    protocol: HTTP
status:
  conditions:
  - lastTransitionTime: "2023-10-17T11:45:59Z"
    message: application-networking.k8s.aws/gateway-api-controller
    observedGeneration: 1
    reason: Accepted
    status: "True"
    type: Accepted
  - lastTransitionTime: "2023-10-17T11:46:20Z"
    message: 'aws-gateway-arn: arn:aws:vpc-lattice:us-west-2:ACCOUNT_ID:servicenetwork/sn-0813ae7fd8eba09c7'
    observedGeneration: 1
    reason: Programmed
    status: "True"
    type: Programmed
  listeners:
  - attachedRoutes: 0
    conditions:
    - lastTransitionTime: "2023-10-17T11:45:59Z"
      message: ""
      observedGeneration: 1
      reason: Accepted
      status: "True"
      type: Accepted
    name: http
    supportedKinds:
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
```
::::


The `status` conditions contains the ARN of the Amazon VPC Lattice Service Network.

`message: aws-gateway-arn: arn:aws:vpc-lattice:us-west-2:ACCOUNT_ID:servicenetwork/sn-0813ae7fd8eba09c7`


View the VPC Lattice Service network `my-hotel` in the [Amazon VPC Console](https://us-west-2.console.aws.amazon.com/vpc/home?ServiceNetwork=&region=us-west-2#ServiceNetworks:)

![servicenetwork.png](/static/images/6-network-security/2-vpc-lattice-service-access/servicenetwork.png)

4. Create the Kubernetes ClusterIP based `Services` **parking**, **review** and `HTTPRoute` object **rates** to define the path based routing for these two Services.

Create the `parking` Service.

```bash
kubectl apply -f examples/parking.yaml
```

::::expand{header="Check Output"}
```bash
deployment.apps/parking created
service/parking created
```
::::


Create the `review` Service.

```bash
kubectl apply -f examples/review.yaml
```

::::expand{header="Check Output"}
```bash
deployment.apps/review created
service/review created
```
::::

Ensure pods for both Services are running.

```bash
kubectl get pod
```

::::expand{header="Check Output"}
```bash
NAME                       READY   STATUS    RESTARTS   AGE
parking-7c89b6b67c-5v69w   1/1     Running   0          118s
parking-7c89b6b67c-s6z9j   1/1     Running   0          118s
review-5846dd8dcc-dh6cz    1/1     Running   0          21s
review-5846dd8dcc-vfs4m    1/1     Running   0          21s
```
::::


Let us check the configuration for the `HTTPRoute` object **rates**.

```bash
cat examples/rate-route-path.yaml
```

```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  name: rates
spec:
  parentRefs:
  - name: my-hotel
    sectionName: http
  rules:
  - backendRefs:
    - name: parking
      kind: Service
      port: 80
    matches:
    - path:
        type: PathPrefix
        value: /parking
  - backendRefs:
    - name: review
      kind: Service
      port: 80
    matches:
    - path:
        type: PathPrefix
        value: /review
```

This creates a Amazon VPC Lattice Service with name `<HTTPRoute_Name>:<Kubernetes Namespace>` i.e. `rates-default`.

Let us create the `HTTPRoute` object **rates**

```bash
kubectl apply -f examples/rate-route-path.yaml
```

::::expand{header="Check Output"}
```bash
httproute.gateway.networking.k8s.io/rates created
```
::::

View the VPC Lattice Service `rates-default` in the [Amazon VPC Console](https://us-west-2.console.aws.amazon.com/vpc/home?region=us-west-2#Services:)

![rates-service.png](/static/images/6-network-security/2-vpc-lattice-service-access/rates-service.png)


Note that this VPC Service `rates-default` is associated with VPC Lattice Network `my-hotel`

![rates-service-association.png](/static/images/6-network-security/2-vpc-lattice-service-access/rates-service-association.png)

Also view the two routes created for this VPC Service `rates-default` in the Console.

![rates-routes.png](/static/images/6-network-security/2-vpc-lattice-service-access/rates-routes.png)

The Pods for the Service `review` are registered with a Target group `k8s-review-default-http-http1` in VPC Lattice.

![rates-tg2.png](/static/images/6-network-security/2-vpc-lattice-service-access/rates-tg2.png)

The Pods for the Service `parking` are registered with a Target group `k8s-parking-default-http-http1` in VPC Lattice.

![rates-tg1.png](/static/images/6-network-security/2-vpc-lattice-service-access/rates-tg1.png)


5. Create the Kubernetes HTTPRoute inventory (this could take about five minutes): 

Create the `inventory-ver1` Service.

```bash
kubectl apply -f examples/inventory-ver1.yaml
```

::::expand{header="Check Output"}
```bash
deployment.apps/inventory-ver1 created
service/inventory-ver1 created
```
::::

Ensure pods for `inventory-ver1` Service are running.

```bash
kubectl get pod
```

::::expand{header="Check Output"}
```bash
NAME                              READY   STATUS    RESTARTS   AGE
inventory-ver1-55ff9bb45d-lbg7x   1/1     Running   0          43s
inventory-ver1-55ff9bb45d-qqh8d   1/1     Running   0          43s
parking-7c89b6b67c-5v69w          1/1     Running   0          36m
parking-7c89b6b67c-s6z9j          1/1     Running   0          36m
review-5846dd8dcc-dh6cz           1/1     Running   0          34m
review-5846dd8dcc-vfs4m           1/1     Running   0          34m
```
::::



Let us check the configuration for the `HTTPRoute` object **inventory**.

```bash
cat examples/inventory-route.yaml
```

```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  name: inventory
spec:
  parentRefs:
  - name: my-hotel
    sectionName: http
  rules:
  - backendRefs:
    - name: inventory-ver1
      kind: Service
      port: 80
      weight: 10
```

This creates a Amazon VPC Lattice Service with name `<HTTPRoute_Name>:<Kubernetes Namespace>` i.e. `rates-default`.

Let us create the `HTTPRoute` object **inventory**

```bash
kubectl apply -f examples/inventory-route.yaml
```

::::expand{header="Check Output"}
```bash
httproute.gateway.networking.k8s.io/inventory created
```
::::


View the VPC Lattice Service `inventory-default` in the [Amazon VPC Console](https://us-west-2.console.aws.amazon.com/vpc/home?region=us-west-2#Services:)

![inventory-service.png](/static/images/6-network-security/2-vpc-lattice-service-access/inventory-service.png)


Also view the two routes created for this VPC Service `inventory-default` in the Console.

![inventory-route.png](/static/images/6-network-security/2-vpc-lattice-service-access/inventory-route.png)

The Pods for the Service `inventory-ver1` are registered with a Target group `k8s-inventory-ver1-default-http-http1` in VPC Lattice.

![inventory-tg1.png](/static/images/6-network-security/2-vpc-lattice-service-access/inventory-tg1.png)

6. List the `HTTPRoute` objects.

```bash
kubectl get httproute
```

::::expand{header="Check Output"}
```bash
NAME        HOSTNAMES   AGE
inventory               6m57s
rates                   44m
```
::::

7. List the route’s yaml file to see the DNS address (highlighted here on the message line): 

```bash
kubectl get httproute inventory -o yaml
```

::::expand{header="Check Output"}
```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  annotations:
    application-networking.k8s.aws/lattice-assigned-domain-name: inventory-default-010fc8d503246d22b.7d67968.vpc-lattice-svcs.us-east-1.on.aws
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"gateway.networking.k8s.io/v1beta1","kind":"HTTPRoute","metadata":{"annotations":{},"name":"inventory","namespace":"default"},"spec":{"parentRefs":[{"name":"my-hotel","sectionName":"http"}],"rules":[{"backendRefs":[{"kind":"Service","name":"inventory-ver1","port":80,"weight":10}]}]}}
  creationTimestamp: "2023-10-17T13:51:54Z"
  finalizers:
  - httproute.k8s.aws/resources
  generation: 1
  name: inventory
  namespace: default
  resourceVersion: "332023"
  uid: 374bf116-7822-4ca7-9b5a-482efa7bd356
spec:
  parentRefs:
  - group: gateway.networking.k8s.io
    kind: Gateway
    name: my-hotel
    sectionName: http
  rules:
  - backendRefs:
    - group: ""
      kind: Service
      name: inventory-ver1
      port: 80
      weight: 10
    matches:
    - path:
        type: PathPrefix
        value: /
status:
  parents:
  - conditions:
    - lastTransitionTime: "2023-10-17T13:52:17Z"
      message: 'DNS Name: inventory-default-010fc8d503246d22b.7d67968.vpc-lattice-svcs.us-east-1.on.aws'
      observedGeneration: 1
      reason: Accepted
      status: "True"
      type: Accepted
    - lastTransitionTime: "2023-10-17T13:52:17Z"
      message: 'DNS Name: inventory-default-010fc8d503246d22b.7d67968.vpc-lattice-svcs.us-east-1.on.aws'
      observedGeneration: 1
      reason: ResolvedRefs
      status: "True"
      type: ResolvedRefs
    controllerName: application-networking.k8s.aws/gateway-api-controller
    parentRef:
      group: gateway.networking.k8s.io
      kind: Gateway
      name: my-hotel
      sectionName: http
```
::::

The `status` field in the above output contains the DNS Name of the Service `message: DNS Name: inventory-default-010fc8d503246d22b.7d67968.vpc-lattice-svcs.us-east-1.on.aws`

```bash
kubectl get httproute rates -o yaml
```

```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  annotations:
    application-networking.k8s.aws/lattice-assigned-domain-name: rates-default-0b1f56d26672bf677.7d67968.vpc-lattice-svcs.us-east-1.on.aws
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"gateway.networking.k8s.io/v1beta1","kind":"HTTPRoute","metadata":{"annotations":{},"name":"rates","namespace":"default"},"spec":{"parentRefs":[{"name":"my-hotel","sectionName":"http"}],"rules":[{"backendRefs":[{"kind":"Service","name":"parking","port":80}],"matches":[{"path":{"type":"PathPrefix","value":"/parking"}}]},{"backendRefs":[{"kind":"Service","name":"review","port":80}],"matches":[{"path":{"type":"PathPrefix","value":"/review"}}]}]}}
  creationTimestamp: "2023-10-17T13:14:50Z"
  finalizers:
  - httproute.k8s.aws/resources
  generation: 1
  name: rates
  namespace: default
  resourceVersion: "322766"
  uid: 8be1b7af-6271-411b-b207-fbd980fb1863
spec:
  parentRefs:
  - group: gateway.networking.k8s.io
    kind: Gateway
    name: my-hotel
    sectionName: http
  rules:
  - backendRefs:
    - group: ""
      kind: Service
      name: parking
      port: 80
      weight: 1
    matches:
    - path:
        type: PathPrefix
        value: /parking
  - backendRefs:
    - group: ""
      kind: Service
      name: review
      port: 80
      weight: 1
    matches:
    - path:
        type: PathPrefix
        value: /review
status:
  parents:
  - conditions:
    - lastTransitionTime: "2023-10-17T13:15:42Z"
      message: 'DNS Name: rates-default-0b1f56d26672bf677.7d67968.vpc-lattice-svcs.us-east-1.on.aws'
      observedGeneration: 1
      reason: Accepted
      status: "True"
      type: Accepted
    - lastTransitionTime: "2023-10-17T13:15:42Z"
      message: 'DNS Name: rates-default-0b1f56d26672bf677.7d67968.vpc-lattice-svcs.us-east-1.on.aws'
      observedGeneration: 1
      reason: ResolvedRefs
      status: "True"
      type: ResolvedRefs
    controllerName: application-networking.k8s.aws/gateway-api-controller
    parentRef:
      group: gateway.networking.k8s.io
      kind: Gateway
      name: my-hotel
      sectionName: http
```

The `status` field in the above output contains the DNS Name of the Service `message: DNS Name: rates-default-0b1f56d26672bf677.7d67968.vpc-lattice-svcs.us-east-1.on.aws`
      
8. Store assigned DNS names to variables.

```bash
ratesdns=$(kubectl get httproute rates -o json | jq -r '.status.parents[].conditions[0].message')
echo "ratesdns=$ratesdns"
inventorydns=$(kubectl get httproute inventory -o json | jq -r '.status.parents[].conditions[0].message')
echo "inventorydns=$inventorydns"
```

::::expand{header="Check Output"}
```bash
ratesdns=DNS Name: rates-default-0b1f56d26672bf677.7d67968.vpc-lattice-svcs.us-east-1.on.aws
inventorydns=DNS Name: inventory-default-010fc8d503246d22b.7d67968.vpc-lattice-svcs.us-east-1.on.aws
```
::::

9. remove preceding extra text.

```bash
prefix="DNS Name: "
ratesFQDN=${ratesdns#$prefix}
echo "ratesFQDN=$ratesFQDN"
inventoryFQDN=${inventorydns#$prefix}
echo "inventoryFQDN=$inventoryFQDN"
```

::::expand{header="Check Output"}
```bash
ratesFQDN=rates-default-0b1f56d26672bf677.7d67968.vpc-lattice-svcs.us-east-1.on.aws
inventoryFQDN=inventory-default-010fc8d503246d22b.7d67968.vpc-lattice-svcs.us-east-1.on.aws
```
::::
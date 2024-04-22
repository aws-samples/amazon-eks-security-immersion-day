---
title : "Deploy AWS Gateway API Controller and Gateway Resource"
weight : 10
---


## Deploy AWS Gateway API Controller in Second EKS Cluster `eksworkshop-eksctl-2`

Follow these instructions deploy the AWS Gateway API Controller in the second cluster.

![](/static/images/6-network-security/2-vpc-lattice-service-access/lattice-usecase6-gateway.png)

### 1. Deploy the VPC Lattice Api Gateway Controller

```bash
eksdemo install vpc-lattice-controller -c $EKS_CLUSTER2_NAME \
  --set log.level=debug \ 
  --set "defaultServiceNetwork=$GATEWAY_NAME"
```

> because we are specifying the default service network associated with our gateway name `app-service-gw`, then the controller will register our EKS VPC with lattice

You can see the logs of the controller. Open an new terminal and execute the following command:

```bash
kubectl stern --context $EKS_CLUSTER2_CONTEXT -n vpc-lattice gateway-api-controller
```

You can also check that the VPC2 has been associated with vpc lattice.

```bash
aws vpc-lattice list-service-network-vpc-associations --vpc-id $EKS_CLUSTER2_VPC_ID
```

::::expand{header="Check Output"}
```
{
    "items": [
        {
            "arn": "arn:aws:vpc-lattice:us-west-2:382076407153:servicenetworkvpcassociation/snva-0a7c8a5213717507c",
            "createdAt": "2024-02-12T15:01:21.266000+00:00",
            "createdBy": "382076407153",
            "id": "snva-0a7c8a5213717507c",
            "lastUpdatedAt": "2024-02-12T15:01:34.936000+00:00",
            "serviceNetworkArn": "arn:aws:vpc-lattice:us-west-2:382076407153:servicenetwork/sn-0394ef6d7c547159b",
            "serviceNetworkId": "sn-0394ef6d7c547159b",
            "serviceNetworkName": "app-services-gw",
            "status": "ACTIVE",
            "vpcId": "vpc-02ea8140e7e54114d"
        }
    ]
}
```
::::

### 3. Ensure the WS Gateway API Controller Pod is running fine.

```bash
kubectl --context $EKS_CLUSTER2_CONTEXT get all -n vpc-lattice
```

::::expand{header="Check Output"}
```
NAME                                         READY   STATUS    RESTARTS   AGE
pod/gateway-api-controller-965646b47-st8bm   2/2     Running   0          39h

NAME                                             TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
service/gateway-api-controller-metrics-service   ClusterIP   172.20.206.49   <none>        8443/TCP   39h

NAME                                     READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/gateway-api-controller   1/1     1            1           39h

NAME                                               DESIRED   CURRENT   READY   AGE
replicaset.apps/gateway-api-controller-965646b47   1         1         1       39h
```
::::


## Deploy `Gateway` Resource in Second EKS Cluster `eksworkshop-eksctl-2`

1. Create the Kubernetes `Gateway` object **app-services-gw**

```bash
kubectl  --context $EKS_CLUSTER2_CONTEXT apply -f manifests/$GATEWAY_NAME.yaml
```

::alert[The above configuration creates Kubernetes `Gateway` object `app-services-gw` in namespace `app-services-gw` in the second EKS Cluster]{header="Note"}


::::expand{header="Check Output"}
```
namespace/app-services-gw created
gateway.gateway.networking.k8s.io/app-services-gw created
```
::::

2. Verify that `app-services-gw` Gateway is created: 

```bash
kubectl  --context $EKS_CLUSTER2_CONTEXT get gateway -n $GATEWAY_NAMESPACE
```

::::expand{header="Check Output"}
```
_NAMESPACE
NAME              CLASS                ADDRESS   PROGRAMMED   AGE
app-services-gw   amazon-vpc-lattice                          97s
```
::::

3. Once the Gateway is created, find the VPC Lattice Service Network.

```bash
kubectl  --context $EKS_CLUSTER2_CONTEXT get gateway $GATEWAY_NAME -n $GATEWAY_NAMESPACE -oyaml
```

::::expand{header="Check Output"}
:::code{language=yaml showCopyAction=false showLineNumbers=true highlightLines='68'}
apiVersion: gateway.networking.k8s.io/v1beta1
kind: Gateway
metadata:
  annotations:
    application-networking.k8s.aws/lattice-vpc-association: "false"
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"gateway.networking.k8s.io/v1beta1","kind":"Gateway","metadata":{"annotations":{"application-networking.k8s.aws/lattice-vpc-association":"false"},"name":"app-services-gw","namespace":"app-services-gw"},"spec":{"gatewayClassName":"amazon-vpc-lattice","listeners":[{"allowedRoutes":{"kinds":[{"kind":"HTTPRoute"}],"namespaces":{"from":"Selector","selector":{"matchLabels":{"allow-attachment-to-infra-gw":"true"}}}},"name":"http-listener","port":80,"protocol":"HTTP"},{"allowedRoutes":{"kinds":[{"kind":"HTTPRoute"}],"namespaces":{"from":"Selector","selector":{"matchLabels":{"allow-attachment-to-infra-gw":"true"}}}},"name":"https-listener-with-default-domain","port":443,"protocol":"HTTPS"},{"allowedRoutes":{"kinds":[{"kind":"HTTPRoute"}],"namespaces":{"from":"Selector","selector":{"matchLabels":{"allow-attachment-to-infra-gw":"true"}}}},"name":"https-listener-with-custom-domain","port":443,"protocol":"HTTPS","tls":{"mode":"Terminate","options":{"application-networking.k8s.aws/certificate-arn":"arn:aws:acm:us-west-2:ACCOUNT_ID:certificate/d5ebbf85-9b6a-4501-9bfb-65d638b9c0f2"}}}]}}
  creationTimestamp: "2023-10-27T03:40:38Z"
  finalizers:
  - gateway.k8s.aws/resources
  generation: 1
  name: app-services-gw
  namespace: app-services-gw
  resourceVersion: "7823"
  uid: 4ac2556c-ef8e-47dd-b5ca-fb3909ed8ba1
spec:
  gatewayClassName: amazon-vpc-lattice
  listeners:
  - allowedRoutes:
      kinds:
      - group: gateway.networking.k8s.io
        kind: HTTPRoute
      namespaces:
        from: Selector
        selector:
          matchLabels:
            allow-attachment-to-infra-gw: "true"
    name: http-listener
    port: 80
    protocol: HTTP
  - allowedRoutes:
      kinds:
      - group: gateway.networking.k8s.io
        kind: HTTPRoute
      namespaces:
        from: Selector
        selector:
          matchLabels:
            allow-attachment-to-infra-gw: "true"
    name: https-listener-with-default-domain
    port: 443
    protocol: HTTPS
  - allowedRoutes:
      kinds:
      - group: gateway.networking.k8s.io
        kind: HTTPRoute
      namespaces:
        from: Selector
        selector:
          matchLabels:
            allow-attachment-to-infra-gw: "true"
    name: https-listener-with-custom-domain
    port: 443
    protocol: HTTPS
    tls:
      mode: Terminate
      options:
        application-networking.k8s.aws/certificate-arn: arn:aws:acm:us-west-2:ACCOUNT_ID:certificate/d5ebbf85-9b6a-4501-9bfb-65d638b9c0f2
status:
  conditions:
  - lastTransitionTime: "2023-10-27T03:40:38Z"
    message: application-networking.k8s.aws/gateway-api-controller
    observedGeneration: 1
    reason: Accepted
    status: "True"
    type: Accepted
  - lastTransitionTime: "2023-10-27T03:40:39Z"
    message: 'aws-gateway-arn: arn:aws:vpc-lattice:us-west-2:ACCOUNT_ID:servicenetwork/sn-0cc73287505ac121a'
    observedGeneration: 1
    reason: Programmed
    status: "True"
    type: Programmed
  listeners:
  - attachedRoutes: 0
    conditions:
    - lastTransitionTime: "2023-10-27T03:40:38Z"
      message: ""
      observedGeneration: 1
      reason: Accepted
      status: "True"
      type: Accepted
    name: http-listener
    supportedKinds:
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
  - attachedRoutes: 0
    conditions:
    - lastTransitionTime: "2023-10-27T03:40:38Z"
      message: ""
      observedGeneration: 1
      reason: Accepted
      status: "True"
      type: Accepted
    name: https-listener-with-default-domain
    supportedKinds:
    - group: gateway.networking.k8s.io
      kind: GRPCRoute
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
  - attachedRoutes: 0
    conditions:
    - lastTransitionTime: "2023-10-27T03:40:38Z"
      message: ""
      observedGeneration: 1
      reason: Accepted
      status: "True"
      type: Accepted
    name: https-listener-with-custom-domain
    supportedKinds:
    - group: gateway.networking.k8s.io
      kind: GRPCRoute
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
:::
::::


The `status` conditions contains the ARN of the Amazon VPC Lattice Service Network.

Note that the Gateway ARN in your output status in message field is same as the one stored earlier in the environment variable.

```bash
echo "gatewayARN=$gatewayARN"
```

::::expand{header="Check Output"}
```
gatewayARN=arn:aws:vpc-lattice:us-west-2:ACCOUNT_ID:servicenetwork/sn-0cc73287505ac121a
```
::::
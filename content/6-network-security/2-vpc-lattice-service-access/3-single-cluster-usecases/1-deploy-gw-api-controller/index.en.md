---
title : "Deploy AWS Gateway API Controller and Gateway Resource"
weight : 10
---


## Deploy AWS Gateway API Controller in First EKS Cluster `eksworkshop-eksctl`

### 1. Follow these instructions deploy the AWS Gateway API Controller.

```bash
# export Gateway name and namespace
echo "export GATEWAY_NAME=app-services-gw" >> ~/.bash_profile
echo "export GATEWAY_NAMESPACE=app-services-gw" >> ~/.bash_profile
source ~/.bash_profile

eksdemo install vpc-lattice-controller -c $EKS_CLUSTER1_NAME --set "defaultServiceNetwork=$GATEWAY_NAME" #--dry-run
```

::::alert{type="info" header="Note"}
By setting `defaultServiceNetwork`, the Gateway API controller will create a serviceNetwork (VPC Lattice Service Network) with the name provided, and associate it with the EKS cluster's VPC. 
Alternatively, you can use AWS CLI to manually create a VPC Lattice service network
```bash
aws vpc-lattice create-service-network --name <my-service-network-name> # grab service network ID
aws vpc-lattice create-service-network-vpc-association --service-network-identifier <service-network-id> --vpc-identifier <k8s-cluster-vpc-id>
```
::::

::::expand{header="Check Output"}
```
NAME: gateway-api-controller
LAST DEPLOYED: Wed Feb  7 15:44:03 2024
NAMESPACE: aws-application-networking-system
STATUS: deployed
REVISION: 1
TEST SUITE: None
NOTES:
aws-gateway-controller-chart has been installed.
This chart deploys "public.ecr.aws/aws-application-networking-k8s/aws-gateway-controller:".

Check its status by running:
  kubectl --namespace aws-application-networking-system get pods -l "app.kubernetes.io/instance=gateway-api-controller"

The controller is running in "cluster" mode.
```
::::

### 2. Ensure the WS Gateway API Controller Pod is running fine.

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT get all -n vpc-lattice
```

::::expand{header="Check Output"}
```
NAME                                          READY   STATUS    RESTARTS   AGE
pod/gateway-api-controller-8549f879fd-7w2qx   1/1     Running   0          40m

NAME                                     READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/gateway-api-controller   1/1     1            1           40m

NAME                                                DESIRED   CURRENT   READY   AGE
replicaset.apps/gateway-api-controller-8549f879fd   1         1         1       40m

```
::::

You can check the logs of the Gateway API controller deployment using the Kubectl krew plugin stern:

```bash
kubectl stern --context $EKS_CLUSTER1_CONTEXT -n vpc-lattice gateway-api-controller
```

::::expand{header="Check Output"}
```
gateway-api-controller-8549f879fd-7w2qx manager {"level":"info","ts":"2024-02-19T19:14:43.407Z","logger":"runtime","caller":"controller/controller.go:220","msg":"Starting workers","controller":"accesslogpolicy","controllerGroup":"application-networking.k8s.aws","controllerKind":"AccessLogPolicy","worker count":1}
gateway-api-controller-8549f879fd-7w2qx manager {"level":"info","ts":"2024-02-19T19:14:43.407Z","logger":"runtime","caller":"controller/controller.go:220","msg":"Starting workers","controller":"grpcroute","controllerGroup":"gateway.networking.k8s.io","controllerKind":"GRPCRoute","worker count":1}
gateway-api-controller-8549f879fd-7w2qx manager {"level":"info","ts":"2024-02-19T19:14:43.407Z","logger":"runtime","caller":"controller/controller.go:220","msg":"Starting workers","controller":"iamauthpolicy","controllerGroup":"application-networking.k8s.aws","controllerKind":"IAMAuthPolicy","worker count":1}
```
::::

### 3. Check VPC service has been created and associated with our EKS cluster VPC

Since we have specified a `defaultServiceNetwork` in our api gateway controller, It should have created a VPC lattice service-network, and associated it with our VPC.

Check the status of the VPC lattice service network:

```bash
aws vpc-lattice list-service-network-vpc-associations --vpc-id $EKS_CLUSTER1_VPC_ID
```

::::expand{header="Check Output"}
```json
{
    "items": [
        {
            "arn": "arn:aws:vpc-lattice:us-west-2:012345678901:servicenetworkvpcassociation/snva-09c42cc777001062c",
            "createdAt": "2024-02-07T15:44:07.445000+00:00",
            "createdBy": "012345678901",
            "id": "snva-09c42cc777001062c",
            "lastUpdatedAt": "2024-02-07T15:44:21.434000+00:00",
            "serviceNetworkArn": "arn:aws:vpc-lattice:us-west-2:012345678901:servicenetwork/sn-0c8e9eeb6d6b0dc9c",
            "serviceNetworkId": "sn-0c8e9eeb6d6b0dc9c",
            "serviceNetworkName": "app-services-gw",
            "status": "ACTIVE",
            "vpcId": "vpc-06bd0081d216484d2"
        }
    ]
}
```

> wait for status to be ACTIVE
::::

View the VPC Lattice Service network `app-services-gw` in the [Amazon VPC Console](https://console.aws.amazon.com/vpc/home?ServiceNetwork=&#ServiceNetworks:)

![](/static/images/6-network-security/2-vpc-lattice-service-access/vpc-service-network.png)

## Deploy `Gateway` Resource in First EKS Cluster `eksworkshop-eksctl`

### 1. Create the Kubernetes `Gateway` object **app-services-gw** ($GATEWAY_NAME)

Let us see how the configuration looks like.

```bash
envsubst < templates/gateway-template.yaml > manifests/$GATEWAY_NAME.yaml
c9 manifests/$GATEWAY_NAME.yaml
```

Ensure that all the fields in the `manifests/app-services-gw.yaml` are populated properly.

::::expand{header="Check Output"}
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: app-services-gw
---
apiVersion: gateway.networking.k8s.io/v1beta1
kind: Gateway
metadata:
  name: app-services-gw
  namespace: app-services-gw
spec:
  gatewayClassName: amazon-vpc-lattice
  listeners:
  - name: http-listener
    port: 80
    protocol: HTTP
    allowedRoutes:
      kinds:
      - kind: HTTPRoute
      namespaces:
        from: Selector
        selector:
          matchLabels:
            allow-attachment-to-infra-gw: "true"
  - name: https-listener-with-default-domain
    port: 443
    protocol: HTTPS
    allowedRoutes:
      kinds:
      - kind: HTTPRoute
      namespaces:
        from: Selector
        selector:
          matchLabels:
            allow-attachment-to-infra-gw: "true"
  - name: https-listener-with-custom-domain
    port: 443
    protocol: HTTPS
    allowedRoutes:
      kinds:
      - kind: HTTPRoute
      namespaces:
        from: Selector
        selector:
          matchLabels:
            allow-attachment-to-infra-gw: "true"    
    tls:
      mode: Terminate
      options:
        application-networking.k8s.aws/certificate-arn: arn:aws:acm:us-west-2:ACCOUNT_ID:certificate/d5ebbf85-9b6a-4501-9bfb-65d638b9c0f2
```
::::


The above configuration creates Kubernetes `Gateway` object `app-services-gw` which creates a **Service Network** in Amazon VPC Lattice.

Apply the configuration.

```bash
kubectl  --context $EKS_CLUSTER1_CONTEXT apply -f manifests/$GATEWAY_NAME.yaml
```

::::expand{header="Check Output"}
```
namespace/app-services-gw created
gateway.gateway.networking.k8s.io/app-services-gw created
```
::::

### 2. Verify that `app-services-gw` Gateway is created : 

```bash
kubectl  --context $EKS_CLUSTER1_CONTEXT get gateway -n $GATEWAY_NAMESPACE
```

::::expand{header="Check Output"}
```
NAME              CLASS                ADDRESS   PROGRAMMED   AGE
app-services-gw   amazon-vpc-lattice             True         76s
```
::::

### 3. Once the Gateway is created, find the VPC Lattice Service Network.

```bash
kubectl  --context $EKS_CLUSTER1_CONTEXT get gateway $GATEWAY_NAME -n $GATEWAY_NAMESPACE -oyaml
```

::::expand{header="Check Output"}
```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: Gateway
metadata:
  annotations:
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"gateway.networking.k8s.io/v1beta1","kind":"Gateway","metadata":{"annotations":{},"name":"app-services-gw","namespace":"app-services-gw"},"spec":{"gatewayClassName":"amazon-vpc-lattice","listeners":[{"allowedRoutes":{"kinds":[{"kind":"HTTPRoute"}],"namespaces":{"from":"Selector","selector":{"matchLabels":{"allow-attachment-to-infra-gw":"true"}}}},"name":"http-listener","port":80,"protocol":"HTTP"},{"allowedRoutes":{"kinds":[{"kind":"HTTPRoute"}],"namespaces":{"from":"Selector","selector":{"matchLabels":{"allow-attachment-to-infra-gw":"true"}}}},"name":"https-listener-with-default-domain","port":443,"protocol":"HTTPS"},{"allowedRoutes":{"kinds":[{"kind":"HTTPRoute"}],"namespaces":{"from":"Selector","selector":{"matchLabels":{"allow-attachment-to-infra-gw":"true"}}}},"name":"https-listener-with-custom-domain","port":443,"protocol":"HTTPS","tls":{"mode":"Terminate","options":{"application-networking.k8s.aws/certificate-arn":"arn:aws:acm:us-west-2:097381749469:certificate/1d3ec714-787f-4a2a-9c46-47927201763c"}}}]}}
  creationTimestamp: "2024-02-07T16:06:37Z"
  finalizers:
  - gateway.k8s.aws/resources
  generation: 1
  name: app-services-gw
  namespace: app-services-gw
  resourceVersion: "253377"
  uid: 45357584-dcaf-40f1-8901-912dfae493e1
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
        application-networking.k8s.aws/certificate-arn: arn:aws:acm:us-west-2:097381749469:certificate/1d3ec714-787f-4a2a-9c46-47927201763c
status:
  conditions:
  - lastTransitionTime: "2024-02-07T16:06:37Z"
    message: application-networking.k8s.aws/gateway-api-controller
    observedGeneration: 1
    reason: Accepted
    status: "True"
    type: Accepted
  - lastTransitionTime: "2024-02-07T16:06:38Z"
    message: 'aws-service-network-arn: arn:aws:vpc-lattice:us-west-2:097381749469:servicenetwork/sn-0c8e9eeb6d6b0dc9c'
    observedGeneration: 1
    reason: Programmed
    status: "True"
    type: Programmed
  listeners:
  - attachedRoutes: 0
    conditions:
    - lastTransitionTime: "2024-02-07T16:06:37Z"
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
    - lastTransitionTime: "2024-02-07T16:06:37Z"
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
    - lastTransitionTime: "2024-02-07T16:06:37Z"
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
```
::::


The `status` conditions contains the ARN of the Amazon VPC Lattice Service Network.

`message: 'aws-gateway-arn: arn:aws:vpc-lattice:us-west-2:ACCOUNT_ID:servicenetwork/sn-0cc73287505ac121a'`

Let us retrieve the Gateway ARN and store it in an environment variable for later use.

```bash
gatewayARN=$(aws vpc-lattice list-service-network-vpc-associations --vpc-id $EKS_CLUSTER1_VPC_ID | jq ".items[0].serviceNetworkArn" -r)
gatewayID=$(aws vpc-lattice list-service-network-vpc-associations --vpc-id $EKS_CLUSTER1_VPC_ID | jq ".items[0].serviceNetworkId" -r)
echo "export gatewayARN=$gatewayARN" | tee -a ~/.bash_profile
echo "export gatewayID=$gatewayID" | tee -a ~/.bash_profile
```

::::expand{header="Check Output"}
```
export gatewayARN=arn:aws:vpc-lattice:us-west-2:734345834211:servicenetwork/sn-03cc2d23efd95fd14
export gatewayID=sn-03cc2d23efd95fd14
```
::::


::::alert{type="info" header="Note"}
Don't proceed until `gatewayARN` and `gatewayID` are properly populated (that can take couple of minutes)
::::
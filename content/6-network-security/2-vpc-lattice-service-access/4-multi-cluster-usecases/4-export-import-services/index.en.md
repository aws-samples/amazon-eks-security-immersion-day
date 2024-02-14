---
title : "Usecase 7: Export K8s Service in Cluster2 and Import into  Cluster1"
weight : 13
---

In this section, we will deploy a new service `app6` in Second EKS Cluster and Export it to VPC Lattice. Then import this service into first EKS Cluster.

## Deploy K8s manifests for Service `app6` in Second EKS Cluster

```bash
export APPNAME=app6
export VERSION=v1
envsubst < templates/app-template.yaml > manifests/$APPNAME-$VERSION-deploy.yaml
kubectl  --context $EKS_CLUSTER2_CONTEXT apply -f manifests/$APPNAME-$VERSION-deploy.yaml
```

::::expand{header="Check Output"}
```
namespace/app6 created
deployment.apps/app6-v1 created
service/app6-v1 created
```
::::


```bash
kubectl --context $EKS_CLUSTER2_CONTEXT -n $APPNAME get all
```

::::expand{header="Check Output"}
```
NAME                           READY   STATUS    RESTARTS   AGE
pod/app6-v1-7c98dc8c57-ssgxz   1/1     Running   0          109s

NAME              TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
service/app6-v1   ClusterIP   172.20.179.90   <none>        80/TCP    109s

NAME                      READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/app6-v1   1/1     1            1           109s

NAME                                 DESIRED   CURRENT   READY   AGE
replicaset.apps/app6-v1-7c98dc8c57   1         1         1       109s
```
::::

### Export Kubernetes service `app6-v1` from Second EKS Cluster to AWS Lattice Service

```bash
cat > manifests/$APPNAME-service-export.yaml <<EOF
apiVersion: application-networking.k8s.aws/v1alpha1   
kind: ServiceExport
metadata:
  name: $APPNAME-$VERSION
  namespace: $APPNAME
  annotations:
    application-networking.k8s.aws/federation: "amazon-vpc-lattice"               
EOF

kubectl --context $EKS_CLUSTER2_CONTEXT apply -f manifests/$APPNAME-service-export.yaml
```

::::expand{header="Check Output"}
```
serviceexport.application-networking.k8s.aws/app6-v1 created
```
::::

```bash
kubectl --context $EKS_CLUSTER2_CONTEXT -n $APPNAME get serviceexport.application-networking.k8s.aws app6-v1 -n app6 
```

::::expand{header="Check Output"}
```
NAME      AGE
app6-v1   44s
```
::::

The Kubernetes `ServicExport`triggers VPC Lattice Gateway API controller to create a lattice target group `k8s-app6-v1-app6-http-http1`

![app6-tg.png](/static/images/6-network-security/2-vpc-lattice-service-access/app6-tg.png)


### Import Kubernetes service `app6-v1` into First EKS Cluster

```bash
export APPNAME=app6
export VERSION=v1
cat > manifests/$APPNAME-service-import.yaml <<EOF
apiVersion: application-networking.k8s.aws/v1alpha1
kind: ServiceImport
metadata: 
  name: app6-v1
  namespace: app6
  annotations:
    application-networking.k8s.aws/aws-eks-cluster-name: $EKS_CLUSTER2_NAME
    application-networking.k8s.aws/aws-vpc: $EKS_CLUSTER2_VPC_ID 
spec:
  type: ClusterSetIP
  ports:
  - port: 80
    protocol: TCP 
EOF

kubectl --context $EKS_CLUSTER1_CONTEXT create namespace $APPNAME
kubectl --context $EKS_CLUSTER1_CONTEXT apply -f manifests/$APPNAME-service-import.yaml
```

::::expand{header="Check Output"}
```
namespace/app6 created
serviceimport.application-networking.k8s.aws/app6-v1 created
```
::::

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT get serviceimport.application-networking.k8s.aws -n app6
```

::::expand{header="Check Output"}
```
NAME      AGE
app6-v1   58s
```
::::


### Deploy HTTPRoute for Service `app6` in First Cluster with ServiceImport

```bash
envsubst < templates/route-template-https-custom-domain-service-import.yaml > manifests/$APPNAME-https-custom-domain-service-import.yaml
kubectl --context $EKS_CLUSTER1_CONTEXT apply -f manifests/$APPNAME-https-custom-domain-service-import.yaml
```

::::expand{header="Check Output"}
```
httproute.gateway.networking.k8s.io/app6 created
```
::::

This step may take 2-3 minutes, run the following command to wait for it to completed.

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT  wait --for=jsonpath='{.status.parents[-1:].conditions[-1:].reason}'=ResolvedRefs httproute/$APPNAME -n $APPNAME
```

::::expand{header="Check Output"}
```
httproute.gateway.networking.k8s.io/app6 condition met
```
::::

::alert[If the above command returns `error: timed out waiting for the condition on httproutes/app6`, run the command once again]{header="Note"}

View the VPC Lattice Service `app6-app6` in the [Amazon VPC Console](https://us-west-2.console.aws.amazon.com/vpc/home?region=us-west-2#Services:)

![app6-service.png](/static/images/6-network-security/2-vpc-lattice-service-access/app6-service.png)


Note that there are 2 listeners created one for `HTTP` and one for `HTTPS` under **Routing** Tab for VPC Service `app6-app6` in the Console. 

Note also the Access configuration with IAM policy.

![app6-routes.png](/static/images/6-network-security/2-vpc-lattice-service-access/app6-routes.png)

This route is connected to the Target group `k8s-app6-v1-app6-http-http1` which was created earlier as result of `ServiceExport` in the Second EKS Cluster.

## Get the HTTPRoute for `app6` service

1. List the route’s yaml file to see the DNS address (highlighted here on the message line): 

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT get httproute $APPNAME -n $APPNAME -o yaml
```

::::expand{header="Check Output"}
```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  annotations:
    application-networking.k8s.aws/lattice-assigned-domain-name: app6-app6-094b5ffecc2aa5d85.7d67968.vpc-lattice-svcs.us-west-2.on.aws
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"gateway.networking.k8s.io/v1beta1","kind":"HTTPRoute","metadata":{"annotations":{},"name":"app6","namespace":"app6"},"spec":{"hostnames":["app6.vpc-lattice-custom-domain.io"],"parentRefs":[{"kind":"Gateway","name":"app-services-gw","namespace":"app-services-gw","sectionName":"http-listener"}],"rules":[{"backendRefs":[{"kind":"ServiceImport","name":"app6-v1","port":80}],"matches":[{"path":{"type":"PathPrefix","value":"/"}}]}]}}
  creationTimestamp: "2023-10-27T09:06:57Z"
  finalizers:
  - httproute.k8s.aws/resources
  generation: 1
  name: app6
  namespace: app6
  resourceVersion: "618104"
  uid: 8e65f671-c5f3-4fcb-8443-9ba4dfbfedba
spec:
  hostnames:
  - app6.vpc-lattice-custom-domain.io
  parentRefs:
  - group: gateway.networking.k8s.io
    kind: Gateway
    name: app-services-gw
    namespace: app-services-gw
    sectionName: http-listener
  rules:
  - backendRefs:
    - group: ""
      kind: ServiceImport
      name: app6-v1
      port: 80
      weight: 1
    matches:
    - path:
        type: PathPrefix
        value: /
status:
  parents:
  - conditions:
    - lastTransitionTime: "2023-10-27T09:07:19Z"
      message: 'DNS Name: app6-app6-094b5ffecc2aa5d85.7d67968.vpc-lattice-svcs.us-west-2.on.aws'
      observedGeneration: 1
      reason: Accepted
      status: "True"
      type: Accepted
    - lastTransitionTime: "2023-10-27T09:07:19Z"
      message: 'DNS Name: app6-app6-094b5ffecc2aa5d85.7d67968.vpc-lattice-svcs.us-west-2.on.aws'
      observedGeneration: 1
      reason: ResolvedRefs
      status: "True"
      type: ResolvedRefs
    controllerName: application-networking.k8s.aws/gateway-api-controller
    parentRef:
      group: gateway.networking.k8s.io
      kind: Gateway
      name: app-services-gw
      namespace: app-services-gw
      sectionName: http-listener
```
::::

The `status` field in the above output contains the DNS Name of the Service `message: 'DNS Name: app6-app6-075dc0ad6d3159ffb.7d67968.vpc-lattice-svcs.us-west-2.on.aws'`

As we have deploy external-DNS, there should also be a `DNSEndpoint` object that will trigger a Route53 record creation.

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT get dnsendpoint $APPNAME-dns -n $APPNAME -o yaml     
```                     

::::expand{header="Check Output"}
```
apiVersion: externaldns.k8s.io/v1alpha1
kind: DNSEndpoint
metadata:
  creationTimestamp: "2024-02-14T12:36:57Z"
  generation: 1
  name: app6-dns
  namespace: app6
  ownerReferences:
  - apiVersion: gateway.networking.k8s.io/v1beta1
    blockOwnerDeletion: true
    controller: true
    kind: HTTPRoute
    name: app6
    uid: b4cde166-8440-4562-9424-75b3fd2f9016
  resourceVersion: "2307662"
  uid: 5a8a00d5-8fed-430b-8e70-46004d8e82dc
spec:
  endpoints:
  - dnsName: app6.vpc-lattice-custom-domain.io
    recordTTL: 300
    recordType: CNAME
    targets:
    - app6-app6-05af6dcbca041aaf3.7d67968.vpc-lattice-svcs.us-west-2.on.aws
status:
  observedGeneration: 1
```
::::

## Test Service Connectivity from `app1` in Cluster1 to `app6` hosted in Cluster2

1. Run the `nslookup` command in the `app1-v1` Pod to resolve **Custom Domain** for `app6` i.e. `app6.vpc-lattice-custom-domain.io`

```bash
export APPNAME=app1
export VERSION=v1
kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/$APPNAME-$VERSION -c $APPNAME-$VERSION -n $APPNAME -- nslookup app6.vpc-lattice-custom-domain.io
```

Note that domain name `app6.vpc-lattice-custom-domain.io` resolves to `app6` default VPC Lattice generated domain as per the `CNAME` record configuration in the Private Hosted Zone.

::::expand{header="Check Output"}
```
Server:         172.20.0.10
Address:        172.20.0.10#53

Non-authoritative answer:
app6.vpc-lattice-custom-domain.io       canonical name = app6-app6-094b5ffecc2aa5d85.7d67968.vpc-lattice-svcs.us-west-2.on.aws.
Name:   app6-app6-094b5ffecc2aa5d85.7d67968.vpc-lattice-svcs.us-west-2.on.aws
Address: 169.254.171.33
Name:   app6-app6-094b5ffecc2aa5d85.7d67968.vpc-lattice-svcs.us-west-2.on.aws
Address: fd00:ec2:80::a9fe:ab21
```
::::


4. Exec into an `app1-v1` pod to check connectivity to `app6` service using custom domain at `HTTP` listener.

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/$APPNAME-$VERSION -c $APPNAME-$VERSION -n $APPNAME -- /bin/bash -c 'TOKEN=$(cat $AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE) && STS=$(curl 169.254.170.23/v1/credentials -H "Authorization: $TOKEN") && curl --cacert /cert/root_cert.pem --aws-sigv4 "aws:amz:${AWS_REGION}:vpc-lattice-svcs" --user $(echo $STS | jq ".AccessKeyId" -r):$(echo $STS | jq ".SecretAccessKey" -r) -H "x-amz-content-sha256: UNSIGNED-PAYLOAD" -H "x-amz-security-token: $(echo $STS | jq ".Token" -r)" 'https://app6.vpc-lattice-custom-domain.io
```

::::expand{header="Check Output"}
```
Requsting to Pod(app6-v1-7c98dc8c57-ssgxz): Hello from app6-v1
```
::::

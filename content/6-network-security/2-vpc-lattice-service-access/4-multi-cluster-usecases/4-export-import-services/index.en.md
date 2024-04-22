---
title : "Usecase 7: Spread a same service onto the 2 different clusters (using serviceImport/serviceExport)"
weight : 13
---

In this section, we will deploy a new version of `app4`, which is already deployed in cluster 1, in Second EKS Cluster and Export it to VPC Lattice. Then import this service into first EKS Cluster.

![](/static/images/6-network-security/2-vpc-lattice-service-access/lattice-usecase7.png)
- We Use only 1 HTTPRoute declared in cluster 1
- This route reference loval app4-v1 service, and Import app4-v2 service from cluster 2
- The route is loadbalanced 50% on each service

## Deploy K8s manifests for Service `app4 version 2` in Second EKS Cluster

#### 1. Create Pod Identity association

For each EKS cluster : 

```bash
aws eks create-pod-identity-association \
  --cluster-name $EKS_CLUSTER1_NAME \
  --namespace app4 \
  --service-account default \
  --role-arn arn:aws:iam::${AWS_ACCOUNT_ID}:role/aws-sigv4-client


aws eks create-pod-identity-association \
  --cluster-name $EKS_CLUSTER2_NAME \
  --namespace app4 \
  --service-account default \
  --role-arn arn:aws:iam::${AWS_ACCOUNT_ID}:role/aws-sigv4-client
```

And restart app4:

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT rollout -n app4 restart deployment app4-v1
```


#### 2. Deploy app4-v2

```bash
export APPNAME=app4
export VERSION=v2 
envsubst < templates/app-template.yaml > manifests/$APPNAME-$VERSION-deploy.yaml
kubectl  --context $EKS_CLUSTER2_CONTEXT apply -f manifests/$APPNAME-$VERSION-deploy.yaml
```

::::expand{header="Check Output"}
```
namespace/app4 created
deployment.apps/app4-v2 created
service/app4-v2 created
```
::::


```bash
kubectl --context $EKS_CLUSTER2_CONTEXT -n $APPNAME get all
```

::::expand{header="Check Output"}
```
NAME                           READY   STATUS    RESTARTS   AGE
pod/app4-v2-76fd45fbc4-d7fhg   1/1     Running   0          23s

NAME              TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
service/app4-v2   ClusterIP   10.100.222.74   <none>        80/TCP    23s

NAME                      READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/app4-v2   1/1     1            1           23s

NAME                                 DESIRED   CURRENT   READY   AGE
replicaset.apps/app4-v2-76fd45fbc4   1         1         1       23s
```
::::

#### 3. Export Kubernetes service `app4-v2` from Second EKS Cluster to AWS Lattice Service

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
serviceexport.application-networking.k8s.aws/app4-v2 created
```
::::

```bash
kubectl --context $EKS_CLUSTER2_CONTEXT -n $APPNAME get serviceexport.application-networking.k8s.aws app4-v2 -n app4
```

::::expand{header="Check Output"}
```
NAME      AGE
app4-v2   44s
```
::::

The Kubernetes `ServicExport`triggers VPC Lattice Gateway API controller to create a lattice target group `k8s-app4-app4-v2-ojmpufnyxi`

![app6-tg.png](/static/images/6-network-security/2-vpc-lattice-service-access/app4-v2-tg.png)

> Note: the target for now is flagged "unused"

### 4. Import Kubernetes service `app4-v2` into First EKS Cluster

```bash
export APPNAME=app4
export VERSION=v2
cat > manifests/$APPNAME-service-import.yaml <<EOF
apiVersion: application-networking.k8s.aws/v1alpha1
kind: ServiceImport
metadata: 
  name: $APPNAME-$VERSION
  namespace: $APPNAME
  annotations:
    application-networking.k8s.aws/aws-eks-cluster-name: $EKS_CLUSTER2_NAME
    application-networking.k8s.aws/aws-vpc: $EKS_CLUSTER2_VPC_ID 
spec:
  type: ClusterSetIP
  ports:
  - port: 80
    protocol: TCP 
EOF

kubectl --context $EKS_CLUSTER1_CONTEXT apply -f manifests/$APPNAME-service-import.yaml
```

::::expand{header="Check Output"}
```
serviceimport.application-networking.k8s.aws/app4-v2 created
```
::::

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT get serviceimport.application-networking.k8s.aws -n $APPNAME
```

::::expand{header="Check Output"}
```
NAME      AGE
app4-v2   68s
```
::::



### 5. Update HTTPRoute for Service `app4` in First Cluster and add ServiceImport as additional target

Before starting, check we can access app4-v1 service, from app1

```bash
export APPNAME=app1
export VERSION=v1
kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/$APPNAME-$VERSION -c $APPNAME-$VERSION -n $APPNAME -- /bin/bash -c '\
curl http://app4.vpc-lattice-custom-domain.io'
```

Update HTTP Route to point to both services, which are in different clusters. We define a weight of 50% for each target (app4-v1 and app4-v2)

```bash
export APPNAME=app4
export VERSION1=v1
export VERSION2=v2
export SOURCE_CLUSTER=$EKS_CLUSTER1_NAME
export SOURCE_NAMESPACE=app1
envsubst < templates/route-template-http-custom-domain-weighted.yaml > manifests/$APPNAME-https-custom-domain-weighted-service-import.yaml
c9 manifests/$APPNAME-https-custom-domain-weighted-service-import.yaml
kubectl --context $EKS_CLUSTER1_CONTEXT apply -f manifests/$APPNAME-https-custom-domain-weighted-service-import.yaml
```

::::expand{header="Manifest" defaultExpanded=true}
:::code{language=yaml showCopyAction=false showLineNumbers=true highlightLines='19,23,57,58'}
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  name: app4
  namespace: app4
spec:
  hostnames:
  - app4.vpc-lattice-custom-domain.io
  parentRefs:
  - kind: Gateway
    name: app-services-gw
    namespace: app-services-gw  
    sectionName: https-listener-with-custom-domain
  rules:
  - backendRefs:
    - name: app4-v1
      kind: Service
      port: 80
      weight: 50
    - name: app4-v2
      kind: ServiceImport
      port: 80
      weight: 50      
    matches:
      - path:
          type: PathPrefix
          value: /
---
apiVersion: application-networking.k8s.aws/v1alpha1
kind: IAMAuthPolicy
metadata:
    name: app4-iam-auth-policy
    namespace: app4
spec:
    targetRef:
        group: "gateway.networking.k8s.io"
        kind: HTTPRoute
        namespace: app4
        name: app4
    policy: |
        {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": "arn:aws:iam::798082067117:root"
                    },
                    "Action": "vpc-lattice-svcs:Invoke",
                    "Resource": "*",
                    "Condition": {
                        "StringEquals": {
                            "vpc-lattice-svcs:SourceVpc": [
                                "vpc-0a376808f0870acc5",
                                "vpc-03054e11d0136f0f0"
                            ],
                            "aws:PrincipalTag/eks-cluster-name": "eksworkshop-eksctl-1",
                            "aws:PrincipalTag/kubernetes-namespace": "app1"
                        }
                    }                    
                }
            ]
        }          

:::
::::

We can see in the highlited lines, that we define 50% request on each service, which are from different clusters.
We only allow app1 from cluster 1 to connect to the app4 service.

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT  wait --for=jsonpath='{.status.parents[-1:].conditions[-1:].reason}'=ResolvedRefs httproute/$APPNAME -n $APPNAME
```

::::expand{header="Check Output"}
```
httproute.gateway.networking.k8s.io/app4 condition met
```
::::

:::::alert{type="info" header="Congratulation!!"}
Wait 2-3 minutes for the HTTPRoute to propagate to VPC lattice service configuration
:::::

View the VPC Lattice Service `app4-app4` in the [Amazon VPC Console](https://console.aws.amazon.com/vpc/home?#Services:)

![app4-service.png](/static/images/6-network-security/2-vpc-lattice-service-access/app4-service.png)

Note that this time we created only 1 `HTTPS` listeners under **Routing** Tab for VPC Service `app4-app4` in the Console. 

![app4-routes-weighted.png](/static/images/6-network-security/2-vpc-lattice-service-access/app4-routes-weighted.png)

In the Routing section you can see that we have now 2 targetgroups for the service:
- the app4-v1 targetgroup is from the local kubernetes service (in EKS cluster 1)
- the app4-v2 targetgroup is from the serviceImport, referencing the remote Kubernetes service (in EKS cluster 2)

Note also the Access configuration with IAM policy.

## Test Service Connectivity from `app1` in Cluster1 to `app4` 

#### 1. Exec into an `app1-v1` pod to check connectivity to `app4` service using custom domain at `HTTPS` listener.

```bash
export APPNAME=app1
export VERSION=v1
for x in `seq 0 9`; do kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/$APPNAME-$VERSION -c $APPNAME-$VERSION -n $APPNAME -- /bin/bash -c '\
curl http://app4.vpc-lattice-custom-domain.io' ; done
```

::::expand{header="Check Output"}
```
Requsting to Pod(app4-v1-65f7f8fdff-ln9hf): Hello from app4-v1
Requsting to Pod(app4-v1-65f7f8fdff-ln9hf): Hello from app4-v1
Requsting to Pod(app4-v2-7f6f8c9674-ftv4s): Hello from app4-v2
Requsting to Pod(app4-v2-7f6f8c9674-ftv4s): Hello from app4-v2
Requsting to Pod(app4-v1-65f7f8fdff-ln9hf): Hello from app4-v1
Requsting to Pod(app4-v2-7f6f8c9674-ftv4s): Hello from app4-v2
Requsting to Pod(app4-v2-7f6f8c9674-ftv4s): Hello from app4-v2
Requsting to Pod(app4-v1-65f7f8fdff-ln9hf): Hello from app4-v1
Requsting to Pod(app4-v2-7f6f8c9674-ftv4s): Hello from app4-v2
Requsting to Pod(app4-v1-65f7f8fdff-ln9hf): Hello from app4-v1
```
::::

> You should see like 50% requests are going to app4-v1, and 50% are going to app4-v2.

## Test resilience when stopping the app1-v1 service.

Now we want to see how VPC lattice can improva the resiliency of our application.

In one terminal, start calling the app4 lattice service:

```bash
export APPNAME=app1
export VERSION=v1
while true; do kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/$APPNAME-$VERSION -c $APPNAME-$VERSION -n $APPNAME -- /bin/bash -c '\
curl http://app4.vpc-lattice-custom-domain.io' ; done
```

While the command is running, check the impact on the following scenarios:

1. Restart the application
```bash
kubectl --context $EKS_CLUSTER1_CONTEXT rollout -n app4 restart deployment app4-v1
kubectl --context $EKS_CLUSTER2_CONTEXT rollout -n app4 restart deployment app4-v2
```


::::expand{header="Check Output"}
```
Requsting to Pod(app4-v1-678678d77b-x4fhb): Hello from app4-v1
Requsting to Pod(app4-v2-7dbbc7c77f-sflcl): Hello from app4-v2
Service Unavailable
Service Unavailable
Requsting to Pod(app4-v2-7dbbc7c77f-sflcl): Hello from app4-v2
Requsting to Pod(app4-v1-7d8f575467-xmzgp): Hello from app4-v1
Requsting to Pod(app4-v2-7dbbc7c77f-sflcl): Hello from app4-v2
```
::::

You should have seen some Errors while the application restart.

<!--
2. scale down to 0 the app4-v1 service in first cluster
```bash
kubectl --context $EKS_CLUSTER1_CONTEXT scale -n app4 deployment/app4-v1 --replicas=0
```
3. Scale back the app4-v1 in first cluster
```bash
kubectl --context $EKS_CLUSTER1_CONTEXT scale -n app4 deployment/app4-v1 --replicas=1
```


You can also try the same for app4-v2

1. Restart the application
```bash
kubectl --context $EKS_CLUSTER2_CONTEXT rollout -n app4 restart deployment app4-v2
```
2. scale down to 0 the app4-v1 service in first cluster
```bash
kubectl --context $EKS_CLUSTER2_CONTEXT scale -n app4 deployment/app4-v2 --replicas=0
```
3. Scale back the app4-v1 in first cluster
```bash
kubectl --context $EKS_CLUSTER2_CONTEXT scale -n app4 deployment/app4-v2 --replicas=1
```
-->

### Improve situation

How can we improve this ? while it is quick for Kubernetes to add a new pod and delete the old one, it take longer for this to reflect in the VPC Lattice targetgroup.
Following the [EKS Best Practice guide for resiliency](https://aws.github.io/aws-eks-best-practices/networking/loadbalancing/loadbalancing/#ensure-pods-are-deregistered-from-load-balancers-before-termination), we are going to add a preStop Hook in our pod definition so that it will wait for 30 seconds before exiting, allowing to keep responding for ongoing request, the time it is removed from the targetgroup

:::code{language=yaml showCopyAction=false showLineNumbers=true highlightLines='2,5'}
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sh", "-c", "sleep 15"]
      terminationGracePeriodSeconds: 15
:::

let's apply this in both manifest for app4-v1 and app4-v2 using following command, and try again the previous test to see the differences.

```bash
sed -i "s/#addprestop//g" manifests/app4-v1-deploy.yaml
kubectl --context $EKS_CLUSTER1_CONTEXT apply -f manifests/app4-v1-deploy.yaml

sed -i "s/#addprestop//g" manifests/app4-v2-deploy.yaml
kubectl --context $EKS_CLUSTER2_CONTEXT apply -f manifests/app4-v2-deploy.yaml
```

With this new setup you should be able to rollout your application without downtime. If needed, you can still increase the terminationGracePeriodSeconds time, so that your application continue to respond while VPC lattice is removing it from the Targetgroup.
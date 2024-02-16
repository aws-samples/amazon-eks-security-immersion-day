---
title : "Usecase 7: Export K8s Service in Cluster2 and Import into  Cluster1"
weight : 13
---

In this section, we will deploy a new version of `app4`, which is already deployed in cluster 1, in Second EKS Cluster and Export it to VPC Lattice. Then import this service into first EKS Cluster.

## Deploy K8s manifests for Service `app4 version 2` in Second EKS Cluster

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

### Export Kubernetes service `app4-v2` from Second EKS Cluster to AWS Lattice Service

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

The Kubernetes `ServicExport`triggers VPC Lattice Gateway API controller to create a lattice target group `k8s-app6-v1-app6-http-http1`

![app6-tg.png](/static/images/6-network-security/2-vpc-lattice-service-access/app4-v2-tg.png)


### Import Kubernetes service `app4-v2` into First EKS Cluster

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



### Update HTTPRoute for Service `app4` in First Cluster and add ServiceImport as additional target

Before starting, check we can access app4-v1 service, from app1

```bash
export APPNAME=app1
export VERSION=v1
kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/$APPNAME-$VERSION -c $APPNAME-$VERSION -n $APPNAME -- /bin/bash -c 'TOKEN=$(cat $AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE) && STS=$(curl 169.254.170.23/v1/credentials -H "Authorization: $TOKEN") && curl --cacert /cert/root_cert.pem --aws-sigv4 "aws:amz:${AWS_REGION}:vpc-lattice-svcs" --user $(echo $STS | jq ".AccessKeyId" -r):$(echo $STS | jq ".SecretAccessKey" -r) -H "x-amz-content-sha256: UNSIGNED-PAYLOAD" -H "x-amz-security-token: $(echo $STS | jq ".Token" -r)" 'https://app4.vpc-lattice-custom-domain.io
```

Update HTTP Route to point to both services, which are in different clusters:

```bash
export APPNAME=app4
export VERSION1=v1
export VERSION2=v2
envsubst < templates/route-template-http-custom-domain-weighted.yaml > manifests/$APPNAME-https-custom-domain-weighted-service-import.yaml
kubectl --context $EKS_CLUSTER1_CONTEXT apply -f manifests/$APPNAME-https-custom-domain-weighted-service-import.yaml
```

::::expand{header="Check Output"}
```
httproute.gateway.networking.k8s.io/app4 configured
```
::::

This step may take 2-3 minutes, run the following command to wait for it to completed.

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT  wait --for=jsonpath='{.status.parents[-1:].conditions[-1:].reason}'=ResolvedRefs httproute/$APPNAME -n $APPNAME
```

::::expand{header="Check Output"}
```
httproute.gateway.networking.k8s.io/app4 condition met
```
::::

::alert[If the above command returns `error: timed out waiting for the condition on httproutes/app6`, run the command once again]{header="Note"}

View the VPC Lattice Service `app4-app4` in the [Amazon VPC Console](https://console.aws.amazon.com/vpc/home?#Services:)

![app4-service.png](/static/images/6-network-security/2-vpc-lattice-service-access/app4-service.png)

Note that this time we created only 1 `HTTPS` listeners under **Routing** Tab for VPC Service `app4-app4` in the Console. 

![app4-routes-weighted.png](/static/images/6-network-security/2-vpc-lattice-service-access/app4-routes-weighted.png)

In the Routing section you can see that we have now 2 targetgroups for the service:
- the app4-v1 targetgroup is from the local kubernetes service (in EKS cluster 1)
- the app4-v2 targetgroup is from the serviceImport, referencing the remote Kubernetes service (in EKS cluster 2)

Note also the Access configuration with IAM policy.

## Test Service Connectivity from `app1` in Cluster1 to `app4` 

### 1. Exec into an `app1-v1` pod to check connectivity to `app4` service using custom domain at `HTTPS` listener.

```bash
export APPNAME=app1
export VERSION=v1
for x in `seq 0 9`; do kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/$APPNAME-$VERSION -c $APPNAME-$VERSION -n $APPNAME -- /bin/bash -c 'TOKEN=$(cat $AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE) && STS=$(curl -s 169.254.170.23/v1/credentials -H "Authorization: $TOKEN") && curl -s --cacert /cert/root_cert.pem --aws-sigv4 "aws:amz:${AWS_REGION}:vpc-lattice-svcs" --user $(echo $STS | jq ".AccessKeyId" -r):$(echo $STS | jq ".SecretAccessKey" -r) -H "x-amz-content-sha256: UNSIGNED-PAYLOAD" -H "x-amz-security-token: $(echo $STS | jq ".Token" -r)" 'https://app4.vpc-lattice-custom-domain.io ; done
```

::::expand{header="Check Output"}
```
Requsting to Pod(app4-v2-76fd45fbc4-d7fhg): Hello from app4-v2
Requsting to Pod(app4-v2-76fd45fbc4-d7fhg): Hello from app4-v2
Requsting to Pod(app4-v2-76fd45fbc4-d7fhg): Hello from app4-v2
Requsting to Pod(app4-v2-76fd45fbc4-d7fhg): Hello from app4-v2
Requsting to Pod(app4-v2-76fd45fbc4-d7fhg): Hello from app4-v2
Requsting to Pod(app4-v1-85d4d9c455-22fgw): Hello from app4-v1
Requsting to Pod(app4-v1-85d4d9c455-22fgw): Hello from app4-v1
Requsting to Pod(app4-v1-85d4d9c455-22fgw): Hello from app4-v1
Requsting to Pod(app4-v1-85d4d9c455-22fgw): Hello from app4-v1
Requsting to Pod(app4-v2-76fd45fbc4-d7fhg): Hello from app4-v2
```
::::

> You should see like 50% requests are going to app4-v1, and 50% are going to app4-v2.

## Test resilience when stopping the app1-v1 service.

Now we want to see how VPC lattice can improva the resiliency of our application.

In one terminal, start calling the app4 lattice service:

```bash
export APPNAME=app1
export VERSION=v1
while true; do kubectl --context $EKS_CLUSTER1_CONTEXT exec -it deploy/$APPNAME-$VERSION -c $APPNAME-$VERSION -n $APPNAME -- /bin/bash -c 'TOKEN=$(cat $AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE) && STS=$(curl -s 169.254.170.23/v1/credentials -H "Authorization: $TOKEN") && curl -s --cacert /cert/root_cert.pem --aws-sigv4 "aws:amz:${AWS_REGION}:vpc-lattice-svcs" --user $(echo $STS | jq ".AccessKeyId" -r):$(echo $STS | jq ".SecretAccessKey" -r) -H "x-amz-content-sha256: UNSIGNED-PAYLOAD" -H "x-amz-security-token: $(echo $STS | jq ".Token" -r)" 'https://app4.vpc-lattice-custom-domain.io ; done
```

While the command is running, scale down to 0 the app4-v1 service in first cluster

```bash

kubectl --context $EKS_CLUSTER1_CONTEXT rollout -n app4 restart deployment app4-v1 

kubectl --context $EKS_CLUSTER1_CONTEXT scale -n app4 deployment/app4-v1 --replicas=0

kubectl --context $EKS_CLUSTER1_CONTEXT get deployment -n app4
```


You can also try the same for app4-v2

```bash
kubectl --context $EKS_CLUSTER2_CONTEXT rollout -n app4 restart deployment app4-v2
```
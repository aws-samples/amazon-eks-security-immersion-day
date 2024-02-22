---
title : "Cleanup"
weight : 15
---

Once you have completed this chapter, you can cleanup the files and resources you created by issuing the following commands:

```bash
cd ~/environment
# Delete the Second EKS Cluster
eksctl delete cluster -f manifests/eksworkshop.yaml

# Delete the Objects from First EKS Cluster

export APPNAME=app6
export VERSION=v1
kubectl --context $EKS_CLUSTER1_CONTEXT delete -f manifests/$APPNAME-http-custom-domain-service-import.yaml
kubectl --context $EKS_CLUSTER1_CONTEXT delete -f manifests/$APPNAME-http-custom-domain-service-import.yaml


export APPNAME=app4
export VERSION=v1
kubectl --context $EKS_CLUSTER1_CONTEXT delete -f manifests/$APPNAME-https-custom-domain.yaml
kubectl  --context $EKS_CLUSTER1_CONTEXT delete -f manifests/$APPNAME-$VERSION-deploy.yaml


export APPNAME=app3
export VERSION=v1
kubectl --context $EKS_CLUSTER1_CONTEXT delete -f manifests/$APPNAME-https-default-domain.yaml
kubectl  --context $EKS_CLUSTER1_CONTEXT delete -f manifests/$APPNAME-$VERSION-deploy.yaml



export APPNAME=app2
export VERSION=v1
kubectl --context $EKS_CLUSTER1_CONTEXT delete -f manifests/$APPNAME-http-default-domain.yaml
kubectl  --context $EKS_CLUSTER1_CONTEXT delete -f manifests/$APPNAME-$VERSION-deploy.yaml


export APPNAME=app1
export VERSION=v1
kubectl --context $EKS_CLUSTER1_CONTEXT delete -f manifests/$APPNAME-http-default-domain.yaml
kubectl  --context $EKS_CLUSTER1_CONTEXT delete -f manifests/$APPNAME-$VERSION-deploy.yaml

export GATEWAY_NAME=app-services-gw
export GATEWAY_NAMESPACE=app-services-gw
kubectl  --context $EKS_CLUSTER1_CONTEXT delete -f manifests/$GATEWAY_NAME.yaml
kubectl  --context $EKS_CLUSTER1_CONTEXT delete -f manifests/gatewayclass.yaml

cd ~/environment/aws-application-networking-k8s
kubectl  --context $EKS_CLUSTER1_CONTEXT delete -f manifests/gatewayclass.yaml
kubectl --context $EKS_CLUSTER1_CONTEXT delete -f examples/deploy-namesystem.yaml
```

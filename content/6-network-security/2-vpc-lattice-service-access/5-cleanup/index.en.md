---
title : "Cleanup"
weight : 15
---

Once you have completed this chapter, you can cleanup the files and resources you created by issuing the following commands:

## Clean second cluster

```bash
kubectl --context $EKS_CLUSTER2_CONTEXT delete ns app5
kubectl --context $EKS_CLUSTER2_CONTEXT delete ns app4

kubectl --context $EKS_CLUSTER2_CONTEXT delete ns app-services-gw
```

## Delete second cluster

```bash
eksdemo delete cluster $EKS_CLUSTER2_NAME
```


## Delete the Objects from First EKS Cluster

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT delete ns app4
kubectl --context $EKS_CLUSTER1_CONTEXT delete ns app3
kubectl --context $EKS_CLUSTER1_CONTEXT delete ns app2
kubectl --context $EKS_CLUSTER1_CONTEXT delete ns app1

kubectl --context $EKS_CLUSTER1_CONTEXT delete ns app-services-gw
```

## Clean first EKS cluster add-ons

If you don't need anymore thoses addons, you can remove them
```bash
eksdemo uninstall vpc-lattice-controller -c $EKS_CLUSTER1_NAME -D

eksdemo uninstall policy kyverno -c $EKS_CLUSTER1_NAME
kubectl --context $EKS_CLUSTER1_CONTEXT delete ns kyverno

eksdemo uninstall external-dns -c $EKS_CLUSTER1_NAME -D
kubectl --context $EKS_CLUSTER1_CONTEXT delete ns external-dns
```
---
title : "Cleanup"
weight : 25
---

Once you have completed this chapter, you can cleanup the files and resources you created by issuing the following commands:

```bash
cd ~/environment/aws-application-networking-k8s
kubectl delete -f kyverno-cluster-policy.yaml
helm -n kyverno uninstall kyverno
kubectl delete -f examples/inventory-route.yaml
kubectl delete -f examples/inventory-ver1.yaml
kubectl delete -f examples/rate-route-path.yaml
kubectl delete -f examples/review.yaml
kubectl delete -f examples/parking.yaml
kubectl delete -f examples/my-hotel-gateway.yaml
kubectl delete -f examples/gatewayclass.yaml

```

::::expand{header="Check Output"}
```bash
clusterpolicy.kyverno.io "inject-sidecar" deleted
release "kyverno" uninstalled
httproute.gateway.networking.k8s.io "inventory" deleted
deployment.apps "inventory-ver1" deleted
service "inventory-ver1" deleted
httproute.gateway.networking.k8s.io "rates" deleted
deployment.apps "review" deleted
service "review" deleted
deployment.apps "parking" deleted
service "parking" deleted
gateway.gateway.networking.k8s.io "my-hotel" deleted
gatewayclass.gateway.networking.k8s.io "amazon-vpc-lattice" deleted
```
::::



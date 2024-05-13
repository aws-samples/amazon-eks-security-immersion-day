---
title : "Use envoy proxy to sign requests"
weight : 26
---

Again in this module we are going to leverage kyverno to inject our envoy signing proxy:

First, check that Kyverno is installed:

```bash
eksdemo install policy kyverno -c $EKS_CLUSTER2_NAME
```

::::expand{header="Check Output"}
```
Downloading Chart: https://kyverno.github.io/kyverno/kyverno-v2.5.2.tgz
Helm installing...
2024/04/22 11:59:56 creating 1 resource(s)
2024/04/22 11:59:56 creating 32 resource(s)
Using chart version "v2.5.2", installed "policy-kyverno" version "v1.7.2" in namespace "kyverno"
NOTES:
Chart version: v2.5.2
Kyverno version: v1.7.2

Thank you for installing kyverno! Your release is named policy-kyverno.
⚠️  WARNING: Setting replicas count below 3 means Kyverno is not running in high availability mode.

💡 Note: There is a trade-off when deciding which approach to take regarding Namespace exclusions. Please see the documentation at https://kyverno.io/docs/installation/#security-vs-operability to understand the risks.
```
::::

Let's apply the Kyverno ClusterPolicy we created in [previous module](/6-network-security/2-vpc-lattice-service-access/3-single-cluster-usecases/5-service-connect-https-custom-domain/1-inject-envoy-kyverno) and let's force restart of our app5

```bash
kubectl --context $EKS_CLUSTER2_CONTEXT apply -f manifests/kyverno-cluster-policy-envoy.yaml
kubectl --context $EKS_CLUSTER2_CONTEXT rollout restart deployment/app5-v1 -n app5
```

No try again to connect to our service:

```bash
kubectl --context $EKS_CLUSTER2_CONTEXT exec -it deploy/app5-v1 -n app5 -c app5-v1 -- /bin/bash -c 'curl http://app1.vpc-lattice-custom-domain.io'
```

::::expand{header="Check Output" defaultExpanded=true}
```
Requsting to Pod(app1-v1-96c54ccf7-4rxg8): Hello from app1-v1
```
::::

You can see the logs of the envoy proxy computing the sigv4 signature by looking at the logs:

```bash
kubectl stern --context $EKS_CLUSTER2_CONTEXT -n app5 app5 -c envoy-sigv4 --tail=10 | grep token
```


::::alert{type="info" header="Congratulation!!"}
We are able to do cross EKS cluster service communication in HTTPS throug VPC lattice, with IAM authorization relying on EKS pod Identity to control which application from which cluster in specific namespace is able or not to access the targeted vpc lattice service.
::::
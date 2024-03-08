---
title : "Cleanup"
weight : 12
---

## Delete Kyverno cluster policy

```bash
kubectl delete clusterpolicy inject-sidecar
``` 

## Redeploy the app1

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT delete deployment/app1-v1 -n app1
kubectl --context $EKS_CLUSTER1_CONTEXT apply -f manifests/app1-v1-deploy.yaml 
```

<!--
## Uninstall Kyverno Policy Engine

Let us uninstall the Kyverno policy engine and associated configurations into the EKS cluster using using this [Helm](https://helm.sh/)

```bash
helm uninstall kyverno --kube-context $EKS_CLUSTER1_CONTEXT --namespace kyverno 
```

::::expand{header="Check Output"}
```
release "kyverno" uninstalled
```
::::
-->

<!--
## Remove IAM Access Auth policy for Service `app2-app2`

1. Run below command to delete the auth policy.

```bash
aws vpc-lattice delete-auth-policy \
    --resource-identifier $APP2_SERVICE_ID 
```
2. Go to VPC Lattice Service `app2-app2` under **Access** tab in the [Amazon VPC Console](https://us-west-2.console.aws.amazon.com/vpc/home?region=us-west-2#Services:), Under  **Access** tab, and then on **Edit access settings**, select **None** and Click on **Save Changes**.

## Remove IAM Access Auth policy for Service network `app-services-gw`

1. Run below command to delete the auth policy.

```bash
aws vpc-lattice delete-auth-policy \
    --resource-identifier $gatewayARN 
```

2. Run below command to change the auth type to `NONE`.

```bash
aws vpc-lattice update-service-network --auth-type NONE \
--service-network-identifier $gatewayARN
```

::::expand{header="Check Output"}
```json
{
    "arn": "arn:aws:vpc-lattice:us-west-2:ACCOUNT_ID:servicenetwork/sn-0cc73287505ac121a",
    "authType": "NONE",
    "id": "sn-0cc73287505ac121a",
    "name": "app-services-gw"
}
```
::::
-->
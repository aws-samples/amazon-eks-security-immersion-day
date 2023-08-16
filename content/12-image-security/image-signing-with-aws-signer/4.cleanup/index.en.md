---
title : "Cleanup"
weight : 29
---

You created a few resources for this workshop. If you are participating in an AWS hosted event, then you don't need to clean up anything. The temporary accounts will get deleted after the workshop.

If are running this workshop in your own account, you would need to follow the below steps to cleanup the environment you set up for the workshop.

```bash
cd ~/environment

kubectl delete  -f signed-pod.yaml -n test-notation
kubectl delete ns test-notation
kubectl delete -f kyverno-policy.yaml
kubectl delete -f trustpolicy.yaml 
kubectl delete -f truststore.yaml 

cd kyverno-notation-aws/
kubectl delete -f configs/crds/
kubectl delete -f configs/install.yaml
kubectl delete -f https://raw.githubusercontent.com/kyverno/kyverno/main/config/install-latest-testing.yaml
kubectl delete -f https://github.com/cert-manager/cert-manager/releases/download/v1.11.0/cert-manager.yaml

aws signer cancel-signing-profile  --profile-name notation_test

eksctl delete iamserviceaccount --name $NAME --cluster $CLUSTER

aws ecr delete-repository \
    --repository-name ${IMAGE_NAME} \
    --force

aws iam delete-policy --policy-arn $SIGNER_POLICY

aws ec2 terminate-instances --instance-ids $AL2023_EC2_INSTANCE_ID

aws ec2 delete-key-pair --key-name "al2023-ssh-key"

```

::::expand{header="Check Output"}
```bash
pod "signed-pod" deleted
namespace "test-notation" deleted
clusterpolicy.kyverno.io "check-images" deleted
truststore.notation.nirmata.io "aws-signer-ts" deleted

customresourcedefinition.apiextensions.k8s.io "trustpolicies.notation.nirmata.io" deleted
customresourcedefinition.apiextensions.k8s.io "truststores.notation.nirmata.io" deleted

namespace "kyverno-notation-aws" deleted
clusterissuer.cert-manager.io "selfsigned-issuer" deleted
certificate.cert-manager.io "my-selfsigned-ca" deleted
issuer.cert-manager.io "my-ca-issuer" deleted
certificate.cert-manager.io "kyverno-notation-aws-cert" deleted
serviceaccount "kyverno-notation-aws" deleted
clusterrole.rbac.authorization.k8s.io "kyverno-notation-aws-clusterrole" deleted
clusterrolebinding.rbac.authorization.k8s.io "kyverno-notation-aws-clusterrolebinding" deleted
role.rbac.authorization.k8s.io "kyverno-notation-aws-role" deleted
rolebinding.rbac.authorization.k8s.io "kyverno-notation-aws-rolebinding" deleted
deployment.apps "kyverno-notation-aws" deleted
service "svc" deleted
configmap "notation-plugin-config" deleted


sercontent.com/kyverno/kyverno/main/config/install-latest-testing.yaml
namespace "kyverno" deleted
serviceaccount "kyverno-admission-controller" deleted
serviceaccount "kyverno-background-controller" deleted
serviceaccount "kyverno-cleanup-controller" deleted
serviceaccount "kyverno-cleanup-jobs" deleted
serviceaccount "kyverno-reports-controller" deleted
configmap "kyverno" deleted
configmap "kyverno-metrics" deleted
customresourcedefinition.apiextensions.k8s.io "admissionreports.kyverno.io" deleted
customresourcedefinition.apiextensions.k8s.io "backgroundscanreports.kyverno.io" deleted
customresourcedefinition.apiextensions.k8s.io "cleanuppolicies.kyverno.io" deleted
customresourcedefinition.apiextensions.k8s.io "clusteradmissionreports.kyverno.io" deleted
customresourcedefinition.apiextensions.k8s.io "clusterbackgroundscanreports.kyverno.io" deleted
customresourcedefinition.apiextensions.k8s.io "clustercleanuppolicies.kyverno.io" deleted
customresourcedefinition.apiextensions.k8s.io "clusterpolicies.kyverno.io" deleted
customresourcedefinition.apiextensions.k8s.io "policies.kyverno.io" deleted
customresourcedefinition.apiextensions.k8s.io "policyexceptions.kyverno.io" deleted
customresourcedefinition.apiextensions.k8s.io "updaterequests.kyverno.io" deleted
customresourcedefinition.apiextensions.k8s.io "clusterpolicyreports.wgpolicyk8s.io" deleted
customresourcedefinition.apiextensions.k8s.io "policyreports.wgpolicyk8s.io" deleted
clusterrole.rbac.authorization.k8s.io "kyverno:admission-controller" deleted
clusterrole.rbac.authorization.k8s.io "kyverno:admission-controller:core" deleted
clusterrole.rbac.authorization.k8s.io "kyverno:background-controller" deleted
clusterrole.rbac.authorization.k8s.io "kyverno:background-controller:core" deleted
clusterrole.rbac.authorization.k8s.io "kyverno:cleanup-controller" deleted
clusterrole.rbac.authorization.k8s.io "kyverno:cleanup-controller:core" deleted
clusterrole.rbac.authorization.k8s.io "kyverno-cleanup-jobs" deleted
clusterrole.rbac.authorization.k8s.io "kyverno:rbac:admin:policies" deleted
clusterrole.rbac.authorization.k8s.io "kyverno:rbac:view:policies" deleted
clusterrole.rbac.authorization.k8s.io "kyverno:rbac:admin:policyreports" deleted
clusterrole.rbac.authorization.k8s.io "kyverno:rbac:view:policyreports" deleted
clusterrole.rbac.authorization.k8s.io "kyverno:rbac:admin:reports" deleted
clusterrole.rbac.authorization.k8s.io "kyverno:rbac:view:reports" deleted
clusterrole.rbac.authorization.k8s.io "kyverno:rbac:admin:updaterequests" deleted
clusterrole.rbac.authorization.k8s.io "kyverno:rbac:view:updaterequests" deleted
clusterrole.rbac.authorization.k8s.io "kyverno:reports-controller" deleted
clusterrole.rbac.authorization.k8s.io "kyverno:reports-controller:core" deleted
clusterrolebinding.rbac.authorization.k8s.io "kyverno:admission-controller" deleted
clusterrolebinding.rbac.authorization.k8s.io "kyverno:background-controller" deleted
clusterrolebinding.rbac.authorization.k8s.io "kyverno:cleanup-controller" deleted
clusterrolebinding.rbac.authorization.k8s.io "kyverno-cleanup-jobs" deleted
clusterrolebinding.rbac.authorization.k8s.io "kyverno:reports-controller" deleted
role.rbac.authorization.k8s.io "kyverno:admission-controller" deleted
role.rbac.authorization.k8s.io "kyverno:background-controller" deleted
role.rbac.authorization.k8s.io "kyverno:cleanup-controller" deleted
role.rbac.authorization.k8s.io "kyverno:reports-controller" deleted
rolebinding.rbac.authorization.k8s.io "kyverno:admission-controller" deleted
rolebinding.rbac.authorization.k8s.io "kyverno:background-controller" deleted
rolebinding.rbac.authorization.k8s.io "kyverno:cleanup-controller" deleted
rolebinding.rbac.authorization.k8s.io "kyverno:reports-controller" deleted
service "kyverno-svc" deleted
service "kyverno-svc-metrics" deleted
service "kyverno-background-controller-metrics" deleted
service "kyverno-cleanup-controller" deleted
service "kyverno-cleanup-controller-metrics" deleted
service "kyverno-reports-controller-metrics" deleted
deployment.apps "kyverno-admission-controller" deleted
deployment.apps "kyverno-background-controller" deleted
deployment.apps "kyverno-cleanup-controller" deleted
deployment.apps "kyverno-reports-controller" deleted
cronjob.batch "kyverno-cleanup-admission-reports" deleted
cronjob.batch "kyverno-cleanup-cluster-admission-reports" deleted

cert-manager/cert-manager/releases/download/v1.11.0/cert-manager.yaml
namespace "cert-manager" deleted
customresourcedefinition.apiextensions.k8s.io "clusterissuers.cert-manager.io" deleted
customresourcedefinition.apiextensions.k8s.io "challenges.acme.cert-manager.io" deleted
customresourcedefinition.apiextensions.k8s.io "certificaterequests.cert-manager.io" deleted
customresourcedefinition.apiextensions.k8s.io "issuers.cert-manager.io" deleted
customresourcedefinition.apiextensions.k8s.io "certificates.cert-manager.io" deleted
customresourcedefinition.apiextensions.k8s.io "orders.acme.cert-manager.io" deleted
serviceaccount "cert-manager-cainjector" deleted
serviceaccount "cert-manager" deleted
serviceaccount "cert-manager-webhook" deleted
configmap "cert-manager-webhook" deleted
clusterrole.rbac.authorization.k8s.io "cert-manager-cainjector" deleted
clusterrole.rbac.authorization.k8s.io "cert-manager-controller-issuers" deleted
clusterrole.rbac.authorization.k8s.io "cert-manager-controller-clusterissuers" deleted
clusterrole.rbac.authorization.k8s.io "cert-manager-controller-certificates" deleted
clusterrole.rbac.authorization.k8s.io "cert-manager-controller-orders" deleted
clusterrole.rbac.authorization.k8s.io "cert-manager-controller-challenges" deleted
clusterrole.rbac.authorization.k8s.io "cert-manager-controller-ingress-shim" deleted
clusterrole.rbac.authorization.k8s.io "cert-manager-view" deleted
clusterrole.rbac.authorization.k8s.io "cert-manager-edit" deleted
clusterrole.rbac.authorization.k8s.io "cert-manager-controller-approve:cert-manager-io" deleted
clusterrole.rbac.authorization.k8s.io "cert-manager-controller-certificatesigningrequests" deleted
clusterrole.rbac.authorization.k8s.io "cert-manager-webhook:subjectaccessreviews" deleted
clusterrolebinding.rbac.authorization.k8s.io "cert-manager-cainjector" deleted
clusterrolebinding.rbac.authorization.k8s.io "cert-manager-controller-issuers" deleted
clusterrolebinding.rbac.authorization.k8s.io "cert-manager-controller-clusterissuers" deleted
clusterrolebinding.rbac.authorization.k8s.io "cert-manager-controller-certificates" deleted
clusterrolebinding.rbac.authorization.k8s.io "cert-manager-controller-orders" deleted
clusterrolebinding.rbac.authorization.k8s.io "cert-manager-controller-challenges" deleted
clusterrolebinding.rbac.authorization.k8s.io "cert-manager-controller-ingress-shim" deleted
clusterrolebinding.rbac.authorization.k8s.io "cert-manager-controller-approve:cert-manager-io" deleted
clusterrolebinding.rbac.authorization.k8s.io "cert-manager-controller-certificatesigningrequests" deleted
clusterrolebinding.rbac.authorization.k8s.io "cert-manager-webhook:subjectaccessreviews" deleted
role.rbac.authorization.k8s.io "cert-manager-cainjector:leaderelection" deleted
role.rbac.authorization.k8s.io "cert-manager:leaderelection" deleted
role.rbac.authorization.k8s.io "cert-manager-webhook:dynamic-serving" deleted
rolebinding.rbac.authorization.k8s.io "cert-manager-cainjector:leaderelection" deleted
rolebinding.rbac.authorization.k8s.io "cert-manager:leaderelection" deleted
rolebinding.rbac.authorization.k8s.io "cert-manager-webhook:dynamic-serving" deleted
service "cert-manager" deleted
service "cert-manager-webhook" deleted
deployment.apps "cert-manager-cainjector" deleted
deployment.apps "cert-manager" deleted
deployment.apps "cert-manager-webhook" deleted
mutatingwebhookconfiguration.admissionregistration.k8s.io "cert-manager-webhook" deleted
validatingwebhookconfiguration.admissionregistration.k8s.io "cert-manager-webhook" deleted


{
    "repository": {
        "repositoryArn": "arn:aws:ecr:us-west-2:XXXXXXXXXX:repository/pause",
        "registryId": "XXXXXXXXXX",
        "repositoryName": "pause",
        "repositoryUri": "XXXXXXXXXX.dkr.ecr.us-west-2.amazonaws.com/pause",
        "createdAt": "2023-08-16T09:00:28+00:00",
        "imageTagMutability": "MUTABLE"
    }
}



```
::::
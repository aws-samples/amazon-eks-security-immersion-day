---
title : "Container image verification in Kubernetes with Kyverno"
weight : 22
---

Before we proceed, ensure that you exited from AL2023 Instance and back to the Cloud9 Environment.

Run `pwd` to check you are in Cloud9.

```bash
pwd
```
::::expand{header="Check Output"}
```bash
WSParticipantRole:~/environment $ pwd
/home/ec2-user/environment
```
::::

In this section, we will explore container image signature validation in Kubernetes. We will use Amazon EKS with [Kubernetes Dynamic Admission Controllers](https://kubernetes.io/docs/reference/access-authn-authz/extensible-admission-controllers/) and the Kyverno policy engine. The Kyverno-Notation-AWS Signer solution is found in the [kyverno-notation-aws](https://github.com/nirmata/kyverno-notation-aws) OSS project.

### Install Kyverno-Notation-AWS Signer solution

To install the Kyverno-Notation-AWS Signer solution, we will follow the [install instructions](https://github.com/nirmata/kyverno-notation-aws#install).

Run the following command to install the Install cert-manager.

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.11.0/cert-manager.yaml
```
::::expand{header="Check Output"}
```bash
namespace/cert-manager unchanged
customresourcedefinition.apiextensions.k8s.io/clusterissuers.cert-manager.io configured
customresourcedefinition.apiextensions.k8s.io/challenges.acme.cert-manager.io configured
customresourcedefinition.apiextensions.k8s.io/certificaterequests.cert-manager.io configured
customresourcedefinition.apiextensions.k8s.io/issuers.cert-manager.io configured
customresourcedefinition.apiextensions.k8s.io/certificates.cert-manager.io configured
customresourcedefinition.apiextensions.k8s.io/orders.acme.cert-manager.io configured
serviceaccount/cert-manager-cainjector configured
serviceaccount/cert-manager configured
serviceaccount/cert-manager-webhook configured
configmap/cert-manager-webhook configured
clusterrole.rbac.authorization.k8s.io/cert-manager-cainjector configured
clusterrole.rbac.authorization.k8s.io/cert-manager-controller-issuers configured
clusterrole.rbac.authorization.k8s.io/cert-manager-controller-clusterissuers configured
clusterrole.rbac.authorization.k8s.io/cert-manager-controller-certificates configured
clusterrole.rbac.authorization.k8s.io/cert-manager-controller-orders configured
clusterrole.rbac.authorization.k8s.io/cert-manager-controller-challenges configured
clusterrole.rbac.authorization.k8s.io/cert-manager-controller-ingress-shim configured
clusterrole.rbac.authorization.k8s.io/cert-manager-view configured
clusterrole.rbac.authorization.k8s.io/cert-manager-edit configured
clusterrole.rbac.authorization.k8s.io/cert-manager-controller-approve:cert-manager-io configured
clusterrole.rbac.authorization.k8s.io/cert-manager-controller-certificatesigningrequests configured
clusterrole.rbac.authorization.k8s.io/cert-manager-webhook:subjectaccessreviews configured
clusterrolebinding.rbac.authorization.k8s.io/cert-manager-cainjector configured
clusterrolebinding.rbac.authorization.k8s.io/cert-manager-controller-issuers configured
clusterrolebinding.rbac.authorization.k8s.io/cert-manager-controller-clusterissuers configured
clusterrolebinding.rbac.authorization.k8s.io/cert-manager-controller-certificates configured
clusterrolebinding.rbac.authorization.k8s.io/cert-manager-controller-orders configured
clusterrolebinding.rbac.authorization.k8s.io/cert-manager-controller-challenges configured
clusterrolebinding.rbac.authorization.k8s.io/cert-manager-controller-ingress-shim configured
clusterrolebinding.rbac.authorization.k8s.io/cert-manager-controller-approve:cert-manager-io configured
clusterrolebinding.rbac.authorization.k8s.io/cert-manager-controller-certificatesigningrequests configured
clusterrolebinding.rbac.authorization.k8s.io/cert-manager-webhook:subjectaccessreviews configured
role.rbac.authorization.k8s.io/cert-manager-cainjector:leaderelection configured
role.rbac.authorization.k8s.io/cert-manager:leaderelection configured
role.rbac.authorization.k8s.io/cert-manager-webhook:dynamic-serving configured
rolebinding.rbac.authorization.k8s.io/cert-manager-cainjector:leaderelection configured
rolebinding.rbac.authorization.k8s.io/cert-manager:leaderelection configured
rolebinding.rbac.authorization.k8s.io/cert-manager-webhook:dynamic-serving configured
service/cert-manager configured
service/cert-manager-webhook configured
deployment.apps/cert-manager-cainjector configured
deployment.apps/cert-manager configured
deployment.apps/cert-manager-webhook configured
mutatingwebhookconfiguration.admissionregistration.k8s.io/cert-manager-webhook configured
validatingwebhookconfiguration.admissionregistration.k8s.io/cert-manager-webhook configured
```
::::

Install the Kyverno policy engine.
```bash
kubectl create -f https://raw.githubusercontent.com/kyverno/kyverno/main/config/install-latest-testing.yaml
```

::::expand{header="Check Output"}
```bash
namespace/kyverno created
serviceaccount/kyverno-admission-controller created
serviceaccount/kyverno-background-controller created
serviceaccount/kyverno-cleanup-controller created
serviceaccount/kyverno-cleanup-jobs created
serviceaccount/kyverno-reports-controller created
configmap/kyverno created
configmap/kyverno-metrics created
customresourcedefinition.apiextensions.k8s.io/admissionreports.kyverno.io created
customresourcedefinition.apiextensions.k8s.io/backgroundscanreports.kyverno.io created
customresourcedefinition.apiextensions.k8s.io/cleanuppolicies.kyverno.io created
customresourcedefinition.apiextensions.k8s.io/clusteradmissionreports.kyverno.io created
customresourcedefinition.apiextensions.k8s.io/clusterbackgroundscanreports.kyverno.io created
customresourcedefinition.apiextensions.k8s.io/clustercleanuppolicies.kyverno.io created
customresourcedefinition.apiextensions.k8s.io/clusterpolicies.kyverno.io created
customresourcedefinition.apiextensions.k8s.io/policies.kyverno.io created
customresourcedefinition.apiextensions.k8s.io/policyexceptions.kyverno.io created
customresourcedefinition.apiextensions.k8s.io/updaterequests.kyverno.io created
customresourcedefinition.apiextensions.k8s.io/clusterpolicyreports.wgpolicyk8s.io created
customresourcedefinition.apiextensions.k8s.io/policyreports.wgpolicyk8s.io created
clusterrole.rbac.authorization.k8s.io/kyverno:admission-controller created
clusterrole.rbac.authorization.k8s.io/kyverno:admission-controller:core created
clusterrole.rbac.authorization.k8s.io/kyverno:background-controller created
clusterrole.rbac.authorization.k8s.io/kyverno:background-controller:core created
clusterrole.rbac.authorization.k8s.io/kyverno:cleanup-controller created
clusterrole.rbac.authorization.k8s.io/kyverno:cleanup-controller:core created
clusterrole.rbac.authorization.k8s.io/kyverno-cleanup-jobs created
clusterrole.rbac.authorization.k8s.io/kyverno:rbac:admin:policies created
clusterrole.rbac.authorization.k8s.io/kyverno:rbac:view:policies created
clusterrole.rbac.authorization.k8s.io/kyverno:rbac:admin:policyreports created
clusterrole.rbac.authorization.k8s.io/kyverno:rbac:view:policyreports created
clusterrole.rbac.authorization.k8s.io/kyverno:rbac:admin:reports created
clusterrole.rbac.authorization.k8s.io/kyverno:rbac:view:reports created
clusterrole.rbac.authorization.k8s.io/kyverno:rbac:admin:updaterequests created
clusterrole.rbac.authorization.k8s.io/kyverno:rbac:view:updaterequests created
clusterrole.rbac.authorization.k8s.io/kyverno:reports-controller created
clusterrole.rbac.authorization.k8s.io/kyverno:reports-controller:core created
clusterrolebinding.rbac.authorization.k8s.io/kyverno:admission-controller created
clusterrolebinding.rbac.authorization.k8s.io/kyverno:background-controller created
clusterrolebinding.rbac.authorization.k8s.io/kyverno:cleanup-controller created
clusterrolebinding.rbac.authorization.k8s.io/kyverno-cleanup-jobs created
clusterrolebinding.rbac.authorization.k8s.io/kyverno:reports-controller created
role.rbac.authorization.k8s.io/kyverno:admission-controller created
role.rbac.authorization.k8s.io/kyverno:background-controller created
role.rbac.authorization.k8s.io/kyverno:cleanup-controller created
role.rbac.authorization.k8s.io/kyverno:reports-controller created
rolebinding.rbac.authorization.k8s.io/kyverno:admission-controller created
rolebinding.rbac.authorization.k8s.io/kyverno:background-controller created
rolebinding.rbac.authorization.k8s.io/kyverno:cleanup-controller created
rolebinding.rbac.authorization.k8s.io/kyverno:reports-controller created
service/kyverno-svc created
service/kyverno-svc-metrics created
service/kyverno-background-controller-metrics created
service/kyverno-cleanup-controller created
service/kyverno-cleanup-controller-metrics created
service/kyverno-reports-controller-metrics created
deployment.apps/kyverno-admission-controller created
deployment.apps/kyverno-background-controller created
deployment.apps/kyverno-cleanup-controller created
deployment.apps/kyverno-reports-controller created
cronjob.batch/kyverno-cleanup-admission-reports created
cronjob.batch/kyverno-cleanup-cluster-admission-reports created
```
::::

Clone the `kyverno-notation-aws` github.

```bash
cd ~/environment
git clone https://github.com/nirmata/kyverno-notation-aws.git
cd kyverno-notation-aws/
```

Install the `kyverno-notation-aws` application.
```bash
kubectl apply -f configs/install.yaml
```

::::expand{header="Check Output"}
```bash
namespace/kyverno-notation-aws created
clusterissuer.cert-manager.io/selfsigned-issuer created
certificate.cert-manager.io/my-selfsigned-ca created
issuer.cert-manager.io/my-ca-issuer created
certificate.cert-manager.io/kyverno-notation-aws-cert created
serviceaccount/kyverno-notation-aws created
clusterrole.rbac.authorization.k8s.io/kyverno-notation-aws-clusterrole created
clusterrolebinding.rbac.authorization.k8s.io/kyverno-notation-aws-clusterrolebinding created
role.rbac.authorization.k8s.io/kyverno-notation-aws-role created
rolebinding.rbac.authorization.k8s.io/kyverno-notation-aws-rolebinding created
deployment.apps/kyverno-notation-aws created
service/svc created
configmap/notation-plugin-config created
```
::::

Apply the Kubernetes custom resources definitions for the Notation TrustPolicy and TrustStore resources

```bash
kubectl apply -f configs/crds/
```

::::expand{header="Check Output"}
```bash
customresourcedefinition.apiextensions.k8s.io/trustpolicies.notation.nirmata.io created
customresourcedefinition.apiextensions.k8s.io/truststores.notation.nirmata.io created
```
::::

### Configure Kyverno

We need to configure the Kyverno solution to use the Notation and AWS Signer configuration which we used earlier to sign the container images and verify the container image signatures. 

Run the below command to create a TrustStore configuration file.

```yaml
cd ~/environment
cat << EOF > truststore.yaml
apiVersion: notation.nirmata.io/v1alpha1
kind: TrustStore
metadata:
  name: aws-signer-ts
spec:
  trustStoreName: aws-signer-ts
  type: signingAuthority
  caBundle: |-
    -----BEGIN CERTIFICATE-----
    MIICWTCCAd6g...
    -----END CERTIFICATE-----
EOF
```

We need to update `caBundle` element in the above `TrustStore` resource to the AWS Signer root certificate configured when we installed Notation and AWS Signer earlier.

Run the below command to copy the AWS Signer root certificate file from AL2023 EC2 Instance to the Cloud9 environment.

```bash
scp -i "al2023-ssh-key.pem" ec2-user@$AL2023_EC2_INSTANCE_PRIVATE_IP:/home/ec2-user/.config/notation/truststore/x509/signingAuthority/aws-signer-ts/aws-signer-notation-root.crt .
```

Update the `caBundle` element value in the `truststore.yaml` with the contents of the file `aws-signer-notation-root.crt`.

::::expand{header="Check for sample truststore.yaml file"}
```yaml
apiVersion: notation.nirmata.io/v1alpha1
kind: TrustStore
metadata:
  name: aws-signer-ts
spec:
  trustStoreName: aws-signer-ts
  type: signingAuthority
  caBundle: |-
    -----BEGIN CERTIFICATE-----
    MIICWTCCAd6gAwIBAgIRAMq5Lmt4rqnUdi8qM4eIGbYwCgYIKoZIzj0EAwMwbDEL
    MAkGA1UEBhMCVVMxDDAKBgNVBAoMA0FXUzEVMBMGA1UECwwMQ3J5cHRvZ3JhcGh5
    MQswCQYDVQQIDAJXQTErMCkGA1UEAwwiQVdTIFNpZ25lciBDb2RlIFNpZ25pbmcg
    Um9vdCBDQSBHMTAgFw0yMjEwMjcyMTMzMjJaGA8yMTIyMTAyNzIyMzMyMlowbDEL
    MAkGA1UEBhMCVVMxDDAKBgNVBAoMA0FXUzEVMBMGA1UECwwMQ3J5cHRvZ3JhcGh5
    MQswCQYDVQQIDAJXQTErMCkGA1UEAwwiQVdTIFNpZ25lciBDb2RlIFNpZ25pbmcg
    Um9vdCBDQSBHMTB2MBAGByqGSM49AgEGBSuBBAAiA2IABM9+dM9WXbVyNOIP08oN
    IQW8DKKdBxP5nYNegFPLfGP0f7+0jweP8LUv1vlFZqVDep5ONus9IxwtIYBJLd36
    5Q3Z44Xnm4PY/wSI5xRvB/m+/B2PHc7Smh0P5s3Dt25oVKNCMEAwDwYDVR0TAQH/
    BAUwAwEB/zAdBgNVHQ4EFgQUONhd3abPX87l4YWKxjysv28QwAYwDgYDVR0PAQH/
    BAQDAgGGMAoGCCqGSM49BAMDA2kAMGYCMQCd32GnYU2qFCtKjZiveGfs+gCBlPi2
    Hw0zU52LXIFC2GlcvwcekbiM6w0Azlr9qvMCMQDl4+Os0yd+fVlYMuovvxh8xpjQ
    NPJ9zRGyYa7+GNs64ty/Z6bzPHOKbGo4In3KKJo=
    -----END CERTIFICATE-----
```
::::


Let's apply the `truststore.yaml` to the cluster.

```bash
kubectl apply -f truststore.yaml 
```

::::expand{header="Check Output"}
```bash
truststore.notation.nirmata.io/aws-signer-ts created
```
::::



Next, we need to apply the correct `TrustPolicy` resource that will tell the Notation Golang libraries (used in the Kyverno solution) to use the correct AWS Signer profile and TrustStore. 

Run below command to get AWS signer profile arn.

```bash
export AWS_SIGNING_PROFILE_ARN=$(aws signer list-signing-profiles | jq -r '.profiles[0].arn')
echo $AWS_SIGNING_PROFILE_ARN
```

::::expand{header="Check Output"}
```bash
arn:aws:signer:us-west-2:XXXXXXXXXX:/signing-profiles/notation_test
```
::::

Run the following command to create the `TrustPolicy` configuration.

```yaml
cat << EOF > trustpolicy.yaml
apiVersion: notation.nirmata.io/v1alpha1
kind: TrustPolicy
metadata:
  name: trustpolicy-sample
spec:
  version: '1.0'
  trustPolicyName: tp-test-notation
  trustPolicies:
  - name: aws-signer-tp
    registryScopes:
    - "*"
    signatureVerification:
      level: strict
      override: {}
    trustStores:
    - signingAuthority:aws-signer-ts
    trustedIdentities:
    - "$AWS_SIGNING_PROFILE_ARN"
EOF
```

Let's apply the `trustpolicy.yaml` to the cluster.

```bash
kubectl apply -f trustpolicy.yaml 
```

::::expand{header="Check Output"}
```bash
trustpolicy.notation.nirmata.io/trustpolicy-sample created
```
::::


Next, we need to create a **Kyverno cluster policy** `check-images`. This cluster policy needs the TLS certificate chain from the `kyverno-notation-aws-tls` secret. This allows the cluster policy to call `kyverno-notation-aws`, a Kubernetes service, external to the `Kyverno policy engine`.

Run below command to create the Kyverno cluster policy configuration.

```yaml
cat << EOF > kyverno-policy.yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: check-images     
spec:
  validationFailureAction: Enforce
  webhookTimeoutSeconds: 30
  rules:
  - name: call-aws-signer-extension
    match:
      any:
      - resources:
          namespaces:
          - test-notation
          kinds:
          - Pod
    context:
    - name: result
      apiCall:
        method: POST
        data:
        - key: images
          value: "{{ request.object.spec.[ephemeralContainers, initContainers, containers][].image }}"
        service:
          url: https://svc.kyverno-notation-aws/checkimages
          caBundle: |-
            -----BEGIN CERTIFICATE-----
            MIICiTCCAjCg...<replace this with tls.crt value from the secret kyverno-notation-aws-tls in namespace kyverno-notation-aws>
            -----END CERTIFICATE-----
            
            -----BEGIN CERTIFICATE-----
            MIIBdzCCAR2g...<replace this with ca.crt value from the secret kyverno-notation-aws-tls in namespace kyverno-notation-aws>
            -----END CERTIFICATE-----

    validate:
      message: "not allowed"
      deny:
        conditions:
          all:
          - key: "{{ result.verified }}"
            operator: EQUALS
            value: false
EOF
```

Ww need to update the `caBundle` element in the Kyverno cluster policy with `tls.crt` and `ca.crt` values from the secret kyverno-notation-aws-tls in namespace kyverno-notation-aws.

Run below command to get the `tls.crt` value.

```bash
kubectl -n kyverno-notation-aws get secret kyverno-notation-aws-tls -o json | jq -r '.data."tls.crt"' | base64 -d
```

::::expand{header="Check Output"}
```bash
-----BEGIN CERTIFICATE-----
MIICijCCAjCgAwIBAgIQL3kIIiFQAy0IgmfUG2tjljAKBggqhkjOPQQDAjAbMRkw
FwYDVQQDExBteS1zZWxmc2lnbmVkLWNhMB4XDTIzMDcwNTA4NTIxM1oXDTIzMTAw
MzA4NTIxM1owMTEQMA4GA1UEChMHbmlybWF0YTEdMBsGA1UEAxMUa3l2ZXJuby1u
b3RhdGlvbi1hd3MwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQD6mGyB
av4EakmD4Va0ijknWZDDuOhHhIKtk69NxtU4HTjI5QIig3MnU06y0jzd458WAToP
1RYuxqE1+q0QbrWG3uouQCuVmBoRwckFCeLKDl0z3q9YRhEHSmE2PSPNAnLlUAcD
AWA3sY0hUAec61FNVEnhdwv6nhBA+Hcz084d7JbKcRZvHqOixM5mgD8FTnuXUDNV
b/fQ4RbklZ6WCum8FWLZmhTFM1q5WIyuHIW6j56vGKGOxLaUr65W17i32/fuXxCB
RjJIviKhnwY4YTlhAc5uNF0Z/8sh/aPIF8TdPfiqY/JVmsahRvPnT8/16KZ65LJE
bUtDwtqekxoElrXVAgMBAAGjdTBzMB0GA1UdJQQWMBQGCCsGAQUFBwMBBggrBgEF
BQcDAjAMBgNVHRMBAf8EAjAAMB8GA1UdIwQYMBaAFL0gCgDaeafBYyRlloR6AOUw
ufr3MCMGA1UdEQQcMBqCGHN2Yy5reXZlcm5vLW5vdGF0aW9uLWF3czAKBggqhkjO
PQQDAgNIADBFAiBJDB7Stz1SVqYKalsoJM7vvzflz5EtlDV08asX8eFddgIhAMfT
ZZLTdoNLC5Q0cKdICa44TjZO4yvdAJR1fYnEOWL3
-----END CERTIFICATE-----
```
::::



Run below command to get the `ca.crt` value.

```bash
kubectl -n kyverno-notation-aws get secret kyverno-notation-aws-tls -o json | jq -r '.data."ca.crt"' | base64 -d
```



::::expand{header="Check Output"}
```bash
-----BEGIN CERTIFICATE-----
MIIBdjCCARygAwIBAgIQJZL2nkdKlAfobqR9zv/ESTAKBggqhkjOPQQDAjAbMRkw
FwYDVQQDExBteS1zZWxmc2lnbmVkLWNhMB4XDTIzMDcwNTA4NTIwOFoXDTIzMTAw
MzA4NTIwOFowGzEZMBcGA1UEAxMQbXktc2VsZnNpZ25lZC1jYTBZMBMGByqGSM49
AgEGCCqGSM49AwEHA0IABLYizLHe17lW04RmPEsE/VVmrzfvkPIZGovxH5xK/xTP
v9B+z6dxYojRO7RoirM9+LbIwMpUIcIyvqDYDo8X8pujQjBAMA4GA1UdDwEB/wQE
AwICpDAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBS9IAoA2nmnwWMkZZaEegDl
MLn69zAKBggqhkjOPQQDAgNIADBFAiANsjDi9NhIyl5goKB97sBBw92NpQlRMIz8
fUNN1zl4jwIhAO++sEOHtbQC2AJLVFOAj9xlqJ9HdQEnIuSUK0IigGUL
-----END CERTIFICATE-----
```
::::

::::expand{header="Check for final kyverno-policy.yaml"}
```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: check-images     
spec:
  validationFailureAction: Enforce
  webhookTimeoutSeconds: 30
  rules:
  - name: call-aws-signer-extension
    match:
      any:
      - resources:
          namespaces:
          - test-notation
          kinds:
          - Pod
    context:
    - name: result
      apiCall:
        method: POST
        data:
        - key: images
          value: "{{ request.object.spec.[ephemeralContainers, initContainers, containers][].image }}"
        service:
          url: https://svc.kyverno-notation-aws/checkimages
          caBundle: |-
            -----BEGIN CERTIFICATE-----
            MIICijCCAjCgAwIBAgIQL3kIIiFQAy0IgmfUG2tjljAKBggqhkjOPQQDAjAbMRkw
            FwYDVQQDExBteS1zZWxmc2lnbmVkLWNhMB4XDTIzMDcwNTA4NTIxM1oXDTIzMTAw
            MzA4NTIxM1owMTEQMA4GA1UEChMHbmlybWF0YTEdMBsGA1UEAxMUa3l2ZXJuby1u
            b3RhdGlvbi1hd3MwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQD6mGyB
            av4EakmD4Va0ijknWZDDuOhHhIKtk69NxtU4HTjI5QIig3MnU06y0jzd458WAToP
            1RYuxqE1+q0QbrWG3uouQCuVmBoRwckFCeLKDl0z3q9YRhEHSmE2PSPNAnLlUAcD
            AWA3sY0hUAec61FNVEnhdwv6nhBA+Hcz084d7JbKcRZvHqOixM5mgD8FTnuXUDNV
            b/fQ4RbklZ6WCum8FWLZmhTFM1q5WIyuHIW6j56vGKGOxLaUr65W17i32/fuXxCB
            RjJIviKhnwY4YTlhAc5uNF0Z/8sh/aPIF8TdPfiqY/JVmsahRvPnT8/16KZ65LJE
            bUtDwtqekxoElrXVAgMBAAGjdTBzMB0GA1UdJQQWMBQGCCsGAQUFBwMBBggrBgEF
            BQcDAjAMBgNVHRMBAf8EAjAAMB8GA1UdIwQYMBaAFL0gCgDaeafBYyRlloR6AOUw
            ufr3MCMGA1UdEQQcMBqCGHN2Yy5reXZlcm5vLW5vdGF0aW9uLWF3czAKBggqhkjO
            PQQDAgNIADBFAiBJDB7Stz1SVqYKalsoJM7vvzflz5EtlDV08asX8eFddgIhAMfT
            ZZLTdoNLC5Q0cKdICa44TjZO4yvdAJR1fYnEOWL3
            -----END CERTIFICATE-----
            
            -----BEGIN CERTIFICATE-----
            MIIBdjCCARygAwIBAgIQJZL2nkdKlAfobqR9zv/ESTAKBggqhkjOPQQDAjAbMRkw
            FwYDVQQDExBteS1zZWxmc2lnbmVkLWNhMB4XDTIzMDcwNTA4NTIwOFoXDTIzMTAw
            MzA4NTIwOFowGzEZMBcGA1UEAxMQbXktc2VsZnNpZ25lZC1jYTBZMBMGByqGSM49
            AgEGCCqGSM49AwEHA0IABLYizLHe17lW04RmPEsE/VVmrzfvkPIZGovxH5xK/xTP
            v9B+z6dxYojRO7RoirM9+LbIwMpUIcIyvqDYDo8X8pujQjBAMA4GA1UdDwEB/wQE
            AwICpDAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBS9IAoA2nmnwWMkZZaEegDl
            MLn69zAKBggqhkjOPQQDAgNIADBFAiANsjDi9NhIyl5goKB97sBBw92NpQlRMIz8
            fUNN1zl4jwIhAO++sEOHtbQC2AJLVFOAj9xlqJ9HdQEnIuSUK0IigGUL
            -----END CERTIFICATE-----

    validate:
      message: "not allowed"
      deny:
        conditions:
          all:
          - key: "{{ result.verified }}"
            operator: EQUALS
            value: false
```
::::

Let us now apply the Kyverno cluster policy into the cluster.

```bash
kubectl apply -f kyverno-policy.yaml
```

::::expand{header="Check Output"}
```bash
clusterpolicy.kyverno.io/check-images created
```
::::

### Configure IRSA for kyverno-notation-aws Application

So far, we applied three resources in the cluster i.e.  `TrustStore`, `TrustPolicy`, and `ClusterPolicy`.  

We will now configure the correct `kyverno-notation-aws` service account in the `kyverno-notation-aws` namespace to use [**IAM Roles for Service Accounts (IRSA)**](https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html). Using IRSA supplies IAM credentials based on an IAM role principal and policies to pods using the service account. These credentials are used for the following access:

* Get region-specific Amazon ECR credentials for pulling container image signatures
* Access AWS Signer APIs needed for the container image signature verification process

A `kyverno-notation-aws` service account is already installed with the `kyverno-notation-aws` application, and you need to override the service account to use our desired IRSA configuration. The easiest way to accomplish this override is to use the following [eksctl](https://eksctl.io/) command.

Let us set some environment variables.

```bash
NAME=kyverno-notation-aws
NAMESPACE=kyverno-notation-aws
CLUSTER=eksworkshop-eksctl
ECR_POLICY=arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly
export ACCOUNT_ID=$(aws sts get-caller-identity --output text --query Account)
```

Run the below commands to create the IAM policy for access AWS Signer APIs.

```bash
cat << EOF > kyverno-notation-aws-iam-policy.json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": "signer:*",
            "Resource": "*"
        }
    ]
}
EOF

# Create an IAM policy for the controller from the policy document
export SIGNER_POLICY=$(aws iam create-policy \
    --policy-name notary-admission-signer \
    --policy-document file://kyverno-notation-aws-iam-policy.json | jq -r '.Policy.Arn' )
echo $SIGNER_POLICY
```

::::expand{header="Check Output"}
```bash
arn:aws:iam::XXXXXXXXXX:policy/notary-admission-signer
```
::::

Run below command to create the Service account.

```bash
eksctl create iamserviceaccount \
  --name $NAME \
  --namespace $NAMESPACE \
  --cluster $CLUSTER \
  --attach-policy-arn $ECR_POLICY \
  --attach-policy-arn $SIGNER_POLICY \
  --approve \
  --override-existing-serviceaccounts
``` 

::::expand{header="Check Output"}
```bash
2023-07-05 09:44:58 [ℹ]  7 existing iamserviceaccount(s) (cert-manager/cert-manager,karpenter/karpenter,kube-system/aws-load-balancer-controller,kube-system/ebs-csi-controller-sa,kube-system/efs-csi-controller-sa,prometheus/amp-irsa-role,sample/external-dns) will be excluded
2023-07-05 09:44:58 [ℹ]  1 iamserviceaccount (kyverno-notation-aws/kyverno-notation-aws) was included (based on the include/exclude rules)
2023-07-05 09:44:58 [!]  metadata of serviceaccounts that exist in Kubernetes will be updated, as --override-existing-serviceaccounts was set
2023-07-05 09:44:58 [ℹ]  1 task: { 
    2 sequential sub-tasks: { 
        create IAM role for serviceaccount "kyverno-notation-aws/kyverno-notation-aws",
        create serviceaccount "kyverno-notation-aws/kyverno-notation-aws",
    } }2023-07-05 09:44:58 [ℹ]  building iamserviceaccount stack "eksctl-eks126-addon-iamserviceaccount-kyverno-notation-aws-kyverno-notation-aws"
2023-07-05 09:44:58 [ℹ]  deploying stack "eksctl-eks126-addon-iamserviceaccount-kyverno-notation-aws-kyverno-notation-aws"
2023-07-05 09:44:58 [ℹ]  waiting for CloudFormation stack "eksctl-eks126-addon-iamserviceaccount-kyverno-notation-aws-kyverno-notation-aws"
2023-07-05 09:45:28 [ℹ]  waiting for CloudFormation stack "eksctl-eks126-addon-iamserviceaccount-kyverno-notation-aws-kyverno-notation-aws"
2023-07-05 09:45:28 [ℹ]  serviceaccount "kyverno-notation-aws/kyverno-notation-aws" already exists
2023-07-05 09:45:28 [ℹ]  updated serviceaccount "kyverno-notation-aws/kyverno-notation-aws"

```
::::


Once the `kyverno-notation-aws service` account is updated, we need to delete the current `kyverno-notation-aws` pods, so that new pods will pick up the AWS credentials from the newly configured `kyverno-notation-aws` service account and allows `kyverno-notation-aws service` to communicate with our Amazon ECR registries and the AWS Signer API.

```bash
POD_NAME=$(kubectl -n kyverno-notation-aws get pod -l=app=kyverno-notation-aws -o=jsonpath={.items..metadata.name})
kubectl -n kyverno-notation-aws delete pod $POD_NAME
```

Verify pods come back up and are ready

```bash
kubectl -n kyverno-notation-aws get pod
```

::::expand{header="Check Output"}
```bash
NAME                                   READY   STATUS    RESTARTS   AGE
kyverno-notation-aws-6d477b86b-fxgcn   1/1     Running   0          49s
```
::::

### Testing the Signature Verification

The Kyverno cluster policy resource `check-images` configures a rule `call-aws-signer-extension` which matches **Pod** objects in the **namespace** `test-notation`.

So, let's create the namespace `test-notation`.

```bash
kubectl create ns test-notation
```

Let us deploy a sample Pod with a container image which is **NOT** signed. For this, we will use the image `public.ecr.aws/eks-distro/kubernetes/pause:3.2`

```yaml
cd ~/environment
cat << EOF > unsigned-pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: unsigned-pod
spec:
  containers:
  - name: unsigned-pod
    image: public.ecr.aws/eks-distro/kubernetes/pause:3.2
    resources:
      requests:
        cpu: "100m"
        memory: "100Mi"
      limits:
        cpu: "1"
        memory: "1Gi"  
EOF
kubectl apply -f unsigned-pod.yaml -n test-notation
```

The output will look like below.

```bash
Error from server: error when creating "unsigned-pod.yaml": admission webhook "validate.kyverno.svc-fail" denied the request: 

resource Pod/test-notation/unsigned-pod was blocked due to the following policies 

check-images:
  call-aws-signer-extension: 'failed to check deny conditions: failed to substitute
    variables in condition key: failed to resolve result.verified at path : JMESPath
    query failed: Unknown key "result" in path'
```

As shown above, the error is expected since the container image is not signed.

```bash
export AWS_REGION=$(curl -s 169.254.169.254/latest/dynamic/instance-identity/document | jq -r '.region')
export ACCOUNT_ID=$(aws sts get-caller-identity --output text --query Account)
export IMAGE_REPO="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
export IMAGE_NAME=pause
export IMAGE_DIGEST=$(aws ecr describe-images --repository-name ${IMAGE_NAME} | jq -r '.imageDetails[]|select(.artifactMediaType=="application/vnd.docker.container.image.v1+json").imageDigest')
```

Let us now run sample Pod with the container image which we have signed earlier in this Module.

```yaml
cat << EOF > signed-pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: signed-pod
spec:
  containers:
  - name: signed-pod
    image: ${IMAGE_REPO}/${IMAGE_NAME}@$IMAGE_DIGEST
    resources:
      requests:
        cpu: "100m"
        memory: "100Mi"
      limits:
        cpu: "1"
        memory: "1Gi"  
EOF

kubectl apply -f signed-pod.yaml -n test-notation
```

Check if the Pod is running in the cluster.

```bash
kubectl get pod -n test-notation
```

The output will look like below.

```bash
jp:~/environment $ kubectl get pod -n test-notation
NAME         READY   STATUS    RESTARTS   AGE
signed-pod   1/1     Running   0          26s
```

Let us check the logs from the `kyverno-notation-aws` pod to see if the signature verification is completed successfully.

```bash
POD_NAME=$(kubectl -n kyverno-notation-aws get pod -l=app=kyverno-notation-aws -o=jsonpath={.items..metadata.name})
kubectl -n kyverno-notation-aws logs  $POD_NAME
```

The output will look like below.

```2023-07-21T06:12:28.403Z        INFO    /auth.go:26     using region: us-east-1
2023-07-21T06:44:50.650Z        INFO    /verify.go:144  verifying image XXXXXXXXXX.dkr.ecr.us-east-1.amazonaws.com/pause@sha256:33f19d2d8ba5fc17ac1099a840b0feac5f40bc6ac02d99891dbd13b0e204af4e
```


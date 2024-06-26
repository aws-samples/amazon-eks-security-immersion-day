---
title : "Projected Service Account Token"
weight : 21
---

Before we get into how IRSA works, let us understand some Basics and underlying Kubernetes which enables IRSA functionality.

### Kubernetes Service Accounts

A service account is a type of non-human account that, in Kubernetes, provides a distinct identity in a Kubernetes cluster. Application Pods, system components, and entities inside and outside the cluster can use a specific ServiceAccount's credentials to identify as that ServiceAccount. This identity is useful in various situations, including authenticating to the API server or implementing identity-based security policies.

There are different ways to manage the credentials for the Service Accounts.

* [TokenRequest AP](https://kubernetes.io/docs/reference/kubernetes-api/authentication-resources/token-request-v1/) (recommended): Request a short-lived service account token from within your own application code. The token expires automatically and can rotate upon expiration. If you have a legacy application that is not aware of Kubernetes, you could use a sidecar container within the same pod to fetch these tokens and make them available to the application workload.
* [Token Volume Projection](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/#serviceaccount-token-volume-projection) (also recommended): In Kubernetes v1.20 and later, use the Pod specification to tell the kubelet to add the service account token to the Pod as a projected volume. Projected tokens expire automatically, and the kubelet rotates the token before it expires.
* [Service Account Token Secrets](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/#manually-create-an-api-token-for-a-serviceaccount) (not recommended): You can mount service account tokens as Kubernetes Secrets in Pods. These tokens don't expire and don't rotate. This method is not recommended, especially at scale, because of the risks associated with static, long-lived credentials. In Kubernetes v1.24 and later, the LegacyServiceAccountTokenNoAutoGeneration feature gate prevents Kubernetes from automatically creating these tokens for ServiceAccounts. LegacyServiceAccountTokenNoAutoGeneration is enabled by default; in other words, Kubernetes does not create these tokens.


#### Default ServiceAccount credentials from Kubernetes version 1.24 or later

As mentioned above, In Kubernetes v1.24 and later, Kubernetes does not create the service account tokens as Kubernetes Secrets in Pods.

To check this, run below command.

```bash
kubectl get sa
```

The output looks like below

```bash
NAME      SECRETS   AGE
default   0         3h9m
```

As you see in the above output, there is no secret created for the sevice account.

### Projected Service Account Token

**Projected Volumes**

A [projected volume](https://kubernetes.io/docs/concepts/storage/projected-volumes/) maps several existing volume sources into the same directory. Currently, the following types of volume sources can be projected:

1. secret
2. downwardAPI
3. configMap
4. serviceAccountToken

In Kubernetes 1.12 the [ProjectedServiceAccountToken](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/#service-account-token-volume-projection) feature was introduced. This feature allows a fully compliant OIDC JWT token issued by the TokenRequest API of Kubernetes to be mounted into the Pod as a Projected Volume. The relevant Service Account Token Volume Projection flags are enabled by default on an EKS cluster. Therefore, fully compliant OIDC JWT Service Account tokens are being projected into each pod instead of the JWT token mentioned in the previous paragraph.

To inspect this OIDC Token, let us create a new pod that just has a sleep process inside with the following command:


```bash
cat > eks-iam-test2.yaml <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: eks-iam-test2
spec:
  containers:
    - name: my-aws-cli
      image: amazon/aws-cli:latest
      command: ['sleep', '36000']
  restartPolicy: Never
EOF

kubectl apply -f eks-iam-test2.yaml
```

::::expand{header="Check Output"}
```bash
pod/eks-iam-test2 created
```
::::

Run the below command to see the pod status

```bash
kubectl get pod
```

The output looks like below

```bash
NAME            READY   STATUS    RESTARTS   AGE
eks-iam-test1   0/1     Error     0          96m
eks-iam-test2   1/1     Running   0          81s
```

Let us look at the Volumes and volumeMounts in the pod `eks-iam-test2` specification.

```bash
kubectl get pod eks-iam-test2 -oyaml
```
The output looks like below. Only relevant fields are shown below.

```yaml
----
spec:
  containers:
  - command:
    - sleep
    - "36000"
    image: amazon/aws-cli:latest
    volumeMounts:
    - mountPath: /var/run/secrets/kubernetes.io/serviceaccount
      name: kube-api-access-qq6vs
      readOnly: true
----
  serviceAccountName: default
----
  volumes:
  - name: kube-api-access-qq6vs
    projected:
      defaultMode: 420
      sources:
      - serviceAccountToken:
          expirationSeconds: 3607
          path: token
      - configMap:
          items:
          - key: ca.crt
            path: ca.crt
          name: kube-root-ca.crt
      - downwardAPI:
          items:
          - fieldRef:
              apiVersion: v1
              fieldPath: metadata.namespace
            path: namespace
----
```

The `volumeMounts` section in the above output, the `mountPath` value **/var/run/secrets/kubernetes.io/serviceaccount** is the base path for all the projected Volume Sources i.e. `serviceAccountToken`, `configMap` and `downwardAPI`.

The generated token is mounted as per `serviceAccountToken` configuration is **/var/run/secrets/kubernetes.io/serviceaccount/token**

The token can be retrieved and expanded to show a fully compliant OIDC token.

```bash
kubectl exec -it eks-iam-test2 -- cat /var/run/secrets/kubernetes.io/serviceaccount/token
```

The Output looks like below.

```bash
eyJhbGciOiJSUzI1NiIsImtpZCI6ImY2NDU3OGViMmFiMjRlOTIxNWM0NjA4Yjg1NTU5YmNiODgxOTQ1NDQifQ.eyJhdWQiOlsiaHR0cHM6Ly9rdWJlcm5ldGVzLmRlZmF1bHQuc3ZjIl0sImV4cCI6MTcwOTQ1ODA4MywiaWF0IjoxNjc3OTIyMDgzLCJpc3MiOiJodHRwczovL29pZGMuZWtzLnVzLWVhc3QtMS5hbWF6b25hd3MuY29tL2lkLzgwRDU2MkVEODAyNkU5MTI5NEQ1MkUwOUJFQTI2MUQ0Iiwia3ViZXJuZXRlcy5pbyI6eyJuYW1lc3BhY2UiOiJkZWZhdWx0IiwicG9kIjp7Im5hbWUiOiJla3MtaWFtLXRlc3QyIiwidWlkIjoiZTU5MTdhM2MtMTA4Yi00YzdiLWIwNDUtOTYwYjZhNTlmZWZiIn0sInNlcnZpY2VhY2NvdW50Ijp7Im5hbWUiOiJkZWZhdWx0IiwidWlkIjoiNzVmMTg5OWItOTE0Ni00ZDgxLTgzNWMtOTFjZTllOWY4OGE1In0sIndhcm5hZnRlciI6MTY3NzkyNTY5MH0sIm5iZiI6MTY3NzkyMjA4Mywic3ViIjoic3lzdGVtOnNlcnZpY2VhY2NvdW50OmRlZmF1bHQ6ZGVmYXVsdCJ9.N-z0JJjHI8yZtDAyPTBfJRz-s7dzhdR1F5QpK5hnuMbeIsPxvuADppanqD82oO8SWy11Nw4WOO85s22ZpRjh3MlSKMuvEIAFkk69iyPooMUrRkqLu7blF3_EsbZKgACR1plUGEjG2Ge1mGGE5nvem63BKBUfhk7F0Eefg58ZaEvu7Zubk3IEChU6Q2FWmLVQGFJOAjZXreDN571DshOXp53y8ZlO0dbuk5WRXtUwY11DgP8cznGiz8bpoPxf20g-pGj4eGR3r0oFRm78rfa-uC6fI5ccOSzYYrBOMujonRS1vbVXLDF71KFbQkbQxUrnqLoYwmPP4pspt6t3OZsfmw
```

Decoding this token at [https://jwt.io/](https://jwt.io/) shows below Payload Data.

```json
{
  "aud": [
    "https://kubernetes.default.svc"
  ],
  "exp": 1709458083,
  "iat": 1677922083,
  "iss": "https://oidc.eks.us-east-1.amazonaws.com/id/80D562ED8026E91294D52E09BEA261D4",
  "kubernetes.io": {
    "namespace": "default",
    "pod": {
      "name": "eks-iam-test2",
      "uid": "e5917a3c-108b-4c7b-b045-960b6a59fefb"
    },
    "serviceaccount": {
      "name": "default",
      "uid": "75f1899b-9146-4d81-835c-91ce9e9f88a5"
    },
    "warnafter": 1677925690
  },
  "nbf": 1677922083,
  "sub": "system:serviceaccount:default:default"
}
```

Let us understand few important fields in the above output.

**iss** : It represents the issuer of the token which is an OIDC Provider `https://oidc.eks.us-east-1.amazonaws.com/id/80D562ED8026E91294D52E09BEA261D4`. This OIDC provider URL will be used during the verification process of the token.

**aud**: It represents the audience of the token which is `https://kubernetes.default.svc`. This is the address inside a cluster used to reach the Kubernetes API Server. This means the token will be accepted by API Server and will be rejected by any other service.

For security reasons, you may not want to include any token into a Kubernetes Pod if the workload in the Pod is not going to be making calls to the Kubernetes API server. This can be done by passing `automountServiceAccountToken: false` into the pod Spec when you create a Pod.

**exp** and **iat** :  These represents the expiry time for the token which basically enables the time bound tokens.


This compliant OIDC token now gives us a foundation to build upon to find a token that can be used to authenticate to AWS APIs. However, we will need an additional component to inject a second token for use with AWS APIs into our Kubernetes Pods. Kubernetes supports validating and mutating webhooks, and AWS has created an [identity webhook](https://github.com/aws/amazon-eks-pod-identity-webhook/) that comes preinstalled in an Amazon EKS cluster. This webhook listens to create pod API calls and can inject an additional Token into our pods. This webhook can also be installed into self-managed Kubernetes clusters on AWS using [this guide](https://github.com/aws/amazon-eks-pod-identity-webhook/blob/master/SELF_HOSTED_SETUP.md)

This additional token, apart from the service account, enables the IRSA functionality. Let's see it in action in next sections.



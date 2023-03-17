---
title : "Projected Service Account Token"
weight : 21
---

Before we get into how IRSA works, let us understand some Basics and underlying Kubernetes which enables IRSA functionality.

### Kubernetes Service Accounts

Kubernetes Pods are given an identity through a Kubernetes concept called a Kubernetes Service Account. When a Service Account is created, a JWT token is automatically created as a Kubernetes Secret. This Secret can then be mounted into Pods and used by that Service Account to authenticate to the Kubernetes API Server.


```bash
kubectl get sa
```

The output looks like below

```bash
NAME      SECRETS   AGE
default   1         3h9m
```

Let us get the secret associated the default Service Account.

```bash
DEFAULT_SA_SECRET_NAME=$(kubectl get sa default -ojson | jq -r '.secrets[0].name')
echo "Default Service Account Secret Name: $DEFAULT_SA_SECRET_NAME"
```

The output looks like below.

```bash
Default Service Account Secret Name: default-token-j9sbj
```


Unfortunately, this default token has a few problems that make it unusable for IAM authentication. 
1. It is only the Kubernetes API server that can validate this token
2. These Service Account tokens do not expire
3. Rotating the signing key is a difficult process

 Let us view the token by retrieving the secret.

```bash
kubectl get secret $DEFAULT_SA_SECRET_NAME -o json | jq -r '.data.token' | base64 -d
```

::::expand{header="Check Output"}
```bash
eyJhbGciOiJSUzI1NiIsImtpZCI6Ill1MWdtZkV2ZlBoUFVTcmJVaVpJTC12MDRuTldxM0tUdWZUQzR2MUVlc3MifQ.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJkZWZhdWx0Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZWNyZXQubmFtZSI6ImRlZmF1bHQtdG9rZW4tajlzYmoiLCJrdWJlcm5ldGVzLmlvL3NlcnZpY2VhY2NvdW50L3NlcnZpY2UtYWNjb3VudC5uYW1lIjoiZGVmYXVsdCIsImt1YmVybmV0ZXMuaW8vc2VydmljZWFjY291bnQvc2VydmljZS1hY2NvdW50LnVpZCI6Ijc1ZjE4OTliLTkxNDYtNGQ4MS04MzVjLTkxY2U5ZTlmODhhNSIsInN1YiI6InN5c3RlbTpzZXJ2aWNlYWNjb3VudDpkZWZhdWx0OmRlZmF1bHQifQ.BIrVHf6QPzMXq7QSeKQQgXpDYY71zfsG1jyBcvqjkQd2P1LrgJVNov-D_piIFZs5lmI8W_uX9L4m5sB6gXauCvZllRygwySHWXIZVy_tHf6SFTLZWNgZBm3isWEJhcJzWEr5E9miq2ZgfcnwfuY6Rg23mf-1UEXDAAwqltJV5gRN878X5dJwrIeUjQHivE1PEDrfKbKdQJ8I284s8FQnxBgE8WRwWyuGIfOnmdmQk5zwpmuWKpIymt3PrD--jc6YCk3knaRHLPnErpXm0lSCvEXfUSvUXQNeyAv6Bijc3C2Y7sXKkwkAHjl8qZFK-WmXSet5HdwLi-j8uVUn6ammUA
```
::::


 Copy the token from the above output and decode it using this online tool [https://jwt.io/](https://jwt.io/)

The Output for the Payload part of the token looks like below.

```json
{
  "iss": "kubernetes/serviceaccount",
  "kubernetes.io/serviceaccount/namespace": "default",
  "kubernetes.io/serviceaccount/secret.name": "default-token-j9sbj",
  "kubernetes.io/serviceaccount/service-account.name": "default",
  "kubernetes.io/serviceaccount/service-account.uid": "75f1899b-9146-4d81-835c-91ce9e9f88a5",
  "sub": "system:serviceaccount:default:default"
}
```


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



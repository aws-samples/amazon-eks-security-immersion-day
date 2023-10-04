---
title : "Enable IRSA"
weight : 22
---

### IAM OIDC provider for your cluster

The EKS cluster has an OpenID Connect (OIDC) issuer URL associated with it. To use AWS Identity and Access Management (IAM) roles for service accounts, an IAM OIDC provider must exist for your cluster's OIDC issuer URL.


**Create IAM OIDC identity provider for EKS cluster**

Run the below command to retrieve the OpenID Connect issuer URL associated with the Amazon EKS Cluster.

1. Determine whether you have an existing IAM OIDC provider for your cluster. Retrieve your cluster's OIDC provider ID and store it in a variable.

```bash
oidc_id=$(aws eks describe-cluster --name eksworkshop-eksctl --query "cluster.identity.oidc.issuer" --output text | cut -d '/' -f 5)
echo $oidc_id
```
The output will looks like below

```bash
80D562ED8026E91294D52E09BEA261D4
```
2. Determine whether an IAM OIDC provider with your cluster's ID is already in your account.

```bash
aws iam list-open-id-connect-providers | grep $oidc_id | cut -d "/" -f4
```

If output is returned, then you already have an IAM OIDC provider for your cluster and you can skip the next step. If no output is returned, then you must create an IAM OIDC provider for your cluster

3. Create an IAM OIDC identity provider for your cluster with the following command.  You only need to do this once for a cluster.

```bash
eksctl utils associate-iam-oidc-provider --cluster eksworkshop-eksctl  --approve
```

If you go to the [Identity Providers in IAM Console](https://console.aws.amazon.com/iam/home#/providers), and click on the OIDC provider link, you will see OIDC provider has created for your cluster. 

![oidc](/static/images/iam/irsa/oidc.png)


### Create service account with attaching an IAM role

You will create an IAM policy that specifies the permissions that you would like the containers in your pods to have.

In this workshop we will use the AWS managed policy named "**AmazonS3ReadOnlyAccess**" which allow get and list for all your S3 buckets.

Let's start by finding the ARN for the "**AmazonS3ReadOnlyAccess**" policy

```bash
aws iam list-policies --query 'Policies[?PolicyName==`AmazonS3ReadOnlyAccess`].Arn'
```

::::expand{header="Check Output"}
```json
[
    "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess"
]
```
::::


Now you will create a IAM role bound to a service account with read-only access to S3

```bash
eksctl create iamserviceaccount \
    --name iam-test \
    --cluster eksworkshop-eksctl \
    --attach-policy-arn arn\:aws\:iam::aws\:policy/AmazonS3ReadOnlyAccess \
    --approve \
    --override-existing-serviceaccounts
```

::::expand{header="Check Output"}
```bash
2023-03-05 07:36:33 [ℹ]  8 existing iamserviceaccount(s) (amazon-cloudwatch/cloudwatch-agent,amazon-cloudwatch/cwagent-prometheus,amazon-cloudwatch/fluent-bit,default/xray-daemon,karpenter/karpenter,kube-system/aws-node,kube-system/cluster-autoscaler,workshop/iam-test) will be excluded
2023-03-05 07:36:33 [ℹ]  1 iamserviceaccount (default/iam-test) was included (based on the include/exclude rules)
2023-03-05 07:36:33 [!]  metadata of serviceaccounts that exist in Kubernetes will be updated, as --override-existing-serviceaccounts was set
2023-03-05 07:36:33 [ℹ]  1 task: { 
    2 sequential sub-tasks: { 
        create IAM role for serviceaccount "default/iam-test",
        create serviceaccount "default/iam-test",
    } }2023-03-05 07:36:33 [ℹ]  building iamserviceaccount stack "eksctl-eksworkshop-eksctl-addon-iamserviceaccount-default-iam-test"
2023-03-05 07:36:33 [ℹ]  deploying stack "eksctl-eksworkshop-eksctl-addon-iamserviceaccount-default-iam-test"
2023-03-05 07:36:33 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-addon-iamserviceaccount-default-iam-test"
2023-03-05 07:37:03 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-addon-iamserviceaccount-default-iam-test"
2023-03-05 07:37:03 [ℹ]  created serviceaccount "default/iam-test"
```
::::

You can see that an IAM role (See the Annotations below) is associated to the service account iam-test in the cluster we just created.

```bash
kubectl describe sa iam-test
```
The output looks like below.

```bash
Name:                iam-test
Namespace:           default
Labels:              app.kubernetes.io/managed-by=eksctl
Annotations:         eks.amazonaws.com/role-arn: arn:aws:iam::XXXXXXXXXXXX:role/eksctl-eksworkshop-eksctl-addon-iamserviceac-Role1-1CF1FE6ZXXRZF
Image pull secrets:  <none>
Mountable secrets:   iam-test-token-v8flm
Tokens:              iam-test-token-v8flm
Events:              <none>
```

In the above input, note that the service account annotation contains the IAM Role.

::alert[If you go to the [AWS CloudFormation in IAM Console](https://console.aws.amazon.com/cloudformation/), you will find that the stack "**eksctl-eksworkshop-eksctl-addon-iamserviceaccount-default-iam-test**" has created a role for your service account.]{header="Note"}

Let’s see how this IAM role looks within the AWS Management Console. Navigate to IAM and then IAM Roles and search for the role. You will see the Annotations field when you describe your Service Account.

![iam-role-permissions](/static/images/iam/irsa/iam-role-permissions.png)


Select the Trust relationships tab and select Edit trust relationship to view the policy document.

![iam-role-trust-policy](/static/images/iam/irsa/iam-role-trust-policy.png)

The principal for this policy is `arn:aws:iam::XXXXXXXXXX:oidc-provider/oidc.eks.us-west-2.amazonaws.com/id/80D562ED8026E91294D52E09BEA261D41` i.e. the OIDC provider for the Amazon EKS Cluster can only assume this role and allowed action is `sts:AssumeRoleWithWebIdentity`.

You can also see that there are 2 conditions in this Policy. The first condition contains `sub` field and ensures that only Kubernetes pod with identity `system:serviceaccount:default:iam-test` can assume this the IAM Role. The second condition has `aud` field which says that the audience must be `sts.amazonaws.com`.

### Configure Kubernetes Pod with Service Account

Let's start by testing if the Service Account we created can list the S3 buckets.

First let's create an S3 bucket.

```bash
aws s3 mb s3://eksworkshop-$ACCOUNT_ID-$AWS_REGION --region $AWS_REGION
```

The output looks like below

```bash
make_bucket: eksworkshop-XXXXXXXX-us-west-2
```
Now let us use the above Service Account with our initial Pod example, which lists S3 objects.

```bash

cat > eks-iam-test3.yaml <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: eks-iam-test3
  labels:
     app: s3-test
spec:
  serviceAccountName: iam-test
  containers:
    - name: eks-iam-test3
      image: amazon/aws-cli:latest
      args: ['s3', 'ls']
      #command: ['aws', 's3', 'ls', 'sleep', '36000']
  restartPolicy: Never
EOF

kubectl apply -f eks-iam-test3.yaml
```

::::expand{header="Check Output"}
```bash
pod/eks-iam-test3 created
```
::::

Run the below command to see the pod status.

```bash
kubectl get pod
```

The output looks like below

```bash
NAME            READY   STATUS    RESTARTS   AGE
NAME            READY   STATUS      RESTARTS   AGE
eks-iam-test1   0/1     Error       0          115m
eks-iam-test2   1/1     Running     0          19m
eks-iam-test3   0/1     Completed   0          61s
```

The pod status shows `Completed`. Let us check the logs to verify that the command ran successfully this time.

```bash
kubectl logs  eks-iam-test3
```
The output should look like below.

```bash
2023-03-14 12:32:02 eksworkshop-XXXXXXXXXX-us-west-2
```

The above output indicates that the container is now able to access the AWS S3 service and list the bucket names successfully.


### Inspect the Projected Service Account token for IRSA

In the above section, we saw that container is able to get access S3 using fine grained IAM permissions. Now, let us inspect the additional token injected by the pod identity webhook.

```bash
cat > eks-iam-test4.yaml <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: eks-iam-test4
spec:
  serviceAccountName: iam-test
  containers:
    - name: my-aws-cli
      image: amazon/aws-cli:latest
      command: ['sleep', '36000']
  restartPolicy: Never
EOF

kubectl apply -f eks-iam-test4.yaml
```

::::expand{header="Check Output"}
```bash
pod/eks-iam-test4 created
```
::::

Run the below command to see the pod status.

```bash
kubectl get pod
```

The output looks like below

```bash
NAME            READY   STATUS      RESTARTS   AGE
eks-iam-test1   0/1     Error       0          125m
eks-iam-test2   1/1     Running     0          30m
eks-iam-test3   0/1     Completed   0          11m
eks-iam-test4   1/1     Running     0          6m12s
```

If we inspect the Pod using Kubectl and jq, we can see there are now two volumes mounted into our Pod. The second one has been mounted via that mutating webhook. The aws-iam-token is still being generated by the Kubernetes API Server, but with a new OIDC JWT audience.

Let us look at the Volumes and volumeMounts in the pod specification.

```bash
kubectl get pod eks-iam-test4 -oyaml
```
The output looks like below. Only relevant fields are shown below.

```yaml
---
spec:
  containers:
  - command:
    - sleep
    - "36000"
    env:
    - name: AWS_STS_REGIONAL_ENDPOINTS
      value: regional
    - name: AWS_DEFAULT_REGION
      value: us-west-2
    - name: AWS_REGION
      value: us-west-2
    - name: AWS_ROLE_ARN
      value: arn:aws:iam::XXXXXXXXX:role/eksctl-eksworkshop-eksctl-addon-iamserviceac-Role1-1CF1FE6ZXXRZF
    - name: AWS_WEB_IDENTITY_TOKEN_FILE
      value: /var/run/secrets/eks.amazonaws.com/serviceaccount/token
    image: amazon/aws-cli:latest
    volumeMounts:
    - mountPath: /var/run/secrets/kubernetes.io/serviceaccount
      name: kube-api-access-t9g7l
      readOnly: true
    - mountPath: /var/run/secrets/eks.amazonaws.com/serviceaccount
      name: aws-iam-token
      readOnly: true
  serviceAccount: iam-test
  volumes:
  - name: aws-iam-token
    projected:
      defaultMode: 420
      sources:
      - serviceAccountToken:
          audience: sts.amazonaws.com
          expirationSeconds: 86400
          path: token
  - name: kube-api-access-t9g7l
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
 ---
```
You can see that there are two `projected` volumes. One of them is for the default Service Account as expected and explained in the previous section. The second one is added by the pod identity webhook for the additional Service Account token used to authenticate with IAM Service to access AWS S3 Service.

The mutating webhook does more than just mount an additional token into the Pod. The mutating webhook also injects environment variables.

Note that there are two additional environment variables added. One of them is `AWS_ROLE_ARN` which contains the ARN of the IAM Role we created earlier for the Pod to assume. Second one is `AWS_WEB_IDENTITY_TOKEN_FILE` which contains the path for the additional service token. Note that additional token is mounted at a different path **/var/run/secrets/eks.amazonaws.com/serviceaccount** than the default Service Account token.

```bash
kubectl exec -it eks-iam-test4 -- cat /var/run/secrets/eks.amazonaws.com/serviceaccount/token
```

The Output looks like below.

```bash
eyJhbGciOiJSUzI1NiIsImtpZCI6ImY2NDU3OGViMmFiMjRlOTIxNWM0NjA4Yjg1NTU5YmNiODgxOTQ1NDQifQ.eyJhdWQiOlsic3RzLmFtYXpvbmF3cy5jb20iXSwiZXhwIjoxNjc4MDk5Njc4LCJpYXQiOjE2NzgwMTMyNzgsImlzcyI6Imh0dHBzOi8vb2lkYy5la3MudXMtZWFzdC0xLmFtYXpvbmF3cy5jb20vaWQvODBENTYyRUQ4MDI2RTkxMjk0RDUyRTA5QkVBMjYxRDQiLCJrdWJlcm5ldGVzLmlvIjp7Im5hbWVzcGFjZSI6ImRlZmF1bHQiLCJwb2QiOnsibmFtZSI6ImVrcy1pYW0tdGVzdDQiLCJ1aWQiOiIwZDY0NDAyZi01Yzg3LTQ2OWMtYjQ0MS04YmQzMzJiMWJkMDcifSwic2VydmljZWFjY291bnQiOnsibmFtZSI6ImlhbS10ZXN0IiwidWlkIjoiODE0NWE2ZDUtNDkzMi00OGU5LTg2YjUtN2MzM2ViOWQ2YWQxIn19LCJuYmYiOjE2NzgwMTMyNzgsInN1YiI6InN5c3RlbTpzZXJ2aWNlYWNjb3VudDpkZWZhdWx0OmlhbS10ZXN0In0.T_s2O-GNW9KrErQ8Vm6WS_3iiKbWR4Zkiv0F7IJaPVxqiMLtkAGbX7ucYkHOxpumgK-9OphzPrBSWZFpoHFYQkIuvN8YRyWJCvcQEzA2dF9IAJVMH8xzyyaxZdTonnRP2M_HHBtYIOYJBty4YzLxwsHiUqxA6c_7Q2Q03eLvaKYU4RM3hibICpcd-ENMEiB9k22B4sgrTe-DzbmJiUghKz4r-Ag-nkS3hiz0Imec2LQ0Xp7BHU74q7015WcbF8J2EdU8kNUwoTqKkuu_wrksk_0XpWLasbsNvLptKAnFQ1hOu_I9wJieL_0P0GMjz-_nviUIjdw7OxnWcZPg3qci5w
```

Decoding this token at [https://jwt.io/](https://jwt.io/) shows below Payload Data.

```json
{
  "aud": [
    "sts.amazonaws.com"
  ],
  "exp": 1678099678,
  "iat": 1678013278,
  "iss": "https://oidc.eks.us-west-2.amazonaws.com/id/80D562ED8026E91294D52E09BEA261D4",
  "kubernetes.io": {
    "namespace": "default",
    "pod": {
      "name": "eks-iam-test4",
      "uid": "0d64402f-5c87-469c-b441-8bd332b1bd07"
    },
    "serviceaccount": {
      "name": "iam-test",
      "uid": "8145a6d5-4932-48e9-86b5-7c33eb9d6ad1"
    }
  },
  "nbf": 1678013278,
  "sub": "system:serviceaccount:default:iam-test"
}
```
You can see that the intended audience for this token is now `sts.amazonaws.com`, the issuer who has created and signed this token is still our OIDC provider, and finally, the expiration of the token is much shorter at 24 hours. We can modify the expiration duration for the Service Account using eks.amazonaws.com/token-expiration annotation in our Pod definition or Service Account definition.
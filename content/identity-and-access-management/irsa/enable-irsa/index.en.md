---
title : "Enable IRSA"
weight : 21
---

### IAM OIDC provider for your clusterHeader anchor link

**Retrieve OpenID Connect issuer URL**

Your EKS cluster has an OpenID Connect issuer URL associated with it, and this will be used when configuring the IAM OIDC Provider. You can check it with:

```bash
aws eks describe-cluster --name eksworkshop-eksctl --query cluster.identity.oidc.issuer --output text
```

```bash
https://oidc.eks.{AWS_REGION}.amazonaws.com/id/D48675832CA65BD10A532F59741CF90B
```
**Create an IAM OIDC provider for your cluster**

(You only need to do this once for a cluster)

```bash
  eksctl utils associate-iam-oidc-provider --cluster eksworkshop-eksctl --approve
```

```bash
[ℹ]  using region {AWS_REGION}
[ℹ]  will create IAM Open ID Connect provider for cluster "eksworkshop-eksctl" in "{AWS_REGION}"
[✔]  created IAM Open ID Connect provider for cluster "eksworkshop-eksctl" in "{AWS_REGION}
```

If you go to the [Identity Providers in IAM Console](https://console.aws.amazon.com/iam/home#/providers), and click on the OIDC provider link, you will see OIDC provider has created for your cluster. 

![oidc](../../../static/images/oidc.PNG)

### Create an IAM role and attach an IAM policyHeader anchor link

You will create an IAM policy that specifies the permissions that you would like the containers in your pods to have.

In this workshop we will use the AWS managed policy named "**AmazonS3ReadOnlyAccess**" which allow get and list for all your S3 buckets.

Let's start by finding the ARN for the "**AmazonS3ReadOnlyAccess**" policy

```bash
aws iam list-policies --query 'Policies[?PolicyName==`AmazonS3ReadOnlyAccess`].Arn'
```

```
"arn\:aws\:iam::aws\:policy/AmazonS3ReadOnlyAccess"
```
Now you will create a IAM role bound to a service account with read-only access to S3

```
eksctl create iamserviceaccount \
    --name iam-test \
    --namespace workshop \
    --cluster eksworkshop-eksctl \
    --attach-policy-arn arn\:aws\:iam::aws\:policy/AmazonS3ReadOnlyAccess \
    --approve \
    --override-existing-serviceaccounts
```

```bash
[ℹ]  using region {AWS_REGION}
[ℹ]  1 iamserviceaccount (default/iam-test) was included (based on the include/exclude rules)
[!]  metadata of serviceaccounts that exist in Kubernetes will be updated, as --override-existing-serviceaccounts was set
[ℹ]  1 task: { 2 sequential sub-tasks: { create IAM role for serviceaccount "default/iam-test", create serviceaccount "default/iam-test" } }
[ℹ]  building iamserviceaccount stack "eksctl-eksworkshop-eksctl-addon-iamserviceaccount-default-iam-test"
[ℹ]  deploying stack "eksctl-eksworkshop-eksctl-addon-iamserviceaccount-default-iam-test"
[ℹ]  created serviceaccount "default/iam-test"
```

### Associate an IAM role with a service account

You can see that an IAM role (See the Annotations below) is associated to the Service Account iam-test in the cluster we just created.

```bash
kubectl describe sa iam-test -n workshop
```


```bash
Name:                iam-test
Namespace:           workshop
Labels:              <none>
Annotations:         eks.amazonaws.com/role-arn: arn\:aws\:iam::$ACCOUNT_ID\:role/eksctl-eksworkshop-eksctl-addon-iamserviceac-Role1-1PJ5Q3H39Z5M9
Image pull secrets:  <none>
Mountable secrets:   iam-test-token-5n9cb
Tokens:              iam-test-token-5n9cb
Events:              <none>
```


::alert[If you go to the [CloudFormation in IAM Console](https://console.aws.amazon.com/cloudformation/), you will thats find the stack "**eksctl-eksworkshop-eksctl-addon-iamserviceaccount-default-iam-test**" has created a role for your service account.]{header="Note"}

### Test Success Case (List S3 buckets)Header anchor link

Let's start by testing if the service account we created can list the S3 buckets.

First let's create an S3 bucket.

```bash
aws s3 mb s3://eksworkshop-$ACCOUNT_ID-$AWS_REGION --region $AWS_REGION
```

Output example

```bash
make_bucket: eksworkshop-886836808448-us-east-1
```

Now add job-s3.yaml that will output the result of the command aws s3 ls (this job should be successful).


```bash
mkdir ~/environment/irsa

cat <<EoF> ~/environment/irsa/job-s3.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: eks-iam-test-s3
  namespace: workshop
spec:
  template:
    metadata:
      labels:
        app: eks-iam-test-s3
    spec:
      serviceAccountName: iam-test
      containers:
      - name: eks-iam-test
        image: amazon/aws-cli:latest
        args: ["s3", "ls"]
      restartPolicy: Never
EoF

kubectl apply -f ~/environment/irsa/job-s3.yaml
```

Make sure your job is completed

```bash
kubectl get job -l app=eks-iam-test-s3 -n workshop
```

```bash
NAME              COMPLETIONS   DURATION   AGE
eks-iam-test-s3   1/1           2s         21m
```

Let's check the logs to verify that the command ran successfully.


```bash
kubectl logs -l app=eks-iam-test-s3 -n workshop
```
Output example

```bash
2021-05-17 15:44:41 eksworkshop-886836808448-us-east-1
```
### Test Failure Case

Now Let's confirm that the service account cannot list the EC2 instances. Add **job-ec2.yaml** that will output the result of the command `aws ec2 describe-instances --region ${AWS_REGION}` (this job should failed).

```bash
cat <<EoF> ~/environment/irsa/job-ec2.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: eks-iam-test-ec2
  namespace: workshop
spec:
  template:
    metadata:
      labels:
        app: eks-iam-test-ec2
    spec:
      serviceAccountName: iam-test
      containers:
      - name: eks-iam-test
        image: amazon/aws-cli:latest
        args: ["ec2", "describe-instances", "--region", "${AWS_REGION}"]
      restartPolicy: Never
  backoffLimit: 0
EoF

kubectl apply -f ~/environment/irsa/job-ec2.yaml
```

Let's verify the job status

```bash
kubectl get job -l app=eks-iam-test-ec2 -n workshop
```

```bash
NAME               COMPLETIONS   DURATION   AGE
eks-iam-test-ec2   0/1           39s        39s
```
::alert[It is normal that the job didn't complete succesfuly]{header="Note"}

Finally we will review the logs

```bash
kubectl logs -l app=eks-iam-test-ec2 -n workshop
```
Output
```bash
An error occurred (UnauthorizedOperation) when calling the DescribeInstances operation: You are not authorized to perform this operation.
```


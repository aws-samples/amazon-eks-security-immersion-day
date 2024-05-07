---
title : "Test EKS Pod Identity"
weight : 22
---

In this section, we test EKS Pod Identity feature to grant access to a Pod to list S3 buckets.


## Test Amazon EKS Pod Identity

### Create S3 bucket 

First let's create a Amazon S3 bucket

```bash
export S3_BUCKET="ekspodidentity-$ACCOUNT_ID-$AWS_REGION"
aws s3 mb s3://$S3_BUCKET --region $AWS_REGION
```

::::expand{header="Check Output"}
```bash
make_bucket: ekspodidentity-ACCOUNT_ID-us-west-2
```
::::

### Test S3 read access

Test the S3 access now.

```bash
kubectl -n $NS exec -it $APP -- aws s3 ls
```

::::expand{header="Check Output"}
```bash
An error occurred (AccessDenied) when calling the ListBuckets operation: Access Denied
command terminated with exit code 254
```
::::

**Why is the Pod still getting `AccessDenied` error?**

This is because the Pod Identity association was created `after` the Pod was created.  So let's re-deploy the Pod again. 

Delete the Pod and re-create it.

```bash
kubectl -n $NS delete pod $APP --force --grace-period=0
kubectl  apply -f ~/environment/$APP.yaml
```

::::expand{header="Check Output"}
```bash
namespace/ns-a unchanged
serviceaccount/sa1 unchanged
pod/app1 created
```
::::


Test the S3 access again.

```bash
kubectl -n $NS exec -it $APP -- aws s3 ls
```

::::expand{header="Check Output"}
```bash
2023-12-12 05:28:12 ekspodidentity-ACCOUNT_ID-us-west-2
```
::::

The App is now able to access the list of S3 Buckets.



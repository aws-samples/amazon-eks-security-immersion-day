---
title : "Access control to IAM Role using EKS Pod Identity Usecases"
weight : 24
---

In this section, we explore how we can control access to an IAM Role using EKS Pod Identity across EKS Clusters, Namespaces, Service accounts etc.


## Control access to IAM Role to specific EKS Clusters.

### Update IAM Role Trust Policy

By default the IAM Role `arn:aws:iam::ACCOUNT_ID:role/eks-pod-s3-read-access-role` can be used across EKS Clusters in this AWS Account without any changes anywhere.

We can restrict the access to the IAM Role to specific EKS Clusters in this AWS Account by modifying the IAM Role Trust Policy.

Let us say we want to restrict access to the IAM Role to only two EKS Clusters say `eksworkshop-eksctl` and eks-ref-nw-1


Let us update the IAM Role Trust policy document as below.

```bash
#cd ~/environment
cd /home/ec2-user/environment/code-samples/aws_services/eks/security/eks-pod-identity/ws
export IAM_ROLE="eks-pod-s3-read-access-role"
export IAM_ROLE_TRUST_POLICY_CLUSTER="eks-pod-s3-read-access-trust-policy-cluster"
export EKS_CLUSTER1_NAME="eksworkshop-eksctl"
export EKS_CLUSTER2_NAME="eks-ref-nw-1"


cat > $IAM_ROLE_TRUST_POLICY_CLUSTER.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "pods.eks.amazonaws.com"
            },
            "Action": [
                "sts:AssumeRole",
                "sts:TagSession"
            ],
            "Condition": {
                "StringEquals": {
                    "aws:RequestTag/eks-cluster-name": [
                        "$EKS_CLUSTER1_NAME",
                        "$EKS_CLUSTER2_NAME"
                    ]
                }
            }
        }
    ]
}
EOF
```

Let us update the IAM Role with the new Trust policy.

```bash
aws iam update-assume-role-policy \
    --role-name $IAM_ROLE \
    --policy-document file://$IAM_ROLE_TRUST_POLICY_CLUSTER.json
```

### Test Access to IAM Role from clusters

Now, if we test EKS Pod Identity feature in any other cluster say `eksworkshop-eksctl-3`, apart from  the above two EKS Clusters, we will get below error when we run `aws s3 ls` from the Application.

Please note we did not create second EKS Cluster i.e. `eks-ref-nw-1` in this workshop. The IAM Role Trust policy is updated to demonostrate how to control access to an IAM Role to specific EKS Clusters.

```bash
Error when retrieving credentials from container-role: Error retrieving metadata: Received non 200 response 500 from container metadata: unable to fetch credentials from EKS Auth: operation error EKS Auth: AssumeRoleForPodIdentity, https response error StatusCode: 400, RequestID: a17127a3-acb1-4531-8926-614944e87e57, AccessDeniedException: Unauthorized Exception! EKS does not have permissions to assume the associated role.

command terminated with exit code 255
```

Note that above error is coming from the EKS Auth API Service and NOT the AWS STS Service. The EKS Auth API Service, extracts the IAM Role from token and validates the current Cluster name i.e. `eksworkshop-eksctl-3` with the allowed cluster names in the IAM Trust Polocy and rejects request.

We can see this from the CloudTrail log.

```bash
EVENT_NAME="AssumeRoleForPodIdentity"
aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventName,AttributeValue=$EVENT_NAME --max-items=1
```


::::expand{header="Check Output"}

```json
{
  "Events": [
    {
      "EventId": "3d93c2b6-7baa-497d-a6f1-48288a2a8db3",
      "EventName": "AssumeRoleForPodIdentity",
      "ReadOnly": "true",
      "AccessKeyId": "ASIAQAHCJ2QPPFCSM6XX",
      "EventTime": "2023-12-13T05:13:13+00:00",
      "EventSource": "eks-auth.amazonaws.com",
      "Username": "i-0f6f119f5ab3da4d2",
      "Resources": [
        {
          "ResourceType": "AWS::EKS::Cluster",
          "ResourceName": "eks-ref-cluster1"
        }
      ],
      "CloudTrailEvent": "{\"eventVersion\":\"1.09\",\"userIdentity\":{\"type\":\"AssumedRole\",\"principalId\":\"AROAQAHCJ2QPNQIOQLNKH:i-0f6f119f5ab3da4d2\",\"arn\":\"arn:aws:sts::ACCOUNT_ID:assumed-role/platform-eks-node-group-20231029075055821400000001/i-0f6f119f5ab3da4d2\",\"accountId\":\"ACCOUNT_ID\",\"accessKeyId\":\"ASIAQAHCJ2QPPFCSM6XX\",\"sessionContext\":{\"sessionIssuer\":{\"type\":\"Role\",\"principalId\":\"AROAQAHCJ2QPNQIOQLNKH\",\"arn\":\"arn:aws:iam::ACCOUNT_ID:role/platform-eks-node-group-20231029075055821400000001\",\"accountId\":\"ACCOUNT_ID\",\"userName\":\"platform-eks-node-group-20231029075055821400000001\"},\"attributes\":{\"creationDate\":\"2023-12-13T04:14:36Z\",\"mfaAuthenticated\":\"false\"},\"ec2RoleDelivery\":\"2.0\"}},\"eventTime\":\"2023-12-13T05:13:13Z\",\"eventSource\":\"eks-auth.amazonaws.com\",\"eventName\":\"AssumeRoleForPodIdentity\",\"awsRegion\":\"us-east-1\",\"sourceIPAddress\":\"52.73.68.55\",\"userAgent\":\"aws-sdk-go-v2/1.21.2 os/linux lang/go#1.19.13 md/GOOS#linux md/GOARCH#amd64 api/eksauth#1.0.0-zeta.e49712bf27d5\",\"errorCode\":\"AccessDenied\",\"errorMessage\":\"Unauthorized Exception! EKS does not have permissions to assume the associated role.\",\"requestParameters\":{\"clusterName\":\"eks-ref-cluster1\",\"token\":\"HIDDEN_DUE_TO_SECURITY_REASONS\"},\"responseElements\":null,\"requestID\":\"08537417-1ee7-4f76-822d-9dbee6ab7e00\",\"eventID\":\"3d93c2b6-7baa-497d-a6f1-48288a2a8db3\",\"readOnly\":true,\"eventType\":\"AwsApiCall\",\"managementEvent\":true,\"recipientAccountId\":\"ACCOUNT_ID\",\"eventCategory\":\"Management\",\"tlsDetails\":{\"tlsVersion\":\"TLSv1.3\",\"cipherSuite\":\"TLS_AES_128_GCM_SHA256\",\"clientProvidedHostHeader\":\"eks-auth.us-east-1.api.aws\"}}"
    }
  ],
  "NextToken": "eyJOZXh0VG9rZW4iOiBudWxsLCAiYm90b190cnVuY2F0ZV9hbW91bnQiOiAxfQ=="
}
```
::::


## Control access to IAM Role to specific Namespaces in a cluster.

In this section, we will see how we can restrict access to IAM Role to specific namespaces in a EKS cluster.

### Update IAM Role Trust Policy

Let us update the IAM Role Trust policy document to restrict access to only two namespaces `ns-a`, `ns-b` in our EKS cluster `eksworkshop-eksctl`


```bash
#cd ~/environment
cd /home/ec2-user/environment/code-samples/aws_services/eks/security/eks-pod-identity/ws
export IAM_ROLE="eks-pod-s3-read-access-role"
export IAM_ROLE_TRUST_POLICY_NAMESPACE="eks-pod-s3-read-access-trust-policy-namespace"
export EKS_CLUSTER1_NAME="eksworkshop-eksctl"
export NS1="ns-a"
export NS2="ns-b"


cat > $IAM_ROLE_TRUST_POLICY_NAMESPACE.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "pods.eks.amazonaws.com"
            },
            "Action": [
                "sts:AssumeRole",
                "sts:TagSession"
            ],
            "Condition": {
                "StringEquals": {
                    "aws:RequestTag/eks-cluster-name": "$EKS_CLUSTER1_NAME",
                    "aws:RequestTag/kubernetes-namespace": [
                        "$NS1",
                        "$NS2"
                    ]
                }
            }
        }
    ]
}
EOF
```

Let us update the IAM Role with the new Trust policy.

```bash
aws iam update-assume-role-policy \
    --role-name $IAM_ROLE \
    --policy-document file://$IAM_ROLE_TRUST_POLICY_NAMESPACE.json
```

### Test Access to IAM Role across Namespaces

#### Create EKS Pod Identity Association for Second App

```bash
export APP="app2"
export NS="ns-b"
export SA="sa2"

aws eks create-pod-identity-association \
  --cluster-name $EKS_CLUSTER1_NAME \
  --namespace $NS \
  --service-account $SA \
  --role-arn $IAM_ROLE_ARN
```

### Deploy a Sample App `app2` in Namespace `ns-b`

Run below command to deploy a Sample App `app2` with a Kubernetes Service account `sa2` in Namspace `ns-a`.  

```bash
export APP=app2
export NS=ns-b
export SA=sa2
envsubst < app-template.yaml > $APP.yaml
kubectl  apply -f $APP.yaml
```

::::expand{header="Check Output"}
```bash
namespace/ns-b created
serviceaccount/sa2 created
pod/app2 created
```
::::

Check if the Pod is running fine.

```bash
kubectl -n $NS get pod
```

::::expand{header="Check Output"}
```bash
NAME   READY   STATUS    RESTARTS   AGE
app2   1/1     Running   0          2m29s
```
::::

Check if the Pod can access any S3 Buckets.


```bash
kubectl -n $NS exec -it $APP -- aws s3 ls
```

::::expand{header="Check Output"}
```bash
2023-12-12 05:28:12 ekspodidentity-ACCOUNT_ID-us-east-1
```
::::

As you can see, the App `app2` in Namespace `ns-b` can list S3 buckets.

Similarly, you ca also restrict access to the IAM Role to a specific Service account and a Pod.

## Control access to AWS Service (S3 Bucket) to specific Cluster/Namespaces/Service account in a cluster.

In this section, we will explore how to control access to S3 Bucket and Objects for a specific  EKS cluster, namespace using AWS Resource Tags.

### Update IAM Policy for fine grained acecss control

Earlier we created one S3 Bucket `ekspodidentity-ACCOUNT_ID-us-east-1`

We will create two S3 objects say `customer1.txt` and `customer2.txt` in this S3 bucket. We want to provide access for the S3 object `customer1.txt` for only a specific Service account say `sa1` in Namespace `ns-a` based on S3 Objects tags. Similarly, we want to provide access for the S3 object `customer2.txt` for only a specific Service account say `sa2` in Namespace `ns-b` based on S3 Objects tags.

Let us first create an updated IAM 

Let us create a custom IAM Policy for S3 read access role to configure the granular IAM permissions.

```bash
export IAM_POLICY="eks-pod-s3-read-access-policy"
export IAM_POLICY_S3="eks-pod-s3-read-access-policy-s3"
cat > $IAM_POLICY_S3.json <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListAllMyBuckets"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:GetObjectTagging"
            ],
            "Resource": "*",
            "Condition": {
                "StringEquals": {
                    "s3:ExistingObjectTag/my-namespace": "\${aws:PrincipalTag/kubernetes-namespace}",
                    "s3:ExistingObjectTag/my-service-account": "\${aws:PrincipalTag/kubernetes-service-account}"
                }
            }            
        }
    ]
}
EOF
```
```bash
s3policyArn=$(aws iam create-policy --policy-name $IAM_POLICY_S3  --policy-document file://$IAM_POLICY_S3.json --output text --query Policy.Arn)
echo "s3policyArn=$s3policyArn"
```

::::expand{header="Check Output"}
```bash
s3policyArn=arn:aws:iam::ACCOUNT_ID:policy/eks-pod-s3-read-access-policy-s3
```
::::

Let us remove the earlier policy and attach the updated IAM policy to the IAM role.

```bash
aws iam  detach-role-policy  --role-name $IAM_ROLE --policy-arn $policyArn                           
aws iam  attach-role-policy  --role-name $IAM_ROLE --policy-arn $s3policyArn
```

### Create S3 Objects in the S3 Bucket

Let us create a file 3 S3 Objects named `customer1.txt`, `customer2.txt` and `common.txt`and upload them to the S3 bucket.

Let us create a simple text file `customer1.txt` and upload it to the S3 bucket by tagging custom Resource Tags with key/value pairs such as `my-namespace=ns-a` and  `my-service-account=sa1` to reflect that this Object needs to be accessed only by that specific Service account and Namespace.

```bash
export NS="ns-a"
export SA="sa1"
export S3_OBJECT="customer1.txt"
cat > $S3_OBJECT <<EOF
This needs to be accessed only by Service account $SA in Namespace $NS
EOF

aws s3api put-object --bucket "${S3_BUCKET}" --key "${S3_OBJECT}" --body "${S3_OBJECT}" --tagging "my-namespace=$NS&my-service-account=$SA"
```

::::expand{header="Check Output"}
```json
{
    "ETag": "\"052d1a31b3ae1ac27c4b0d1b23199d65\"",
    "ServerSideEncryption": "AES256"
}
```
::::

Let us create another simple text file `customer2.txt` and upload it to the S3 bucket by tagging custom Resource Tags with key/value pairs such as `my-namespace=ns-b` and  `my-service-account=sa2` to reflect that this Object needs to be accessed only by that specific Service account and Namespace.



```bash
export NS="ns-b"
export SA="sa2"
export S3_OBJECT="customer2.txt"
cat > $S3_OBJECT <<EOF
This needs to be accessed only by Service account $SA in Namespace $NS
EOF

aws s3api put-object --bucket "${S3_BUCKET}" --key "${S3_OBJECT}" --body "${S3_OBJECT}" --tagging "my-namespace=$NS&my-service-account=$SA"
```

::::expand{header="Check Output"}
```json
{
    "ETag": "\"a3bffd3ac901fb7510179c440b22a1e9\"",
    "ServerSideEncryption": "AES256"
}
```
::::

### Test access to S3 Objects

Let us try to access the S3 Objects `customer1.txt` and `customer2.txt` from Service account `sa1` in Namespace `ns-a`

```bash
export APP="app1"
export NS="ns-a"
export SA="sa1"
export ACCOUNT_ID=$(aws sts get-caller-identity --output text --query Account)
export AWS_REGION="us-east-1"
export S3_BUCKET="ekspodidentity-$ACCOUNT_ID-$AWS_REGION"
export S3_OBJECT="customer1.txt"
kubectl -n $NS exec -it $APP -- bash
aws s3api get-object --bucket "${S3_BUCKET}" --key "${S3_OBJECT}" "${S3_OBJECT}"
```

::::expand{header="Check Output"}
```json
{
    "AcceptRanges": "bytes",
    "LastModified": "2023-12-13T11:44:49+00:00",
    "ContentLength": 72,
    "ETag": "\"052d1a31b3ae1ac27c4b0d1b23199d65\"",
    "ContentType": "binary/octet-stream",
    "ServerSideEncryption": "AES256",
    "Metadata": {},
    "TagCount": 2
}
```
::::

As expected Service account `sa1` in Namespace `ns-a` can access S3 Object `customer1.txt` since tags are matching.

Let us try accessing S3 Object `customer2.txt`

```bash
export S3_OBJECT="customer2.txt"
aws s3api get-object --bucket "${S3_BUCKET}" --key "${S3_OBJECT}" "${S3_OBJECT}"
```

::::expand{header="Check Output"}
```bash
An error occurred (AccessDenied) when calling the GetObject operation: Access Denied
```
::::

As expected, we see `AccessDenied` error.

Let us now try to access the S3 Objects `customer1.txt` and `customer2.txt` from Service account `sa2` in Namespace `ns-b`

```bash
export APP="app2"
export NS="ns-b"
export SA="sa2"
export ACCOUNT_ID=$(aws sts get-caller-identity --output text --query Account)
export AWS_REGION="us-east-1"
export S3_BUCKET="ekspodidentity-$ACCOUNT_ID-$AWS_REGION"
export S3_OBJECT="customer1.txt"
kubectl -n $NS exec -it $APP -- bash
aws s3api get-object --bucket "${S3_BUCKET}" --key "${S3_OBJECT}" "${S3_OBJECT}"
```

::::expand{header="Check Output"}
```bash
An error occurred (AccessDenied) when calling the GetObject operation: Access Denied
```
::::

As expected, we see `AccessDenied` error.


Let us try accessing S3 Object `customer2.txt`

```bash
export S3_OBJECT="customer2.txt"
aws s3api get-object --bucket "${S3_BUCKET}" --key "${S3_OBJECT}" "${S3_OBJECT}"
```

::::expand{header="Check Output"}
```json
{
    "AcceptRanges": "bytes",
    "LastModified": "2023-12-13T11:50:19+00:00",
    "ContentLength": 72,
    "ETag": "\"a3bffd3ac901fb7510179c440b22a1e9\"",
    "ContentType": "binary/octet-stream",
    "ServerSideEncryption": "AES256",
    "Metadata": {},
    "TagCount": 2
}
```
::::

As expected Service account `sa2` in Namespace `ns-b` can access S3 Object `customer2.txt` since tags are matching.


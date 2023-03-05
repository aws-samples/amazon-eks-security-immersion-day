---
title : "IAM Roles for Service Accounts(IRSA)"
weight : 34
---

### Why do we need IRSA in the first place?

Before getting into the details of what is IRSA and how does it work, let us first understand what is the problem statement.

A common challenge architects face when designing a Kubernetes solution on AWS is how to grant containerized workload permissions to access an AWS service or resource. AWS Identity and Access Management (IAM) provides fine-grained access control where you can specify who can access which AWS service or resources, ensuring the principle of least privilege. The challenge when your workload is running in Kubernetes, however, is providing an identity to that Kubernetes workload that IAM can use for authentication.

Let's take an example to illustrate this challenge. Let's deploy a simple pod which needs to list all the AWS S3 buckets.

```bash
cat > eks-iam-test1.yaml <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: eks-iam-test1
  labels:
     app: s3-test
spec:
  containers:
    - name: eks-iam-test1
      image: amazon/aws-cli:latest
      args: ['s3', 'ls']
  restartPolicy: Never
EOF

kubectl apply -f eks-iam-test1.yaml
kubectl get pod
kubectl logs  eks-iam-test1
```

::::expand{header="Check Output"}
```bash
An error occurred (AccessDenied) when calling the ListBuckets operation: Access Denied
``
::::

As you see in the above output, the pod is not able to access the AWS S3 service due to `AccessDenied` permission error.

The reason for this error is that the Kubernetes Pod is assuming an [IAM Role attached to the Amazon EC2 instance](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/iam-roles-for-amazon-ec2.html) and leveraging this role to try and list the S3 buckets. This is because no other AWS credentials were found in the container, so the SDK fell back to the IAM metadata server, as mentioned in the [python boto3 sdk documentation](https://boto3.amazonaws.com/v1/documentation/api/latest/guide/credentials.html#id1).

As the IAM role within the EC2 Instance Profile does not have necessary permissions to list the buckets, the command received an “Access Denied” error.  One way to fix this could be to attach additional permissions to the EC2 instance profile. However, this violates a key security principle, the principle of least privilege. This additional permission would be at the EC2 Node level, not at the Kubernetes Pod level. Therefore, all Pods running on that node would gain access to our S3 buckets. We want to restrict this permission to the Pod level.


This leads us on to the next question: how could we inject AWS credentials into a container so the container does not default to the EC2 instance profile? Injecting AWS credentials via Kubernetes Secrets or environment variables would not be secure, and the user would have to manage the lifecycle of these credentials. We would not recommend either of those approaches.


### Fine-Grained IAM Roles for Service Accounts

Applications in a Pod’s containers can use an AWS SDK or the AWS CLI to make API requests to AWS services using AWS Identity and Access Management (IAM) permissions. For example, applications may need to upload files to an S3 bucket or query a DynamoDB table. To do so applications must sign their AWS API requests with AWS credentials. [IAM Roles for Service Accounts (IRSA)](https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html) provide the ability to manage credentials for your applications, similar to the way that IAM Instance Profiles provide credentials to Amazon EC2 instances. Instead of creating and distributing your AWS credentials to the containers or relying on the Amazon EC2 Instance Profile for authorization, you associate an IAM Role with a Kubernetes Service Account and configure your Pods to use that Service Account.


You can associate an IAM role with a Kubernetes service account. This service account can then provide AWS permissions to the containers in any pod that uses that service account. With this feature, you no longer need to provide extended permissions to the Amazon EKS node IAM role so that pods on that node can call AWS APIs.

The IAM roles for service accounts feature provides the following benefits:

* **Least privilege** — By using the IAM roles for service accounts feature, you no longer need to provide extended permissions to the node IAM role so that pods on that node can call AWS APIs. You can scope IAM permissions to a service account, and only pods that use that service account have access to those permissions.
* **Credential isolation** — A container can only retrieve credentials for the IAM role that is associated with the service account to which it belongs. A container never has access to credentials that are intended for another container that belongs to another pod.
* **Auditability** – Access and event logging is available through AWS CloudTrail to help ensure retrospective auditing.


Below diagram from a blog [Introducing fine-grained IAM roles for service accounts](https://aws.amazon.com/blogs/opensource/introducing-fine-grained-iam-roles-service-accounts/) explains how applications running in EKS access Kubernetes resources using RBAC and AWS Services using IAM Permissions.


![iam-rbac-example](/static/images/iam/irsa/iam-rbac-example-1024x997.png)

IRSA implementation includes various components as shown below.

![irsa](/static/images/iam/irsa/irsa.png)


Enabling IRSA including the the following procedures:

1. IAM OIDC provider for EKS cluster.
2. Configure Kubernetes service account to assume IAM role
3. Configure pods to use Kubernetes service account

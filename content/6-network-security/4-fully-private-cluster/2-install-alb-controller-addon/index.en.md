---
title : "Installing the AWS Load Balancer Controller add-on"
weight : 152
---


The AWS Load Balancer Controller manages AWS Elastic Load Balancers for a Kubernetes cluster. The controller provisions the following resources:

Kubernetes Ingress

    The AWS Load Balancer Controller creates an AWS Application Load Balancer (ALB) when you create a Kubernetes Ingress.
Kubernetes service of the LoadBalancer type

    The AWS Load Balancer Controller creates an AWS Network Load Balancer (NLB) when you create a Kubernetes service of type LoadBalancer. In the past, the Kubernetes network load balancer was used for instance targets, but the AWS Load balancer Controller was used for IP targets. With the AWS Load Balancer Controller version 2.3.0 or later, you can create NLBs using either target type. For more information about NLB target types, see Target type in the User Guide for Network Load Balancers.

The AWS Load Balancer Controller was formerly named the AWS ALB Ingress Controller. It's an open-source project
managed on GitHub.

# Create an IAM policy

Create an IAM OIDC identity provider for your cluster with the following command


```bash
eksctl utils associate-iam-oidc-provider --region=$AWS_REGION --cluster=eksworkshop-eksctl-private --approve
```


Download an IAM policy for the AWS Load Balancer Controller that allows it to make calls to AWS APIs on your behalf from the Cloud9 instance.


```bash
curl -O https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.6.2/docs/install/iam_policy.json
```


Create an IAM policy using the policy downloaded in the previous step.


```bash
aws iam create-policy \
--policy-name AWSLoadBalancerControllerIAMPolicy \
--policy-document file://iam_policy.json
```


Create an IAM role. Create a Kubernetes service account named aws-load-balancer-controller in the kube-system namespace for the AWS Load Balancer Controller and annotate the Kubernetes service account with the name of the IAM role.


```bash
eksctl create iamserviceaccount \
--cluster=eksworkshop-eksctl-private \
--namespace=kube-system \
--name=aws-load-balancer-controller \
--role-name AmazonEKSLoadBalancerControllerRole \
--attach-policy-arn=arn:aws:iam::$ACCOUNT_ID:policy/AWSLoadBalancerControllerIAMPolicy \
--approve
```


# Install the AWS Load Balancer Controller using Helm V3 or later 

Add the eks-charts repository.


```bash
helm repo add eks https://aws.github.io/eks-charts
```


Update your local repo to make sure that you have the most recent charts.


```bash
helm repo update eks
```


Since your nodes don't have access to the Amazon ECR Public image repository, then you need to pull the following container image and push it to a repository that your nodes have access to.


```bash
aws ecr create-repository --region $AWS_REGION --repository-name aws-load-balancer-controller
```


Please notice the "repositoryUri" from the output. It would look like the following

<<ACCOUNT_ID>>.dkr.ecr.<<REGION_CODE>>.amazonaws.com/aws-load-balancer-controller

Pull image from Public registry


```bash
docker pull public.ecr.aws/eks/aws-load-balancer-controller:v2.6.2
```


::::expand{header="Check Output"}
```
v2.6.2: Pulling from eks/aws-load-balancer-controller
23d07b917726: Pull complete 
75b73619860e: Pull complete 
Digest: sha256:afc96bdad819bfac184a6e9a90096b68583cf5977e66fa985143bde37e847a50
Status: Downloaded newer image for public.ecr.aws/eks/aws-load-balancer-controller:v2.6.2
public.ecr.aws/eks/aws-load-balancer-controller:v2.6.2
```
::::

Get the image id for the pulled image


```bash
LBC_IMAGE_ID=$(docker image public.ecr.aws/eks/aws-load-balancer-controller:v2.6.2 -q)
```


::::expand{header="Check Output"}
```
355e20eeb0df
```
::::

Tag the image that you pulled with your registry, repository, and tag. Use the 355e20eeb0df image id from the previous command

```bash
docker tag $LBC_IMAGE_ID $ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/aws-load-balancer-controller:v2.6.2
```


Authenticate to your Private ECR registry.


```bash
aws ecr get-login-password —region $AWS_REGION | sudo docker login —username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com
```


Push the image to the Private ECR repository


```bash
docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/aws-load-balancer-controller:v2.6.2
```


Installed the ALB controller. When deploying it, we should use command line flags to set enable-shield, enable-waf, and enable-wafv2 to false.


```bash
helm upgrade aws-load-balancer-controller eks/aws-load-balancer-controller \
-n kube-system \
--set clusterName=eksworkshop-eksctl-private \
--set serviceAccount.create=false \
--set serviceAccount.name=aws-load-balancer-controller \
--set image.repository=$ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/aws-load-balancer-controller \
--set enableShield=false \
--set enableWaf=false \
--set enableWafv2=false
```


Verify If the controller is installed


```bash
kubectl get deployment -n kube-system aws-load-balancer-controller
```


An example output is as follows.

:::code{showCopyAction=true showLineNumbers=false}
NAME                           READY   UP-TO-DATE   AVAILABLE   AGE
aws-load-balancer-controller   2/2     2            2           84s
:::

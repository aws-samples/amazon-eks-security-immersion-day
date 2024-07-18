---
title: "Fully Private EKS Cluster"
weight: 150
---

# INTRODUCTION

This module would deploy an Amazon EKS cluster that is deployed on the AWS Cloud, but doesn't have outbound internet access. To understand the details on Amazon EKS networking, see De-mystifying cluster networking for Amazon EKS worker nodes in the following blog: http://aws.amazon.com/blogs/containers/de-mystifying-cluster-networking-for-amazon-eks-worker-nodes/. If your cluster doesn't have outbound internet access, then it must meet the following requirements:

1. Your cluster must pull images from a private container registry through VPC endpoint. You can create a Private Amazon Elastic Container Registry and ECR VPC endpoints in your VPC and copy container images to it for your nodes to pull from.
2. Your cluster must have endpoint private access enabled. This is required for nodes to register with the cluster endpoint.
3. Your cluster's aws-auth ConfigMap must be created from within your VPC.
4. Pods configured with IAM roles for service accounts acquire credentials from an AWS Security Token Service (AWS STS) API call. If there is no outbound internet access, you must create and use an AWS STS VPC endpoint in your VPC. Most AWS v1 SDKs use the global AWS STS endpoint by default (sts.amazonaws.com), which doesn't use the AWS STS VPC endpoint. To use the AWS STS VPC endpoint, you might need to configure your SDK to use the regional AWS STS endpoint (sts.region-code.amazonaws.com).
5. Your cluster's VPC subnets must have a VPC interface endpoint for any AWS services that your Pods need access to.
6. You can use the AWS Load Balancer Controller to deploy AWS Application Load Balancers (ALB) and Network Load Balancers to your private cluster. When deploying it, you should use command line flags to set enable-shield, enable-waf, and enable-wafv2 to false.

In this module, we would create a fully private EKS cluster and explore its private behaviour. The steps would be as follows.

1. Create the Private EKS cluster
2. Install the AWS Load Balancer Controller
3. Deploy 2048 Sample application in the cluster

# Accessing a private only API Server

If you have disabled public access for your cluster's Kubernetes API server endpoint, you can only access the API server from within your VPC or a connected network. Here are a few possible ways to access the Kubernetes API server endpoint:
1. Connected network
> Connect your network to the VPC with an AWS transit gateway or other connectivity option and then use a computer in the connected network.
2. Amazon EC2 bastion host
> You can launch an Amazon EC2 instance into a public subnet in your cluster's VPC and then log in via SSH into that instance to run kubectl commands. 
3. AWS Cloud9 IDE
> AWS Cloud9 is a cloud-based integrated development environment (IDE) that lets you write, run, and debug your code with just a browser. You can create an AWS Cloud9 IDE in your cluster's VPC and use the IDE to communicate with your cluster. Please refer the following blog for ruuning Cloud9 in a Private Subnet.
https://aws.amazon.com/blogs/security/isolating-network-access-to-your-aws-cloud9-environments/

We are going to use the third option with a mix of 2 Cloud9 instances to Create and Manage the cluster. The Final state of the lab would look this.

![EKS Setup](/static/images/fully-private-cluster/eks-fully-private-cluster.png)

When you create a new cluster, Amazon EKS creates an endpoint for the managed Kubernetes API server that you use to communicate with your cluster (using Kubernetes management tools such as kubectl). By default, this API server endpoint is public to the internet, and access to the API server is secured using a combination of AWS Identity and Access Management (IAM) and native Kubernetes Role Based Access Control (RBAC).
You can enable private access to the Kubernetes API server so that all communication between your nodes and the API server stays within your VPC. You can limit the IP addresses that can access your API server from the internet, or completely disable internet access to the API server.

Note: 
Because this endpoint is for the Kubernetes API server and not a traditional AWS PrivateLink endpoint for communicating with an AWS API, it doesn't appear as an endpoint in the Amazon VPC console.

When you enable endpoint private access for your cluster, Amazon EKS creates a Route 53 private hosted zone on your behalf and associates it with your cluster's VPC. This private hosted zone is managed by Amazon EKS, and it doesn't appear in your account's Route 53 resources. In order for the private hosted zone to properly route traffic to your API server, your VPC must have enableDnsHostnames and enableDnsSupport set to true, and the DHCP options set for your VPC must include AmazonProvidedDNS in its domain name servers list.
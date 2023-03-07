---
title : "Create EKS Cluster"
weight : 24
---


## Create EKS Cluster using Amazon EKS Blueprints for Terraform

We will follow below steps to create an EKS cluster using [EKS Terraform Blueprint](https://aws-ia.github.io/terraform-aws-eks-blueprints/v4.1.0/)


* Clone the [repo](https://aws-ia.github.io/terraform-aws-eks-blueprints/v4.1.0/getting-started/#clone-the-repo)
```bash
git clone https://github.com/aws-ia/terraform-aws-eks-blueprints.git
cd examples/eks-cluster-with-new-vpc/
```
* Now open the file **/terraform-aws-eks-blueprints/examples/eks-cluster-with-new-vpc/main.tf** from the cloned repo directory and do the following changes.
  *  Inside the module **locals {}**, change the region to your region and the cluster_name to **eksworkshop-eksctl**.
```bash
    locals {...
        cluster_name = "eksworkshop-eksctl"
        region       = "<YOUR_AWS_REGION>"
    }
```
  *  Inside the module **eks_blueprints**, pin the kubernetes version by setting the `cluster_version` variable. EKS cluster will be created with the version of kubernetes that's mentioned in `cluster_version` variable. Here, we're going to use kubernetes `1.24`.
```bash
module "eks_blueprints" {
  source = "../.."
  
  cluster_version = "1.24"
  ...
}  
```
  * Add the below section inside module **eks_blueprints**. This will ensure for the role to get access to see the EKS nodes in the AWS console.
```bash
      map_roles = [
        {
          rolearn  = "arn:aws:iam::<YOUR_ACCOUNT_ID>:role/<YOUR_CONSOLE_ROLE>"
          username = "admin"
          groups   = ["system:masters"]
        }
      ]
```
* Now execute the remaining steps starting from [Terraform Init](https://aws-ia.github.io/terraform-aws-eks-blueprints/v4.1.0/getting-started/#terraform-init) till [Validate Cluster](https://aws-ia.github.io/terraform-aws-eks-blueprints/v4.1.0/getting-started/#validation)
section.
* If you get any error try again the below command
```bash
terraform apply -auto-approve
```
The output will look like this.

```bash
Outputs:

configure_kubectl = "aws eks --region us-east-1 update-kubeconfig --name eksworkshop-eksctl"
eks_cluster_id = "eksworkshop-eksctl"
eks_managed_nodegroup_arns = tolist([
  "arn:aws:eks:us-east-1:XXXX:nodegroup/eksworkshop-eksctl/managed-ondemand-20220621175746156200000010/82c0c3b4-e537-d006-b352-4c43f4ca7641",
])
eks_managed_nodegroup_ids = tolist([
  "eksworkshop-eksctl:managed-ondemand-20220621175746156200000010",
])
eks_managed_nodegroup_role_name = tolist([
  "eksworkshop-eksctl-managed-ondemand",
])
eks_managed_nodegroup_status = tolist([
  "ACTIVE",
])
eks_managed_nodegroups = tolist([
  {
    "mg_5" = {
      "managed_nodegroup_arn" = [
        "arn:aws:eks:us-east-1:XXXX:nodegroup/eksworkshop-eksctl/managed-ondemand-20220621175746156200000010/82c0c3b4-e537-d006-b352-4c43f4ca7641",
      ]
      "managed_nodegroup_iam_instance_profile_arn" = [
        "arn:aws:iam::XXXX:instance-profile/eksworkshop-eksctl-managed-ondemand",
      ]
      "managed_nodegroup_iam_instance_profile_id" = [
        "eksworkshop-eksctl-managed-ondemand",
      ]
      "managed_nodegroup_iam_role_arn" = [
        "arn:aws:iam::XXXX:role/eksworkshop-eksctl-managed-ondemand",
      ]
      "managed_nodegroup_iam_role_name" = [
        "eksworkshop-eksctl-managed-ondemand",
      ]
      "managed_nodegroup_id" = [
        "eksworkshop-eksctl:managed-ondemand-20220621175746156200000010",
      ]
      "managed_nodegroup_launch_template_arn" = []
      "managed_nodegroup_launch_template_id" = []
      "managed_nodegroup_launch_template_latest_version" = []
      "managed_nodegroup_status" = [
        "ACTIVE",
      ]
    }
  },
])
region = "us-east-1"
vpc_cidr = "10.0.0.0/16"
vpc_private_subnet_cidr = [
  "10.0.10.0/24",
  "10.0.11.0/24",
  "10.0.12.0/24",
]
vpc_public_subnet_cidr = [
  "10.0.0.0/24",
  "10.0.1.0/24",
  "10.0.2.0/24",
]
```

## Confirm EKS Setup

You can test access to your cluster by running the following command. The output will be a list of worker nodes

```bash
kubectl get nodes
```
You should see below output

```bash
NAME                             STATUS   ROLES    AGE   VERSION
ip-192-168-11-48.ec2.internal    Ready    <none>   50m   v1.24.7-eks-49a6c0
ip-192-168-62-163.ec2.internal   Ready    <none>   50m   v1.24.7-eks-49a6c0
ip-192-168-88-42.ec2.internal    Ready    <none>   50m   v1.24.7-eks-49a6c0
```

---
title : "Deploying the AWS Gateway API Controller"
weight : 20
---

Follow these instructions deploy the AWS Gateway API Controller.


1. You can check your current Kubernetes version with following command.

```bash
export ACCOUNT_ID=$(aws sts get-caller-identity --output text --query Account)
export AWS_REGION=$(curl -s 169.254.169.254/latest/dynamic/instance-identity/document | jq -r '.region')
export CLUSTER_NAME=eksworkshop-eksctl
#export CLUSTER_NAME=eks-ref-cluster1
``` 

2. Clone the Repo.

```bash
cd ~/environment
git clone https://github.com/aws/aws-application-networking-k8s.git
cd aws-application-networking-k8s
```

3. Configure security group to receive traffic from the VPC Lattice fleet. You must set up security groups so that they allow all Pods communicating with VPC Lattice to allow traffic on all ports from the `169.254.171.0/24` address range.

```bash
PREFIX_LIST_ID=$(aws ec2 describe-managed-prefix-lists --query "PrefixLists[?PrefixListName=="\'com.amazonaws.$AWS_REGION.vpc-lattice\'"].PrefixListId" | jq -r '.[]')
echo "PREFIX_LIST_ID=$PREFIX_LIST_ID"
MANAGED_PREFIX=$(aws ec2 get-managed-prefix-list-entries --prefix-list-id $PREFIX_LIST_ID --output json  | jq -r '.Entries[0].Cidr')
echo "MANAGED_PREFIX=$MANAGED_PREFIX"
CLUSTER_SG=$(aws eks describe-cluster --name $CLUSTER_NAME --output json| jq -r '.cluster.resourcesVpcConfig.clusterSecurityGroupId')
echo "CLUSTER_SG=$CLUSTER_SG"
aws ec2 authorize-security-group-ingress --group-id $CLUSTER_SG --cidr $MANAGED_PREFIX --protocol -1
```


::::expand{header="Check Output"}
```json
PREFIX_LIST_ID=pl-07cbd8b5e26960eac
MANAGED_PREFIX=169.254.171.0/24
CLUSTER_SG=sg-040765a152dcc53f2
{
    "Return": true,
    "SecurityGroupRules": [
        {
            "SecurityGroupRuleId": "sgr-0198901caed795af1",
            "GroupId": "sg-040765a152dcc53f2",
            "GroupOwnerId": "ACCOUNT_ID",
            "IsEgress": false,
            "IpProtocol": "-1",
            "FromPort": -1,
            "ToPort": -1,
            "CidrIpv4": "169.254.171.0/24"
        }
    ]
}
```
::::

4. Create an IAM OIDC provider: See [Creating an IAM OIDC provider](https://docs.aws.amazon.com/eks/latest/userguide/enable-iam-roles-for-service-accounts.html) for your cluster for details. 

```bash
eksctl utils associate-iam-oidc-provider --cluster $CLUSTER_NAME --approve --region $AWS_REGION
```

::::expand{header="Check Output"}
```bash
2023-10-19 11:04:48 [ℹ]  IAM Open ID Connect provider is already associated with cluster "eksworkshop-eksctl" in "us-west-2"
```
::::

5. Create a policy (`recommended-inline-policy.json`) in IAM with the following content that can invoke the gateway API.

```bash
cat > recommended-inline-policy.json <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "vpc-lattice:*",
                "iam:CreateServiceLinkedRole",
                "ec2:DescribeVpcs",
                "ec2:DescribeSubnets",
                "ec2:DescribeTags"
            ],
            "Resource": "*"
        }
    ]
}
EOF
```
Create the IAM policy

```bash
export VPCLatticeControllerIAMPolicyArn=$(aws iam create-policy \
   --policy-name VPCLatticeControllerIAMPolicy \
   --policy-document file://recommended-inline-policy.json --output text --query Policy.Arn)
echo "VPCLatticeControllerIAMPolicyArn=$VPCLatticeControllerIAMPolicyArn"
```
::::expand{header="Check Output"}
```bash
VPCLatticeControllerIAMPolicyArn=arn:aws:iam::ACCOUNT_ID:policy/VPCLatticeControllerIAMPolicy
```
::::

6. Create the `aws-application-networking-system` Namespace.

```bash
kubectl apply -f examples/deploy-namesystem.yaml
```

::::expand{header="Check Output"}
```bash
namespace/aws-application-networking-system created
```
::::


7. Create an IRSA for Pod level permission: 

```bash
eksctl create iamserviceaccount \
   --cluster=$CLUSTER_NAME \
   --namespace=aws-application-networking-system \
   --name=gateway-api-controller \
   --attach-policy-arn=$VPCLatticeControllerIAMPolicyArn \
   --override-existing-serviceaccounts \
   --region $AWS_REGION \
   --approve
```

::::expand{header="Check Output"}
```bash
2023-10-19 11:12:51 [ℹ]  1 iamserviceaccount (aws-application-networking-system/gateway-api-controller) was included (based on the include/exclude rules)
2023-10-19 11:12:51 [!]  metadata of serviceaccounts that exist in Kubernetes will be updated, as --override-existing-serviceaccounts was set
2023-10-19 11:12:51 [ℹ]  1 task: { 
    2 sequential sub-tasks: { 
        create IAM role for serviceaccount "aws-application-networking-system/gateway-api-controller",
        create serviceaccount "aws-application-networking-system/gateway-api-controller",
    } }2023-10-19 11:12:51 [ℹ]  building iamserviceaccount stack "eksctl-eksworkshop-eksctl-addon-iamserviceaccount-aws-application-networking-system-gateway-api-controller"
2023-10-19 11:12:52 [ℹ]  deploying stack "eksctl-eksworkshop-eksctl-addon-iamserviceaccount-aws-application-networking-system-gateway-api-controller"
2023-10-19 11:12:52 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-addon-iamserviceaccount-aws-application-networking-system-gateway-api-controller"
2023-10-19 11:13:22 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-addon-iamserviceaccount-aws-application-networking-system-gateway-api-controller"
2023-10-19 11:13:22 [ℹ]  created serviceaccount "aws-application-networking-system/gateway-api-controller"
```
::::

8. Run kubectl command to deploy the controller.

```bash
kubectl apply -f examples/deploy-v0.0.17.yaml
```

::::expand{header="Check Output"}
```bash
namespace/aws-application-networking-system unchanged
customresourcedefinition.apiextensions.k8s.io/dnsendpoints.externaldns.k8s.io created
customresourcedefinition.apiextensions.k8s.io/gatewayclasses.gateway.networking.k8s.io created
customresourcedefinition.apiextensions.k8s.io/gateways.gateway.networking.k8s.io created
customresourcedefinition.apiextensions.k8s.io/grpcroutes.gateway.networking.k8s.io created
customresourcedefinition.apiextensions.k8s.io/httproutes.gateway.networking.k8s.io created
customresourcedefinition.apiextensions.k8s.io/serviceexports.multicluster.x-k8s.io created
customresourcedefinition.apiextensions.k8s.io/serviceimports.multicluster.x-k8s.io created
customresourcedefinition.apiextensions.k8s.io/targetgrouppolicies.application-networking.k8s.aws created
customresourcedefinition.apiextensions.k8s.io/vpcassociationpolicies.application-networking.k8s.aws created
Warning: resource serviceaccounts/gateway-api-controller is missing the kubectl.kubernetes.io/last-applied-configuration annotation which is required by kubectl apply. kubectl apply should only be used on resources created declaratively by either kubectl create --save-config or kubectl apply. The missing annotation will be patched automatically.
serviceaccount/gateway-api-controller configured
clusterrole.rbac.authorization.k8s.io/aws-application-networking-controller created
clusterrole.rbac.authorization.k8s.io/metrics-reader created
clusterrole.rbac.authorization.k8s.io/proxy-role created
clusterrolebinding.rbac.authorization.k8s.io/aws-application-networking-controller created
clusterrolebinding.rbac.authorization.k8s.io/proxy-rolebinding created
configmap/manager-config created
service/gateway-api-controller-metrics-service created
deployment.apps/gateway-api-controller created
```
::::

9. Ensure the WS Gateway API Controller Pod is running fine.

```bash
kubectl get all -n aws-application-networking-system
```

::::expand{header="Check Output"}
```bash
NAME                                         READY   STATUS    RESTARTS   AGE
pod/gateway-api-controller-965646b47-z66m5   2/2     Running   0          112s

NAME                                             TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)    AGE
service/gateway-api-controller-metrics-service   ClusterIP   10.100.34.93   <none>        8443/TCP   112s

NAME                                     READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/gateway-api-controller   1/1     1            1           112s

NAME                                               DESIRED   CURRENT   READY   AGE
replicaset.apps/gateway-api-controller-965646b47   1         1         1       112s
```
::::


10. Create the `GatewayClass` Object with name `amazon-vpc-lattice`.

Let us see how the configuration looks like.

```bash
cat examples/gatewayclass.yaml
```

The output will look like below

```yaml
# Create a new Gateway Class for AWS VPC lattice provider
apiVersion: gateway.networking.k8s.io/v1beta1
kind: GatewayClass
metadata:
  name: amazon-vpc-lattice
spec:
  controllerName: application-networking.k8s.aws/gateway-api-controller
```

The above configuration creates Kubernetes `GatewayClass` object **amazon-vpc-lattice** to identify Amazon VPC Lattice as the Infrastructure provider.

Apply the configuration.

```bash
kubectl apply -f examples/gatewayclass.yaml
```

::::expand{header="Check Output"}
```bash
gatewayclass.gateway.networking.k8s.io/amazon-vpc-lattice created
```
::::


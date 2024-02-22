---
title : "Deploy AWS Gateway API Controller and Gateway Resource"
weight : 10
---


## Deploy AWS Gateway API Controller in First EKS Cluster `eksworkshop-eksctl`

### 1. Follow these instructions deploy the AWS Gateway API Controller.

```bash
# export Gateway name and namespace
echo "export GATEWAY_NAME=app-services-gw" >> ~/.bash_profile
echo "export GATEWAY_NAMESPACE=app-services-gw" >> ~/.bash_profile
source ~/.bash_profile

eksdemo install vpc-lattice-controller -c $EKS_CLUSTER1_NAME --set "defaultServiceNetwork=$GATEWAY_NAME" --dry-run
```

<!--
1. Clone the AWS Gateway API Controller Github Repository.

```bash
cd ~/environment
git clone https://github.com/aws/aws-application-networking-k8s.git
cd aws-application-networking-k8s
```

2. Configure security group to receive traffic from the VPC Lattice fleet. You must set up security groups so that they allow all Pods communicating with VPC Lattice to allow traffic on all ports from the `169.254.171.0/24` address range.

```bash
PREFIX_LIST_ID=$(aws ec2 describe-managed-prefix-lists --query "PrefixLists[?PrefixListName=="\'com.amazonaws.$AWS_REGION.vpc-lattice\'"].PrefixListId" | jq -r '.[]')
echo "PREFIX_LIST_ID=$PREFIX_LIST_ID"
MANAGED_PREFIX=$(aws ec2 get-managed-prefix-list-entries --prefix-list-id $PREFIX_LIST_ID --output json  | jq -r '.Entries[0].Cidr')
echo "MANAGED_PREFIX=$MANAGED_PREFIX"
CLUSTER_SG=$(aws eks describe-cluster --name $EKS_CLUSTER1_NAME --output json| jq -r '.cluster.resourcesVpcConfig.clusterSecurityGroupId')
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

3. Create an IAM OIDC provider: See [Creating an IAM OIDC provider](https://docs.aws.amazon.com/eks/latest/userguide/enable-iam-roles-for-service-accounts.html) for your cluster for details. 

```bash
eksctl utils associate-iam-oidc-provider --cluster $EKS_CLUSTER1_NAME --approve --region $AWS_REGION
```

::::expand{header="Check Output"}
```
2023-10-19 11:04:48 [ℹ]  IAM Open ID Connect provider is already associated with cluster "eksworkshop-eksctl" in "us-west-2"
```
::::

4. Create a policy (`recommended-inline-policy.json`) in IAM with the following content that can invoke the gateway API.

```bash
cat > recommended-inline-policy.json <<EOF
{
 "Version": "2012-10-17",
 "Statement": [
     {
         "Effect": "Allow",
         "Action": [
             "vpc-lattice:*",
             "ec2:DescribeVpcs",
             "ec2:DescribeSubnets",
             "ec2:DescribeTags",
             "ec2:DescribeSecurityGroups",
             "logs:CreateLogDelivery",
             "logs:GetLogDelivery",
             "logs:DescribeLogGroups",
             "logs:PutResourcePolicy",
             "logs:DescribeResourcePolicies",
             "logs:UpdateLogDelivery",
             "logs:DeleteLogDelivery",
             "logs:ListLogDeliveries",
             "tag:GetResources",
             "firehose:TagDeliveryStream",
             "s3:GetBucketPolicy",
             "s3:PutBucketPolicy"
         ],
         "Resource": "*"
     },
     {
         "Effect" : "Allow",
         "Action" : "iam:CreateServiceLinkedRole",
         "Resource" : "arn:aws:iam::*:role/aws-service-role/vpc-lattice.amazonaws.com/AWSServiceRoleForVpcLattice",
         "Condition" : {
             "StringLike" : {
                 "iam:AWSServiceName" : "vpc-lattice.amazonaws.com"
             }
         }
     },
     {
         "Effect" : "Allow",
         "Action" : "iam:CreateServiceLinkedRole",
         "Resource" : "arn:aws:iam::*:role/aws-service-role/delivery.logs.amazonaws.com/AWSServiceRoleForLogDelivery",
         "Condition" : {
             "StringLike" : {
                 "iam:AWSServiceName" : "delivery.logs.amazonaws.com"
             }
         }
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
echo "export VPCLatticeControllerIAMPolicyArn=$VPCLatticeControllerIAMPolicyArn" >> ~/.bash_profile

```
::::expand{header="Check Output"}
```
VPCLatticeControllerIAMPolicyArn=arn:aws:iam::ACCOUNT_ID:policy/VPCLatticeControllerIAMPolicy
```
::::

5. Create the `aws-application-networking-system` Namespace.

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT apply -f examples/deploy-namesystem.yaml
```

::::expand{header="Check Output"}
```
namespace/aws-application-networking-system created
```
::::


6. Create an IRSA for Pod level permission: 

```bash
eksctl create iamserviceaccount \
   --cluster=$EKS_CLUSTER1_NAME \
   --namespace=aws-application-networking-system \
   --name=gateway-api-controller \
   --attach-policy-arn=$VPCLatticeControllerIAMPolicyArn \
   --override-existing-serviceaccounts \
   --region $AWS_REGION \
   --approve
```

::::expand{header="Check Output"}
```
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

7. Run helm command to deploy the controller.

```bash
# export Gateway name and namespace
echo "export GATEWAY_NAME=app-services-gw" >> ~/.bash_profile
echo "export GATEWAY_NAMESPACE=app-services-gw" >> ~/.bash_profile
source ~/.bash_profile

# login to ECR
aws ecr-public get-login-password --region us-east-1 | helm registry login --username AWS --password-stdin public.ecr.aws

# Run helm with either install or upgrade
export HELM_EXPERIMENTAL_OCI=1
helm --kube-context $EKS_CLUSTER1_CONTEXT install gateway-api-controller \
   oci://public.ecr.aws/aws-application-networking-k8s/aws-gateway-controller-chart \
   --version=v1.0.3 \
   --set=serviceAccount.create=false --namespace aws-application-networking-system \
   --set=log.level=info \
   --set=defaultServiceNetwork=$GATEWAY_NAME
```
-->
::::alert{type="info" header="Note"}
By setting `defaultServiceNetwork`, the Gateway API controller will create a serviceNetwork (Lattice Service Network) with the name provided, and associat it with the EKS cluster's VPC. 
Alternatively, you can use AWS CLI to manually create a VPC Lattice service network
```bash
aws vpc-lattice create-service-network --name <my-service-network-name> # grab service network ID
aws vpc-lattice create-service-network-vpc-association --service-network-identifier <service-network-id> --vpc-identifier <k8s-cluster-vpc-id>
```
::::

::::expand{header="Check Output"}
```
NAME: gateway-api-controller
LAST DEPLOYED: Wed Feb  7 15:44:03 2024
NAMESPACE: aws-application-networking-system
STATUS: deployed
REVISION: 1
TEST SUITE: None
NOTES:
aws-gateway-controller-chart has been installed.
This chart deploys "public.ecr.aws/aws-application-networking-k8s/aws-gateway-controller:".

Check its status by running:
  kubectl --namespace aws-application-networking-system get pods -l "app.kubernetes.io/instance=gateway-api-controller"

The controller is running in "cluster" mode.
```
::::

### 2. Ensure the WS Gateway API Controller Pod is running fine.

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT get all -n vpc-lattice
```

::::expand{header="Check Output"}
```
NAME                                          READY   STATUS    RESTARTS   AGE
pod/gateway-api-controller-8549f879fd-7w2qx   1/1     Running   0          40m

NAME                                     READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/gateway-api-controller   1/1     1            1           40m

NAME                                                DESIRED   CURRENT   READY   AGE
replicaset.apps/gateway-api-controller-8549f879fd   1         1         1       40m

```
::::

You can check the logs of the Gateway API controller deployment using the Kubectl krew plugin stern:

```bash
kubectl stern --context $EKS_CLUSTER1_CONTEXT -n vpc-lattice gateway-api-controller
```

::::expand{header="Check Output"}
```
gateway-api-controller-8549f879fd-7w2qx manager {"level":"info","ts":"2024-02-19T19:14:43.407Z","logger":"runtime","caller":"controller/controller.go:220","msg":"Starting workers","controller":"accesslogpolicy","controllerGroup":"application-networking.k8s.aws","controllerKind":"AccessLogPolicy","worker count":1}
gateway-api-controller-8549f879fd-7w2qx manager {"level":"info","ts":"2024-02-19T19:14:43.407Z","logger":"runtime","caller":"controller/controller.go:220","msg":"Starting workers","controller":"grpcroute","controllerGroup":"gateway.networking.k8s.io","controllerKind":"GRPCRoute","worker count":1}
gateway-api-controller-8549f879fd-7w2qx manager {"level":"info","ts":"2024-02-19T19:14:43.407Z","logger":"runtime","caller":"controller/controller.go:220","msg":"Starting workers","controller":"iamauthpolicy","controllerGroup":"application-networking.k8s.aws","controllerKind":"IAMAuthPolicy","worker count":1}
```
::::

### 3. Check VPC service has been created and associated with our EKS cluster VPC

Since we have specified a `defaultServiceNetwork` in our api gateway controller, It should have created a VPC lattice service-network, and associated it with our VPC.

Check the status of the VPC lattice service network:

```bash
aws vpc-lattice list-service-network-vpc-associations --vpc-id $EKS_CLUSTER1_VPC_ID
```

::::expand{header="Check Output"}
```json
{
    "items": [
        {
            "arn": "arn:aws:vpc-lattice:us-west-2:012345678901:servicenetworkvpcassociation/snva-09c42cc777001062c",
            "createdAt": "2024-02-07T15:44:07.445000+00:00",
            "createdBy": "012345678901",
            "id": "snva-09c42cc777001062c",
            "lastUpdatedAt": "2024-02-07T15:44:21.434000+00:00",
            "serviceNetworkArn": "arn:aws:vpc-lattice:us-west-2:012345678901:servicenetwork/sn-0c8e9eeb6d6b0dc9c",
            "serviceNetworkId": "sn-0c8e9eeb6d6b0dc9c",
            "serviceNetworkName": "app-services-gw",
            "status": "ACTIVE",
            "vpcId": "vpc-06bd0081d216484d2"
        }
    ]
}
```

> wait for status to be ACTIVE
::::

View the VPC Lattice Service network `app-services-gw` in the [Amazon VPC Console](https://console.aws.amazon.com/vpc/home?ServiceNetwork=&#ServiceNetworks:)

![](/static/images/6-network-security/2-vpc-lattice-service-access/vpc-service-network.png)

<!--
## Deploy `GatewayClass` Resource in First EKS Cluster `eksworkshop-eksctl`

1. Create the `GatewayClass` Object with name `amazon-vpc-lattice`.

Let us see how the configuration looks like.

```bash
cd ~/environment
cat > manifests/gatewayclass.yaml <<EOF
# Create a new Gateway Class for AWS VPC lattice provider
apiVersion: gateway.networking.k8s.io/v1beta1
kind: GatewayClass
metadata:
  name: amazon-vpc-lattice
spec:
  controllerName: application-networking.k8s.aws/gateway-api-controller
EOF
kubectl  --context $EKS_CLUSTER1_CONTEXT apply -f manifests/gatewayclass.yaml
```

The above configuration creates Kubernetes `GatewayClass` object **amazon-vpc-lattice** to identify Amazon VPC Lattice as the Infrastructure provider, and apply the configuration.


::::expand{header="Check Output"}
```
gatewayclass.gateway.networking.k8s.io/amazon-vpc-lattice created
```
::::
-->
## Deploy `Gateway` Resource in First EKS Cluster `eksworkshop-eksctl`

### 1. Create the Kubernetes `Gateway` object **app-services-gw** ($GATEWAY_NAME)

Let us see how the configuration looks like.

```bash
envsubst < templates/gateway-template.yaml > manifests/$GATEWAY_NAME.yaml
c9 manifests/$GATEWAY_NAME.yaml
```

Ensure that all the fields in the `manifests/app-services-gw.yaml` are populated properly.

::::expand{header="Check Output"}
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: app-services-gw
---
apiVersion: gateway.networking.k8s.io/v1beta1
kind: Gateway
metadata:
  name: app-services-gw
  namespace: app-services-gw
spec:
  gatewayClassName: amazon-vpc-lattice
  listeners:
  - name: http-listener
    port: 80
    protocol: HTTP
    allowedRoutes:
      kinds:
      - kind: HTTPRoute
      namespaces:
        #from: Same
        #from: All
        from: Selector
        selector:
          matchLabels:
            allow-attachment-to-infra-gw: "true"
  - name: https-listener-with-default-domain
    port: 443
    protocol: HTTPS
    allowedRoutes:
      kinds:
      - kind: HTTPRoute
      namespaces:
        #from: Same
        #from: All
        from: Selector
        selector:
          matchLabels:
            allow-attachment-to-infra-gw: "true"
  - name: https-listener-with-custom-domain
    port: 443
    protocol: HTTPS
    allowedRoutes:
      kinds:
      - kind: HTTPRoute
      namespaces:
        #from: Same
        #from: All
        from: Selector
        selector:
          matchLabels:
            allow-attachment-to-infra-gw: "true"    
    tls:
      mode: Terminate
      options:
        application-networking.k8s.aws/certificate-arn: arn:aws:acm:us-west-2:ACCOUNT_ID:certificate/d5ebbf85-9b6a-4501-9bfb-65d638b9c0f2
```
::::


The above configuration creates Kubernetes `Gateway` object `app-services-gw` which creates a **Service Network** in Amazon VPC Lattice.

Apply the configuration.

```bash
kubectl  --context $EKS_CLUSTER1_CONTEXT apply -f manifests/$GATEWAY_NAME.yaml
```

::::expand{header="Check Output"}
```
namespace/app-services-gw created
gateway.gateway.networking.k8s.io/app-services-gw created
```
::::

### 2. Verify that `app-services-gw` Gateway is created (this could take about five minutes): 

```bash
kubectl  --context $EKS_CLUSTER1_CONTEXT get gateway -n $GATEWAY_NAMESPACE
```

::::expand{header="Check Output"}
```
NAME              CLASS                ADDRESS   PROGRAMMED   AGE
app-services-gw   amazon-vpc-lattice             True         76s
```
::::

### 3. Once the Gateway is created, find the VPC Lattice Service Network.

```bash
kubectl  --context $EKS_CLUSTER1_CONTEXT get gateway $GATEWAY_NAME -n $GATEWAY_NAMESPACE -oyaml
```

::::expand{header="Check Output"}
```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: Gateway
metadata:
  annotations:
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"gateway.networking.k8s.io/v1beta1","kind":"Gateway","metadata":{"annotations":{},"name":"app-services-gw","namespace":"app-services-gw"},"spec":{"gatewayClassName":"amazon-vpc-lattice","listeners":[{"allowedRoutes":{"kinds":[{"kind":"HTTPRoute"}],"namespaces":{"from":"Selector","selector":{"matchLabels":{"allow-attachment-to-infra-gw":"true"}}}},"name":"http-listener","port":80,"protocol":"HTTP"},{"allowedRoutes":{"kinds":[{"kind":"HTTPRoute"}],"namespaces":{"from":"Selector","selector":{"matchLabels":{"allow-attachment-to-infra-gw":"true"}}}},"name":"https-listener-with-default-domain","port":443,"protocol":"HTTPS"},{"allowedRoutes":{"kinds":[{"kind":"HTTPRoute"}],"namespaces":{"from":"Selector","selector":{"matchLabels":{"allow-attachment-to-infra-gw":"true"}}}},"name":"https-listener-with-custom-domain","port":443,"protocol":"HTTPS","tls":{"mode":"Terminate","options":{"application-networking.k8s.aws/certificate-arn":"arn:aws:acm:us-west-2:097381749469:certificate/1d3ec714-787f-4a2a-9c46-47927201763c"}}}]}}
  creationTimestamp: "2024-02-07T16:06:37Z"
  finalizers:
  - gateway.k8s.aws/resources
  generation: 1
  name: app-services-gw
  namespace: app-services-gw
  resourceVersion: "253377"
  uid: 45357584-dcaf-40f1-8901-912dfae493e1
spec:
  gatewayClassName: amazon-vpc-lattice
  listeners:
  - allowedRoutes:
      kinds:
      - group: gateway.networking.k8s.io
        kind: HTTPRoute
      namespaces:
        from: Selector
        selector:
          matchLabels:
            allow-attachment-to-infra-gw: "true"
    name: http-listener
    port: 80
    protocol: HTTP
  - allowedRoutes:
      kinds:
      - group: gateway.networking.k8s.io
        kind: HTTPRoute
      namespaces:
        from: Selector
        selector:
          matchLabels:
            allow-attachment-to-infra-gw: "true"
    name: https-listener-with-default-domain
    port: 443
    protocol: HTTPS
  - allowedRoutes:
      kinds:
      - group: gateway.networking.k8s.io
        kind: HTTPRoute
      namespaces:
        from: Selector
        selector:
          matchLabels:
            allow-attachment-to-infra-gw: "true"
    name: https-listener-with-custom-domain
    port: 443
    protocol: HTTPS
    tls:
      mode: Terminate
      options:
        application-networking.k8s.aws/certificate-arn: arn:aws:acm:us-west-2:097381749469:certificate/1d3ec714-787f-4a2a-9c46-47927201763c
status:
  conditions:
  - lastTransitionTime: "2024-02-07T16:06:37Z"
    message: application-networking.k8s.aws/gateway-api-controller
    observedGeneration: 1
    reason: Accepted
    status: "True"
    type: Accepted
  - lastTransitionTime: "2024-02-07T16:06:38Z"
    message: 'aws-service-network-arn: arn:aws:vpc-lattice:us-west-2:097381749469:servicenetwork/sn-0c8e9eeb6d6b0dc9c'
    observedGeneration: 1
    reason: Programmed
    status: "True"
    type: Programmed
  listeners:
  - attachedRoutes: 0
    conditions:
    - lastTransitionTime: "2024-02-07T16:06:37Z"
      message: ""
      observedGeneration: 1
      reason: Accepted
      status: "True"
      type: Accepted
    name: http-listener
    supportedKinds:
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
  - attachedRoutes: 0
    conditions:
    - lastTransitionTime: "2024-02-07T16:06:37Z"
      message: ""
      observedGeneration: 1
      reason: Accepted
      status: "True"
      type: Accepted
    name: https-listener-with-default-domain
    supportedKinds:
    - group: gateway.networking.k8s.io
      kind: GRPCRoute
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
  - attachedRoutes: 0
    conditions:
    - lastTransitionTime: "2024-02-07T16:06:37Z"
      message: ""
      observedGeneration: 1
      reason: Accepted
      status: "True"
      type: Accepted
    name: https-listener-with-custom-domain
    supportedKinds:
    - group: gateway.networking.k8s.io
      kind: GRPCRoute
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
```
::::


The `status` conditions contains the ARN of the Amazon VPC Lattice Service Network.

`message: 'aws-gateway-arn: arn:aws:vpc-lattice:us-west-2:ACCOUNT_ID:servicenetwork/sn-0cc73287505ac121a'`

Let us retrieve the Gateway ARN and store it in an environment variable for later use.

```bash
gatewayARN=$(aws vpc-lattice list-service-network-vpc-associations --vpc-id $EKS_CLUSTER1_VPC_ID | jq ".items[0].serviceNetworkArn" -r)
gatewayID=$(aws vpc-lattice list-service-network-vpc-associations --vpc-id $EKS_CLUSTER1_VPC_ID | jq ".items[0].serviceNetworkId" -r)
echo "export gatewayARN=$gatewayARN" | tee -a ~/.bash_profile
echo "export gatewayID=$gatewayID" | tee -a ~/.bash_profile
```

::::expand{header="Check Output"}
```
export gatewayARN=arn:aws:vpc-lattice:us-west-2:734345834211:servicenetwork/sn-03cc2d23efd95fd14
export gatewayID=sn-03cc2d23efd95fd14
```
::::

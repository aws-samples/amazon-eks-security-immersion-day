---
title : "Deploy AWS Gateway API Controller and Gateway Resource"
weight : 10
---


## Deploy AWS Gateway API Controller in First EKS Cluster `eksworkshop-eksctl`

Follow these instructions deploy the AWS Gateway API Controller.

1. You can check your current Kubernetes version with following command.

```bash
export ACCOUNT_ID=$(aws sts get-caller-identity --output text --query Account)
export AWS_REGION=$(curl -s 169.254.169.254/latest/dynamic/instance-identity/document | jq -r '.region')
export EKS_CLUSTER1_NAME=eksworkshop-eksctl
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

4. Create an IAM OIDC provider: See [Creating an IAM OIDC provider](https://docs.aws.amazon.com/eks/latest/userguide/enable-iam-roles-for-service-accounts.html) for your cluster for details. 

```bash
eksctl utils associate-iam-oidc-provider --cluster $EKS_CLUSTER1_NAME --approve --region $AWS_REGION
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
echo "export VPCLatticeControllerIAMPolicyArn=$VPCLatticeControllerIAMPolicyArn" >> ~/.bash_profile

```
::::expand{header="Check Output"}
```bash
VPCLatticeControllerIAMPolicyArn=arn:aws:iam::ACCOUNT_ID:policy/VPCLatticeControllerIAMPolicy
```
::::

6. Create the `aws-application-networking-system` Namespace.

```bash
kubectl --context $EKS_CLUSTER1_CONTEXT apply -f examples/deploy-namesystem.yaml
```

::::expand{header="Check Output"}
```bash
namespace/aws-application-networking-system created
```
::::


7. Create an IRSA for Pod level permission: 

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
kubectl --context $EKS_CLUSTER1_CONTEXT apply -f examples/deploy-v0.0.17.yaml
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
serviceaccount/gateway-api-controller created
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
kubectl --context $EKS_CLUSTER1_CONTEXT get all -n aws-application-networking-system
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
```

The above configuration creates Kubernetes `GatewayClass` object **amazon-vpc-lattice** to identify Amazon VPC Lattice as the Infrastructure provider.

Apply the configuration.

```bash
kubectl  --context $EKS_CLUSTER1_CONTEXT apply -f manifests/gatewayclass.yaml
```

::::expand{header="Check Output"}
```bash
gatewayclass.gateway.networking.k8s.io/amazon-vpc-lattice created
```
::::

## Deploy `Gateway` Resource in First EKS Cluster `eksworkshop-eksctl`

1. Create the Kubernetes `Gateway` object **app-services-gw**

Let us see how the configuration looks like.

```bash
source ~/.bash_profile
export GATEWAY_NAME=app-services-gw
export GATEWAY_NAMESPACE=app-services-gw
envsubst < templates/gateway-template.yaml > manifests/$GATEWAY_NAME.yaml
cat manifests/$GATEWAY_NAME.yaml
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
  annotations:
    application-networking.k8s.aws/lattice-vpc-association: "true"
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

::alert[By default, the Gateway (Lattice Service Network) is not associated with cluster's VPC. To associate a Gateway (Lattice Service Network) to VPC, `manifests/app-services-gw.yaml` includes the annotation `application-networking.k8s.aws/lattice-vpc-association: "true"`. ]{header="Note"}

Apply the configuration.

```bash
kubectl  --context $EKS_CLUSTER1_CONTEXT apply -f manifests/$GATEWAY_NAME.yaml
```

::::expand{header="Check Output"}
```bash
gateway.gateway.networking.k8s.io/app-services-gw created
```
::::

2. Verify that `app-services-gw` Gateway is created (this could take about five minutes): 

```bash
kubectl  --context $EKS_CLUSTER1_CONTEXT get gateway -n $GATEWAY_NAMESPACE
```

::::expand{header="Check Output"}
```bash
NAME              CLASS                ADDRESS   PROGRAMMED   AGE
app-services-gw   amazon-vpc-lattice             True         76s
```
::::

3. Once the Gateway is created, find the VPC Lattice Service Network.

```bash
kubectl  --context $EKS_CLUSTER1_CONTEXT get gateway $GATEWAY_NAME -n $GATEWAY_NAMESPACE -oyaml
```

::::expand{header="Check Output"}
```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: Gateway
metadata:
  annotations:
    application-networking.k8s.aws/lattice-vpc-association: "true"
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"gateway.networking.k8s.io/v1beta1","kind":"Gateway","metadata":{"annotations":{"application-networking.k8s.aws/lattice-vpc-association":"true"},"name":"app-services-gw","namespace":"app-services-gw"},"spec":{"gatewayClassName":"amazon-vpc-lattice","listeners":[{"allowedRoutes":{"kinds":[{"kind":"HTTPRoute"}],"namespaces":{"from":"Selector","selector":{"matchLabels":{"allow-attachment-to-infra-gw":"true"}}}},"name":"http-listener","port":80,"protocol":"HTTP"},{"allowedRoutes":{"kinds":[{"kind":"HTTPRoute"}],"namespaces":{"from":"Selector","selector":{"matchLabels":{"allow-attachment-to-infra-gw":"true"}}}},"name":"https-listener-with-default-domain","port":443,"protocol":"HTTPS"},{"allowedRoutes":{"kinds":[{"kind":"HTTPRoute"}],"namespaces":{"from":"Selector","selector":{"matchLabels":{"allow-attachment-to-infra-gw":"true"}}}},"name":"https-listener-with-custom-domain","port":443,"protocol":"HTTPS","tls":{"mode":"Terminate","options":{"application-networking.k8s.aws/certificate-arn":"arn:aws:acm:us-west-2:ACCOUNT_ID:certificate/d5ebbf85-9b6a-4501-9bfb-65d638b9c0f2"}}}]}}
  creationTimestamp: "2023-10-25T10:30:52Z"
  finalizers:
  - gateway.k8s.aws/resources
  generation: 1
  name: app-services-gw
  namespace: app-services-gw
  resourceVersion: "60343"
  uid: 14e0fef5-3625-4752-9969-c32f02bb902f
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
        application-networking.k8s.aws/certificate-arn: arn:aws:acm:us-west-2:ACCOUNT_ID:certificate/d5ebbf85-9b6a-4501-9bfb-65d638b9c0f2
status:
  conditions:
  - lastTransitionTime: "2023-10-25T10:30:52Z"
    message: application-networking.k8s.aws/gateway-api-controller
    observedGeneration: 1
    reason: Accepted
    status: "True"
    type: Accepted
  - lastTransitionTime: "2023-10-25T10:31:14Z"
    message: 'aws-gateway-arn: arn:aws:vpc-lattice:us-west-2:ACCOUNT_ID:servicenetwork/sn-0cc73287505ac121a'
    observedGeneration: 1
    reason: Programmed
    status: "True"
    type: Programmed
  listeners:
  - attachedRoutes: 0
    conditions:
    - lastTransitionTime: "2023-10-25T10:30:52Z"
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
    - lastTransitionTime: "2023-10-25T10:30:52Z"
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
    - lastTransitionTime: "2023-10-25T10:30:52Z"
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


View the VPC Lattice Service network `app-services-gw` in the [Amazon VPC Console](https://us-west-2.console.aws.amazon.com/vpc/home?ServiceNetwork=&region=us-west-2#ServiceNetworks:)

![app-services-gw.png](/static/images/6-network-security/2-vpc-lattice-service-access/app-services-gw.png)

Let us the Gateway ARN and store it in an environment variable for later use.

```bash
gatewayARNMessage=$(kubectl  --context $EKS_CLUSTER1_CONTEXT get gateway $GATEWAY_NAME -n $GATEWAY_NAMESPACE -o json | jq -r '.status.conditions[1].message')
echo "gatewayARNMessage=$gatewayARNMessage"
prefix="aws-gateway-arn: "
gatewayARN=${gatewayARNMessage#$prefix}
echo "gatewayARN=$gatewayARN"
echo "export gatewayARN=$gatewayARN" >> ~/.bash_profile
```

::::expand{header="Check Output"}
```bash
gatewayARNMessage=aws-gateway-arn: arn:aws:vpc-lattice:us-west-2:ACCOUNT_ID:servicenetwork/sn-0cc73287505ac121a
gatewayARN=arn:aws:vpc-lattice:us-west-2:ACCOUNT_ID:servicenetwork/sn-0cc73287505ac121a
```
::::
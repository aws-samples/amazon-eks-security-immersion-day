---
title : "Deploy AWS Gateway API Controller and Gateway Resource"
weight : 10
---


## Deploy AWS Gateway API Controller in Second EKS Cluster `eksworkshop-eksctl-2`

Follow these instructions deploy the AWS Gateway API Controller.

1. You can check your current Kubernetes version with following command.

```bash
export ACCOUNT_ID=$(aws sts get-caller-identity --output text --query Account)
export AWS_REGION=$(curl -s 169.254.169.254/latest/dynamic/instance-identity/document | jq -r '.region')
export EKS_CLUSTER2_NAME=eksworkshop-eksctl-2
``` 

2. Clone the Repo.

```bash
cd ~/environment/aws-application-networking-k8s
```

3. Configure security group to receive traffic from the VPC Lattice fleet. You must set up security groups so that they allow all Pods communicating with VPC Lattice to allow traffic on all ports from the `169.254.171.0/24` address range.

```bash
PREFIX_LIST_ID=$(aws ec2 describe-managed-prefix-lists --query "PrefixLists[?PrefixListName=="\'com.amazonaws.$AWS_REGION.vpc-lattice\'"].PrefixListId" | jq -r '.[]')
echo "PREFIX_LIST_ID=$PREFIX_LIST_ID"
MANAGED_PREFIX=$(aws ec2 get-managed-prefix-list-entries --prefix-list-id $PREFIX_LIST_ID --output json  | jq -r '.Entries[0].Cidr')
echo "MANAGED_PREFIX=$MANAGED_PREFIX"
CLUSTER_SG=$(aws eks describe-cluster --name $EKS_CLUSTER2_NAME --output json| jq -r '.cluster.resourcesVpcConfig.clusterSecurityGroupId')
echo "CLUSTER_SG=$CLUSTER_SG"
aws ec2 authorize-security-group-ingress --group-id $CLUSTER_SG --cidr $MANAGED_PREFIX --protocol -1
```


::::expand{header="Check Output"}
```json
PREFIX_LIST_ID=pl-07cbd8b5e26960eac
MANAGED_PREFIX=169.254.171.0/24
CLUSTER_SG=sg-09a9e49553653e80c
{
    "Return": true,
    "SecurityGroupRules": [
        {
            "SecurityGroupRuleId": "sgr-069ad649f19743beb",
            "GroupId": "sg-09a9e49553653e80c",
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
eksctl utils associate-iam-oidc-provider --cluster $EKS_CLUSTER2_NAME --approve --region $AWS_REGION
```

::::expand{header="Check Output"}
```bash
2023-10-27 01:41:42 [ℹ]  will create IAM Open ID Connect provider for cluster "eksworkshop-eksctl-2" in "us-west-2"
2023-10-27 01:41:42 [✔]  created IAM Open ID Connect provider for cluster "eksworkshop-eksctl-2" in "us-west-2"
```
::::

5. Note that VPC Lattice Controller IAM Policy was already created in earlier module. Ensure that it exists.

```bash
echo "VPCLatticeControllerIAMPolicyArn=$VPCLatticeControllerIAMPolicyArn"
```
::::expand{header="Check Output"}
```bash
VPCLatticeControllerIAMPolicyArn=arn:aws:iam::ACCOUNT_ID:policy/VPCLatticeControllerIAMPolicy
```
::::

6. Create the `aws-application-networking-system` Namespace.

```bash
kubectl --context $EKS_CLUSTER2_CONTEXT apply -f examples/deploy-namesystem.yaml
```

::::expand{header="Check Output"}
```bash
namespace/aws-application-networking-system created
```
::::


7. Create an IRSA for Pod level permission: 

```bash
eksctl create iamserviceaccount \
   --cluster=$EKS_CLUSTER2_NAME \
   --namespace=aws-application-networking-system \
   --name=gateway-api-controller \
   --attach-policy-arn=$VPCLatticeControllerIAMPolicyArn \
   --override-existing-serviceaccounts \
   --region $AWS_REGION \
   --approve
```

::::expand{header="Check Output"}
```bash
2023-10-27 01:48:53 [ℹ]  1 iamserviceaccount (aws-application-networking-system/gateway-api-controller) was included (based on the include/exclude rules)
2023-10-27 01:48:53 [!]  metadata of serviceaccounts that exist in Kubernetes will be updated, as --override-existing-serviceaccounts was set
2023-10-27 01:48:53 [ℹ]  1 task: { 
    2 sequential sub-tasks: { 
        create IAM role for serviceaccount "aws-application-networking-system/gateway-api-controller",
        create serviceaccount "aws-application-networking-system/gateway-api-controller",
    } }2023-10-27 01:48:53 [ℹ]  building iamserviceaccount stack "eksctl-eksworkshop-eksctl-2-addon-iamserviceaccount-aws-application-networking-system-gateway-api-controller"
2023-10-27 01:48:54 [ℹ]  deploying stack "eksctl-eksworkshop-eksctl-2-addon-iamserviceaccount-aws-application-networking-system-gateway-api-controller"
2023-10-27 01:48:54 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-2-addon-iamserviceaccount-aws-application-networking-system-gateway-api-controller"
2023-10-27 01:49:24 [ℹ]  waiting for CloudFormation stack "eksctl-eksworkshop-eksctl-2-addon-iamserviceaccount-aws-application-networking-system-gateway-api-controller"
2023-10-27 01:49:24 [ℹ]  serviceaccount "aws-application-networking-system/gateway-api-controller" already exists
2023-10-27 01:49:24 [ℹ]  updated serviceaccount "aws-application-networking-system/gateway-api-controller"
```
::::

8. Run kubectl command to deploy the controller.

```bash
kubectl --context $EKS_CLUSTER2_CONTEXT apply -f examples/deploy-v0.0.17.yaml
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
kubectl --context $EKS_CLUSTER2_CONTEXT get all -n aws-application-networking-system
```

::::expand{header="Check Output"}
```bash
NAME                                         READY   STATUS    RESTARTS   AGE
pod/gateway-api-controller-965646b47-st8bm   2/2     Running   0          39h

NAME                                             TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
service/gateway-api-controller-metrics-service   ClusterIP   172.20.206.49   <none>        8443/TCP   39h

NAME                                     READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/gateway-api-controller   1/1     1            1           39h

NAME                                               DESIRED   CURRENT   READY   AGE
replicaset.apps/gateway-api-controller-965646b47   1         1         1       39h
```
::::


## Deploy `GatewayClass` Resource in First EKS Cluster `eksworkshop-eksctl`

1. Create the `GatewayClass` object with name `amazon-vpc-lattice`.

```bash
cd ~/environment
kubectl  --context $EKS_CLUSTER2_CONTEXT apply -f manifests/gatewayclass.yaml
```

::::expand{header="Check Output"}
```bash
gatewayclass.gateway.networking.k8s.io/amazon-vpc-lattice created
```
::::

## Deploy `Gateway` Resource in Second EKS Cluster `eksworkshop-eksctl-2`

1. Create the Kubernetes `Gateway` object **app-services-gw**

Note that we already generated the `Gateway` configuratoion earlier in the file `manifests/app-services-gw.yaml`. For now, we will change the annotaion from `application-networking.k8s.aws/lattice-vpc-association: "true"` to `application-networking.k8s.aws/lattice-vpc-association: "false"` and apply the configuration. We will associate the second EKS Cluster VPC to the Service network later during the workshop.


```bash
export GATEWAY_NAME=app-services-gw
export GATEWAY_NAMESPACE=app-services-gw
sed -i -e 's#application-networking.k8s.aws/lattice-vpc-association: "true"#application-networking.k8s.aws/lattice-vpc-association: "false"#g' manifests/$GATEWAY_NAME.yaml
kubectl  --context $EKS_CLUSTER2_CONTEXT apply -f manifests/$GATEWAY_NAME.yaml
```

::alert[The above configuration creates Kubernetes `Gateway` object `app-services-gw` in the second EKS Cluster but **will not** create the **Service Network** again in Amazon VPC Lattice since it was already created earlier. ]{header="Note"}


::::expand{header="Check Output"}
```bash
namespace/app-services-gw created
gateway.gateway.networking.k8s.io/app-services-gw created
```
::::

2. Verify that `app-services-gw` Gateway is created (this could take about five minutes): 

```bash
kubectl  --context $EKS_CLUSTER2_CONTEXT get gateway -n $GATEWAY_NAMESPACE
```

::::expand{header="Check Output"}
```bash
_NAMESPACE
NAME              CLASS                ADDRESS   PROGRAMMED   AGE
app-services-gw   amazon-vpc-lattice                          97s
```
::::

3. Once the Gateway is created, find the VPC Lattice Service Network.

```bash
kubectl  --context $EKS_CLUSTER2_CONTEXT get gateway $GATEWAY_NAME -n $GATEWAY_NAMESPACE -oyaml
```

::::expand{header="Check Output"}
```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: Gateway
metadata:
  annotations:
    application-networking.k8s.aws/lattice-vpc-association: "false"
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"gateway.networking.k8s.io/v1beta1","kind":"Gateway","metadata":{"annotations":{"application-networking.k8s.aws/lattice-vpc-association":"false"},"name":"app-services-gw","namespace":"app-services-gw"},"spec":{"gatewayClassName":"amazon-vpc-lattice","listeners":[{"allowedRoutes":{"kinds":[{"kind":"HTTPRoute"}],"namespaces":{"from":"Selector","selector":{"matchLabels":{"allow-attachment-to-infra-gw":"true"}}}},"name":"http-listener","port":80,"protocol":"HTTP"},{"allowedRoutes":{"kinds":[{"kind":"HTTPRoute"}],"namespaces":{"from":"Selector","selector":{"matchLabels":{"allow-attachment-to-infra-gw":"true"}}}},"name":"https-listener-with-default-domain","port":443,"protocol":"HTTPS"},{"allowedRoutes":{"kinds":[{"kind":"HTTPRoute"}],"namespaces":{"from":"Selector","selector":{"matchLabels":{"allow-attachment-to-infra-gw":"true"}}}},"name":"https-listener-with-custom-domain","port":443,"protocol":"HTTPS","tls":{"mode":"Terminate","options":{"application-networking.k8s.aws/certificate-arn":"arn:aws:acm:us-west-2:ACCOUNT_ID:certificate/d5ebbf85-9b6a-4501-9bfb-65d638b9c0f2"}}}]}}
  creationTimestamp: "2023-10-27T03:40:38Z"
  finalizers:
  - gateway.k8s.aws/resources
  generation: 1
  name: app-services-gw
  namespace: app-services-gw
  resourceVersion: "7823"
  uid: 4ac2556c-ef8e-47dd-b5ca-fb3909ed8ba1
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
  - lastTransitionTime: "2023-10-27T03:40:38Z"
    message: application-networking.k8s.aws/gateway-api-controller
    observedGeneration: 1
    reason: Accepted
    status: "True"
    type: Accepted
  - lastTransitionTime: "2023-10-27T03:40:39Z"
    message: 'aws-gateway-arn: arn:aws:vpc-lattice:us-west-2:ACCOUNT_ID:servicenetwork/sn-0cc73287505ac121a'
    observedGeneration: 1
    reason: Programmed
    status: "True"
    type: Programmed
  listeners:
  - attachedRoutes: 0
    conditions:
    - lastTransitionTime: "2023-10-27T03:40:38Z"
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
    - lastTransitionTime: "2023-10-27T03:40:38Z"
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
    - lastTransitionTime: "2023-10-27T03:40:38Z"
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


Note that the Gateway ARN in the above message field is same as the one stored earlier in the environment variable.

```bash
echo "gatewayARN=$gatewayARN"
```

::::expand{header="Check Output"}
```bash
gatewayARN=arn:aws:vpc-lattice:us-west-2:ACCOUNT_ID:servicenetwork/sn-0cc73287505ac121a
```
::::
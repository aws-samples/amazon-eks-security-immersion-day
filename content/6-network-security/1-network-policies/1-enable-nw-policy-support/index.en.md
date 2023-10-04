---
title : "Configure EKS Cluster for Kubernetes network policies"
weight : 20
---

## Prerequisites

Network policies in the Amazon VPC CNI plugin for Kubernetes are supported in the following configurations.

*  **New Amazon EKS clusters of version 1.25 and later.**


You can check your current Kubernetes version with following command.

```bash
aws eks describe-cluster --name eksworkshop-eksctl --query cluster.version --output text
``` 

The output shows 1.28, which is the supported version.

```bash
1.28
```

* **Version 1.14 or later of the Amazon VPC CNI plugin for Kubernetes on your cluster.**

You can see which version that you currently have with the following command.

```bash
kubectl describe daemonset aws-node --namespace kube-system | grep amazon-k8s-cni: | cut -d : -f 3
```

The output shows.

```bash
v1.14.0-eksbuild.3
```

This means we need to upgrade Amazon VPC CNI plugin to Version 1.14 or later. We will do that shortly in this section.

* **Your nodes must have Linux kernel version 5.10 or later**

Run the following command to check kernel version on the EKS worker nodes.

```bash
kubectl get node -o wide
```

The output will look lke below.

```bash
NAME                                           STATUS   ROLES    AGE    VERSION
ip-10-254-128-55.us-west-2.compute.internal    Ready    <none>   3h9m   v1.28.1-eks-43840fb
ip-10-254-180-171.us-west-2.compute.internal   Ready    <none>   3h9m   v1.28.1-eks-43840fb
ip-10-254-217-72.us-west-2.compute.internal    Ready    <none>   3h9m   v1.28.1-eks-43840fb
```

The output shows the Linux version is `5.10.186-179.751.amzn2.x86_64` which is supported.

## Enable network policy in the VPC CNI

Before we enable the network policy in the VPC CNI, let us see the `aws=node` pods in the `kube-system` namespace.

```bash
kubectl get pods -n kube-system | grep 'aws-node\|amazon'
```

The pods will have only one container.

```bash
aws-node-gndqg             1/1     Running   0          12h
aws-node-s4pr4             1/1     Running   0          12h
```

:::::tabs{variant="container"}

::::tab{id="cli" label="Using AWS CLI"}

Run below command to create Amazon EKS VPC CNI Managed add-on with additional configuratin to enable Network Policy Agent and also enable ClodWatch logs.

```bash
aws eks create-addon --cluster-name eksworkshop-eksctl --addon-name vpc-cni --addon-version v1.14.0-eksbuild.3 \
    --resolve-conflicts OVERWRITE --configuration-values '{"enableNetworkPolicy": "true", "nodeAgent": {"enableCloudWatchLogs": "true"}}'     
```

::::expand{header="Check Output"}
```json
{
    "addon": {
        "addonName": "vpc-cni",
        "clusterName": "eksworkshop-eksctl",
        "status": "CREATING",
        "addonVersion": "v1.14.0-eksbuild.3",
        "health": {
            "issues": []
        },
        "addonArn": "arn:aws:eks:us-west-2:ACCOUNT_ID:addon/eksworkshop-eksctl/vpc-cni/eac53eda-2b8b-8fb6-5972-33b33c43a7f6",
        "createdAt": "2023-09-10T06:08:05.709000+00:00",
        "modifiedAt": "2023-09-10T06:08:05.724000+00:00",
        "tags": {},
        "configurationValues": "{\"enableNetworkPolicy\": \"true\", \"nodeAgent\": {\"enableCloudWatchLogs\": \"true\"}}"
    }
}
```
::::


::::

::::tab{id="console" label="Using AWS Console"}

1. Open the Amazon [EKS console](https://console.aws.amazon.com/eks/home#/clusters)
2. In the left navigation pane, select **Clusters**, and then select the name of the cluster that you want to configure the Amazon VPC CNI add-on for.
3. Choose the **Add-ons** tab.
4. Click on Get More add-ons
5. Select checkbox next to **Amazon VPC CNI**
6. Click on **Next** to go next page
7. Expand the **Optional configuration settings**.
8. Enter the following in the json text box
    ```json
         {
            "enableNetworkPolicy": "true",
            "nodeAgent": {
                "enableCloudWatchLogs": "true"
            }
         } 
    ```
9. Click on **Next**
10. Click on **Create**

The following screenshot shows an example of this scenario.
![console-cni-config-network-policy-logs](/static/images/6-network-security/1-network-policies/console-cni-config-network-policy-logs.png)


::::

:::::



Wait for few minutes and Ensure that the pods are in running state.


```bash
kubectl get pods -n kube-system | grep 'aws-node\|amazon'
```

The pods will now contain two containers.

```bash
aws-node-jzkpd             2/2     Running   0          54s
aws-node-mqtx7             2/2     Running   0          31s
```

If network policy is enabled, there are 2 containers in the `aws-node` pods. In previous versions and if network policy is disabled, there is only a single container in the `aws-node` pods.

Run the below command to check the container names in the  Amazon VPC CNI node agent.

```bash
kubectl get ds -n kube-system aws-node -o jsonpath='{.spec.template.spec.containers[*].name}{"\n"}'
```

The output will look like below.

```bash
aws-node aws-eks-nodeagent
```

Let us see how the configuration for the Network Polocy Agent container inside the `aws-node` DaemonSet looks like. The output is truncated to highlight only relevant Info.

```bash
kubectl get ds -n kube-system aws-node -oyaml
```

```yaml
apiVersion: apps/v1
kind: DaemonSet
...
      containers:
        image: 602401143452.dkr.ecr.us-west-2.amazonaws.com/amazon-k8s-cni:v1.14.0-eksbuild.3
        name: aws-node
        ports:
        - containerPort: 61678
          hostPort: 61678
          name: metrics
          protocol: TCP
        readinessProbe:
          exec:
            command:
            - /app/grpc-health-probe
            - -addr=:50051
            - -connect-timeout=5s
            - -rpc-timeout=5s
        resources:
          requests:
            cpu: 25m
        securityContext:
          capabilities:
            add:
            - NET_ADMIN
            - NET_RAW

      - args:
        - --enable-ipv6=false
        - --enable-network-policy=true
        - --enable-cloudwatch-logs=true
        image: 602401143452.dkr.ecr.us-west-2.amazonaws.com/amazon/aws-network-policy-agent:v1.0.1-eksbuild.1
        imagePullPolicy: IfNotPresent
        name: aws-eks-nodeagent
        resources:
          requests:
            cpu: 25m
        securityContext:
          capabilities:
            add:
            - NET_ADMIN
          privileged: true
      dnsPolicy: ClusterFirst
      hostNetwork: true
      initContainers:
      - env:
        - name: DISABLE_TCP_EARLY_DEMUX
          value: "false"
        - name: ENABLE_IPv6
          value: "false"
        image: 602401143452.dkr.ecr.us-west-2.amazonaws.com/amazon-k8s-cni-init:v1.14.0-eksbuild.3
        imagePullPolicy: IfNotPresent
        name: aws-vpc-cni-init
        resources:
          requests:
            cpu: 25m
        securityContext:
          privileged: true
      priorityClassName: system-node-critical
      restartPolicy: Always
      schedulerName: default-scheduler
      securityContext: {}
      serviceAccount: aws-node
      serviceAccountName: aws-node
      terminationGracePeriodSeconds: 10
      tolerations:
      - operator: Exists
      - hostPath:
          path: /var/run/aws-node
          type: DirectoryOrCreate
        name: run-dir
      - hostPath:
          path: /run/xtables.lock
          type: ""
        name: xtables-lock
...
```

Run below command to see new CRDs created by Amazon EKS VPC CNI.

```bash
kubectl get crd
```

The output will look like below. Note that Amazon VPC CNI uses a new CRD `policyendpoints.networking.k8s.aws` to implement the Network Policies.

```bash
NAME                                         CREATED AT
cninodes.vpcresources.k8s.aws                2023-09-07T11:26:26Z
eniconfigs.crd.k8s.amazonaws.com             2023-09-07T11:26:23Z
policyendpoints.networking.k8s.aws           2023-09-07T11:26:27Z
securitygrouppolicies.vpcresources.k8s.aws   2023-09-07T11:26:26Z
```

Let is ensure that there are no network policies in the Cluster before proceeding further.

```bash
kubectl get netpol -A
```

::::expand{header="Check Output"}

```bash
No resources found
```
::::


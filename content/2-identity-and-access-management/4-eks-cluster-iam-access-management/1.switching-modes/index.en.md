---
title : "Switching between Authentication Modes"
weight : 21
---


## Switching between Authentication Modes

In this section, let us explore possible options to switch betweem different Authentication modes.

### Prerequisites

Before procedding further, ensure that the EKS cluster must have a [platform version that is the same or later than the version listed in the table, or a Kubernetes version that is later than the versions listed in the table](https://docs.aws.amazon.com/eks/latest/userguide/access-entries.html).


Check the platform version of the EKS cluster.


```bash
export EKS_CLUSTER_NAME="eksworkshop-eksctl"
aws eks describe-cluster --name $EKS_CLUSTER_NAME --query 'cluster.{"Kubernetes Version": version, "Platform Version": platformVersion}'
```
::::expand{header="Check Output"}
```json
{
    "Kubernetes Version": "1.28",
    "Platform Version": "eks.6"
}
```
::::


### Default Cluster authentication mode

The default Cluster authentication is `CONFIG_MAP`. 

Run below command to get the current cluster Authentication mode.

```bash
aws eks describe-cluster --name $EKS_CLUSTER_NAME --query 'cluster.accessConfig'
```

::::expand{header="Check Output"}
```json
{
    "authenticationMode": "CONFIG_MAP"
}
```
::::

You can also see that in the EKS Console, under the **Access** Tab.

![default_mode](/static/images/iam/eks-access-management/default_mode.png)


### Configure API_AND_CONFIG_MAP Mode

Switching authentication modes on an existing cluster is a one-way operation. You can switch from `CONFIG_MAP` to `API_AND_CONFIG_MAP` but cannot directly switch to `API` mode. You can then switch from `API_AND_CONFIG_MAP` to `API`. You **cannot** revert these operations in the opposite direction. Meaning you cannot switch back to `CONFIG_MAP` or `API_AND_CONFIG_MAP` from API. And you cannot switch back to `CONFIG_MAP`from `API_AND_CONFIG_MAP`.

Let's first ensure there are no access entries exists by default. 


```bash
aws eks list-access-entries --cluster-name $EKS_CLUSTER_NAME 
```

::::expand{header="Check Output"}
```bash
An error occurred (InvalidRequestException) when calling the ListAccessEntries operation: The cluster's authentication mode must be set to one of [API, API_AND_CONFIG_MAP] to perform this operation.
```
::::

The error is expected since the EKS cluster is currently in the default mode i.e. `CONFIG_MAP`

Let us now try to switch directly to `API` mode from `CONFIG_MAP`.

```bash
export AUTHENTICATION_MODE="API"
aws eks update-cluster-config \
   --name $EKS_CLUSTER_NAME \
   --access-config authenticationMode=$AUTHENTICATION_MODE
```

::::expand{header="Check Output"}
```bash
An error occurred (InvalidParameterException) when calling the UpdateClusterConfig operation: Unsupported authentication mode update from CONFIG_MAP to API
```
::::

The error is expected as explained before.


Let us also see content of the `aws-auth` ConfigMap.

```bash
k -n kube-system get cm aws-auth -oyaml
```

::::expand{header="Check Output"}
```yaml
apiVersion: v1
data:
  mapAccounts: |
    []
  mapRoles: |
    - "groups":
      - "system:bootstrappers"
      - "system:nodes"
      "rolearn": "arn:aws:iam::ACCOUNT_ID:role/kafka1-eks-node-group-20231221064656609300000014"
      "username": "system:node:{{EC2PrivateDNSName}}"
    - "groups":
      - "system:bootstrappers"
      - "system:nodes"
      "rolearn": "arn:aws:iam::ACCOUNT_ID:role/platform-eks-node-group-20231221064656599700000013"
      "username": "system:node:{{EC2PrivateDNSName}}"
  mapUsers: |
    []
kind: ConfigMap
metadata:
  creationTimestamp: "2023-12-21T06:58:55Z"
  name: aws-auth
  namespace: kube-system
  resourceVersion: "2425"
  uid: f348b69b-a08e-449f-a391-c1cee8fb3ce5
```
::::


Let us now try to switch to `API_AND_CONFIG_MAP` mode from `CONFIG_MAP`.
```bash
export AUTHENTICATION_MODE="API_AND_CONFIG_MAP"
aws eks update-cluster-config \
   --name $EKS_CLUSTER_NAME \
   --access-config authenticationMode=$AUTHENTICATION_MODE
```

::::expand{header="Check Output"}
```json
{
    "update": {
        "id": "f710c23d-8ae9-4972-818a-76780287b18d",
        "status": "InProgress",
        "type": "AccessConfigUpdate",
        "params": [
            {
                "type": "AuthenticationMode",
                "value": "\"API_AND_CONFIG_MAP\""
            }
        ],
        "createdAt": 1703060401.088,
        "errors": []
    }
}
```
::::

It takes few minutes to change the Authentication mode. 

Run below command to get the current cluster Authentication mode.

```bash
aws eks describe-cluster --name $EKS_CLUSTER_NAME --query 'cluster.accessConfig'
```

::::expand{header="Check Output"}
```json
{
    "authenticationMode": "API_AND_CONFIG_MAP"
}
```
::::

Let us try switching the Authentication mode to `CONFIG_MAP`

```bash
export AUTHENTICATION_MODE="CONFIG_MAP"
aws eks update-cluster-config \
   --name $EKS_CLUSTER_NAME \
   --access-config authenticationMode=$AUTHENTICATION_MODE
```

::::expand{header="Check Output"}
```bash
An error occurred (InvalidParameterException) when calling the UpdateClusterConfig operation: Unsupported authentication mode update from API_AND_CONFIG_MAP to CONFIG_MAP
```
::::

The error is expected as explained before.


Let us again list if any access entries are automatically created when we changed to Authentication mode `API_AND_CONFIG_MAP`


```bash
aws eks list-access-entries --cluster-name $EKS_CLUSTER_NAME 
```

::::expand{header="Check Output"}
```json
{
    "accessEntries": [
        "arn:aws:iam::ACCOUNT_ID:role/eksworkshop-admin",
        "arn:aws:iam::ACCOUNT_ID:role/kafka1-eks-node-group-20231221064656609300000014",
        "arn:aws:iam::ACCOUNT_ID:role/platform-eks-node-group-20231221064656599700000013"
    ]
}
```
::::


You can also view these access entries in the EKS Console under the **Access** Tab.

![access_entries](/static/images/iam/eks-access-management/access_entries.png)

Notice there are 3 access entries in the above output. The first one `arn:aws:iam::ACCOUNT_ID:role/eksworkshop-admin` is the IAM Role used to create the EKS cluster.  Note this IAM Role cannot be seen anywhere in the default Authentication Mode `CONFIG_MAP`

Run the below command to see the current IAM Role assigned to the Cloud9 EC2 Instance. This will be the same IAM Role as first access entry listed above.

```bash
aws sts get-caller-identity
```


::::expand{header="Check Output"}
```json
{
    "UserId": "AROAQAHCJ2QPAE3TBRGHQ:i-08b0a08412575c115",
    "Account": "ACCOUNT_ID",
    "Arn": "arn:aws:sts::ACCOUNT_ID:assumed-role/eksworkshop-admin/i-08b0a08412575c115"
}
```
::::
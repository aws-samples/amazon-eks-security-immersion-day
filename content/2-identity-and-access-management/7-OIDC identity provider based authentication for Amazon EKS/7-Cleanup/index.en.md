---
title : "Clean Up"
weight : 47
---


You created a few resources for this workshop. If you are participating in an AWS hosted event, then you don't need to clean up anything. The temporary accounts will get deleted after the workshop.

If are running this workshop in your own account, you would need to follow the below steps to cleanup the environment you set up for the workshop.


First let us clear the context and user from the EKS cluster
```bash
CONTEXT_ARN=$(aws eks describe-cluster --name eksworkshop-eksctl --query "cluster.arn" --output text)
kubectl config use-context $CONTEXT_ARN
kubectl config delete-context oidc-secret-reader
kubectl config delete-user cognito-user
```

Now let us disassociate the cognito identity provider from the cluster and delete the user-pool-client

```bash
aws eks disassociate-identity-provider-config --cluster-name $CLUSTER_NAME --identity-provider-config 'type=oidc,name=CognitoID'   
export CLIENT_ID=$(aws cognito-idp create-user-pool-client --user-pool-id $POOL_ID  --client-name EKSClient --no-generate-secret --explicit-auth-flows "USER_PASSWORD_AUTH" "ADMIN_NO_SRP_AUTH"| jq -r '.UserPoolClient.ClientId')
aws cognito-idp delete-user-pool-client --user-pool-id $POOL_ID --client-id $CLIENT_ID
```
echo $output

```

:::expand{header="Check Output"}
```json
{
  "update": {
    "id": "5d930e07-449e-3f88-8bc9-9240ef59d6c1",
    "status": "InProgress",
    "type": "DisassociateIdentityProviderConfig",
    "params": [
      {
        "type": "IdentityProviderConfig",
        "value": "[]"
      }
    ],
    "createdAt": "2024-10-19T15:46:47.619000+00:00",
    "errors": []
  }
}
```
:::
Finally let us delete the user pool in cognito

```bash
aws cognito-idp delete-user-pool --user-pool-id $POOL_ID
```

::::






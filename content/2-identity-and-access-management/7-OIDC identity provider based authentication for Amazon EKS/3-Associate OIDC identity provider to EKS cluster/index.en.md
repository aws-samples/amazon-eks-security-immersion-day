---
title : "Associate OIDC identity provider to EKS cluster"
weight : 43
---

Great, we've now set up our Cognito User Pool. The next step is to associate this identity provider with our Amazon EKS cluster.

This integration will allow users authenticated through the Cognito User Pool to access resources within the EKS environment. We'll need to provide EKS with the necessary configuration details about the Cognito IDP, such as the issuer URL and client ID.

Once the integration is complete, we can then leverage Kubernetes RBAC to authorize access to specific resources based on the user's group membership in Cognito. This will enable a more seamless authentication and authorization workflow for our development teams.

Let's walk through the process of associating the identity provider for your Amazon EKS cluster

:::::tabs{variant="container"}

::::tab{id="cli" label="Using AWS CLI"}

Run the following command to associate OIDCUserpool to EKS cluster

:::code{language=bash showLineNumbers=false showCopyAction=true}
CLUSTER_NAME=$(aws eks list-clusters | jq -r '.clusters[] | select(contains("eksworkshop"))')
output=$(aws eks associate-identity-provider-config --cluster-name $CLUSTER_NAME --oidc 'identityProviderConfigName=CognitoID,issuerUrl='$ISSUER_URL',clientId='$CLIENT_ID',usernameClaim=email,groupsClaim=cognito:groups,groupsPrefix=gid:')
echo $output

while true; do
   OIDC_STATUS=$(aws eks describe-identity-provider-config \
     --cluster-name "$CLUSTER_NAME" \
     --identity-provider-config type=oidc,name=CognitoID  \
     --query "identityProviderConfig.oidc.status" \
     --output text)

   if [ "$OIDC_STATUS" == "ACTIVE" ]; then
     echo "OIDC provider configuration is now active."
     break
   else
     echo "OIDC provider configuration is not yet active. Waiting 30 seconds..."
     sleep 30
   fi
 done
:::

:::expand{header="Check Output"}
Output will be similar to this (value will differ)
```json
{
  "update": {
    "id": "9a114a33-8da4-3fdc-97ae-36933b0ca39d",
    "status": "InProgress",
    "type": "AssociateIdentityProviderConfig",
    "params": [
      {
        "type": "IdentityProviderConfig",
        "value": "[{'type':'oidc','name':'CognitoIDP'}]"
      }
    ],
    "createdAt": "2024-09-19T07:44:44.774000+01:00",
    "errors": []
  },
  "tags": {}
}

OIDC provider configuration is not yet active. Waiting 30 seconds...
OIDC provider configuration is not yet active. Waiting 30 seconds...

```
:::

Wait till OIDC provider configuration is active before proceeding further to next steps

::::
::::tab{id="con" label="Using AWS Console"}

1) In the AWS console - search for EKS
    ![oidc_eks_home](/static/images/iam/oidc-cognito/oidc-eks-home-ekscluster.jpg)

2) Click on the eks cluster
3) Click on "Access" and click on "Associate identity provider"
    ![oidc_eks_home](/static/images/iam/oidc-cognito/oidc-eks-access-associateidp.jpg)
4) Provide name for configuration like "CognitoIDP", copy value "iss" to Issuer URL,"aud" to Client ID for group claim obtained in previous step 
5) Add "email" for username claim and "cognito::groups" to Groups claim and press "Associate"
   ![oidc_eks_oidc_association](/static/images/iam/oidc-cognito/oidc-eks-cognito-oidc-association.jpg)
6) Association between EKS cluster and OIDC will be created and association will be visible in the UI
   ![oidc_eks_oidc_association](/static/images/iam/oidc-cognito/oidc-eks-cognito-oidc-association-creation.jpg)


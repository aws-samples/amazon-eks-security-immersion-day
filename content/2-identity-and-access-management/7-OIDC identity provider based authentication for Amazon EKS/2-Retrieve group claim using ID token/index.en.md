---
title : "Retrieve group claim using ID token"
weight : 42
---
In order to properly configure the OIDC identity provider for the next step, we need to understand the contents of the ID token that Cognito will return upon successful user authentication.

The ID token is a security token that contains claims about the authenticated user, including any group memberships. This information will be crucial for setting up the ClusterRoleBinding to authorize access to the Amazon EKS cluster based on the user's group, rather than just their individual identity.

To inspect the ID token, we'll use a command to authenticate a test user against the Cognito User Pool. This will retrieve the full ID token, which is represented as a JSON Web Token (JWT). We can then base64-decode the token payload to view the claims inside.

Understanding the structure and contents of the Cognito ID token will ensure we configure the OIDC integration with Amazon EKS correctly in the next step.

:::code{language=bash showLineNumbers=false showCopyAction=true}


export CLIENT_ID=$(aws cognito-idp create-user-pool-client --user-pool-id $POOL_ID  --client-name EKSClient --access-token-validity 24 --id-token-validity 24 --no-generate-secret --explicit-auth-flows "USER_PASSWORD_AUTH" "ADMIN_NO_SRP_AUTH"| jq -r '.UserPoolClient.ClientId')
export TOKEN=$(aws cognito-idp admin-initiate-auth --auth-flow ADMIN_USER_PASSWORD_AUTH --client-id $CLIENT_ID --auth-parameters USERNAME=test1@example.com,PASSWORD=Blah123$ --user-pool-id $POOL_ID --query 'AuthenticationResult.IdToken' --output text)
export PAYLOAD=$(echo $TOKEN | cut -d. -f2 | tr -d '\r\n')
export DECODED_PAYLOAD=$(echo $PAYLOAD | base64 --decode)
echo $DECODED_PAYLOAD | jq
ISSUER_URL=$(echo $DECODED_PAYLOAD | jq -r '.iss')
CLIENT_ID=$(echo $DECODED_PAYLOAD | jq -r '.aud')
echo $ISSUER_URL
echo $CLIENT_ID
:::


:::expand{header="Check Output"}
Output will be similar to this (value will differ)
:::code{language=bash showLineNumbers=false showCopyAction=false}
echo $ISSUER_URL
https://cognito-idp.us-west-2.amazonaws.com/us-west-2_LrtAxcED9
echo $CLIENT_ID
4fd97j3d6bj3vc90g4jubi1m4l
:::
:::






The output will be similar to this (values will differ in many cases)

![oidc_cognito_groupclaim](/static/images/iam/oidc-cognito/oidc-eks-cognito-groupclaim.jpg)

The Cognito ID token payload typically has the claims as shown. The payload helps determine the group key to reference in the group claim field of the association in step 3. For Amazon Cognito-issued ID token, the group key is `"cognito:groups"` as shown below. This may vary with OIDC IDP you may use, hence it is important to understand this to help you configure the cluster OIDC association appropriately in the next step.


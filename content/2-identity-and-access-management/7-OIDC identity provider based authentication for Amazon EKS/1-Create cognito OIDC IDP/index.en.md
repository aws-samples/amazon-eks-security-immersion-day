---
title : "Create Cognito OIDC IDP"
weight : 41
---

Let's start with Amazon Cognito User Pool to serve as  OpenID Connect (OIDC) identity provider for Amazon EKS. Cognito User Pools provide a fully-managed, scalable user directory to handle all of our authentication needs. With Cognito, we can easily create and manage users and groups without having to deploy any additional infrastructure

:::::tabs{variant="container"}

::::tab{id="cli" label="Using AWS CLI"}

Run the following command to create Cognito user pool

:::code{language=bash showLineNumbers=false showCopyAction=true}
aws cognito-idp create-user-pool --pool-name OIDCUserPool --username-attributes "email"
:::

:::expand{header="Check Output"}
```json
{
"UserPool": {
"Id": "eu-west-2_ilD61yy1L",
"Name": "OICDUserPool",
"Policies": {
"PasswordPolicy": {
"MinimumLength": 8,
"RequireUppercase": true,
"RequireLowercase": true,
"RequireNumbers": true,
"RequireSymbols": true,
"TemporaryPasswordValidityDays": 7
}
},
"DeletionProtection": "INACTIVE",
"LambdaConfig": {},
"LastModifiedDate": "2024-09-06T11:01:58.421000+00:00",
"CreationDate": "2024-09-06T11:01:58.421000+00:00",
"SchemaAttributes": [
{
"Name": "sub",
"AttributeDataType": "String",
"DeveloperOnlyAttribute": false,
"Mutable": false,
"Required": true,
"StringAttributeConstraints": {
"MinLength": "1",
"MaxLength": "2048"
}
},
{
"Name": "name",
"AttributeDataType": "String",
"DeveloperOnlyAttribute": false,
"Mutable": true,
"Required": false,
"StringAttributeConstraints": {
"MinLength": "0",
"MaxLength": "2048"
}
},
{
"Name": "given_name",
"AttributeDataType": "String",
"DeveloperOnlyAttribute": false,
"Mutable": true,
"Required": false,
"StringAttributeConstraints": {
"MinLength": "0",
"MaxLength": "2048"
}
},
{
"Name": "family_name",
"AttributeDataType": "String",
"DeveloperOnlyAttribute": false,
"Mutable": true,
"Required": false,
"StringAttributeConstraints": {
"MinLength": "0",
"MaxLength": "2048"
}
},
{
"Name": "middle_name",
"AttributeDataType": "String",
"DeveloperOnlyAttribute": false,
"Mutable": true,
"Required": false,
"StringAttributeConstraints": {
"MinLength": "0",
"MaxLength": "2048"
}
},
{
"Name": "nickname",
"AttributeDataType": "String",
"DeveloperOnlyAttribute": false,
"Mutable": true,
"Required": false,
"StringAttributeConstraints": {
"MinLength": "0",
"MaxLength": "2048"
}
},
{
"Name": "preferred_username",
"AttributeDataType": "String",
"DeveloperOnlyAttribute": false,
"Mutable": true,
"Required": false,
"StringAttributeConstraints": {
"MinLength": "0",
"MaxLength": "2048"
}
},
{
"Name": "profile",
"AttributeDataType": "String",
"DeveloperOnlyAttribute": false,
"Mutable": true,
"Required": false,
"StringAttributeConstraints": {
"MinLength": "0",
"MaxLength": "2048"
}
},
{
"Name": "picture",
"AttributeDataType": "String",
"DeveloperOnlyAttribute": false,
"Mutable": true,
"Required": false,
"StringAttributeConstraints": {
"MinLength": "0",
"MaxLength": "2048"
}
},
{
"Name": "website",
"AttributeDataType": "String",
"DeveloperOnlyAttribute": false,
"Mutable": true,
"Required": false,
"StringAttributeConstraints": {
"MinLength": "0",
"MaxLength": "2048"
}
},
{
"Name": "email",
"AttributeDataType": "String",
"DeveloperOnlyAttribute": false,
"Mutable": true,
"Required": false,
"StringAttributeConstraints": {
"MinLength": "0",
"MaxLength": "2048"
}
},
{
"Name": "email_verified",
"AttributeDataType": "Boolean",
"DeveloperOnlyAttribute": false,
"Mutable": true,
"Required": false
},
{
"Name": "gender",
"AttributeDataType": "String",
"DeveloperOnlyAttribute": false,
"Mutable": true,
"Required": false,
"StringAttributeConstraints": {
"MinLength": "0",
"MaxLength": "2048"
}
},
{
"Name": "birthdate",
"AttributeDataType": "String",
"DeveloperOnlyAttribute": false,
"Mutable": true,
"Required": false,
"StringAttributeConstraints": {
"MinLength": "10",
"MaxLength": "10"
}
},
{
"Name": "zoneinfo",
"AttributeDataType": "String",
"DeveloperOnlyAttribute": false,
"Mutable": true,
"Required": false,
"StringAttributeConstraints": {
"MinLength": "0",
"MaxLength": "2048"
}
},
{
"Name": "locale",
"AttributeDataType": "String",
"DeveloperOnlyAttribute": false,
"Mutable": true,
"Required": false,
"StringAttributeConstraints": {
"MinLength": "0",
"MaxLength": "2048"
}
},
{
"Name": "phone_number",
"AttributeDataType": "String",
"DeveloperOnlyAttribute": false,
"Mutable": true,
"Required": false,
"StringAttributeConstraints": {
"MinLength": "0",
"MaxLength": "2048"
}
},
{
"Name": "phone_number_verified",
"AttributeDataType": "Boolean",
"DeveloperOnlyAttribute": false,
"Mutable": true,
"Required": false
},
{
"Name": "address",
"AttributeDataType": "String",
"DeveloperOnlyAttribute": false,
"Mutable": true,
"Required": false,
"StringAttributeConstraints": {
"MinLength": "0",
"MaxLength": "2048"
}
},
{
"Name": "updated_at",
"AttributeDataType": "Number",
"DeveloperOnlyAttribute": false,
"Mutable": true,
"Required": false,
"NumberAttributeConstraints": {
"MinValue": "0"
}
}
],
"UsernameAttributes": [
"email"
],
"VerificationMessageTemplate": {
"DefaultEmailOption": "CONFIRM_WITH_CODE"
},
"UserAttributeUpdateSettings": {
"AttributesRequireVerificationBeforeUpdate": []
},
"MfaConfiguration": "OFF",
"EstimatedNumberOfUsers": 0,
"EmailConfiguration": {
"EmailSendingAccount": "COGNITO_DEFAULT"
},
"AdminCreateUserConfig": {
"AllowAdminCreateUserOnly": false,
"UnusedAccountValidityDays": 7
},
"Arn": "arn:aws:cognito-idp:eu-west-2:053778695015:userpool/eu-west-2_ilD61yy1L",
"AccountRecoverySetting": {
"RecoveryMechanisms": [
{
"Priority": 1,
"Name": "verified_email"
},
{
"Priority": 2,
"Name": "verified_phone_number"
}
]
}
}
}
```
:::

Now let's create a username and secret-reader user group which we would use to login to EKS cluster.

```bash
    export POOL_ID=$(aws cognito-idp list-user-pools --max-results 10 | jq -r '.UserPools[] | select(.Name == "OIDCUserPool") | .Id')
    aws cognito-idp admin-create-user --user-pool-id $POOL_ID --username test1@example.com --temporary-password Password1!
    aws cognito-idp admin-set-user-password --user-pool-id $POOL_ID --username test1@example.com --password Blah123$ --permanent
    
    aws cognito-idp create-group --group-name secret-reader --user-pool-id $POOL_ID
    aws cognito-idp admin-add-user-to-group --user-pool-id $POOL_ID --username test1@example.com --group-name secret-reader
```

::::expand{header="Check Output"}
```json
{
  "User": {
    "Username": "966222c4-0041-7008-e5cc-38ec156e8574",
    "Attributes": [
      {
        "Name": "email",
        "Value": "test1@example.com"
      },
      {
        "Name": "sub",
        "Value": "966222c4-0041-7008-e5cc-38ec156e8574"
      }
    ],
    "UserCreateDate": "2024-09-19T10:16:40.088000+01:00",
    "UserLastModifiedDate": "2024-09-19T10:16:40.088000+01:00",
    "Enabled": true,
    "UserStatus": "FORCE_CHANGE_PASSWORD"
  },
  "Group": {
    "GroupName": "secret-reader",
    "UserPoolId": "eu-west-2_BvEn2bzOs",
    "LastModifiedDate": "2024-09-19T10:16:41.931000+01:00",
    "CreationDate": "2024-09-19T10:16:41.931000+01:00"
  }
}
```
::::
::::

::::tab{id="console" label="Using AWS Console"}

In your AWS Console, Search for Cognito
![oidc_cognito](/static/images/iam/oidc-cognito/oidc-eks-search-cognito.jpg)

You will land on cognito home screen
![oidc_cognito-homescreen](/static/images/iam/oidc-cognito/oidc-eks-cognito-home.jpg)

Click on the hamburger icon and expand the select the user pool
![oidc_cognito-side-homescreen](/static/images/iam/oidc-cognito/oidc-eks-cognito-home-burgericon.jpg)

Click on the hamburger icon and expand the select the user pool
![oidc_cognito-side-homescreen-icon](/static/images/iam/oidc-cognito/oidc-eks-cognito-home-burgericon.jpg)

Click on User pools
![oidc_cognito-side-homescreen-userpool](/static/images/iam/oidc-cognito/oidc-eks-cognito-home-userpool.jpg)

Click on "Create user pool"
![oidc_cognito-side-homescreen-createuserpool](/static/images/iam/oidc-cognito/oidc-eks-cognito-home-createuserpool.jpg)

Choose "Email" in Cognito user pool sign-in options and press Next
![oidc_cognito-side-homescreen-createuserpoolemail](/static/images/iam/oidc-cognito/oidc-eks-cognito-home-createuserpool-signin-options.jpg)

For the purpose of the lab - choose "Cognito defaults" for password policy mode, "No MFA" , Select "Enable self-service account recovery" , "Email" user "User account recovery" and press "Next"
![oidc_cognito-side-homescreen-createuserpoolcognito](/static/images/iam/oidc-cognito/oidc-eks-cognito-home-createuserpool-securityrequirements.jpg)

In Configure signup experience - use default selections and press "Next"
![oidc_cognito-side-homescreen-createuserpoolsignup](/static/images/iam/oidc-cognito/oidc-eks-cognito-home-createuserpool-configuresignup.jpg)

In Configure message delivery - choose "send email with cognito" and press "Next"
![oidc_cognito-side-homescreen-createuserpoolsendemail](/static/images/iam/oidc-cognito/oidc-eks-cognito-home-createuserpool-configuremessagedelivery.jpg)

In "Integrate your App" - Type in User pool name as "OIDCClient",select Initial app client as "Other", app client as "eksClient" and press "Next"
![oidc_cognito-side-homescreen-createuserpoolOIDC](/static/images/iam/oidc-cognito/oidc-eks-cognito-home-createuserpool-integrateApp.jpg)

Review all details and press "Create"

Now userpool is created - click on the "User pool name" to see the details
![oidc_cognito-side-homescreen-createuserpool](/static/images/iam/oidc-cognito/oidc-eks-cognito-home-userpoolcreated.jpg)

You can see the "User pool" to see the details
![oidc_cognito-side-homescreen-createuserpooldetails](/static/images/iam/oidc-cognito/oidc-eks-cognito-home-userpooldetails.jpg)

## Create Users and User group
Click on "OIDCUserPool" and click on "Create user"
![oidc_cognito-side-homescreen-userpool-createuser](/static/images/iam/oidc-cognito/oidc-eks-cognito-home-userpool-createuser.jpg)

Set email as "test1@example.com",choose "set a password" and click on "Create user"
![oidc_cognito-side-homescreen-createuserpooldetails](/static/images/iam/oidc-cognito/oidc-eks-cognito-createuser.jpg)

The user account will be provisioned with a confirmation status of 'Force change password'. Under normal circumstances, a user would be able to log in to the application after the User Pool is integrated.However, for the purposes of this lab exercise, we will run a CLI command to manually change the user's password. This will allow us to then authenticate and gain access to the Amazon EKS cluster using the updated credentials

:::code{language=bash showLineNumbers=false showCopyAction=true}
    export POOL_ID=$(aws cognito-idp list-user-pools --max-results 10 | jq -r '.UserPools[] | select(.Name == "OIDCUserPool") | .Id')
    aws cognito-idp admin-set-user-password --user-pool-id $POOL_ID --username test1@example.com --password Blah123$ --permanent
:::
Lets now create user group.Click on "Groups" and create "Create group"
![oidc_cognito-side-homescreen-createusergroup](/static/images/iam/oidc-cognito/oidc-eks-cognito-home-creategroup.jpg)

Add "secret-reader" as Group name and click on "Create group"
![oidc_cognito-side-homescreen-createusergroup](/static/images/iam/oidc-cognito/oidc-eks-cognito-home-createuserpool-creategroup.jpg)

The user group would be created and you can see that in "Groups" table.
![oidc_cognito-side-homescreen-listgroup](/static/images/iam/oidc-cognito/oidc-eks-cognito-home-createuserpool-creategroup-listgroups.jpg)

Lets add users to this group now.Click on the group name "secret reader" and click on "Add user to group"
![oidc_cognito-side-homescreen-listgroup](/static/images/iam/oidc-cognito/oidc-eks-cognito-home-createuserpool-adduserstogroup.jpg)

You should see the user "test1@example.com" added earlier.Select the user and click "Add"
![oidc_cognito-side-homescreen-listgroup](/static/images/iam/oidc-cognito/oidc-eks-cognito-home-createuserpool-addUserToGroup.jpg)

You should be able to see the user added to the group now
![oidc_cognito-side-homescreen-listgroup](/static/images/iam/oidc-cognito/oidc-eks-cognito-home-createuserpool-addusertogrouplist.jpg)
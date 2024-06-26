---
title : "Create AWS IAM Users"
weight : 24
---

In order to test our scenarios, we will create 3 users, one for each groups we created :

```bash
IAM_USERS=("PaulAdmin" "JeanDev" "PierreInteg")
for IAM_USER in ${IAM_USERS[@]}; do
    export IAM_USER_ARN=$(aws iam get-user --user-name $IAM_USER | jq -r '.User.Arn')
    if [ -z "$IAM_USER_ARN" ]
    then
        IAM_USER_ARN=$(aws iam create-user --user-name $IAM_USER | jq -r '.User.Arn')
        echo "IAM User ${IAM_USER} created. IAM_USER_ARN=$IAM_USER_ARN"
    
    else
        echo "IAM User ${IAM_USER} already exist..."
    fi
done
```

::::expand{header="Check Output"}
```bash
IAM User PaulAdmin created. IAM_USER_ARN=arn:aws:iam::ACCOUNT_ID:user/PaulAdmin
IAM User JeanDev created. IAM_USER_ARN=arn:aws:iam::ACCOUNT_ID:user/JeanDev
IAM User PierreInteg created. IAM_USER_ARN=arn:aws:iam::ACCOUNT_ID:user/PierreInteg
```
::::


Add users to associated groups:

```bash
aws iam add-user-to-group --group-name k8sAdmin --user-name PaulAdmin
aws iam add-user-to-group --group-name k8sDev --user-name JeanDev
aws iam add-user-to-group --group-name k8sInteg --user-name PierreInteg
```

Check users are correctly added in their groups:

```bash
aws iam get-group --group-name k8sAdmin
aws iam get-group --group-name k8sDev
aws iam get-group --group-name k8sInteg
```

::::expand{header="Check Output"}
```json
{
    "Users": [
        {
            "Path": "/",
            "UserName": "PaulAdmin",
            "UserId": "AIDAYGIGGNX6DQ3VBNWSP",
            "Arn": "arn:aws:iam::ACCOUNT_ID:user/PaulAdmin",
            "CreateDate": "2023-03-14T09:38:58+00:00"
        }
    ],
    "Group": {
        "Path": "/",
        "GroupName": "k8sAdmin",
        "GroupId": "AGPAYGIGGNX6INPRF5C7E",
        "Arn": "arn:aws:iam::ACCOUNT_ID:group/k8sAdmin",
        "CreateDate": "2023-03-14T09:33:25+00:00"
    }
}

{
    "Users": [
        {
            "Path": "/",
            "UserName": "JeanDev",
            "UserId": "AIDAYGIGGNX6KG5ALPI65",
            "Arn": "arn:aws:iam::ACCOUNT_ID:user/JeanDev",
            "CreateDate": "2023-03-14T09:38:59+00:00"
        }
    ],
    "Group": {
        "Path": "/",
        "GroupName": "k8sDev",
        "GroupId": "AGPAYGIGGNX6GRTEAJQE3",
        "Arn": "arn:aws:iam::ACCOUNT_ID:group/k8sDev",
        "CreateDate": "2023-03-14T09:35:00+00:00"
    }
}

{
    "Users": [
        {
            "Path": "/",
            "UserName": "PierreInteg",
            "UserId": "AIDAYGIGGNX6EF5ELOVZ4",
            "Arn": "arn:aws:iam::ACCOUNT_ID:user/PierreInteg",
            "CreateDate": "2023-03-14T09:39:00+00:00"
        }
    ],
    "Group": {
        "Path": "/",
        "GroupName": "k8sInteg",
        "GroupId": "AGPAYGIGGNX6KBNORQ3GN",
        "Arn": "arn:aws:iam::ACCOUNT_ID:group/k8sInteg",
        "CreateDate": "2023-03-14T09:35:55+00:00"
    }
}
```
::::


**Note** For the sake of simplicity, in this chapter, we will save credentials to a file to make it easy to toggle back and forth between users. Never do this in production or with credentials that have priviledged access; It is not a security best practice to store credentials on the filesystem.

Retrieve Access Keys for our fake users:

```bash
aws iam create-access-key --user-name PaulAdmin | tee /tmp/PaulAdmin.json
aws iam create-access-key --user-name JeanDev | tee /tmp/JeanDev.json
aws iam create-access-key --user-name PierreInteg | tee /tmp/PierreInteg.json
```

::::expand{header="Check Output"}
```json
{
    "AccessKey": {
        "UserName": "PaulAdmin",
        "AccessKeyId": "XXXXXXXXX",
        "Status": "Active",
        "SecretAccessKey": "XXXXXXXX",
        "CreateDate": "2023-03-14T09:52:30+00:00"
    }
}

{
    "AccessKey": {
        "UserName": "JeanDev",
        "AccessKeyId": "XXXXXXX",
        "Status": "Active",
        "SecretAccessKey": "XXXXXXXX",
        "CreateDate": "2023-03-14T09:52:31+00:00"
    }
}

{
    "AccessKey": {
        "UserName": "PierreInteg",
        "AccessKeyId": "XXXXXXX",
        "Status": "Active",
        "SecretAccessKey": "XXXXXXX",
        "CreateDate": "2023-03-14T09:52:32+00:00"
    }
}
```
::::


Recap:

-   **PaulAdmin** is in the **k8sAdmin** group and will be able to assume the **k8sAdmin** role.
-   **JeanDev** is in **k8sDev** Group and will be able to assume IAM role **k8sDev**
-   **PierreInteg** is in **k8sInteg** group and will be able to assume IAM role **k8sInteg**


Let's go to the [AWS IAM Console](https://console.aws.amazon.com/iamv2/home#/home) and check one of the above IAM Groups and see that there are IAM users part of the group.

![IAM-group-users](/static/images/iam/iam-role-rbac/IAM-group-users.png)


And also let's see trust policy of the IAM Group that allows users from this group to assume an IAM Role:

![IAM-group-trust-policy](/static/images/iam/iam-role-rbac/IAM-group-trust-policy.png)
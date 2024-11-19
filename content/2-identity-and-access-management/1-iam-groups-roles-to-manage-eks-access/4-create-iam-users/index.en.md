---
title: "Create AWS IAM users"
weight: 24
---

In order to test our scenarios, we will create 3 IAM users, one for each of the IAM user groups we created :

```bash
IAM_USERS=("PaulAdmin" "JeanDev" "PierreInteg")
for IAM_USER in ${IAM_USERS[@]}; do
    export IAM_USER_ARN=$(aws iam get-user --user-name $IAM_USER | jq -r '.User.Arn')
    if [ -z "$IAM_USER_ARN" ]
    then
        IAM_USER_ARN=$(aws iam create-user --user-name $IAM_USER | jq -r '.User.Arn')
        echo "IAM user ${IAM_USER} created. IAM_USER_ARN=$IAM_USER_ARN"

    else
        echo "IAM user ${IAM_USER} already exist..."
    fi
done
```

::::expand{header="Check Output"}

```bash
An error occurred (NoSuchEntity) when calling the GetUser operation: The user with name PaulAdmin cannot be found.
IAM user PaulAdmin created. IAM_USER_ARN=arn:aws:iam::12345678900:user/PaulAdmin

An error occurred (NoSuchEntity) when calling the GetUser operation: The user with name JeanDev cannot be found.
IAM user JeanDev created. IAM_USER_ARN=arn:aws:iam::12345678900:user/JeanDev

An error occurred (NoSuchEntity) when calling the GetUser operation: The user with name PierreInteg cannot be found.
IAM user PierreInteg created. IAM_USER_ARN=arn:aws:iam::12345678900:user/PierreInteg
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
            "UserId": "AIDATU4OKBDXRPPLEHSZI",
            "Arn": "arn:aws:iam::12345678900:user/PaulAdmin",
            "CreateDate": "2024-11-19T03:50:16+00:00"
        }
    ],
    "Group": {
        "Path": "/",
        "GroupName": "k8sAdmin",
        "GroupId": "AGPATU4OKBDX4PWJNK6YD",
        "Arn": "arn:aws:iam::12345678900:group/k8sAdmin",
        "CreateDate": "2024-11-19T02:38:25+00:00"
    }
}
{
    "Users": [
        {
            "Path": "/",
            "UserName": "JeanDev",
            "UserId": "AIDATU4OKBDXQYQKMCN4V",
            "Arn": "arn:aws:iam::12345678900:user/JeanDev",
            "CreateDate": "2024-11-19T03:50:18+00:00"
        }
    ],
    "Group": {
        "Path": "/",
        "GroupName": "k8sDev",
        "GroupId": "AGPATU4OKBDXTUV6BC4VG",
        "Arn": "arn:aws:iam::12345678900:group/k8sDev",
        "CreateDate": "2024-11-19T02:47:38+00:00"
    }
}


{
    "Users": [
        {
            "Path": "/",
            "UserName": "PierreInteg",
            "UserId": "AIDATU4OKBDXYUXNWBNAV",
            "Arn": "arn:aws:iam::12345678900:user/PierreInteg",
            "CreateDate": "2024-11-19T03:50:19+00:00"
        }
    ],
    "Group": {
        "Path": "/",
        "GroupName": "k8sInteg",
        "GroupId": "AGPATU4OKBDX5LTFS4JGM",
        "Arn": "arn:aws:iam::12345678900:group/k8sInteg",
        "CreateDate": "2024-11-19T02:50:04+00:00"
    }
}
```

::::

**Note** For the sake of simplicity, in this chapter, we will save credentials to a file to make it easy to toggle back and forth between users. Never do this in production or with credentials that have privileged access; It is not a security best practice to store credentials on the filesystem.

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

- **PaulAdmin** is in the **k8sAdmin** group and will be able to assume the **k8sAdmin** role.
- **JeanDev** is in **k8sDev** Group and will be able to assume IAM role **k8sDev**
- **PierreInteg** is in **k8sInteg** group and will be able to assume IAM role **k8sInteg**

Go to the [AWS IAM console](https://console.aws.amazon.com/iamv2/home?#/groups/details/k8sAdmin?section=users) and see that the IAM user `PaulAdmin` is part of the IAM user group `k8sAdmin`.

![IAM-group-users](/static/images/iam/iam-role-rbac/IAM-group-users.png)

And also let's see trust policy of the IAM Group that allows users from this group to assume an IAM Role:

![IAM-group-trust-policy](/static/images/iam/iam-role-rbac/IAM-group-trust-policy.png)

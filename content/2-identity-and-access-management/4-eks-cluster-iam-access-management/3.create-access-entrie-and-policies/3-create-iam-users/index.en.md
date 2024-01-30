---
title : "Create AWS IAM Users"
weight : 24
---

In order to test our scenarios, we will create 3 users, one for each groups we created :

```bash
IAM_USERS=("User1Admin" "User1TeamADev" "User1TeamATest")
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
An error occurred (NoSuchEntity) when calling the GetUser operation: The user with name User1Admin cannot be found.
IAM User User1Admin created. IAM_USER_ARN=arn:aws:iam::ACCOUNT_ID:user/User1Admin
An error occurred (NoSuchEntity) when calling the GetUser operation: The user with name User1TeamADev cannot be found.
IAM User User1TeamADev created. IAM_USER_ARN=arn:aws:iam::ACCOUNT_ID:user/User1TeamADev
An error occurred (NoSuchEntity) when calling the GetUser operation: The user with name User1TeamATest cannot be found.
IAM User User1TeamATest created. IAM_USER_ARN=arn:aws:iam::ACCOUNT_ID:user/User1TeamATest
```
::::


Add users to associated groups:

```bash
aws iam add-user-to-group --group-name k8sClusterAdmin --user-name User1Admin
aws iam add-user-to-group --group-name k8sTeamADev --user-name User1TeamADev
aws iam add-user-to-group --group-name k8sTeamATest --user-name User1TeamATest
```

Check users are correctly added in their groups:

```bash
aws iam get-group --group-name k8sClusterAdmin
aws iam get-group --group-name k8sTeamADev
aws iam get-group --group-name k8sTeamATest
```

::::expand{header="Check Output"}
```json
{
    "Users": [
        {
            "Path": "/",
            "UserName": "User1Admin",
            "UserId": "AIDAYGIGGNX6DQ3VBNWSP",
            "Arn": "arn:aws:iam::ACCOUNT_ID:user/User1Admin",
            "CreateDate": "2023-03-14T09:38:58+00:00"
        }
    ],
    "Group": {
        "Path": "/",
        "GroupName": "k8sClusterAdmin",
        "GroupId": "AGPAYGIGGNX6INPRF5C7E",
        "Arn": "arn:aws:iam::ACCOUNT_ID:group/k8sClusterAdmin",
        "CreateDate": "2023-03-14T09:33:25+00:00"
    }
}

{
    "Users": [
        {
            "Path": "/",
            "UserName": "User1TeamADev",
            "UserId": "AIDAYGIGGNX6KG5ALPI65",
            "Arn": "arn:aws:iam::ACCOUNT_ID:user/User1TeamADev",
            "CreateDate": "2023-03-14T09:38:59+00:00"
        }
    ],
    "Group": {
        "Path": "/",
        "GroupName": "k8sTeamADev",
        "GroupId": "AGPAYGIGGNX6GRTEAJQE3",
        "Arn": "arn:aws:iam::ACCOUNT_ID:group/k8sTeamADev",
        "CreateDate": "2023-03-14T09:35:00+00:00"
    }
}

{
    "Users": [
        {
            "Path": "/",
            "UserName": "User1TeamATest",
            "UserId": "AIDAYGIGGNX6EF5ELOVZ4",
            "Arn": "arn:aws:iam::ACCOUNT_ID:user/User1TeamATest",
            "CreateDate": "2023-03-14T09:39:00+00:00"
        }
    ],
    "Group": {
        "Path": "/",
        "GroupName": "k8sTeamATest",
        "GroupId": "AGPAYGIGGNX6KBNORQ3GN",
        "Arn": "arn:aws:iam::ACCOUNT_ID:group/k8sTeamATest",
        "CreateDate": "2023-03-14T09:35:55+00:00"
    }
}
```
::::


**Note** For the sake of simplicity, in this chapter, we will save credentials to a file to make it easy to toggle back and forth between users. Never do this in production or with credentials that have priviledged access; It is not a security best practice to store credentials on the filesystem.

Retrieve Access Keys for our fake users:

```bash
aws iam create-access-key --user-name User1Admin | tee /tmp/User1Admin.json
aws iam create-access-key --user-name User1TeamADev | tee /tmp/User1TeamADev.json
aws iam create-access-key --user-name User1TeamATest | tee /tmp/User1TeamATest.json
```

::::expand{header="Check Output"}
```json
{
    "AccessKey": {
        "UserName": "User1Admin",
        "AccessKeyId": "XXXXXXXXX",
        "Status": "Active",
        "SecretAccessKey": "XXXXXXXX",
        "CreateDate": "2023-03-14T09:52:30+00:00"
    }
}

{
    "AccessKey": {
        "UserName": "User1TeamADev",
        "AccessKeyId": "XXXXXXX",
        "Status": "Active",
        "SecretAccessKey": "XXXXXXXX",
        "CreateDate": "2023-03-14T09:52:31+00:00"
    }
}

{
    "AccessKey": {
        "UserName": "User1TeamATest",
        "AccessKeyId": "XXXXXXX",
        "Status": "Active",
        "SecretAccessKey": "XXXXXXX",
        "CreateDate": "2023-03-14T09:52:32+00:00"
    }
}
```
::::


Recap:

-   **User1Admin** is in the **k8sClusterAdmin** group and will be able to assume the **k8sClusterAdmin** role.
-   **User1TeamADev** is in **k8sTeamADev** Group and will be able to assume IAM role **k8sTeamADev**
-   **User1TeamATest** is in **k8sTeamATest** group and will be able to assume IAM role **k8sTeamATest**


Let's go to the [AWS IAM Console](https://console.aws.amazon.com/iamv2/home#/home) and check one of the above IAM Groups and see that there are IAM users part of the group.

![IAM-group-users](/static/images/iam/eks-access-management/IAM-group-users.png)


And also let's see trust policy of the IAM Group that allows users from this group to assume an IAM Role:

![IAM-group-trust-policy](/static/images/iam/eks-access-management/IAM-group-trust-policy.png)
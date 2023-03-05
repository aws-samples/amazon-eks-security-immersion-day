---
title : "Create IAM Users"
weight : 24
---

In order to test our scenarios, we will create 3 users, one for each groups we created :

```bash
aws iam create-user --user-name PaulAdmin
aws iam create-user --user-name JeanDev
aws iam create-user --user-name PierreInteg
```

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

**Note** For the sake of simplicity, in this chapter, we will save credentials to a file to make it easy to toggle back and forth between users. Never do this in production or with credentials that have priviledged access; It is not a security best practice to store credentials on the filesystem.

Retrieve Access Keys for our fake users:

```bash
aws iam create-access-key --user-name PaulAdmin | tee /tmp/PaulAdmin.json
aws iam create-access-key --user-name JeanDev | tee /tmp/JeanDev.json
aws iam create-access-key --user-name PierreInteg | tee /tmp/PierreInteg.json
```

Recap:

-   **PaulAdmin** is in the **k8sAdmin** group and will be able to assume the **k8sAdmin** role.
-   **JeanDev** is in **k8sDev** Group and will be able to assume IAM role **k8sDev**
-   **PierreInteg** is in **k8sInteg** group and will be able to assume IAM role **k8sInteg**


Let's go to the AWS IAM Console and check one of the above IAM Groups and see that there are IAM users part of the group.

![IAM-group-users](/static/images/iam/iam-role-rbac/IAM-group-users.png)


And also let's see trust policy of the IAM Group that allows users from this group to assume an IAM Role:

![IAM-group-trust-policy](/static/images/iam/iam-role-rbac/IAM-group-trust-policy.png)
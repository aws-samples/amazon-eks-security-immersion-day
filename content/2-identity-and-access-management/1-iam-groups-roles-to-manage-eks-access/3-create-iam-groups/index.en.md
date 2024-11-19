---
title: "Create AWS IAM user groups"
weight: 23
---

In this section let's create 3 IAM user groups and attach IAM permission policy on these IAM user groups to be assume the IAM roles created earlier for Kubernetes role.

We want to have different IAM users which will be added to specific IAM user groups in order to have different rights in the Kubernetes cluster.

We will define 3 groups:

- **k8sAdmin** - users from this group will have admin rights on the Kubernetes cluster
- **k8sDev** - users from this group will have full access only in the development namespace of the cluster
- **k8sInteg** - users from this group will have access to integration namespace.

> In fact, users from **k8sDev** and **k8sInteg** groups will only have access to namespaces where we will define Kubernetes RBAC access for their associated Kubernetes role. We'll see this but first, let's create the groups.

#### Create k8sAdmin IAM user group

The **k8sAdmin** Group will be allowed to assume the **k8sAdmin** IAM Role.

```bash
IAM_GROUP="k8sAdmin"
export IAM_GROUP_ARN=$(aws iam get-group --group-name $IAM_GROUP  | jq -r '.Group.Arn')
if [ -z "$IAM_GROUP_ARN" ]
then
      IAM_GROUP_ARN=$(aws iam create-group --group-name $IAM_GROUP  | jq -r '.Group.Arn')
      echo "IAM user group ${IAM_GROUP} created. IAM_GROUP_ARN=$IAM_GROUP_ARN"

else
      echo "IAM user group ${IAM_GROUP} already exist..."
fi
```

::::expand{header="Check Output"}

```bash
An error occurred (NoSuchEntity) when calling the GetGroup operation: The group with name k8sAdmin cannot be found.
IAM user group k8sAdmin created. IAM_GROUP_ARN=arn:aws:iam::12345678900:group/k8sAdmin
```

::::

Let's add a Policy on our group which will allow users from this group to assume our k8sAdmin Role:

```bash
ADMIN_GROUP_POLICY=$(echo -n '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowAssumeOrganizationAccountRole",
      "Effect": "Allow",
      "Action": "sts:AssumeRole",
      "Resource": "arn:aws:iam::'; echo -n "$ACCOUNT_ID"; echo -n ':role/k8sAdmin"
    }
  ]
}')
echo ADMIN_GROUP_POLICY=$ADMIN_GROUP_POLICY

aws iam put-group-policy \
--group-name k8sAdmin \
--policy-name k8sAdmin-policy \
--policy-document "$ADMIN_GROUP_POLICY"
```

#### Create k8sDev IAM user group

The **k8sDev** Group will be allowed to assume the **k8sDev** IAM Role.

```bash
IAM_GROUP="k8sDev"
export IAM_GROUP_ARN=$(aws iam get-group --group-name $IAM_GROUP  | jq -r '.Group.Arn')
if [ -z "$IAM_GROUP_ARN" ]
then
      IAM_GROUP_ARN=$(aws iam create-group --group-name $IAM_GROUP  | jq -r '.Group.Arn')
      echo "IAM user group ${IAM_GROUP} created. IAM_GROUP_ARN=$IAM_GROUP_ARN"

else
      echo "IAM user group ${IAM_GROUP} already exist..."
fi
```

::::expand{header="Check Output"}

```bash
An error occurred (NoSuchEntity) when calling the GetGroup operation: The group with name k8sDev cannot be found.
IAM user group k8sDev created. IAM_GROUP_ARN=arn:aws:iam::12345678900:group/k8sDev
```

::::

Let's add a Policy on our group which will allow users from this group to assume our k8sDev Role:

```bash
DEV_GROUP_POLICY=$(echo -n '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowAssumeOrganizationAccountRole",
      "Effect": "Allow",
      "Action": "sts:AssumeRole",
      "Resource": "arn:aws:iam::'; echo -n "$ACCOUNT_ID"; echo -n ':role/k8sDev"
    }
  ]
}')
echo DEV_GROUP_POLICY=$DEV_GROUP_POLICY

aws iam put-group-policy \
--group-name k8sDev \
--policy-name k8sDev-policy \
--policy-document "$DEV_GROUP_POLICY"
```

#### Create k8sInteg IAM user group

```bash
IAM_GROUP="k8sInteg"
export IAM_GROUP_ARN=$(aws iam get-group --group-name $IAM_GROUP  | jq -r '.Group.Arn')
if [ -z "$IAM_GROUP_ARN" ]
then
      IAM_GROUP_ARN=$(aws iam create-group --group-name $IAM_GROUP  | jq -r '.Group.Arn')
      echo "IAM user group ${IAM_GROUP} created. IAM_GROUP_ARN=$IAM_GROUP_ARN"

else
      echo "IAM user group ${IAM_GROUP} already exist..."
fi
```

::::expand{header="Check Output"}

```bash
An error occurred (NoSuchEntity) when calling the GetGroup operation: The group with name k8sInteg cannot be found.
IAM user group k8sInteg created. IAM_GROUP_ARN=arn:aws:iam::12345678900:group/k8sInteg
```

::::

Let's add a Policy on our group which will allow users from this group to assume our k8sInteg Role:

```bash
INTEG_GROUP_POLICY=$(echo -n '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowAssumeOrganizationAccountRole",
      "Effect": "Allow",
      "Action": "sts:AssumeRole",
      "Resource": "arn:aws:iam::'; echo -n "$ACCOUNT_ID"; echo -n ':role/k8sInteg"
    }
  ]
}')
echo INTEG_GROUP_POLICY=$INTEG_GROUP_POLICY

aws iam put-group-policy \
--group-name k8sInteg \
--policy-name k8sInteg-policy \
--policy-document "$INTEG_GROUP_POLICY"
```

You now should have your 3 groups

```bash
aws iam list-groups
```

The output will look like below.

```json
{
    "Groups": [
        {
            "Path": "/",
            "GroupName": "k8sAdmin",
            "GroupId": "AGPATU4OKBDX4PWJNK6YD",
            "Arn": "arn:aws:iam::12345678900:group/k8sAdmin",
            "CreateDate": "2024-11-19T02:38:25+00:00"
        },
        {
            "Path": "/",
            "GroupName": "k8sDev",
            "GroupId": "AGPATU4OKBDXTUV6BC4VG",
            "Arn": "arn:aws:iam::12345678900:group/k8sDev",
            "CreateDate": "2024-11-19T02:47:38+00:00"
        },
        {
            "Path": "/",
            "GroupName": "k8sInteg",
            "GroupId": "AGPATU4OKBDX5LTFS4JGM",
            "Arn": "arn:aws:iam::12345678900:group/k8sInteg",
            "CreateDate": "2024-11-19T02:50:04+00:00"
        }
    ]
}
```



Go to the AWS [IAM console](https://console.aws.amazon.com/iam/home#/groups) to see the IAM user groups.

![iam-user-groups](/static/images/iam/iam-role-rbac/iam-user-groups.png)
---
title : "Create AWS IAM Groups"
weight : 23
---

In this section let's create 3 IAM groups and attach IAM permission policy on these IAM groups to be assume the IAM roles created earlier for Kubernetes role.

We want to have different IAM users which will be added to specific IAM groups in order to have different rights in the kubernetes cluster.

We will define 3 groups:

-   **k8sClusterAdmin** - users from this group will have **AmazonEKSClusterAdminPolicy** Kubernetes permissions on the cluster
-   **k8sTeamADev** - users from this group will have **AmazonEKSAdminPolicy** Kubernetes permissions on the Namespace `ns-a`
-   **k8sTeamATest** - users from this group will have **AmazonEKSViewPolicy** Kubernetes permissions on the Namespace `ns-a`


#### Create k8sClusterAdmin IAM Group

The **k8sClusterAdmin** Group will be allowed to assume the **k8sClusterAdmin** IAM Role.

```bash
IAM_GROUP="k8sClusterAdmin"
export IAM_GROUP_ARN=$(aws iam get-group --group-name $IAM_GROUP  | jq -r '.Group.Arn')
if [ -z "$IAM_GROUP_ARN" ]
then
      IAM_GROUP_ARN=$(aws iam create-group --group-name $IAM_GROUP  | jq -r '.Group.Arn')
      echo "IAM Group ${IAM_GROUP} created. IAM_GROUP_ARN=$IAM_GROUP_ARN"
  
else
      echo "IAM Group ${IAM_GROUP} already exist. IAM_GROUP_ARN=$IAM_GROUP_ARN"
fi
```

::::expand{header="Check Output"}
```bash
IAM Group k8sAdmin created. IAM_GROUP_ARN=arn:aws:iam::ACCOUNT_ID:group/k8sClusterAdmin
```
::::


Let's add a Policy on our group which will allow users from this group to assume our k8sClusterAdmin Role:

```bash
ADMIN_GROUP_POLICY=$(echo -n '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowAssumeOrganizationAccountRole",
      "Effect": "Allow",
      "Action": "sts:AssumeRole",
      "Resource": "arn:aws:iam::'; echo -n "$ACCOUNT_ID"; echo -n ':role/k8sClusterAdmin"
    }
  ]
}')
echo ADMIN_GROUP_POLICY=$ADMIN_GROUP_POLICY

aws iam put-group-policy \
--group-name k8sClusterAdmin \
--policy-name k8sClusterAdmin-policy \
--policy-document "$ADMIN_GROUP_POLICY"
```

#### Create k8sTeamADev IAM Group

The **k8sTeamADev** Group will be allowed to assume the **k8sTeamADev** IAM Role.

```bash
IAM_GROUP="k8sTeamADev"
export IAM_GROUP_ARN=$(aws iam get-group --group-name $IAM_GROUP  | jq -r '.Group.Arn')
if [ -z "$IAM_GROUP_ARN" ]
then
      IAM_GROUP_ARN=$(aws iam create-group --group-name $IAM_GROUP  | jq -r '.Group.Arn')
      echo "IAM Group ${IAM_GROUP} created. IAM_GROUP_ARN=$IAM_GROUP_ARN"
  
else
      echo "IAM Group ${IAM_GROUP} already exist. IAM_GROUP_ARN=$IAM_GROUP_ARN"
fi
```

::::expand{header="Check Output"}
```bash
IAM Group k8sDev created. IAM_GROUP_ARN=arn:aws:iam::ACCOUNT_ID:group/k8sTeamADev
```
::::


Let's add a Policy on our group which will allow users from this group to assume our k8sTeamADev Role:

```bash
DEV_GROUP_POLICY=$(echo -n '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowAssumeOrganizationAccountRole",
      "Effect": "Allow",
      "Action": "sts:AssumeRole",
      "Resource": "arn:aws:iam::'; echo -n "$ACCOUNT_ID"; echo -n ':role/k8sTeamADev"
    }
  ]
}')
echo DEV_GROUP_POLICY=$DEV_GROUP_POLICY

aws iam put-group-policy \
--group-name k8sTeamADev \
--policy-name k8sTeamADev-policy \
--policy-document "$DEV_GROUP_POLICY"
```

#### Create k8sTeamATest IAM Group
```bash
IAM_GROUP="k8sTeamATest"
export IAM_GROUP_ARN=$(aws iam get-group --group-name $IAM_GROUP  | jq -r '.Group.Arn')
if [ -z "$IAM_GROUP_ARN" ]
then
      IAM_GROUP_ARN=$(aws iam create-group --group-name $IAM_GROUP  | jq -r '.Group.Arn')
      echo "IAM Group ${IAM_GROUP} created. IAM_GROUP_ARN=$IAM_GROUP_ARN"
  
else
      echo "IAM Group ${IAM_GROUP} already exist. IAM_GROUP_ARN=$IAM_GROUP_ARN"
fi
```
::::expand{header="Check Output"}
```json
IAM Group k8sInteg created. IAM_GROUP_ARN=arn:aws:iam::ACCOUNT_ID:group/k8sTeamATest
```
::::

Let's add a Policy on our group which will allow users from this group to assume our k8sTeamATest Role:

```bash
TEST_GROUP_POLICY=$(echo -n '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowAssumeOrganizationAccountRole",
      "Effect": "Allow",
      "Action": "sts:AssumeRole",
      "Resource": "arn:aws:iam::'; echo -n "$ACCOUNT_ID"; echo -n ':role/k8sTeamATest"
    }
  ]
}')
echo TEST_GROUP_POLICY=$TEST_GROUP_POLICY

aws iam put-group-policy \
--group-name k8sTeamATest \
--policy-name k8sTeamATest-policy \
--policy-document "$TEST_GROUP_POLICY"
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
            "GroupName": "k8sClusterAdmin",
            "GroupId": "AGPAZRV3OHPJZGT2JKVDV",
            "Arn": "arn:aws:iam::ACCOUNT_ID:group/k8sClusterAdmin",
            "CreateDate": "2020-04-07T13:32:52Z"
        },
        {
            "Path": "/",
            "GroupName": "k8sTeamADev",
            "GroupId": "AGPAZRV3OHPJUOBR375KI",
            "Arn": "arn:aws:iam::ACCOUNT_ID:group/k8sTeamADev",
            "CreateDate": "2020-04-07T13:33:15Z"
        },
        {
            "Path": "/",
            "GroupName": "k8sTeamATest",
            "GroupId": "AGPAZRV3OHPJR6GM6PFDG",
            "Arn": "arn:aws:iam::ACCOUNT_ID:group/k8sTeamATest",
            "CreateDate": "2020-04-07T13:33:25Z"
        }
    ]
}
```


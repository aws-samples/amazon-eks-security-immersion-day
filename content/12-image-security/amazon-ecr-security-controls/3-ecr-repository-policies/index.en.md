---
title : "Managing access to ECR repos using ECR repository resource-based policies"
weight : 23
---

In this section, you will manage access to Amazon ECR repositories using [resource-based policies](https://docs.aws.amazon.com/AmazonECR/latest/userguide/repository-policies.html#repository-policy-vs-iam-policy). Amazon ECR repository policies are a subset of IAM policies that are scoped for, and specifically used for, controlling access to individual Amazon ECR repositories.

You will use IAM role **ecr_access_teama_role** (through AWS CLI profile ecrTester), which only allows ListImages action in `team-a/alpine` repository. You will create resource-based policies for both repositories and see how [AWS policy evaluation logic](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html#policy-eval-denyallow) works.

1. Prepare a resource-based policy for the ECR repository `team-a/alpine`. This policy **denies** ListImages action for `ecr_access_teama_role` role.

```bash
TEAM_A_REPO_POLICY=$(echo -n '{"Version":"2012-10-17","Statement":[{"Sid":"DenyECRTester","Effect":"Deny","Principal":{"AWS":"arn:aws:iam::'$ACCOUNT_ID':role/'$ECR_ACCESS_ROLE'"},"Action":"ecr:ListImages"}]}')
```

2. Apply the resource-based policy to ECR repository `team-a/alpine`

```bash
aws ecr set-repository-policy \
  --repository-name $ECR_REPO_A \
  --region $AWS_REGION \
  --policy-text $TEAM_A_REPO_POLICY
```

::::expand{header="Check Output"}
```
{
    "registryId": "ACCOUNT_ID",
    "repositoryName": "team-a/alpine",
    "policyText": "{\n  \"Version\" : \"2012-10-17\",\n  \"Statement\" : [ {\n    \"Sid\" : \"DenyECRTester\",\n    \"Effect\" : \"Deny\",\n    \"Principal\" : {\n      \"AWS\" : \"arn:aws:iam::ACCOUNT_ID:role/ecr_access_teama_role\"\n    },\n    \"Action\" : \"ecr:ListImages\"\n  } ]\n}"
}
```
::::

3. Prepare a resource-based policy for the ECR repository `team-b/alpine`. This policy **allows** ListImages action for `ecr_access_teama_role` role.

```bash
TEAM_B_REPO_POLICY=$(echo -n '{"Version":"2012-10-17","Statement":[{"Sid":"AllowECRTester","Effect":"Allow","Principal":{"AWS":"arn:aws:iam::'$ACCOUNT_ID':role/'$ECR_ACCESS_ROLE'"},"Action":"ecr:ListImages"}]}')
```

4. Apply the resource-based policy to ECR repository `team-b/alpine`

```bash
aws ecr set-repository-policy \
  --repository-name $ECR_REPO_B \
  --region $AWS_REGION \
  --policy-text $TEAM_B_REPO_POLICY
```

::::expand{header="Check Output"}
```
{
    "registryId": "ACCOUNT_ID",
    "repositoryName": "team-b/alpine",
    "policyText": "{\n  \"Version\" : \"2012-10-17\",\n  \"Statement\" : [ {\n    \"Sid\" : \"AllowECRTester\",\n    \"Effect\" : \"Allow\",\n    \"Principal\" : {\n      \"AWS\" : \"arn:aws:iam::ACCOUNT_ID:role/ecr_access_teama_role\"\n    },\n    \"Action\" : \"ecr:ListImages\"\n  } ]\n}"
}
```
::::

Amazon ECR repository policy can be reviewed through [AWS Console](https://us-west-2.console.aws.amazon.com/ecr/repositories) as shown below:

![ecrrepopolicy](/static/images/image-security/ecr-security-controls/ecr-repository-policy.png)
![ecrrepopolicy2](/static/images/image-security/ecr-security-controls/ecr-repository-policy2.png)

5. List images in the ECR repository `team-a/alpine` using **ecr_access_teama_role** role. The identity-based policy in IAM **allows** ListImages action on the repository, and the repository-based policy in ECR **denies** ListImages action on the repository. If there is an explicit _Deny_ in any of the applicable policies, the final decision is **Deny**

![policyevaluationlogic](/static/images/image-security/ecr-security-controls/policy-evaluation-logic-short.png)

```bash
aws ecr list-images \
  --repository-name $ECR_REPO_A \
  --region $AWS_REGION \
  --profile ecrTester
```

The output will look like below

```
An error occurred (AccessDeniedException) when calling the ListImages operation: 
User: arn:aws:sts::ACCOUNT_ID:assumed-role/ecr_access_teama_role/ECR-Access-Testing 
is not authorized to perform: ecr:ListImages on resource: 
arn:aws:ecr:us-west-2:ACCOUNT_ID:repository/team-a/alpine 
with an explicit deny in a resource-based policy <--
```

6. List images in the ECR repository `team-b/alpine` using **ecr_access_teama_role** role. The identity-based policy in IAM does not give any permissions on the ECR repository, and the resource-based policy in ECR **allows** ListImages action on the repository. There is no explicit _Deny_ and there is an explicit _Allow_, so the acction is allowed.

```bash
aws ecr list-images \
  --repository-name $ECR_REPO_B \
  --region $AWS_REGION \
  --profile ecrTester
```

The output will look like below

```
{
    "imageIds": [
        {
            "imageDigest": "sha256:25fad2a32ad1f6f510e528448ae1ec69a28ef81916a004d3629874104f8a7f70",
            "imageTag": "v1"
        }
    ]
}
```

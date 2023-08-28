---
title : "Managing access to ECR repos using IAM Identity-based policies"
weight : 22
---

In this section, you will use AWS Identity and Access Management (AWS IAM) to create a role and attach a policy to provide access to only one ECR repository. You will review how IAM policies can control user access to specific ECR repositories. IAM policies are generally used to apply permissions for the entire Amazon ECR service but can also be used to control access to specific resources as well.

1. Add environment variables for this section into the source file

```bash
echo "export ECR_ACCESS_ROLE=ecr_access_teama_role" >> ~/.ecr_security
echo "export ECR_ACCESS_POLICY=ecr_access_testing" >> ~/.ecr_security
source ~/.ecr_security
```
2. Prepare an IAM trust policy document, to allow IAM identities within this AWS account assume a new IAM role

```bash
TRUST_POLICY=$(echo -n '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"AWS":"arn:aws:iam::'$ACCOUNT_ID':root"},"Action":"sts:AssumeRole","Condition":{}}]}')
```

3. Prepare an IAM identity policy document, to create a **customer managed** IAM policy and attach it to a new IAM role. The IAM policy allows ListImages action on repositories in `team-a/` namespace.

```bash
IDENTITY_POLICY=$(echo -n '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":["ecr:ListImages"],"Resource":["arn:aws:ecr:'$AWS_REGION':'$ACCOUNT_ID':repository/team-a/*"]}]}')
```

4. Create a new IAM role **ecr_access_teama_role**

```bash
aws iam create-role \
  --role-name $ECR_ACCESS_ROLE \
  --description "IAM role to test ECR repository access" \
  --assume-role-policy-document "$TRUST_POLICY" \
  --output text \
  --query 'Role.Arn'
```

5. Create a new IAM **customer managed** policy

```bash
aws iam create-policy \
  --policy-name $ECR_ACCESS_POLICY \
  --policy-document "$IDENTITY_POLICY" \
  --output text \
  --query 'Policy.Arn'
```

6. Attach the new IAM **customer managed** policy to the **ecr_access_teama_role** IAM role

```bash
aws iam attach-role-policy \
  --role-name $ECR_ACCESS_ROLE \
  --policy-arn "arn:aws:iam::$ACCOUNT_ID:policy/$ECR_ACCESS_POLICY"
```

7. Generate temporary credentials for the **ecr_access_teama_role** role and temporarily store in a text file

```bash
aws sts assume-role \
  --role-arn arn:aws:iam::${ACCOUNT_ID}:role/$ECR_ACCESS_ROLE \
  --role-session-name ECR-Access-Testing | jq -r .Credentials \
  > /tmp/ecrTester.json
```

8. Populate ~/.aws/credentials file with the temporary credentials

```bash
cat << EoF > ~/.aws/credentials

[ecrTester]
aws_access_key_id=$(jq -r .AccessKeyId /tmp/ecrTester.json)
aws_secret_access_key=$(jq -r .SecretAccessKey /tmp/ecrTester.json)
aws_session_token=$(jq -r .SessionToken /tmp/ecrTester.json)

EoF
```

9. List images in the ECR repository `team-a/alpine` using **ecr_access_teama_role** role permissions

```bash
aws ecr list-images \
  --repository-name $ECR_REPO_A \
  --region $AWS_REGION \
  --profile ecrTester
```

The output will look like below:

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

10. List images in the ECR repository `team-b/alpine` using **ecr_access_teama_role** role permissions

```bash
aws ecr list-images \
  --repository-name $ECR_REPO_B \
  --region $AWS_REGION \
  --profile ecrTester
```

The output will look like below and confirms the ECR repository access can be controlled by IAM permissions:

```
An error occurred (AccessDeniedException) when calling the ListImages operation: 
User: arn:aws:sts::ACCOUNT_ID:assumed-role/ecr_access_teama_role/ECR-Access-Testing 
is not authorized to perform: ecr:ListImages on resource: 
arn:aws:ecr:us-west-2:ACCOUNT_ID:repository/team-b/alpine 
because no identity-based policy allows the ecr:ListImages action <--
```

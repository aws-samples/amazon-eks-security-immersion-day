---
title : "Managing container images using ECR lifecycle policies"
weight : 25
---

Over time, old images with vulnerable and out-of-date software packages should be removed to prevent accidental deployment and exposure. [Amazon ECR lifecycle policies](https://docs.aws.amazon.com/AmazonECR/latest/userguide/LifecyclePolicies.html) help with lifecycle management of images. A lifecycle policy sets rules for when images expire, based on age or count of images in the repository.

In this section, you will create and review a [lifecycle policy](https://docs.aws.amazon.com/AmazonECR/latest/userguide/LifecyclePolicies.html#lifecycle-policy-howitworks) on the `team-b/alpine` repository.

::alert[Once a lifecycle policy is applied to a repository, you should expect that images become expired within 24 hours after they meet the expiration criteria.]{header=""}

1. Create and push a new version of the image to `team-b/alpine` repository

```bash
cat << EoF > Dockerfile

FROM alpine:latest
EXPOSE 80

EoF

docker build -t alpine:local .

docker tag alpine:local $ECR_REPO_URI_B:v2

docker push $ECR_REPO_URI_B:v2
```

::::expand{header="Check Output"}
```
$ docker build -t alpine:local .
Sending build context to Docker daemon  271.3MB
Step 1/2 : FROM alpine:latest
 ---> 7e01a0d0a1dc
Step 2/2 : EXPOSE 80
 ---> Running in 5b7a59f6d5f2
Removing intermediate container 5b7a59f6d5f2
 ---> 70bf76c9f947
Successfully built 70bf76c9f947
Successfully tagged alpine:local

$ docker push $ECR_REPO_URI_B:v2
The push refers to repository [ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/team-b/alpine]
4693057ce236: Layer already exists 
v2: digest: sha256:b4b98faa7b1efd41553497879f92c62b04f475cb81fac37f02cb472ed6589d93 size: 528
```
::::

2. List two images in the ECR repository `team-b/alpine`

```bash
aws ecr list-images \
  --repository-name $ECR_REPO_B \
  --region $AWS_REGION
```

::::expand{header="Check Output"}
```json
{
    "imageIds": [
        {
            "imageDigest": "sha256:c5c5fda71656f28e49ac9c5416b3643eaa6a108a8093151d6d1afc9463be8e33",
            "imageTag": "v1"
        },
        {
            "imageDigest": "sha256:b4b98faa7b1efd41553497879f92c62b04f475cb81fac37f02cb472ed6589d93",
            "imageTag": "v2"
        }
    ]
}
```
::::

3. Prepare a lifecycle policy for ECR repository `team-b/alpine`

```bash
ECR_LIFECYCLE_POLICY=$(echo -n '{"rules":[{"rulePriority":1,"description":"Keep most recently uploaded image only","selection":{"tagStatus":"any","countType":"imageCountMoreThan","countNumber":1},"action":{"type":"expire"}}]}')
```

4. Create a test rule with the lifecycle policy and run a preview of the test rule on ECR repository `team-b/alpine`

```bash
aws ecr start-lifecycle-policy-preview \
    --registry-id $ACCOUNT_ID \
    --repository-name $ECR_REPO_B \
    --lifecycle-policy-text "$ECR_LIFECYCLE_POLICY" \
    --region $AWS_REGION
```

::::expand{header="Check Output"}
```
{
    "registryId": "ACCOUNT_ID",
    "repositoryName": "team-b/alpine",
    "lifecyclePolicyText": "{\"rules\":[{\"rulePriority\":1,\"description\":\"Keep most recently uploaded image only\",\"selection\":{\"tagStatus\":\"any\",\"countType\":\"imageCountMoreThan\",\"countNumber\":1},\"action\":{\"type\":\"expire\"}}]}",
    "status": "IN_PROGRESS"
}
```
::::

Amazon ECR lifecycle policy test rules can be reviewed through [AWS Console](https://us-west-2.console.aws.amazon.com/ecr/repositories) as shown below:

![ecrlifecyclepolicy](/static/images/image-security/ecr-security-controls/ecr-lifecycle-policy.png)
![ecrlifecyclepolicy2](/static/images/image-security/ecr-security-controls/ecr-lifecycle-policy2.png)
![ecrlifecyclepolicy3](/static/images/image-security/ecr-security-controls/ecr-lifecycle-policy3.png)

5. Check the preview output of the test rule with lifecycle policy (expire older images if image count is more than 1)

 
```bash
aws ecr get-lifecycle-policy-preview \
    --registry-id $ACCOUNT_ID \
    --repository-name $ECR_REPO_B \
    --query previewResults \
    --region $AWS_REGION
```

::::expand{header="Check Output"}
```
[
    {
        "imageTags": [
            "v1"
        ],
        "imageDigest": "sha256:c5c5fda71656f28e49ac9c5416b3643eaa6a108a8093151d6d1afc9463be8e33",
        "imagePushedAt": "2023-09-04T05:35:37+00:00",
        "action": {
            "type": "EXPIRE"
        },
        "appliedRulePriority": 1
    }
]
```
::::

Amazon ECR lifecycle policy test rule's preview output can be reviewed as shown below:

![ecrlifecyclepolicy4](/static/images/image-security/ecr-security-controls/ecr-lifecycle-policy4.png)

6. Apply the test rule as a lifecycle policy to the `team-b/alpine` repository. Test rule preview showed the image with v1 tag will expire and you should expect the v1 image will expire within 24 hours.

```bash
aws ecr put-lifecycle-policy \
    --registry-id $ACCOUNT_ID \
    --repository-name $ECR_REPO_B \
    --lifecycle-policy-text "$ECR_LIFECYCLE_POLICY" \
    --region $AWS_REGION
```

::::expand{header="Check Output"}
```
{
    "registryId": "ACCOUNT_ID",
    "repositoryName": "team-b/alpine",
    "lifecyclePolicyText": "{\"rules\":[{\"rulePriority\":1,\"description\":\"Keep most recently uploaded image only\",\"selection\":{\"tagStatus\":\"any\",\"countType\":\"imageCountMoreThan\",\"countNumber\":1},\"action\":{\"type\":\"expire\"}}]}"
}
```
::::

Amazon ECR lifecycle policy can be reviewed as shown below. Test rule's preview from the previous step is also shown in events history as DryRunEvent:

![ecrlifecyclepolicy5](/static/images/image-security/ecr-security-controls/ecr-lifecycle-policy5.png)

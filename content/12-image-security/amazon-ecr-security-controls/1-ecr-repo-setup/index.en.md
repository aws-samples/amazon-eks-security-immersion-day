---
title : "Setup ECR Repositories"
weight : 21
---

::alert[Please ensure you are in the correct region for the tasks listed below. You can select the correct region from the region selection dropdown towards the top right of the AWS console.]{header="Note"}

For the purpose of this workshop, you will use Amazon Elastic Container Registry (Amazon ECR) to create two private repositories and use [namespaces](https://docs.aws.amazon.com/AmazonECR/latest/userguide/Repositories.html#repository-concepts). This section will focus on pushing the container images to ECR.

1. Set below environment variables

```bash
export ACCOUNT_ID=$(aws sts get-caller-identity --output text --query Account)
export AWS_REGION=$(curl -s 169.254.169.254/latest/dynamic/instance-identity/document | jq -r '.region')
```

2. Pull a container image from DockerHub

```bash
docker pull alpine:latest
```

3. Login to ECR by running the following command

```bash
aws ecr get-login-password \
  --region $AWS_REGION \
  | docker login \
  --username AWS \
  --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
```

4. Create an ECR repository with namespace (prefix) `team-a/`

```bash
aws ecr create-repository \
  --repository-name team-a/alpine \
  --region $AWS_REGION \
  --image-tag-mutability IMMUTABLE \
  --output text \
  --query 'repository.repositoryUri'
```

5. Create an ECR repository with namespace (prefix) `team-b/`

```bash
aws ecr create-repository \
  --repository-name team-b/alpine \
  --region $AWS_REGION \
  --image-tag-mutability IMMUTABLE \
  --output text \
  --query 'repository.repositoryUri'
```

After both repositories are created, AWS Console will show the repositories as shown below:

![reflistrepositories](/static/images/image-security/ecr-security-controls/list-repositories.png)

6. Tag the `alpine` image to prepare it for push to ECR repositories

```bash
docker tag alpine:latest $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/team-a/alpine:v1
docker tag alpine:latest $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/team-b/alpine:v1
```

7. Run the below docker images command. You should see three images with the same image ID.

```bash
docker images
```

The output will look like below:

```
REPOSITORY                                                 TAG       IMAGE ID       CREATED       SIZE
ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/team-a/alpine   v1        c1aabb73d233   6 weeks ago   7.33MB
ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/team-b/alpine   v1        c1aabb73d233   6 weeks ago   7.33MB
alpine                                                     latest    c1aabb73d233   6 weeks ago   7.33MB
```

8. Push the images to ECR repositories

```bash
docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/team-a/alpine:v1
docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/team-b/alpine:v1
```

9. List images in the ECR repository `team-a/alpine` using the Cloud9 workspace IAM role permissions (_AdministratorAccess_)

```bash
aws ecr list-images \
  --repository-name "team-a/alpine" \
  --region $AWS_REGION
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

AWS Console will list the images in a repository as shown below:

![reflistimages1](/static/images/image-security/ecr-security-controls/list-images1.png)

10. List images in the ECR repository `team-b/alpine` using the Cloud9 workspace IAM role permissions (_AdministratorAccess_)

```bash
aws ecr list-images \
  --repository-name "team-b/alpine" \
  --region $AWS_REGION
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

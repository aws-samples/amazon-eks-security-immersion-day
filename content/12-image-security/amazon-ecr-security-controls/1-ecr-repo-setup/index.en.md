---
title : "Setup ECR Repositories"
weight : 21
---

::alert[Please ensure you are in the correct region for the tasks listed below. You can select the correct region from the region selection dropdown towards the top right of the AWS console.]{header="Note"}

For the purpose of this workshop, you will use Amazon Elastic Container Registry (Amazon ECR) to create two private repositories and use [namespaces](https://docs.aws.amazon.com/AmazonECR/latest/userguide/Repositories.html#repository-concepts). This section will focus on pushing the container images to ECR.

1. Environment variables used across different sections of this workshop module are saved into a file `~/.ecr_security`, as we progress through this module. Source the file or copy/run the export commands from the file `~/.ecr_security` to rebuild the environment variables, if you start a new terminal in the Cloud9 workspace

```bash
export ACCOUNT_ID=$(aws sts get-caller-identity --output text --query Account)
export AWS_REGION=$(curl -s 169.254.169.254/latest/dynamic/instance-identity/document | jq -r '.region')
export ECR_REGISTRY="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
export ECR_REPO_A="team-a/alpine"
export ECR_REPO_B="team-b/alpine"

echo "export ACCOUNT_ID=$ACCOUNT_ID" > ~/.ecr_security
echo "export ACCOUNT_REGION=$ACCOUNT_REGION" >> ~/.ecr_security
echo "export ECR_REGISTRY=$ECR_REGISTRY" >> ~/.ecr_security
echo "export ECR_REPO_A=$ECR_REPO_A" >> ~/.ecr_security
echo "export ECR_REPO_B=$ECR_REPO_B" >> ~/.ecr_security
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
  --password-stdin $ECR_REGISTRY
```

4. Create an ECR repository with namespace (prefix) `team-a/`. First, check if it already exists.

```bash
export ECR_REPO_URI_A=$(aws ecr describe-repositories --repository-name ${ECR_REPO_A} --region ${AWS_REGION} | jq -r '.repositories[0].repositoryUri')
if [ -z "$ECR_REPO_URI_A" ]
then
      echo "${ECR_REGISTRY}/${ECR_REPO_A} does not exist. So creating it..."
      ECR_REPO_URI_A=$(aws ecr create-repository \
        --repository-name $ECR_REPO_A \
        --region $AWS_REGION \
        --image-tag-mutability IMMUTABLE \
        --query 'repository.repositoryUri' \
        --output text)
      echo "ECR_REPO_URI_A=$ECR_REPO_URI_A"
else
      echo "${ECR_REPO_URI_A} already exists..."
fi
echo "export ECR_REPO_URI_A=$ECR_REPO_URI_A" >> ~/.ecr_security
```

5. Create an ECR repository with namespace (prefix) `team-b/`. First, check if it already exists.

```bash
export ECR_REPO_URI_B=$(aws ecr describe-repositories --repository-name ${ECR_REPO_B} --region ${AWS_REGION} | jq -r '.repositories[0].repositoryUri')
if [ -z "$ECR_REPO_URI_B" ]
then
      echo "${ECR_REGISTRY}/${ECR_REPO_B} does not exist. So creating it..."
      ECR_REPO_URI_B=$(aws ecr create-repository \
        --repository-name $ECR_REPO_B \
        --region $AWS_REGION \
        --image-tag-mutability IMMUTABLE \
        --query 'repository.repositoryUri' \
        --output text)
      echo "ECR_REPO_URI_B=$ECR_REPO_URI_B"
else
      echo "${ECR_REPO_URI_B} already exists..."
fi
echo "export ECR_REPO_URI_B=$ECR_REPO_URI_B" >> ~/.ecr_security
```
After both repositories are created, AWS Console will show the repositories as shown below:

![reflistrepositories](/static/images/image-security/ecr-security-controls/list-repositories.png)

6. Tag the `alpine` image to prepare it for push to ECR repositories

```bash
docker tag alpine:latest $ECR_REPO_URI_A:v1
docker tag alpine:latest $ECR_REPO_URI_B:v1
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
docker push $ECR_REPO_URI_A:v1
docker push $ECR_REPO_URI_B:v1
```

9. Check the role name and permissions assigned to the current IAM identity

```bash
export ROLE_NAME=$(aws sts get-caller-identity --output text --query Arn | cut -d'/' -f2)
export POLICY_NAME=$(aws iam list-attached-role-policies --role-name ${ROLE_NAME} | jq .AttachedPolicies[].PolicyName)
echo -e "\nIAM Role $ROLE_NAME is assigned to the Cloud9 instance and IAM policy $POLICY_NAME is attached to the $ROLE_NAME role"
echo "export ROLE_NAME=$ROLE_NAME" >> ~/.ecr_security
echo "export POLICY_NAME=$POLICY_NAME" >> ~/.ecr_security
```

The output will look like below:

```
IAM Role eks-bootstrap-template-ws-Cloud9InstanceRole-1WXBJ4WGCUFN9 is assigned
to the Cloud9 instance and IAM policy "AdministratorAccess" is attached to the 
eks-bootstrap-template-ws-Cloud9InstanceRole-1WXBJ4WGCUFN9 role
```

10. List images in the ECR repository `team-a/alpine` using the Cloud9 workspace IAM role permissions (_AdministratorAccess_)

```bash
aws ecr list-images \
  --repository-name $ECR_REPO_A \
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

11. List images in the ECR repository `team-b/alpine` using the Cloud9 workspace IAM role permissions (_AdministratorAccess_)

```bash
aws ecr list-images \
  --repository-name $ECR_REPO_B \
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

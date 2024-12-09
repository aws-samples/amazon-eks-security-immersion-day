---
title: "Setup ECR Repositories"
weight: 21
---

::alert[Please ensure you are in the correct region within the AWS Console, for the tasks listed below. You can select the correct region from the region selection dropdown towards the top right of the AWS console.]{header="Note"}

For the purpose of this workshop, you will use Amazon Elastic Container Registry (Amazon ECR) to create two private repositories and use [namespaces](https://docs.aws.amazon.com/AmazonECR/latest/userguide/Repositories.html#repository-concepts). This section will focus on pushing the container images to ECR.

1. Environment variables used across different sections of this workshop module are saved into a file `~/.ecr_security`, as we progress through this module. If you start a new terminal in the CloudIDE, source the file or copy/run the export commands from the file `~/.ecr_security` to rebuild the environment variables.

```bash
export ECR_REGISTRY="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
export ECR_REPO_A="team-a/alpine"
export ECR_REPO_B="team-b/alpine"

echo "export ECR_REGISTRY=$ECR_REGISTRY" > ~/.ecr_security
echo "export ECR_REPO_A=$ECR_REPO_A" >> ~/.ecr_security
echo "export ECR_REPO_B=$ECR_REPO_B" >> ~/.ecr_security
```

2. Pull a container image from DockerHub

```bash
docker pull alpine:latest
```

::::expand{header="Check Output"}

```
latest: Pulling from library/alpine
7264a8db6415: Pull complete
Digest: sha256:7144f7bab3d4c2648d7e59409f15ec52a18006a128c733fcff20d3a4a54ba44a
Status: Downloaded newer image for alpine:latest
docker.io/library/alpine:latest
```

::::

3. Install and configure [Amazon ECR Credential Helper](https://github.com/awslabs/amazon-ecr-credential-helper)

```bash
cat << EoF > ~/.docker/config.json
{
    "credsStore": "ecr-login"
}
EoF
sudo yum install -y amazon-ecr-credential-helper
```

::::expand{header="Check Output"}

```
Last metadata expiration check: 1 day, 20:04:51 ago on Tue 03 Dec 2024 12:54:35 AM UTC.
Dependencies resolved.
=====================================================================================
 Package                         Arch      Version              Repository      Size
=====================================================================================
Installing:
 amazon-ecr-credential-helper    x86_64    0.9.0-1.amzn2023     amazonlinux    2.4 M

Transaction Summary
=====================================================================================
Install  1 Package

Total download size: 2.4 M
Installed size: 7.3 M
Downloading Packages:
amazon-ecr-credential-helper-0.9.0-1.amzn2023.x86_64  14 MB/s | 2.4 MB     00:00    
-------------------------------------------------------------------------------------
Total                                                 11 MB/s | 2.4 MB     00:00     
Running transaction check
Transaction check succeeded.
Running transaction test
Transaction test succeeded.
Running transaction
  Preparing        :                                                             1/1 
  Installing       : amazon-ecr-credential-helper-0.9.0-1.amzn2023.x86_64        1/1 
  Running scriptlet: amazon-ecr-credential-helper-0.9.0-1.amzn2023.x86_64        1/1 
  Verifying        : amazon-ecr-credential-helper-0.9.0-1.amzn2023.x86_64        1/1 

Installed:
  amazon-ecr-credential-helper-0.9.0-1.amzn2023.x86_64                               

Complete!
```

::::

4. Create an ECR repository with namespace (prefix) `team-a/`. First, check if it already exists.

```bash
export ECR_REPO_URI_A=$(aws ecr describe-repositories --repository-name ${ECR_REPO_A} --region ${AWS_REGION} | jq -r '.repositories[0].repositoryUri')
if [ -z "$ECR_REPO_URI_A" ]
then
      echo "\n${ECR_REGISTRY}/${ECR_REPO_A} does not exist. So creating it..."
      ECR_REPO_URI_A=$(aws ecr create-repository \
        --repository-name $ECR_REPO_A \
        --region $AWS_REGION \
        --image-tag-mutability IMMUTABLE \
        --query 'repository.repositoryUri' \
        --output text)
      echo "export ECR_REPO_URI_A=$ECR_REPO_URI_A" >> ~/.ecr_security
      echo -e "\n${ECR_REPO_URI_A} repo created..."
else
      echo "\n${ECR_REPO_URI_A} already exists..."
      echo "export ECR_REPO_URI_A=$ECR_REPO_URI_A" >> ~/.ecr_security
fi
```

::::expand{header="Check Output"}

```
ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/team-a/alpine does not exist. So creating it...

ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/team-a/alpine repo created...
```

::::

5. Create an ECR repository with namespace (prefix) `team-b/`. First, check if it already exists.

```bash
export ECR_REPO_URI_B=$(aws ecr describe-repositories --repository-name ${ECR_REPO_B} --region ${AWS_REGION} | jq -r '.repositories[0].repositoryUri')
if [ -z "$ECR_REPO_URI_B" ]
then
      echo "\n${ECR_REGISTRY}/${ECR_REPO_B} does not exist. So creating it..."
      ECR_REPO_URI_B=$(aws ecr create-repository \
        --repository-name $ECR_REPO_B \
        --region $AWS_REGION \
        --image-tag-mutability IMMUTABLE \
        --query 'repository.repositoryUri' \
        --output text)
      echo "export ECR_REPO_URI_B=$ECR_REPO_URI_B" >> ~/.ecr_security
      echo -e "\n${ECR_REPO_URI_B} repo created..."
else
      echo "\n${ECR_REPO_URI_B} already exists..."
      echo "export ECR_REPO_URI_B=$ECR_REPO_URI_B" >> ~/.ecr_security
fi
```

::::expand{header="Check Output"}

```
ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/team-b/alpine does not exist. So creating it...

ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/team-b/alpine repo created...
```

::::

After both repositories are created, [AWS Console](https://us-west-2.console.aws.amazon.com/ecr/repositories) will show the repositories as shown below:

![list repositories](/static/images/image-security/ecr-security-controls/list-repositories.png)

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

::::expand{header="Check Output"}

```
The push refers to repository [ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/team-a/alpine]
75654b8eeebd: Pushed 
v1: digest: sha256:3e21c52835bab96cbecb471e3c3eb0e8a012b91ba2f0b934bd0b5394cd570b9f size: 527

The push refers to repository [ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/team-b/alpine]
75654b8eeebd: Pushed 
v1: digest: sha256:3e21c52835bab96cbecb471e3c3eb0e8a012b91ba2f0b934bd0b5394cd570b9f size: 527
```

::::

9. Check the role name and permissions assigned to the current IAM identity

```bash
export ROLE_NAME=$(aws sts get-caller-identity --output text --query Arn | cut -d'/' -f2)
export POLICY_NAME=$(aws iam list-attached-role-policies --role-name ${ROLE_NAME} | jq -r '.AttachedPolicies[] | select(.PolicyName == "AdministratorAccess") | .PolicyArn')
echo -e "\nIAM Role $ROLE_NAME is assigned to the CloudIDE and IAM policy $POLICY_NAME is attached to the $ROLE_NAME role"
```

The output will look like below:

```
IAM Role eks-security-workshop-team-stack-SharedRoleD1D02F7E-jjxqc4J016ex is assigned 
to the CloudIDE and IAM policy "arn:aws:iam::aws:policy/AdministratorAccess" is attached 
to the eks-security-workshop-team-stack-SharedRoleD1D02F7E-jjxqc4J016ex role
```

10. List images in the ECR repository `team-a/alpine` using the CloudIDE's IAM role permissions (_AdministratorAccess_)

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

![list images](/static/images/image-security/ecr-security-controls/list-images.png)

11. List images in the ECR repository `team-b/alpine` using the CloudIDE's IAM role permissions (_AdministratorAccess_)

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

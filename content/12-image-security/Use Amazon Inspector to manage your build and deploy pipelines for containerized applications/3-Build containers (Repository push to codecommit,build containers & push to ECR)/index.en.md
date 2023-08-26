---
title : "Build and Push Container images to an ECR Repository"
weight : 21
---

::alert[Please ensure you are in the correct region for the tasks listed below. You can select the correct region from the region selection dropdown towards the top right of the AWS console.]{header="Note"}

For the purpose of this workshop, you will use Amazon Elastic Container Registry (Amazon ECR) to create a private repository for a sample open source container image.

You would not be focussing on getting the containerized application working, this section will focus on building an image, pushing the image to ECR and reviewing how to work with vulnerability scans.



1. Set below environment variables
```bash
export ACCOUNT_ID=$(aws sts get-caller-identity --output text --query Account)
export AWS_REGION=$(curl -s 169.254.169.254/latest/dynamic/instance-identity/document | jq -r '.region')
```
2.  Clone the sample application github repository.
```bash
cd ~/environment
git clone https://github.com/aws-samples/amazon-ecs-mythicalmysfits-workshop.git
cd ~/environment/amazon-ecs-mythicalmysfits-workshop/workshop-1/app/monolith-service/
```
3. Run the below command to create a Docker file with the following content

```bash
cat > Dockerfile <<EOF
FROM ubuntu:20.04
RUN apt-get update -y
RUN apt-get install -y python3-pip python-dev build-essential
RUN pip3 install --upgrade pip
COPY ./service/requirements.txt .
RUN pip3 install -r ./requirements.txt
COPY ./service /MythicalMysfitsService
WORKDIR /MythicalMysfitsService
EXPOSE 80
ENTRYPOINT ["python3"]
CMD ["mythicalMysfitsService.py"]
EOF
```
4. Build the container image.
```bash
docker build -t monolith-service:v1 .
```
::::expand{header="Check Output"}
```bash
Sending build context to Docker daemon  13.31kB

Step 1/11 : FROM ubuntu:20.04
20.04: Pulling from library/ubuntu
47c764472391: Pull complete 
Digest: sha256:9fa30fcef427e5e88c76bc41ad37b7cc573e1d79cecb23035e413c4be6e476ab
Status: Downloaded newer image for ubuntu:20.04
 ---> 61c45d0e9798
Step 2/11 : RUN apt-get update -y
 ---> Running in 99361d22c6fc
Get:1 http://archive.ubuntu.com/ubuntu focal InRelease [265 kB]
...
Get:18 http://security.ubuntu.com/ubuntu focal-security/main amd64 Packages [2539 kB]
Fetched 25.6 MB in 2s (13.3 MB/s)
Reading package lists...
Removing intermediate container 99361d22c6fc
 ---> b02c68963964
Step 3/11 : RUN apt-get install -y python3-pip python-dev build-essential
 ---> Running in d3469a61d26e
Reading package lists...
Building dependency tree...
Reading state information...
The following additional packages will be installed:
  binutils binutils-common binutils-x86-64-linux-gnu 
  ...
Removing intermediate container 3e3335e551cf
 ---> 70f10960342c
Step 7/11 : COPY ./service /MythicalMysfitsService
 ---> 2354eff4a491
Step 8/11 : WORKDIR /MythicalMysfitsService
 ---> Running in dc4f9ad07088
Removing intermediate container dc4f9ad07088
 ---> 3f84da74ce03
Step 9/11 : EXPOSE 80
 ---> Running in b7c4f46ab2ed
Removing intermediate container b7c4f46ab2ed
 ---> 716478f5a4b6
Step 10/11 : ENTRYPOINT ["python3"]
 ---> Running in cb94f43823de
Removing intermediate container cb94f43823de
 ---> d632e17a29eb
Step 11/11 : CMD ["mythicalMysfitsService.py"]
 ---> Running in 9f1da0e516a2
Removing intermediate container 9f1da0e516a2
 ---> bf47e8f0a7bd
Successfully built bf47e8f0a7bd
Successfully tagged monolith-service:v1
```
::::


After the build is complete, run the below docker images command. You should see the images just built.

```bash
docker images
```
The output will look like below

```bash
REPOSITORY            TAG         IMAGE ID       CREATED         SIZE
monolith-service       v1        bf47e8f0a7bd   5 days ago      548MB
ubuntu              20.04        61c45d0e9798   2 weeks ago     72.8MB
```


1. Create an ECR Repository

:::::tabs{variant="container"}

::::tab{id="cli" label="Using AWS CLI"}
Run the following command to create an ECR Repository by enabling both **Scan on push** and **Tag immutability** features.

```bash
    ECR_REPO_URI=$(aws ecr create-repository \
       --repository-name monolith-service\
       --region $AWS_REGION \
       --query 'repository.repositoryUri' \
       --image-scanning-configuration scanOnPush=true \
       --image-tag-mutability IMMUTABLE \
       --output text)
    echo "$ECR_REPO_URI"
```
The output will look like below
```bash
<ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com/monolith-service
```
::::

::::tab{id="console" label="Using AWS Console"}


* Navigate to the [ECR console](https://console.aws.amazon.com/ecr/home)
  , click on the left hand corner to expand the panel.


* Click on **Repositories** in the left hand navigation panel and the select **Create repository**.

![ecr2](/static/images/image-security/manage-image-cve-with-inspector/ecr2.png)

* In the **General settings**, under **Visibility settings**, select **Private**. give the repository name monolith-service and enable Tag immutability.

::alert[[Image tag mutability](https://docs.aws.amazon.com/AmazonECR/latest/userguide/image-tag-mutability.html) You can configure a repository to enable tag immutability to prevent image tags from being overwritten. After the repository is configured for immutable tags, an ImageTagAlreadyExistsException error is returned if you attempt to push an image with a tag that is already in the repository. When tag immutability is enabled for a repository, this affects all tags and you cannot make some tags immutable while others are not.              This ensures that once an image tag is scanned for vulnerabilities, it cannot be overwritten by pushing the same tag with different contents.]{header="WARNING"  type="warning"}

![repocreate1](/static/images/image-security/manage-image-cve-with-inspector/repocreate1.png)

* Under **Image scan settings**, enable **Scan on push**. Leave **Encryption settings** as default. Select **Create repository**

* Set the environment variable `ECR_REPO_URI` with URI of the above ECR Repository.

```bash
export ECR_REPO_URI="$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/monolith-service"
```
::::

:::::

6. Once the repository is created you will see it listed in the **Repositories** console under **Private** repositories.

![repocreated](/static/images/image-security/manage-image-cve-with-inspector/repocreated.png)

7. Login to ECR by running the following command
```bash
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
```
8. Tag and push the `monolith-service` to the ECR repository.

```bash
docker tag monolith-service:v1 $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/monolith-service:v1
docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/monolith-service:v1
```
Once the image is pushed, you will see the tag in the `monolith-service` repository.

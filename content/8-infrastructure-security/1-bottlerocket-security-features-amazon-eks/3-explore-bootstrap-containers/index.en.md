---
title : "Exploring Bootstrap Containers"
weight : 23
---

In this section of the workshop, you will explore [Bootstrap Containers](https://bottlerocket.dev/en/os/latest/#/concepts/bootstrap-containers/). You will create a directory using bootstrap container and find it in the admin container.

Bootstrap containers allow you to run a container that performs a task as the system boots. They are containers that can be used to “bootstrap” the host before other services start, solving for node configuration through Bottlerocket’s design of container-based customization.

Bootstrap containers have access to the underlying host filesystem at /.bottlerocket/ which contains the root filesystem (/.bottlerocket/rootfs). Additionally, bootstrap containers run with the CAP_SYS_ADMIN capability, allowing for the creation of files, directories, and mounts accessible to the host (however the root filesystem remains immutable). Both bootstrap and superpowered host containers are configured with the /.bottlerocket/rootfs/mnt bind mount.

1. Exit out of the `control` container, back to the Cloud9 workspace to create a container image for the bootstrap container.

```bash
exit
```

::::expand{header="Check Output"}
```
[ssm-user@control]$ exit
exit

Exiting session with sessionId: i-12345999999-abcdexxxxxxxx
```
::::

2. Create ECR repository for container images.

```bash
export ECR_REPO="br-bootstrap"
echo "export ECR_REPO=$ECR_REPO" | tee -a ~/.bash_profile
export ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
export ECR_REPO_URI=$(aws ecr describe-repositories --repository-name ${ECR_REPO} --region ${AWS_REGION} | \
                      jq -r '.repositories[0].repositoryUri')

if [ -z "$ECR_REPO_URI" ]
then
      echo "${ECR_REGISTRY}/${ECR_REPO} does not exist. So creating it..."
      ECR_REPO_URI=$(aws ecr create-repository \
        --repository-name $ECR_REPO \
        --region $AWS_REGION \
        --image-tag-mutability IMMUTABLE \
        --query 'repository.repositoryUri' \
        --output text)
      echo "export ECR_REPO_URI=$ECR_REPO_URI" | tee -a ~/.bash_profile
      echo -e "\n${ECR_REPO_URI} repo created..."
else
      echo "${ECR_REPO_URI} already exists..."
      echo "export ECR_REPO_URI=$ECR_REPO_URI" | tee -a ~/.bash_profile
fi
```

::::expand{header="Check Output"}
```
ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/br-bootstrap does not exist. So creating it...

ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/br-bootstrap repo created...
```
::::

3. Create a Dockerfile and script for the container image. The script will create `eks-workshop` directory within the bind mount `/.bottlerocket/rootfs/mnt`. Build and push the container image to the ECR repository.

```bash
cat << EoF > Dockerfile
FROM alpine
ADD test-bootstrap ./
RUN chmod +x ./test-bootstrap
ENTRYPOINT ["sh", "test-bootstrap"]
EoF

cat << EoF > test-bootstrap
#!/usr/bin/env bash
set -ex

mkdir -p /.bottlerocket/rootfs/mnt/eks-workshop
EoF

docker build -t $ECR_REPO:v1 .
docker tag $ECR_REPO:v1 $ECR_REPO_URI:v1
docker push $ECR_REPO_URI:v1
```

::::expand{header="Check Output"}
```
$ docker build -t $ECR_REPO:v1 .

Sending build context to Docker daemon  8.653MB
Step 1/4 : FROM alpine
 ---> f8c20f8bbcb6
Step 2/4 : ADD test-bootstrap ./
 ---> 7d373ee43c35
Step 3/4 : RUN chmod +x ./test-bootstrap
 ---> Running in 75cf10b62465
Removing intermediate container 75cf10b62465
 ---> 769f7a7afb0a
Step 4/4 : ENTRYPOINT ["sh", "test-bootstrap"]
 ---> Running in 4b4bbad50ce4
Removing intermediate container 4b4bbad50ce4
 ---> c5f218d94f2a
Successfully built c5f218d94f2a
Successfully tagged br-bootstrap:v1

$ docker tag $ECR_REPO:v1 $ECR_REPO_URI:v1
$ docker push $ECR_REPO_URI:v1

The push refers to repository [ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/br-bootstrap]
06f1ac858607: Pushed 
5cbe1c60b3b0: Pushed 
5af4f8f59b76: Pushed 
v1: digest: sha256:75989751ae2f651987ddab689b879b911aa35374ab6a90b370251bcc7487dcd2 size: 942
```
::::

4. Login to the `control` container of the Bottlerocket host

```bash
aws ssm start-session --target $INSTANCE_ID
```

5. Use `apiclient` to configure the bootstrap container in the host and verify the bootstrap container settings.

```bash
ACCOUNT_ID=`curl -s http://169.254.169.254/latest/dynamic/instance-identity/document | jq -r .accountId`
AWS_REGION=`curl -s http://169.254.169.254/latest/dynamic/instance-identity/document | jq -r .region`

apiclient set \
  bootstrap-containers.bootstrap.source=$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/br-bootstrap:v1 \
  bootstrap-containers.bootstrap.mode=always \
  bootstrap-containers.bootstrap.essential=false

apiclient get settings.bootstrap-containers
```

::::expand{header="Check Output"}
```
{
  "settings": {
    "bootstrap-containers": {
      "bootstrap": {
        "essential": false,
        "mode": "always",
        "source": "ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/br-bootstrap:v1"
      }
    }
  }
}
```
::::

6. Login to the `admin` container

```bash
enter-admin-container
```

7. Check if `eks-workshop` directory exists and exit out of the `admin` container. Bootstrap container starts at boot time and the directory should not exist on the host before the first reboot, after configuring the bootstrap container.

```bash
df -h /.bottlerocket/rootfs/mnt/

if [ -d "/.bottlerocket/rootfs/mnt/eks-workshop" ]; then

  echo -e "\nDirectory /.bottlerocket/rootfs/mnt/eks-workshop exists"

else

  echo -e "\nDirectory /.bottlerocket/rootfs/mnt/eks-workshop does not exist"

fi

exit
```

::::expand{header="Check Output"}
```
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme1n1p1   20G  2.8G   18G  14% /.bottlerocket/rootfs/mnt

Directory /.bottlerocket/rootfs/mnt/eks-workshop does not exist
```
::::

8. Reboot the Bottlerocket host using `apiclient` and then exit out of `control` container.

```bash
apiclient reboot; exit
```

9. Reboot from previous step will take about a minute. Login to the `control` container.

```bash
aws ssm start-session --target $INSTANCE_ID
```

10. Login to the `admin` container. `Note:` the exit command will automatically logout of `control` container after we logout of the `admin` container.

```bash
enter-admin-container;exit
```

11. Check if `eks-workshop` directory exists. Bootstrap container should have started at boot time and the directory should exist on the host.

```bash
if [ -d "/.bottlerocket/rootfs/mnt/eks-workshop" ]; then

  echo -e "\nDirectory /.bottlerocket/rootfs/mnt/eks-workshop exists"

else

  echo -e "\nDirectory /.bottlerocket/rootfs/mnt/eks-workshop does not exist"

fi
```

::::expand{header="Check Output"}
```

Directory /.bottlerocket/rootfs/mnt/eks-workshop exists
```
::::

You can use Bootstrap containers to run critical software before the node connects to an orchestrator. They give you substantial power to configure and modify the system in ways that would otherwise be difficult or impossible. Please check Bootstrap container [use cases](https://bottlerocket.dev/en/os/latest/#/concepts/bootstrap-containers/#use-cases).

Bootstrap containers can also be specified when creating node groups with the `eksctl create nodegroup` command. Refer to [eksctl schema](https://eksctl.io/usage/schema/#managedNodeGroups-bottlerocket-settings) for the available settings. Please also review [Validating Amazon EKS optimized Bottlerocket AMI against the CIS Benchmark
](https://catalog.workshops.aws/eks-security-immersionday/en-US/10-regulatory-compliance/2-cis-bottlerocket-eks/create-eks-br-mng) module of this workshop for an example of creating node group with bootstrap container.

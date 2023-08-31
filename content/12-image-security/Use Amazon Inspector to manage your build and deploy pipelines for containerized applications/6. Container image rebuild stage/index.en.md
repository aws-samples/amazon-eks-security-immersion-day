---
title : "Rebuild container image"
weight : 22
---

Deploying a new container image will involve pushing an updated Dockerfile to the ContainerComponentsRepo repository in CodeCommit. With CodeCommit you can interact by using standard Git commands from a command line prompt, and there are multiple approaches that you can take to connect to the AWS CodeCommit repository from the command line. 



1. Set below environment variables
```bash
export ACCOUNT_ID=$(aws sts get-caller-identity --output text --query Account)
export AWS_REGION=$(curl -s 169.254.169.254/latest/dynamic/instance-identity/document | jq -r '.region')
```
2.  Clone the  application from codecommit repository.
```bash
cd ~/environment
git clone https://git-codecommit.eu-west-2.amazonaws.com/v1/repos/ContainerComponentsRepo
cd ~/environment/ContainerComponentsRepo
```
3. Open the "Dockerfile" and change  Docker file with the following content

```bash
cat > Dockerfile <<EOF
FROM public.ecr.aws/amazonlinux/amazonlinux:latest
```

4. Save the file by using "CTRL+O",Choose "Y" and "CTRL+X"

5. Push the file back to remote Code commit repository with following commands
```bash
git add .
git commit -m "modified docker image in Dockerfile"
git push
```


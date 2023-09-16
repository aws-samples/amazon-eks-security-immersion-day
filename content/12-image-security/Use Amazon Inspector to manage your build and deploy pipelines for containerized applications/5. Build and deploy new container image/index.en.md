---
title : "Build and deploy a new Container image"
weight : 22
---

In this section,we will fix the vulnerabilities in original docker file.

Deploying a new container image will involve pushing an updated Dockerfile to the ContainerComponentsRepo repository in CodeCommit. With CodeCommit you can interact by using standard Git commands from a command line prompt, and there are multiple approaches that you can take to [connect to the AWS CodeCommit repository from the command line](https://docs.aws.amazon.com/codecommit/latest/userguide/how-to-connect.html). For this exercise, in order to simplify the interactions with CodeCommit, we will directly update the file directly through the CodeCommit console.


To update Dockerfile in CodeCommit

1. In the [CodeCommit Console](https://us-west-2.console.aws.amazon.com/codesuite/codecommit/repositories?region=us-west-2)., choose the repository named ContainerComponentsRepo.
2. In the screen listing the repository files, choose the Dockerfile file link and choose Edit.
3. In the Edit a file form, overwrite the existing file contents with the following command:

```bash
   FROM public.ecr.aws/amazonlinux/amazonlinux:latest
```
4.In the Commit changes to main section, fill in the following fields.
      Author name: your name
      Email address: your email
      Commit message: ‘Updated Dockerfile’

   ![Edit file Code Commit](/static/images/image-security/devsecops-inspector/Codecommit-edit-dockerfile.png)

5.Choose **Commit changes** to save the new Dockerfile
    

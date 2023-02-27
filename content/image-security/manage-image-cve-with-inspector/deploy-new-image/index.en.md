---
title : "Build and deploy a new container image"
weight : 28
---

#### Adjust the Amazon ECS desired count for the cluster service

Up to this point, you’ve deployed a pipeline to build and validate the container image, and you’ve seen an example of how the pipeline handles a container image that did not meet the defined vulnerability thresholds. Now you’ll deploy a new container image that will pass a vulnerability assessment and complete the pipeline.

The Amazon ECS service that the CloudFormation template deploys is initially created with the number of desired tasks set to 0. In order to allow the container pipeline to successfully deploy a container, you need to update the desired tasks value.

**To adjust the task count in Amazon ECS (console)**

1. In the [Amazon ECS console](https://console.aws.amazon.com/ecs/v2), choose the link for the cluster, in this case **InspectorBlogCluster**.
2. On the **Services** tab, choose the link for the service named **InspectorBlogService**.
3. Choose the **Update** button. On the **Configure service** page, set **Number of tasks** to 1.
4. Choose **Skip to review**, and then choose **Update Service**.


**To adjust the task count in Amazon ECS (AWS CLI)**

Alternatively, you can run the following AWS CLI command to update the desired task count to 1. In order to run this command, you need the ARN of the Amazon ECS cluster, which you can retrieve from the **Output** tab of the CloudFormation stack that you created. You can run this command from the command line of an environment of your choosing, or by using [AWS CloudShell](https://aws.amazon.com/cloudshell/). Make sure to replace `<Cluster ARN>` with your own value.


```bash
aws ecs update-service --cluster <Cluster ARN> --service InspectorBlogService --desired-count 1
```

#### Build and deploy a new container image


Deploying a new container image will involve pushing an updated Dockerfile to the **ContainerComponentsRepo** repository in CodeCommit. With CodeCommit you can interact by using standard Git commands from a command line prompt, and there are multiple approaches that you can take to [connect to the AWS CodeCommit repository](https://docs.aws.amazon.com/codecommit/latest/userguide/how-to-connect.html) from the command line. For this post, in order to simplify the interactions with CodeCommit, you will be shown how to add an updated file directly through the CodeCommit console.

**To add an updated Dockerfile to CodeCommit**

1. In the [CodeCommit console](https://console.aws.amazon.com/codecommit/home), choose the repository named **ContainerComponentsRepo**.
2. In the screen listing the repository files, choose the **Dockerfile** file link and choose **Edit**.
3. In the **Edit a file** form, overwrite the existing file contents with the following command:

```bash
FROM public.ecr.aws/amazonlinux/amazonlinux:latest
```
4. In the **Commit changes to main** section, fill in the following fields.
   1. **Author name:** your name
   2. **Email address:** your email
   3. **Commit message:** ‘Updated Dockerfile’

Below diagram shows what the completed form should look like.

![codecommit-changes](/static/images/image-security/codecommit-changes.png)



5. Choose **Commit changes** to save the new Dockerfile.

This update to the Dockerfile will immediately invoke a new instance of the container pipeline, where the updated container image will be pulled and evaluated by Amazon Inspector.

#### Verify the container image approval and deployment

With a new pipeline initiated through the push of the updated Dockerfile, you can now review the overall pipeline to see that the container image was approved and deployed.

**To see the full details in CodePipeline **

1. In the [CodePipeline console](https://console.aws.amazon.com/codepipeline/home), choose the **container-build-deploy** pipeline. You should see the container pipeline in an active status. In about five minutes, you should see the **ContainerVulnerabilityAssessment** stage move to completed with an **Approved** status, and the deploy stage should show a **Succeeded** status.
2. To confirm that the final image was deployed to the Amazon ECS cluster, from the **Deploy** stage, choose **Details**. This will open a new browser tab for the Amazon ECS service.
3. In the Amazon ECS console, choose the **Tasks** tab. You should see a task with **Last status** showing **RUNNING**. This is confirmation that the image was successfully approved and deployed through the container pipeline. Below diagram shows where the task definition and status are located. 


![task-running](/static/images/image-security/task-running.jpg)

4. Choose the task definition to bring up the latest task definition revision, which was created by the deploy stage of the container pipeline.
5. Scroll down in the task definition screen to the **Container definitions** section. Note that the task is tied to the image you deployed, providing further verification that the approved container image was successfully deployed. Below diagram shows where the container definition can be found and what you should expect to see.

![container-in-task](/static/images/image-security/container-in-task.png)




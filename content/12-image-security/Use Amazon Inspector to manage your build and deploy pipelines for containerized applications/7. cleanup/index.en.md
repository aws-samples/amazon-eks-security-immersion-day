---
title : "Cleanup"
weight : 29
---

You created a few resources for this workshop. If you are participating in an AWS hosted event, then you don't need to clean up anything. The temporary accounts will get deleted after the workshop.

If are running this workshop in your own account, you would need to follow the below steps to cleanup the environment you set up for the workshop.

1. Amazon Inspector:
    Navigate to the Amazon Inspector console, select **Settings**, then **General**. For **Deactivate Amazon Inspector**, select **Deactivate Inspector**. In the confirmation prompt, type **deactivate** then select **Deactivate Inspector**.
2. Amazon Security Hub:
    Navigate to the Amazon Security Hub, select **Settings**, and then disable the **Security Hub**
3. To delete objects in Codepipeline artifact bucket
   In the Amazon S3 console in your AWS account, locate the bucket whose name starts with codepipelineartifactstorebucket.
   Delete the ContainerBuildDeploy folder that is in the bucket.
4. To delete images from Amazon ECR repository
   In the Amazon ECR console, navigate to the AWS account and Region where you deployed the solution. Choose the link for the repository named inspector-blog-images.
   Delete all  images that are listed in the repository.
5. Delete cloudformation stack:
```bash
cd ~/environment

aws cloudformation delete-stack --stack-name inspector-container-scan

```


---
title : "Verify container image approval and deployment"
weight : 22
---

With a new pipeline initiated through the push of the updated `Dockerfile`, you can now review the overall pipeline to see that the container image was approved and deployed

1. In the [CodePipeline console](https://us-west-2.console.aws.amazon.com/codesuite/codepipeline/pipelines/ContainerBuildDeployPipeline/view?region=us-west-2), choose the **ContainerBuildDeployPipeline** pipeline. You should see the container pipeline in an active status. In about five minutes, you should see the **ContainerVulnerabilityAssessment** stage move to completed with an **Approved** status, and the deploy stage should show a **Succeeded** status.

![successful_pipeline_1](/static/images/image-security/devsecops-inspector/successful_pipeline_1.png)

![successful_pipeline_2](/static/images/image-security/devsecops-inspector/successful_pipeline_2.png)

2. To confirm that the final image was deployed to the EKS cluster, goto cloud9 terminal.

Execute the following command
```bash
kubectl get deployments
```

::::expand{header="Check Output"}
```bash
NAME                 READY   UP-TO-DATE   AVAILABLE   AGE
inspector-workshop   1/1     1            1           4m35s
```
::::

3. You should see container deployed  
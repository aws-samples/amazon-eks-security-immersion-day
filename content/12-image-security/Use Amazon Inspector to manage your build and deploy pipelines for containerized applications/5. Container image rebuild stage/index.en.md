---
title : "Verify container image approval and deployment"
weight : 22
---

With a new pipeline initiated through the push of the updated Dockerfile, you can now review the overall pipeline to see that the container image was approved and deployed

1. In the CodePipeline console, choose the container-build-deploy pipeline. You should see the container pipeline in an active status. In about five minutes, you should see the ContainerVulnerabilityAssessment stage move to completed with an Approved status, and the deploy stage should show a Succeeded status.
2. To confirm that the final image was deployed to the EKS cluster,goto cloud9 terminal

Execute the following command
```bash
kubectl get deployments
```

![Inspector](/static/images/image-security/devsecops-inspector/Inspector-container-deployment.png)


3. You should see container deployed  
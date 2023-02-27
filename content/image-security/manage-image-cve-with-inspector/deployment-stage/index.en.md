---
title : "Image deployment stage"
weight : 26
---

If the container image is approved, the final image is deployed to an Amazon ECS cluster. The deploy stage of the pipeline is configured with Amazon ECS as the action provider. The deploy action contains the name of the Amazon ECS cluster and stage that the container image should be deployed to. The image definition file (`imagedefinitions.json`) that was created in the build stage is also listed in the deploy configuration. When the deploy stage runs, it will create a revision to the existing Amazon ECS task definition. This task definition contains the name of the Amazon ECR image that has been approved for deployment. The task definition is then deployed to the Amazon ECS cluster and service. 
---
title : "Cleanup"
weight : 29
---

You created a few resources for this workshop. If you are participating in an AWS hosted event, then you don't need to clean up anything. The temporary accounts will get deleted after the workshop.

If are running this workshop in your own account, you would need to follow the below steps to cleanup the environment you set up for the workshop.


1. To delete objects in Codepipeline artifact bucket
   In the Amazon S3 console in your AWS account, locate the bucket whose name starts with codepipelineartifactstorebucket.
   Delete the ContainerBuildDeploy folder that is in the bucket.
2. To delete images from Amazon ECR repository
   In the Amazon ECR console, navigate to the AWS account and Region where you deployed the solution. Choose the link for the repository named inspector-blog-images.
   Delete all  images that are listed in the repository.
3. You can disable Inspector,security hub,delete kubernetes deployment, delete role/policy and delete cloudformation stack by running the following commands:
```bash
cd ~/environment

aws inspector2 disable
aws securityhub disable-security-hub

kubectl delete deployment
eksctl delete iamidentitymapping --cluster eksworkshop-eksctl --arn arn:aws:iam::${ACCOUNT_ID}:role/EksWorkshopCodeBuildKubectlRole
aws iam delete-role --role-name EksWorkshopCodeBuildKubectlRole

rm /tmp/*.json
rm /tmp/iam-role-policy*


aws cloudformation delete-stack --stack-name inspector-container-scan

```


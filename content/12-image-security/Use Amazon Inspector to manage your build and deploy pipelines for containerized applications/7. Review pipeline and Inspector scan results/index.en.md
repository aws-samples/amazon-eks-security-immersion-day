---
title : "Review pipeline and Inspector scan results"
weight : 22
---


With recent push to Codecommit repository - pipeline runs fine,There is no vulnerability with new containers and pipeline runs successfully



![Code Pipeline](/static/images/image-security/devsecops-inspector/Inspector-successpipeline.png)


Once pipeline passes successfully - goto cloud9 to check if deployment is successful


Set below environment variables
```bash
export ACCOUNT_ID=$(aws sts get-caller-identity --output text --query Account)
export AWS_REGION=$(curl -s 169.254.169.254/latest/dynamic/instance-identity/document | jq -r '.region')
```


Check kubectl delpoyment:

```bash
cd ~/environment

kubectl get pods
```



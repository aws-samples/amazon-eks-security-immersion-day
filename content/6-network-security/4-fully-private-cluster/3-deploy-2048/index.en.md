---
title : "Deploy a Sample Application"
weight : 152
---

Deploy the game 2048 as a sample application to verify that the AWS Load Balancer Controller creates an AWS ALB as a result of the ingress object. Complete the steps for the type of subnet you're deploying to.

Download the manifest.


```bash
curl -O https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.5.4/docs/examples/2048/2048_full.yaml
```

Since your nodes don't have access to the Amazon ECR Public image repository, then you need to pull the following container image and push it to a repository that your nodes have access to.

Pull image from Public registry


```bash
docker pull public.ecr.aws/l6m2t8p7/docker-2048:latest
```


::::expand{header="Check Output"}
```
latest: Pulling from l6m2t8p7/docker-2048
23d07b917726: Pull complete 
75b73619860e: Pull complete 
Digest: sha256:afc96bdad819bfac184a6e9a90096b68583cf5977e66fa985143bde37e847a50
Status: Downloaded newer image for public.ecr.aws/l6m2t8p7/docker-2048:latest
public.ecr.aws/l6m2t8p7/docker-2048:latest
```
::::

Get the image id for the pulled image


```bash
IMAGE_ID=$(docker image public.ecr.aws/l6m2t8p7/docker-2048:latest -q)
```


::::expand{header="Check Output"}
```
eb0a3a80a5dd
```
::::

Tag the image that you pulled with your registry, repository, and tag. Use the IMAGE_ID variable as image id from the previous command

```bash
docker tag $IMAGE_ID $ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/docker-2048
```


Authenticate to your Private ECR registry.


```bash
aws ecr get-login-password —region $AWS_REGION | sudo docker login —username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com
```


Push the image to the Private ECR repository


```bash
docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/docker-2048
```


- The following commands would edit the file and find/replace the line that says alb.ingress.kubernetes.io/scheme: internet-facing.
- It would also change the public image repository url to the private image repository url
- Apply the manifest to your cluster.

```bash
sed -i 's/internet-facing/internal' 2048_full.yaml
sed -i 's/public.ecr.aws\/l6m2t8p7/$ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com' 2048_full.yaml
```


```bash
kubectl apply -f 2048_full.yaml
```



```bash
kubectl get ingress/ingress-2048 -n game-2048
```


An example output is as follows.

:::code{showCopyAction=false showLineNumbers=false}
NAME           CLASS    HOSTS   ADDRESS                                                                   		   PORTS   AGE
ingress-2048   <none>   *       internal-k8s-game2048-ingress2-e087aff82e-609127627.ap-south-1.elb.amazonaws.com   80      2m32s
:::

Since we have created the load balancer in a private subnet, the value under ADDRESS in the previous output is prefaced with internal-.
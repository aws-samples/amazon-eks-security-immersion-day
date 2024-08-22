---
title : "Deploy a Sample Enclave Application"
weight : 24
---

## Package your enclave application

Nitro Enclaves uses Docker images as a convenient file format for packaging your applications. You must build the Docker image that includes your enclave application and any other commands that are needed to run the application. This Docker [image](https://github.com/aws/aws-nitro-enclaves-cli/tree/main/examples/x86_64/hello) will be deployed to the worker node in the following step.

AWS provides a command line tool, **enclavectl** that automates the steps that are needed to build an enclave image file and to package your enclave image file into a Docker image. Additionally, the tool includes features that automate Amazon EKS cluster and node group creation, and application deployment. For an end-to-end tutorial on how to use the **enclavectl** tool to automate cluster creation, application packaging, and application deployment, see the [aws-nitro-enclaves-with-k8s readme file](https://github.com/aws/aws-nitro-enclaves-with-k8s/blob/main/README.md).

### Build the image

The **enclavectl** utility can be found in the `aws-nitro-enclaves-with-k8s` GitHub repo. Clone the GitHub repo and navigate into the directory.

```bash
git clone https://github.com/aws/aws-nitro-enclaves-with-k8s.git 
cd aws-nitro-enclaves-with-k8s
```

Source the `env.sh` script to add the **enclavectl** tool to you PATH variable.

```bash
source env.sh
```

Configure the **enclavectl** for the tutorial. The `settings.json` file includes some default parameters that are used only if you create a cluster using **enclavectl**.

Since we are using existing cluster, the parameters in the `settings.json` are not used; but you must run this command to configure the tool before using it.

```bash
enclavectl configure --file settings.json
```

Build the Hello Enclaves enclave image file and package it into a Docker image. The required files are located in the `/container/hello` directory. Use the `enclavectl build` command and specify the name of the directory.

```bash
enclavectl build --image hello
```

Sample output:

```bash
...
 => => naming to docker.io/library/hello-23a18b21-b1db-4a3e-99ed-6153e4a4b70e:latest 
```


The Docker image is created with a name in the following format: `hello-`*`unique_uuid`*. Note the name, you will need it in subsequent steps. To view the full name of the image, run the following command.

```bash
docker image ls | grep hello
```

::::expand{header="Check Sample Output"}

```bash
hello-23a18b21-b1db-4a3e-99ed-6153e4a4b70e   latest    610df34dea23   About a minute ago   246MB
ne-build-hello-eif                           1.0       8411dfbd4f2a   6 hours ago          4.26MB
```

::::

## Create and push the Docker image to an Amazon ECR private repository

Authenticate your Docker client to the Amazon ECR registry to which you intend to push your image.

```bash
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
```

Create an Amazon ECR private repository:

```bash
ECR_REPO="hello-23a18b21-b1db-4a3e-99ed-6153e4a4b70e"
ECR_REPO_URI=$(aws ecr create-repository --repository-name ${ECR_REPO} --region=${AWS_REGION} --query 'repository.repositoryUri' --output text)
echo $ECR_REPO_URI
```

Replace the docker image name **hello-23a18b21-b1db-4a3e-99ed-6153e4a4b70e** with the name you retrieved from the previous step:

Tag your image with the Amazon ECR registry, repository, and optional image tag name combination to use. 

```bash
docker tag ${ECR_REPO}:latest ${ECR_REPO_URI}:latest
```

Push the image using the **docker push** command:

```bash
docker push ${ECR_REPO_URI}:latest
```

## Deploy sample enclave application to the cluster

Finally, you need to deploy the application to your cluster.

### To deploy the application to the cluster

Create a deployment specification. Create a new file named `deployment_spec.yaml` and add the following content.

```bash
cat <<EOF>deployment_spec.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hello
spec:
  replicas: 1
  selector:
    matchLabels:
      app: hello
  template:
    metadata:
      labels:
        app: hello
    spec:
      containers:
      - name: hello
        image: ${ECR_REPO_URI}:latest
        command: ["/home/run.sh"]
        volumeMounts:
        - mountPath: /hugepages-2Mi
          name: hugepage-2mi
          readOnly: false
        resources:
          limits:
            aws.ec2.nitro/nitro_enclaves: "1"
            hugepages-2Mi: 512Mi
            cpu: 125m
          requests:
            aws.ec2.nitro/nitro_enclaves: "1"
            hugepages-2Mi: 512Mi
      volumes:
      - name: hugepage-2mi
        emptyDir:
          medium: HugePages-2Mi
      - name: hugepage-1gi
        emptyDir:
          medium: HugePages-1Gi
      tolerations:
      - effect: NoSchedule
        operator: Exists
      - effect: NoExecute
        operator: Exists
EOF
```

Note: The deployment specification must include the following Nitro Enclaves specific sections:

```bash
limits:
  aws.ec2.nitro/nitro_enclaves: "1"
  hugepages-2Mi: 512Mi
  cpu: 125m # when requesting hugepage resources, either memory or CPU resources must be requested as well.
```

The limits section defines the resource limits for the container and `aws.ec2.nitro/nitro_enclaves` is the resource name of the enclaves device driver defined in the device plugin.
We specify 1 nitro_enclaves so that only one application can use the enclaves device driver at the same time. Nitro Enclaves uses large contiguous memory regions and therefore requires huge pages support. See [Managing huge pages](https://kubernetes.io/docs/tasks/manage-hugepages/scheduling-hugepages/) to learn more.

Apply the deployment specification to the cluster and deploy the application. Use the `kubectl apply` command and specify the deployment specification file.

```bash
kubectl apply -f deployment_spec.yaml
```

Check deployment status of the hello application:

```bash
kubectl get pods --selector app=hello --watch -o wide 
```

::::expand{header="Check Sample Output"}

```bash
NAME                     READY   STATUS    RESTARTS   AGE   IP               NODE                                         NOMINATED NODE   READINESS GATES
hello-675b5df4f6-w2qk8   1/1     Running   0          5s    10.254.191.250   ip-10-254-133-18.us-west-2.compute.internal   <none>           <none>
```

::::

Check the logs:

```bash
kubectl logs hello-675b5df4f6-w2qk8
```

::::expand{header="Check Sample Output"}

```bash
Start allocating memory...
Started enclave with enclave-cid: 16, memory: 128 MiB, cpu-ids: [1, 5]
...
[   1] Hello from the enclave side!
[   2] Hello from the enclave side!
[   3] Hello from the enclave side!
[   4] Hello from the enclave side!
[   5] Hello from the enclave side!
```

::::

The application keeps printing "Hello from the enclave side!" message every 5 seconds.

For further confirmation, you can check how the enclave resource on the node is allocated:

```bash
kubectl describe node -l aws-nitro-enclaves-k8s-dp=enabled | egrep 'Allocated' -A9
```

::::expand{header="Check Sample Output"}

```bash
Allocated resources:
  (Total limits may be over 100 percent, i.e., overcommitted.)
  Resource                      Requests     Limits
  --------                      --------     ------
  cpu                           285m (3%)    225m (2%)
  memory                        15Mi (0%)    15Mi (0%)
  ephemeral-storage             0 (0%)       0 (0%)
  hugepages-1Gi                 0 (0%)       0 (0%)
  hugepages-2Mi                 512Mi (12%)  512Mi (12%)
  aws.ec2.nitro/nitro_enclaves  1            1
--
```

::::

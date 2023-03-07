---
title : "Validating the Bottlerocket AMI against the CIS Benchmark"
weight : 24
---

After deploying a managed node group that adheres to the CIS Benchmark, we can use the commands outlined in the benchmark to verify the configuration, as 26 of the 28 checks are able to be automatically audited. For this step, we created a container to execute a script to perform the validation and a Kubernetes pod configuration to deploy the container to the cluster. This deployment method is idempotent in nature, so it can be executed once to verify initial configuration and regularly afterwards to detect any configuration drift.

First, we’ll need to again create an Amazon ECR repository to house the validation image:

```bash
cd ~/environment/containers-blog-maelstrom/cis-bottlerocket-benchmark-eks/bottlerocket-cis-validating-image
chmod +x create-ecr-repo.sh
./create-ecr-repo.sh
```

The output looks like below

```bash
An error occurred (RepositoryNotFoundException) when calling the DescribeRepositories operation: The repository with name 'bottlerocket-cis-validation-image' does not exist in the registry with id 'XXXXXXXXXXX'
XXXXXXXXXXX.dkr.ecr.us-west-2.amazonaws.com/bottlerocket-cis-validation-image does not exist. So creating it...
ECR_REPO_URI=XXXXXXXXXXX.dkr.ecr.us-west-2.amazonaws.com/bottlerocket-cis-validation-image
```

Second, we’ll build the validation container and put it in the newly created Amazon ECR reposition:

```bash
make
```

The output looks like below

```bash
Building the docker image: bottlerocket-cis-validation-image:latest using bottlerocket-cis-validation-image/Dockerfile...
Sending build context to Docker daemon  19.97kB
Step 1/5 : FROM alpine
 ---> 6dbb9cc54074
Step 2/5 : COPY ./validating-script.sh /
 ---> d1985764782d
Step 3/5 : RUN chmod +x /validating-script.sh
 ---> Running in d0e748099b9f
Removing intermediate container d0e748099b9f
 ---> 00558a658bd6
Step 4/5 : RUN apk update && apk add bash && apk add iptables && apk add ip6tables
 ---> Running in 1dbeaff9cebb
fetch https://dl-cdn.alpinelinux.org/alpine/v3.13/main/x86_64/APKINDEX.tar.gz
fetch https://dl-cdn.alpinelinux.org/alpine/v3.13/community/x86_64/APKINDEX.tar.gz
v3.13.12-94-g0551adbecc [https://dl-cdn.alpinelinux.org/alpine/v3.13/main]
v3.13.12-94-g0551adbecc [https://dl-cdn.alpinelinux.org/alpine/v3.13/community]
OK: 13907 distinct packages available
(1/4) Installing ncurses-terminfo-base (6.2_p20210109-r1)
(2/4) Installing ncurses-libs (6.2_p20210109-r1)
(3/4) Installing readline (8.1.0-r0)
(4/4) Installing bash (5.1.16-r0)
Executing bash-5.1.16-r0.post-install
Executing busybox-1.32.1-r6.trigger
OK: 8 MiB in 18 packages
(1/3) Installing libmnl (1.0.4-r1)
(2/3) Installing libnftnl-libs (1.1.8-r0)
(3/3) Installing iptables (1.8.6-r0)
Executing busybox-1.32.1-r6.trigger
OK: 10 MiB in 21 packages
(1/1) Installing ip6tables (1.8.6-r0)
Executing busybox-1.32.1-r6.trigger
OK: 11 MiB in 22 packages
Removing intermediate container 1dbeaff9cebb
 ---> ab9929302da8
Step 5/5 : ENTRYPOINT ["bash", "/validating-script.sh"]
 ---> Running in 252b04204078
Removing intermediate container 252b04204078
 ---> f43b91cb113e
Successfully built f43b91cb113e
Successfully tagged XXXXXXXXXXX.dkr.ecr.us-east-1.amazonaws.com/bottlerocket-cis-validation-image:latest
Pushing the docker image for XXXXXXXXXXX.dkr.ecr.us-east-1.amazonaws.com/bottlerocket-cis-validation-image:latest ...
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin XXXXXXXXXXX.dkr.ecr.us-east-1.amazonaws.com/bottlerocket-cis-validation-image
WARNING! Your password will be stored unencrypted in /home/ec2-user/.docker/config.json.
Configure a credential helper to remove this warning. See
https://docs.docker.com/engine/reference/commandline/login/#credentials-store

Login Succeeded

Logging in with your password grants your terminal complete access to your account. 
For better security, log in with a limited-privilege personal access token. Learn more at https://docs.docker.com/go/access-tokens/
The push refers to repository [XXXXXXXXXXX.dkr.ecr.us-east-1.amazonaws.com/bottlerocket-cis-validation-image]
ab6dd5fb8454: Pushed 
e074ab1fd705: Pushed 
f5511157c85c: Pushed 
b2d5eeeaba3a: Pushed 
latest: digest: sha256:860de03d8a99db479f7c966f66f20c19e7aa04cccdedd3784b649ba64bda6cf4 size: 1155
```

Let's go to the [Amazon ECR console](https://us-east-1.console.aws.amazon.com/ecr/get-started?region=us-east-1) and ensure that the Repository is created and the validating container image is pushed successfully.

![bottlerocket-cis-validating-image](/static/images/regulatory-compliance/cis-bottlerocket-eks/bottlerocket-cis-validating-image.png)


Third, we will use another cat command to insert the environment variables defined previously into the job-eks.yaml file located at the root of the GitHub repository. This file is used to deploy the Kubernetes batch job object which references the validation image onto the cluster:

```bash
cd ..
cat > job-eks.yaml <<EOF
---
apiVersion: batch/v1
kind: Job
metadata:
  name: eks-cis-benchmark
spec:
  ttlSecondsAfterFinished: 600
  template:
    metadata:
      labels:
        app: eks-cis-benchmark  
    spec:
      hostNetwork: true
      nodeSelector:
         eks.amazonaws.com/nodegroup: bottlerocket-mng     
      containers:
        - name: eks-cis-benchmark
          image: $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$VALIDATION_ECR_REPO
          imagePullPolicy: Always
          securityContext:
            capabilities:
              add: ["SYS_ADMIN", "NET_ADMIN", "CAP_SYS_ADMIN"]
          volumeMounts:
          - mountPath: /.bottlerocket/rootfs
            name: btl-root
      volumes:
      - name: btl-root
        hostPath:
          path: /
      restartPolicy: Never
EOF
```

Apply the batch job using kubectl and check if the pod completed the execution:

```bash
kubectl apply -f job-eks.yaml
kubectl get Job,pod
```
The output looks like the following:

```bash
jp:~/environment/eks-cis-bottlerocket (main) $ kubectl get Job,pod
NAME                          COMPLETIONS   DURATION   AGE
job.batch/eks-cis-benchmark   1/1           5s         43s

NAME                          READY   STATUS      RESTARTS   AGE
pod/eks-cis-benchmark-c4k5h   0/1     Completed   0          43s
pod/nginx-6c8b449b8f-29ldd    1/1     Running     0          5m20s          0                2m27s
```

Once the batch job has completed, we can view the pod logs to verify the CIS Bottlerocket Benchmark compliance status of the node:


```bash
POD_NAME=$(kubectl get pods -l=app=eks-cis-benchmark -o=jsonpath={.items..metadata.name})
kubectl logs $POD_NAME
```

The output should look like the following:

```bash
This tool validates the Amazon EKS optimized AMI against CIS Bottlerocket Benchmark v1.0.0
[PASS] 1.1.1.1 Ensure mounting of udf filesystems is disabled (Automated)
[PASS] 1.3.1 Ensure dm-verity is configured (Automated)
[PASS] 1.4.1 Ensure setuid programs do not create core dumps (Automated)
[PASS] 1.4.2 Ensure address space layout randomization (ASLR) is enabled (Automated)
[PASS] 1.4.3 Ensure unprivileged eBPF is disabled (Automated)
[PASS] 1.4.4 Ensure user namespaces are disabled (Automated)
[PASS] 1.5.1 Ensure SELinux is configured (Automated)
[PASS] 1.5.2 Ensure Lockdown is configured (Automated)
[PASS] 2.1.1.1 Ensure chrony is configured (Automated)
[PASS] 3.1.1 Ensure packet redirect sending is disabled (Automated)
[PASS] 3.2.1 Ensure source routed packets are not accepted (Automated)
[PASS] 3.2.2 Ensure ICMP redirects are not accepted (Automated)
[PASS] 3.2.3 Ensure secure ICMP redirects are not accepted (Automated)
[PASS] 3.2.4 Ensure suspicious packets are logged (Automated)
[PASS] 3.2.5 Ensure broadcast ICMP requests are ignored (Automated)
[PASS] 3.2.6 Ensure bogus ICMP responses are ignored (Automated)
[PASS] 3.2.7 Ensure TCP SYN Cookies is enabled (Automated)
[PASS] 3.3.1 Ensure SCTP is disabled (Automated)
[PASS] 3.4.1.1 Ensure IPv4 default deny firewall policy (Automated)
[PASS] 3.4.1.2 Ensure IPv4 loopback traffic is configured (Automated)
[PASS] 3.4.1.3 Ensure IPv4 outbound and established connections are configured (Manual)
[PASS] 3.4.2.1 Ensure IPv6 default deny firewall policy (Automated)
[PASS] 3.4.2.2 Ensure IPv6 loopback traffic is configured (Automated)
[PASS] 3.4.2.3 Ensure IPv6 outbound and established connections are configured (Manual)
[PASS] 4.1.1.1 Ensure journald is configured to write logs to persistent disk (Automated)
[PASS] 4.1.2 Ensure permissions on journal files are configured (Automated)
26/26 checks passed
```




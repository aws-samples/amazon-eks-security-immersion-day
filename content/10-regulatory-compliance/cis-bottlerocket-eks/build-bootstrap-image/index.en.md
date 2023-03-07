---
title : "Building a bootstrap container image"
weight : 21
---


[Bootstrap containers](https://github.com/bottlerocket-os/bottlerocket#bootstrap-containers-settings) on Bottlerocket are specialized host containers that run on a new node as it is launched. Bootstrap containers are used to configure host OS settings that are not available via the Bottlerocket API. For the CIS Benchmark for Bottlerocket, a bootstrap container is needed to update the iptables rules of the host to be in compliance with Level 2 of the CIS Benchmark. The bootstrap container’s Entrypoint executes the following bash script, which, aside from the rules allowing inbound kubelet traffic to the instance, is sourced directly from the Benchmark documentation.

Take a look at the **bottlerocket-cis-bootstrap-image/bootstrap-script.sh** to see how ip tables rules are configured.


```bash
#!/usr/bin/env bash

# Flush iptables rules
iptables -F

# 3.4.1.1 Ensure IPv4 default deny firewall policy (Automated)
iptables -P INPUT DROP
iptables -P OUTPUT DROP
iptables -P FORWARD DROP

# Allow inbound traffic for kubelet (so kubectl logs/exec works)
iptables -I INPUT -p tcp -m tcp --dport 10250 -j ACCEPT

# 3.4.1.2 Ensure IPv4 loopback traffic is configured (Automated)
iptables -A INPUT -i lo -j ACCEPT
iptables -A OUTPUT -o lo -j ACCEPT
iptables -A INPUT -s 127.0.0.0/8 -j DROP

# 3.4.1.3 Ensure IPv4 outbound and established connections are configured (Manual)
iptables -A OUTPUT -p tcp -m state --state NEW,ESTABLISHED -j ACCEPT
iptables -A OUTPUT -p udp -m state --state NEW,ESTABLISHED -j ACCEPT
iptables -A OUTPUT -p icmp -m state --state NEW,ESTABLISHED -j ACCEPT
iptables -A INPUT -p tcp -m state --state ESTABLISHED -j ACCEPT
iptables -A INPUT -p udp -m state --state ESTABLISHED -j ACCEPT
iptables -A INPUT -p icmp -m state --state ESTABLISHED -j ACCEPT

# Flush ip6tables rules 
ip6tables -F

# 3.4.2.1 Ensure IPv6 default deny firewall policy (Automated)
ip6tables -P INPUT DROP
ip6tables -P OUTPUT DROP
ip6tables -P FORWARD DROP

# Allow inbound traffic for kubelet on ipv6 if needed (so kubectl logs/exec works)
ip6tables -A INPUT -p tcp --destination-port 10250 -j ACCEPT

# 3.4.2.2 Ensure IPv6 loopback traffic is configured (Automated)
ip6tables -A INPUT -i lo -j ACCEPT
ip6tables -A OUTPUT -o lo -j ACCEPT
ip6tables -A INPUT -s ::1 -j DROP

# 3.4.2.3 Ensure IPv6 outbound and established connections are configured (Manual)
ip6tables -A OUTPUT -p tcp -m state --state NEW,ESTABLISHED -j ACCEPT
ip6tables -A OUTPUT -p udp -m state --state NEW,ESTABLISHED -j ACCEPT
ip6tables -A OUTPUT -p icmp -m state --state NEW,ESTABLISHED -j ACCEPT
ip6tables -A INPUT -p tcp -m state --state ESTABLISHED -j ACCEPT
ip6tables -A INPUT -p udp -m state --state ESTABLISHED -j ACCEPT
ip6tables -A INPUT -p icmp -m state --state ESTABLISHED -j ACCEPT
```

Make a note to a special rule to allow inbound traffic at port `10250` for kubelet. This is required to enable use cases such as kubectl logs and kubectl exec. We will test these commands later in the workshop to see if it works.


We’ll use a script from the repository to create an Amazon Elastic Container Registry ([Amazon ECR](https://docs.aws.amazon.com/ecr/?icmpid=docs_homepage_containers)) repository to store the container image. You can safely ignore the error message An error occurred (RepositoryNotFoundException) output while running the script.

Run the below commands.

```bash
cd ~/environment/containers-blog-maelstrom/cis-bottlerocket-benchmark-eks/bottlerocket-cis-bootstrap-image
chmod +x create-ecr-repo.sh
./create-ecr-repo.sh
```

The output looks like below.

```bash
An error occurred (RepositoryNotFoundException) when calling the DescribeRepositories operation: The repository with name 'bottlerocket-cis-bootstrap-image' does not exist in the registry with id 'XXXXXXXXXXX'
XXXXXXXXXXX.dkr.ecr.XXus-west-2.amazonaws.com/bottlerocket-cis-bootstrap-image does not exist. So creating it...
ECR_REPO_URI=XXXXXXXXXXX.dkr.ecr.XXus-west-2.amazonaws.com/bottlerocket-cis-bootstrap-image
```
Ignore the above error `RepositoryNotFoundException`

Next, let’s build the bootstrap container image and push it to the newly created Amazon ECR repository.

```bash
make
```

The output from the make command should look like the following code:

```bash
Building the docker image: bottlerocket-cis-bootstrap-image-t:latest using bottlerocket-cis-bootstrap-image-t/Dockerfile...
[+] Building 3.3s (9/9) FINISHED                                                                                                                                                       
 => [internal] load build definition from Dockerfile                                                                                                                              0.0s
 => => transferring dockerfile: 226B                                                                                                                                              0.0s
 => [internal] load .dockerignore                                                                                                                                                 0.0s
 => => transferring context: 2B                                                                                                                                                   0.0s
 => [internal] load metadata for docker.io/library/alpine:latest                                                                                                                  0.7s
 => CACHED [1/4] FROM docker.io/library/alpine@sha256:b95359c2505145f16c6aa384f9cc74eeff78eb36d308ca4fd902eeeb0a0b161b                                                            0.0s
 => [internal] load build context                                                                                                                                                 0.0s
 => => transferring context: 2.10kB                                                                                                                                               0.0s
 => [2/4] COPY ./bootstrap-script.sh /                                                                                                                                            0.0s
 => [3/4] RUN chmod +x /bootstrap-script.sh                                                                                                                                       0.4s
 => [4/4] RUN apk update && apk add bash && apk add iptables && apk add ip6tables                                                                                                 2.0s
 => exporting to image                                                                                                                                                            0.1s
 => => exporting layers                                                                                                                                                           0.1s
 => => writing image sha256:e1bb2264fd429e4b47f79af6035684b1ebc34e6fcd9b784c540ec16a56baaccb                                                                                      0.0s 
 => => naming to XXXXXXXXX.dkr.ecr.us-east-1.amazonaws.com/bottlerocket-cis-bootstrap-image-t:latest                                                                           0.0s 
                                                                                                                                                                                       
Use 'docker scan' to run Snyk tests against images to find vulnerabilities and learn how to fix them                                                                                   
#@docker build --no-cache -f ./bottlerocket-cis-bootstrap-image-t/Dockerfile -t  XXXXXXXXX.dkr.ecr.us-east-1.amazonaws.com/bottlerocket-cis-bootstrap-image-t:latest 
Pushing the docker image for XXXXXXXXX.dkr.ecr.us-east-1.amazonaws.com/bottlerocket-cis-bootstrap-image-t:latest ...
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin XXXXXXXXX.dkr.ecr.us-east-1.amazonaws.com/bottlerocket-cis-bootstrap-image-t
Login Succeeded
The push refers to repository [XXXXXXXXX.dkr.ecr.us-east-1.amazonaws.com/bottlerocket-cis-bootstrap-image-t]
132f2a14454d: Pushed 
fbadbb73a582: Pushed 
3fa058784363: Pushed 
e5e13b0c77cb: Pushed 
latest: digest: sha256:97856f5c9ec99320b6009a8f37389ce91086d3fbf815301abc4e81a08f1c43b2 size: 1153
```

Let's go to the [Amazon ECR console](https://us-east-1.console.aws.amazon.com/ecr/get-started?region=us-east-1) and ensure that the Repository is created and the bootstrap container image is pushed successfully.

![bottlerocket-cis-bootstrap-image](/static/images/regulatory-compliance/cis-bottlerocket-eks/bottlerocket-cis-bootstrap-image.png)


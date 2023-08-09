---
title : "Lab 4: Running kube-bench in Debug mode (Optional)"
weight : 21
---

In this lab, we will create a kube-bench batch job in debug mode in EKS cluster to run the CIS Amazon EKS Benchmark assessment.
1. Open the [AWS Cloud9 console](https://console.aws.amazon.com/cloud9/) created for the workshop 
2. Create Debug Job
```shell
cat <<EOF | kubectl apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: kube-bench-debug
spec:
  template:
    spec:
      hostPID: true
      containers:
        - name: kube-bench
          image: docker.io/aquasec/kube-bench:latest
          command:
            [
              "kube-bench",
              "run",
              "--targets",
              "node",
              "--benchmark",
              "eks-1.2.0",
              "-v", 
              "3", 
              "--logtostderr"
            ]
          volumeMounts:
            - name: var-lib-kubelet
              mountPath: /var/lib/kubelet
              readOnly: true
            - name: etc-systemd
              mountPath: /etc/systemd
              readOnly: true
            - name: etc-kubernetes
              mountPath: /etc/kubernetes
              readOnly: true
      restartPolicy: Never
      volumes:
        - name: var-lib-kubelet
          hostPath:
            path: "/var/lib/kubelet"
        - name: etc-systemd
          hostPath:
            path: "/etc/systemd"
        - name: etc-kubernetes
          hostPath:
            path: "/etc/kubernetes"
EOF
```
3. View kube-bench job Logs
```shell
kubectl logs jobs/kube-bench-debug 
```
::::expand{header="Check Output"}
```shell
NAME               READY   STATUS      RESTARTS   AGE
kube-bench-87h5h   0/1     Completed   0          4s
```
::::
4. View the Logs
```shell
kubectl logs jobs/kube-bench
```
::::expand{header="Check Output"}
```shell
I0730 08:21:23.230375   22854 util.go:489] Checking for oc
I0730 08:21:23.230521   22854 util.go:518] Can't find oc command: exec: "oc": executable file not found in $PATH
I0730 08:21:23.230542   22854 kubernetes_version.go:36] Try to get version from Rest API
I0730 08:21:23.230599   22854 kubernetes_version.go:161] Loading CA certificate
I0730 08:21:23.230624   22854 kubernetes_version.go:115] getWebData srvURL: https://kubernetes.default.svc/version
I0730 08:21:23.253903   22854 kubernetes_version.go:100] vd: {
  "major": "1",
  "minor": "25+",
  "gitVersion": "v1.25.11-eks-a5565ad",
  "gitCommit": "df109513ba589adaee235b4e658476275d1fde31",
  "gitTreeState": "clean",
  "buildDate": "2023-06-16T17:35:00Z",
  "goVersion": "go1.19.10",
  "compiler": "gc",
  "platform": "linux/amd64"
}
I0730 08:21:23.253997   22854 kubernetes_version.go:105] vrObj: &cmd.VersionResponse{Major:"1", Minor:"25+", GitVersion:"v1.25.11-eks-a5565ad", GitCommit:"df109513ba589adaee235b4e658476275d1fde31", GitTreeState:"clean", BuildDate:"2023-06-16T17:35:00Z", GoVersion:"go1.19.10", Compiler:"gc", Platform:"linux/amd64"}
I0730 08:21:23.254012   22854 util.go:294] Kubernetes REST API Reported version: &{1 25+  v1.25.11-eks-a5565ad}
I0730 08:21:23.254081   22854 common.go:352] Kubernetes version: "" to Benchmark version: "eks-1.2.0"
I0730 08:21:23.254091   22854 run.go:40] Checking targets [node] for eks-1.2.0
I0730 08:21:23.254310   22854 common.go:275] Using config file: cfg/eks-1.2.0/config.yaml
I0730 08:21:23.254345   22854 run.go:75] Running tests from files [cfg/eks-1.2.0/node.yaml]
I0730 08:21:23.254382   22854 common.go:79] Using test file: cfg/eks-1.2.0/node.yaml
I0730 08:21:23.254416   22854 util.go:80] ps - proc: "hyperkube"
I0730 08:21:23.269211   22854 util.go:84] [/bin/ps -C hyperkube -o cmd --no-headers]: exit status 1
I0730 08:21:23.269401   22854 util.go:87] ps - returning: ""
I0730 08:21:23.269433   22854 util.go:228] reFirstWord.Match()
I0730 08:21:23.269439   22854 util.go:258] executable 'hyperkube kubelet' not running
I0730 08:21:23.269446   22854 util.go:80] ps - proc: "kubelet"
I0730 08:21:23.288074   22854 util.go:87] ps - returning: "/usr/bin/kubelet --config /etc/kubernetes/kubelet/kubelet-config.json --kubeconfig /var/lib/kubelet/kubeconfig --container-runtime-endpoint unix:///run/containerd/containerd.sock --image-credential-provider-config /etc/eks/image-credential-provider/config.json --image-credential-provider-bin-dir /etc/eks/image-credential-provider --node-ip=10.254.193.104 --pod-infra-container-image=602401143452.dkr.ecr.us-west-2.amazonaws.com/eks/pause:3.5 --v=2 --cloud-provider=aws --container-runtime=remote --node-labels=eks.amazonaws.com/nodegroup-image=ami-0a419d1a5b24a5d95,eks.amazonaws.com/capacityType=ON_DEMAND,eks.amazonaws.com/nodegroup=mng-al2 --max-pods=8\n"
I0730 08:21:23.288145   22854 util.go:228] reFirstWord.Match(/usr/bin/kubelet --config /etc/kubernetes/kubelet/kubelet-config.json --kubeconfig /var/lib/kubelet/kubeconfig --container-runtime-endpoint unix:///run/containerd/containerd.sock --image-credential-provider-config /etc/eks/image-credential-provider/config.json --image-credential-provider-bin-dir /etc/eks/image-credential-provider --node-ip=10.254.193.104 --pod-infra-container-image=602401143452.dkr.ecr.us-west-2.amazonaws.com/eks/pause:3.5 --v=2 --cloud-provider=aws --container-runtime=remote --node-labels=eks.amazonaws.com/nodegroup-image=ami-0a419d1a5b24a5d95,eks.amazonaws.com/capacityType=ON_DEMAND,eks.amazonaws.com/nodegroup=mng-al2 --max-pods=8)
I0730 08:21:23.288159   22854 util.go:116] Component kubelet uses running binary kubelet
I0730 08:21:23.288194   22854 util.go:80] ps - proc: "kube-proxy"
I0730 08:21:23.314390   22854 util.go:87] ps - returning: "kube-proxy --v=2 --config=/var/lib/kube-proxy-config/config --hostname-override=ip-10-254-193-104.us-west-2.compute.internal\n"
I0730 08:21:23.314447   22854 util.go:228] reFirstWord.Match(kube-proxy --v=2 --config=/var/lib/kube-proxy-config/config --hostname-override=ip-10-254-193-104.us-west-2.compute.internal)
I0730 08:21:23.314463   22854 util.go:116] Component proxy uses running binary kube-proxy
I0730 08:21:23.314541   22854 util.go:201] Component kubelet uses config file '/etc/kubernetes/kubelet/kubelet-config.json'
I0730 08:21:23.314600   22854 util.go:194] Using default config file name '/etc/kubernetes/addons/kube-proxy-daemonset.yaml' for component proxy
I0730 08:21:23.314619   22854 util.go:194] Using default config file name '/etc/kubernetes/config' for component kubernetes
I0730 08:21:23.314652   22854 util.go:201] Component kubelet uses service file '/etc/systemd/system/kubelet.service'
I0730 08:21:23.314698   22854 util.go:197] Missing service file for proxy
I0730 08:21:23.314728   22854 util.go:197] Missing service file for kubernetes
I0730 08:21:23.314761   22854 util.go:201] Component kubelet uses kubeconfig file '/var/lib/kubelet/kubeconfig'
I0730 08:21:23.314814   22854 util.go:201] Component proxy uses kubeconfig file '/var/lib/kubelet/kubeconfig'
I0730 08:21:23.314845   22854 util.go:197] Missing kubeconfig file for kubernetes
I0730 08:21:23.314874   22854 util.go:201] Component kubelet uses ca file '/etc/kubernetes/pki/ca.crt'
I0730 08:21:23.314901   22854 util.go:197] Missing ca file for proxy
I0730 08:21:23.314925   22854 util.go:197] Missing ca file for kubernetes
I0730 08:21:23.314951   22854 util.go:197] Missing datadir file for kubelet
I0730 08:21:23.314969   22854 util.go:197] Missing datadir file for proxy
I0730 08:21:23.314994   22854 util.go:197] Missing datadir file for kubernetes
I0730 08:21:23.315015   22854 util.go:388] Substituting $kubeletbin with 'kubelet'
I0730 08:21:23.315038   22854 util.go:388] Substituting $proxybin with 'kube-proxy'
I0730 08:21:23.315049   22854 util.go:388] Substituting $kubernetesconf with '/etc/kubernetes/config'
I0730 08:21:23.315059   22854 util.go:388] Substituting $kubeletconf with '/etc/kubernetes/kubelet/kubelet-config.json'
I0730 08:21:23.315085   22854 util.go:388] Substituting $proxyconf with '/etc/kubernetes/addons/kube-proxy-daemonset.yaml'
I0730 08:21:23.315094   22854 util.go:388] Substituting $kubernetessvc with 'kubernetes'
I0730 08:21:23.315102   22854 util.go:388] Substituting $kubeletsvc with '/etc/systemd/system/kubelet.service'
I0730 08:21:23.315125   22854 util.go:388] Substituting $proxysvc with 'proxy'
I0730 08:21:23.315136   22854 util.go:388] Substituting $kuberneteskubeconfig with 'kubernetes'
I0730 08:21:23.315144   22854 util.go:388] Substituting $kubeletkubeconfig with '/var/lib/kubelet/kubeconfig'
I0730 08:21:23.315160   22854 util.go:388] Substituting $proxykubeconfig with '/var/lib/kubelet/kubeconfig'
I0730 08:21:23.315168   22854 util.go:388] Substituting $kubeletcafile with '/etc/kubernetes/pki/ca.crt'
I0730 08:21:23.315175   22854 util.go:388] Substituting $proxycafile with 'proxy'
I0730 08:21:23.315182   22854 util.go:388] Substituting $kubernetescafile with 'kubernetes'
I0730 08:21:23.315189   22854 util.go:388] Substituting $kubeletdatadir with 'kubelet'
I0730 08:21:23.315196   22854 util.go:388] Substituting $proxydatadir with 'proxy'
I0730 08:21:23.315203   22854 util.go:388] Substituting $kubernetesdatadir with 'kubernetes'
I0730 08:21:23.316387   22854 check.go:110] -----   Running check 3.1.1   -----
I0730 08:21:23.322412   22854 check.go:309] Command: "/bin/sh -c 'if test -e /var/lib/kubelet/kubeconfig; then stat -c permissions=%a /var/lib/kubelet/kubeconfig; fi'"
I0730 08:21:23.322565   22854 check.go:310] Output:
 "permissions=644\n"
I0730 08:21:23.322580   22854 check.go:231] Running 1 test_items
I0730 08:21:23.322657   22854 test.go:153] In flagTestItem.findValue 644
I0730 08:21:23.322679   22854 test.go:247] Flag 'permissions' exists
I0730 08:21:23.322683   22854 check.go:255] Used auditCommand
I0730 08:21:23.322697   22854 check.go:287] Returning from execute on tests: finalOutput &check.testOutput{testResult:true, flagFound:false, actualResult:"permissions=644", ExpectedResult:"permissions has permissions 644, expected 644 or more restrictive"}
I0730 08:21:23.322737   22854 check.go:184] Command: "" TestResult: true State: "PASS" 
I0730 08:21:23.322747   22854 check.go:110] -----   Running check 3.1.2   -----
I0730 08:21:23.324927   22854 check.go:309] Command: "/bin/sh -c 'if test -e /var/lib/kubelet/kubeconfig; then stat -c %U:%G /var/lib/kubelet/kubeconfig; fi'"
I0730 08:21:23.324957   22854 check.go:310] Output:
 "root:root\n"
I0730 08:21:23.324964   22854 check.go:231] Running 1 test_items
I0730 08:21:23.325002   22854 test.go:153] In flagTestItem.findValue root:root
I0730 08:21:23.325011   22854 test.go:247] Flag 'root:root' exists
I0730 08:21:23.325016   22854 check.go:255] Used auditCommand
I0730 08:21:23.325022   22854 check.go:287] Returning from execute on tests: finalOutput &check.testOutput{testResult:true, flagFound:false, actualResult:"root:root", ExpectedResult:"'root:root' is present"}
I0730 08:21:23.325038   22854 check.go:184] Command: "" TestResult: true State: "PASS" 
I0730 08:21:23.325092   22854 check.go:110] -----   Running check 3.1.3   -----
I0730 08:21:23.326888   22854 check.go:309] Command: "/bin/sh -c 'if test -e /etc/kubernetes/kubelet/kubelet-config.json; then stat -c permissions=%a /etc/kubernetes/kubelet/kubelet-config.json; fi'"
I0730 08:21:23.326916   22854 check.go:310] Output:
 "permissions=644\n"
I0730 08:21:23.326922   22854 check.go:231] Running 1 test_items
I0730 08:21:23.326969   22854 test.go:153] In flagTestItem.findValue 644
I0730 08:21:23.326981   22854 test.go:247] Flag 'permissions' exists
I0730 08:21:23.326985   22854 check.go:255] Used auditCommand
I0730 08:21:23.326992   22854 check.go:287] Returning from execute on tests: finalOutput &check.testOutput{testResult:true, flagFound:false, actualResult:"permissions=644", ExpectedResult:"permissions has permissions 644, expected 644 or more restrictive"}
I0730 08:21:23.327009   22854 check.go:184] Command: "" TestResult: true State: "PASS" 
I0730 08:21:23.327017   22854 check.go:110] -----   Running check 3.1.4   -----
I0730 08:21:23.330406   22854 check.go:309] Command: "/bin/sh -c 'if test -e /etc/kubernetes/kubelet/kubelet-config.json; then stat -c %U:%G /etc/kubernetes/kubelet/kubelet-config.json; fi'"
I0730 08:21:23.330439   22854 check.go:310] Output:
 "root:root\n"
I0730 08:21:23.330446   22854 check.go:231] Running 1 test_items
I0730 08:21:23.330491   22854 test.go:153] In flagTestItem.findValue root:root
I0730 08:21:23.330498   22854 test.go:247] Flag 'root:root' exists
I0730 08:21:23.330502   22854 check.go:255] Used auditCommand
I0730 08:21:23.330509   22854 check.go:287] Returning from execute on tests: finalOutput &check.testOutput{testResult:true, flagFound:false, actualResult:"root:root", ExpectedResult:"'root:root' is present"}
I0730 08:21:23.330527   22854 check.go:184] Command: "" TestResult: true State: "PASS" 
I0730 08:21:23.330536   22854 check.go:110] -----   Running check 3.2.1   -----
I0730 08:21:23.352148   22854 check.go:309] Command: "/bin/ps -fC kubelet"
I0730 08:21:23.352321   22854 check.go:310] Output:
 "UID        PID  PPID  C STIME TTY          TIME CMD\nroot      2839     1  1 Jul29 ?        00:14:22 /usr/bin/kubelet --config /etc/kubernetes/kubelet/kubelet-config.json --kubeconfig /var/lib/kubelet/kubeconfig --container-runtime-endpoint unix:///run/containerd/containerd.sock --image-credential-provider-config /etc/eks/image-credential-provider/config.json --image-credential-provider-bin-dir /etc/eks/image-credential-provider --node-ip=10.254.193.104 --pod-infra-container-image=602401143452.dkr.ecr.us-west-2.amazonaws.com/eks/pause:3.5 --v=2 --cloud-provider=aws --container-runtime=remote --node-labels=eks.amazonaws.com/nodegroup-image=ami-0a419d1a5b24a5d95,eks.amazonaws.com/capacityType=ON_DEMAND,eks.amazonaws.com/nodegroup=mng-al2 --max-pods=8\n"
I0730 08:21:23.357021   22854 check.go:309] Command: "/bin/cat /etc/kubernetes/kubelet/kubelet-config.json"
I0730 08:21:23.357201   22854 check.go:310] Output:
 "{\n  \"kind\": \"KubeletConfiguration\",\n  \"apiVersion\": \"kubelet.config.k8s.io/v1beta1\",\n  \"address\": \"0.0.0.0\",\n  \"authentication\": {\n    \"anonymous\": {\n      \"enabled\": false\n    },\n    \"webhook\": {\n      \"cacheTTL\": \"2m0s\",\n      \"enabled\": true\n    },\n    \"x509\": {\n      \"clientCAFile\": \"/etc/kubernetes/pki/ca.crt\"\n    }\n  },\n  \"authorization\": {\n    \"mode\": \"Webhook\",\n    \"webhook\": {\n      \"cacheAuthorizedTTL\": \"5m0s\",\n      \"cacheUnauthorizedTTL\": \"30s\"\n    }\n  },\n  \"clusterDomain\": \"cluster.local\",\n  \"hairpinMode\": \"hairpin-veth\",\n  \"readOnlyPort\": 0,\n  \"cgroupDriver\": \"systemd\",\n  \"cgroupRoot\": \"/\",\n  \"featureGates\": {\n    \"RotateKubeletServerCertificate\": true,\n    \"KubeletCredentialProviders\": true\n  },\n  \"protectKernelDefaults\": true,\n  \"serializeImagePulls\": false,\n  \"serverTLSBootstrap\": true,\n  \"tlsCipherSuites\": [\n    \"TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256\",\n    \"TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256\",\n    \"TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305\",\n    \"TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305\",\n    \"TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_RSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_RSA_WITH_AES_128_GCM_SHA256\"\n  ],\n  \"clusterDNS\": [\n    \"172.20.0.10\"\n  ],\n  \"kubeAPIQPS\": 10,\n  \"kubeAPIBurst\": 20,\n  \"evictionHard\": {\n    \"memory.available\": \"100Mi\",\n    \"nodefs.available\": \"10%\",\n    \"nodefs.inodesFree\": \"5%\"\n  },\n  \"kubeReserved\": {\n    \"cpu\": \"70m\",\n    \"ephemeral-storage\": \"1Gi\",\n    \"memory\": \"343Mi\"\n  },\n  \"systemReservedCgroup\": \"/system\",\n  \"kubeReservedCgroup\": \"/runtime\"\n}\n"
I0730 08:21:23.357465   22854 check.go:231] Running 1 test_items
I0730 08:21:23.357519   22854 test.go:153] In flagTestItem.findValue 
I0730 08:21:23.357725   22854 test.go:247] Flag '--anonymous-auth' does not exist
I0730 08:21:23.357917   22854 test.go:171] In pathTestItem.findValue false
I0730 08:21:23.358003   22854 test.go:249] Path '{.authentication.anonymous.enabled}' exists
I0730 08:21:23.358059   22854 check.go:255] Used auditConfig
I0730 08:21:23.358121   22854 check.go:287] Returning from execute on tests: finalOutput &check.testOutput{testResult:true, flagFound:false, actualResult:"{\n  \"kind\": \"KubeletConfiguration\",\n  \"apiVersion\": \"kubelet.config.k8s.io/v1beta1\",\n  \"address\": \"0.0.0.0\",\n  \"authentication\": {\n    \"anonymous\": {\n      \"enabled\": false\n    },\n    \"webhook\": {\n      \"cacheTTL\": \"2m0s\",\n      \"enabled\": true\n    },\n    \"x509\": {\n      \"clientCAFile\": \"/etc/kubernetes/pki/ca.crt\"\n    }\n  },\n  \"authorization\": {\n    \"mode\": \"Webhook\",\n    \"webhook\": {\n      \"cacheAuthorizedTTL\": \"5m0s\",\n      \"cacheUnauthorizedTTL\": \"30s\"\n    }\n  },\n  \"clusterDomain\": \"cluster.local\",\n  \"hairpinMode\": \"hairpin-veth\",\n  \"readOnlyPort\": 0,\n  \"cgroupDriver\": \"systemd\",\n  \"cgroupRoot\": \"/\",\n  \"featureGates\": {\n    \"RotateKubeletServerCertificate\": true,\n    \"KubeletCredentialProviders\": true\n  },\n  \"protectKernelDefaults\": true,\n  \"serializeImagePulls\": false,\n  \"serverTLSBootstrap\": true,\n  \"tlsCipherSuites\": [\n    \"TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256\",\n    \"TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256\",\n    \"TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305\",\n    \"TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305\",\n    \"TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_RSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_RSA_WITH_AES_128_GCM_SHA256\"\n  ],\n  \"clusterDNS\": [\n    \"172.20.0.10\"\n  ],\n  \"kubeAPIQPS\": 10,\n  \"kubeAPIBurst\": 20,\n  \"evictionHard\": {\n    \"memory.available\": \"100Mi\",\n    \"nodefs.available\": \"10%\",\n    \"nodefs.inodesFree\": \"5%\"\n  },\n  \"kubeReserved\": {\n    \"cpu\": \"70m\",\n    \"ephemeral-storage\": \"1Gi\",\n    \"memory\": \"343Mi\"\n  },\n  \"systemReservedCgroup\": \"/system\",\n  \"kubeReservedCgroup\": \"/runtime\"\n}", ExpectedResult:"'{.authentication.anonymous.enabled}' is equal to 'false'"}
I0730 08:21:23.358214   22854 check.go:184] Command: "/bin/cat /etc/kubernetes/kubelet/kubelet-config.json" TestResult: true State: "PASS" 
I0730 08:21:23.358266   22854 check.go:110] -----   Running check 3.2.2   -----
I0730 08:21:23.373192   22854 check.go:309] Command: "/bin/ps -fC kubelet"
I0730 08:21:23.373336   22854 check.go:310] Output:
 "UID        PID  PPID  C STIME TTY          TIME CMD\nroot      2839     1  1 Jul29 ?        00:14:22 /usr/bin/kubelet --config /etc/kubernetes/kubelet/kubelet-config.json --kubeconfig /var/lib/kubelet/kubeconfig --container-runtime-endpoint unix:///run/containerd/containerd.sock --image-credential-provider-config /etc/eks/image-credential-provider/config.json --image-credential-provider-bin-dir /etc/eks/image-credential-provider --node-ip=10.254.193.104 --pod-infra-container-image=602401143452.dkr.ecr.us-west-2.amazonaws.com/eks/pause:3.5 --v=2 --cloud-provider=aws --container-runtime=remote --node-labels=eks.amazonaws.com/nodegroup-image=ami-0a419d1a5b24a5d95,eks.amazonaws.com/capacityType=ON_DEMAND,eks.amazonaws.com/nodegroup=mng-al2 --max-pods=8\n"
I0730 08:21:23.375116   22854 check.go:309] Command: "/bin/cat /etc/kubernetes/kubelet/kubelet-config.json"
I0730 08:21:23.375623   22854 check.go:310] Output:
 "{\n  \"kind\": \"KubeletConfiguration\",\n  \"apiVersion\": \"kubelet.config.k8s.io/v1beta1\",\n  \"address\": \"0.0.0.0\",\n  \"authentication\": {\n    \"anonymous\": {\n      \"enabled\": false\n    },\n    \"webhook\": {\n      \"cacheTTL\": \"2m0s\",\n      \"enabled\": true\n    },\n    \"x509\": {\n      \"clientCAFile\": \"/etc/kubernetes/pki/ca.crt\"\n    }\n  },\n  \"authorization\": {\n    \"mode\": \"Webhook\",\n    \"webhook\": {\n      \"cacheAuthorizedTTL\": \"5m0s\",\n      \"cacheUnauthorizedTTL\": \"30s\"\n    }\n  },\n  \"clusterDomain\": \"cluster.local\",\n  \"hairpinMode\": \"hairpin-veth\",\n  \"readOnlyPort\": 0,\n  \"cgroupDriver\": \"systemd\",\n  \"cgroupRoot\": \"/\",\n  \"featureGates\": {\n    \"RotateKubeletServerCertificate\": true,\n    \"KubeletCredentialProviders\": true\n  },\n  \"protectKernelDefaults\": true,\n  \"serializeImagePulls\": false,\n  \"serverTLSBootstrap\": true,\n  \"tlsCipherSuites\": [\n    \"TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256\",\n    \"TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256\",\n    \"TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305\",\n    \"TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305\",\n    \"TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_RSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_RSA_WITH_AES_128_GCM_SHA256\"\n  ],\n  \"clusterDNS\": [\n    \"172.20.0.10\"\n  ],\n  \"kubeAPIQPS\": 10,\n  \"kubeAPIBurst\": 20,\n  \"evictionHard\": {\n    \"memory.available\": \"100Mi\",\n    \"nodefs.available\": \"10%\",\n    \"nodefs.inodesFree\": \"5%\"\n  },\n  \"kubeReserved\": {\n    \"cpu\": \"70m\",\n    \"ephemeral-storage\": \"1Gi\",\n    \"memory\": \"343Mi\"\n  },\n  \"systemReservedCgroup\": \"/system\",\n  \"kubeReservedCgroup\": \"/runtime\"\n}\n"
I0730 08:21:23.375756   22854 check.go:231] Running 1 test_items
I0730 08:21:23.375819   22854 test.go:153] In flagTestItem.findValue 
I0730 08:21:23.376263   22854 test.go:247] Flag '--authorization-mode' does not exist
I0730 08:21:23.376431   22854 test.go:171] In pathTestItem.findValue Webhook
I0730 08:21:23.376506   22854 test.go:249] Path '{.authorization.mode}' exists
I0730 08:21:23.376528   22854 check.go:255] Used auditConfig
I0730 08:21:23.376549   22854 check.go:287] Returning from execute on tests: finalOutput &check.testOutput{testResult:true, flagFound:false, actualResult:"{\n  \"kind\": \"KubeletConfiguration\",\n  \"apiVersion\": \"kubelet.config.k8s.io/v1beta1\",\n  \"address\": \"0.0.0.0\",\n  \"authentication\": {\n    \"anonymous\": {\n      \"enabled\": false\n    },\n    \"webhook\": {\n      \"cacheTTL\": \"2m0s\",\n      \"enabled\": true\n    },\n    \"x509\": {\n      \"clientCAFile\": \"/etc/kubernetes/pki/ca.crt\"\n    }\n  },\n  \"authorization\": {\n    \"mode\": \"Webhook\",\n    \"webhook\": {\n      \"cacheAuthorizedTTL\": \"5m0s\",\n      \"cacheUnauthorizedTTL\": \"30s\"\n    }\n  },\n  \"clusterDomain\": \"cluster.local\",\n  \"hairpinMode\": \"hairpin-veth\",\n  \"readOnlyPort\": 0,\n  \"cgroupDriver\": \"systemd\",\n  \"cgroupRoot\": \"/\",\n  \"featureGates\": {\n    \"RotateKubeletServerCertificate\": true,\n    \"KubeletCredentialProviders\": true\n  },\n  \"protectKernelDefaults\": true,\n  \"serializeImagePulls\": false,\n  \"serverTLSBootstrap\": true,\n  \"tlsCipherSuites\": [\n    \"TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256\",\n    \"TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256\",\n    \"TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305\",\n    \"TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305\",\n    \"TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_RSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_RSA_WITH_AES_128_GCM_SHA256\"\n  ],\n  \"clusterDNS\": [\n    \"172.20.0.10\"\n  ],\n  \"kubeAPIQPS\": 10,\n  \"kubeAPIBurst\": 20,\n  \"evictionHard\": {\n    \"memory.available\": \"100Mi\",\n    \"nodefs.available\": \"10%\",\n    \"nodefs.inodesFree\": \"5%\"\n  },\n  \"kubeReserved\": {\n    \"cpu\": \"70m\",\n    \"ephemeral-storage\": \"1Gi\",\n    \"memory\": \"343Mi\"\n  },\n  \"systemReservedCgroup\": \"/system\",\n  \"kubeReservedCgroup\": \"/runtime\"\n}", ExpectedResult:"'{.authorization.mode}' does not have 'AlwaysAllow'"}
I0730 08:21:23.376607   22854 check.go:184] Command: "/bin/cat /etc/kubernetes/kubelet/kubelet-config.json" TestResult: true State: "PASS" 
I0730 08:21:23.376617   22854 check.go:110] -----   Running check 3.2.3   -----
I0730 08:21:23.394305   22854 check.go:309] Command: "/bin/ps -fC kubelet"
I0730 08:21:23.394494   22854 check.go:310] Output:
 "UID        PID  PPID  C STIME TTY          TIME CMD\nroot      2839     1  1 Jul29 ?        00:14:22 /usr/bin/kubelet --config /etc/kubernetes/kubelet/kubelet-config.json --kubeconfig /var/lib/kubelet/kubeconfig --container-runtime-endpoint unix:///run/containerd/containerd.sock --image-credential-provider-config /etc/eks/image-credential-provider/config.json --image-credential-provider-bin-dir /etc/eks/image-credential-provider --node-ip=10.254.193.104 --pod-infra-container-image=602401143452.dkr.ecr.us-west-2.amazonaws.com/eks/pause:3.5 --v=2 --cloud-provider=aws --container-runtime=remote --node-labels=eks.amazonaws.com/nodegroup-image=ami-0a419d1a5b24a5d95,eks.amazonaws.com/capacityType=ON_DEMAND,eks.amazonaws.com/nodegroup=mng-al2 --max-pods=8\n"
I0730 08:21:23.398068   22854 check.go:309] Command: "/bin/cat /etc/kubernetes/kubelet/kubelet-config.json"
I0730 08:21:23.398260   22854 check.go:310] Output:
 "{\n  \"kind\": \"KubeletConfiguration\",\n  \"apiVersion\": \"kubelet.config.k8s.io/v1beta1\",\n  \"address\": \"0.0.0.0\",\n  \"authentication\": {\n    \"anonymous\": {\n      \"enabled\": false\n    },\n    \"webhook\": {\n      \"cacheTTL\": \"2m0s\",\n      \"enabled\": true\n    },\n    \"x509\": {\n      \"clientCAFile\": \"/etc/kubernetes/pki/ca.crt\"\n    }\n  },\n  \"authorization\": {\n    \"mode\": \"Webhook\",\n    \"webhook\": {\n      \"cacheAuthorizedTTL\": \"5m0s\",\n      \"cacheUnauthorizedTTL\": \"30s\"\n    }\n  },\n  \"clusterDomain\": \"cluster.local\",\n  \"hairpinMode\": \"hairpin-veth\",\n  \"readOnlyPort\": 0,\n  \"cgroupDriver\": \"systemd\",\n  \"cgroupRoot\": \"/\",\n  \"featureGates\": {\n    \"RotateKubeletServerCertificate\": true,\n    \"KubeletCredentialProviders\": true\n  },\n  \"protectKernelDefaults\": true,\n  \"serializeImagePulls\": false,\n  \"serverTLSBootstrap\": true,\n  \"tlsCipherSuites\": [\n    \"TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256\",\n    \"TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256\",\n    \"TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305\",\n    \"TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305\",\n    \"TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_RSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_RSA_WITH_AES_128_GCM_SHA256\"\n  ],\n  \"clusterDNS\": [\n    \"172.20.0.10\"\n  ],\n  \"kubeAPIQPS\": 10,\n  \"kubeAPIBurst\": 20,\n  \"evictionHard\": {\n    \"memory.available\": \"100Mi\",\n    \"nodefs.available\": \"10%\",\n    \"nodefs.inodesFree\": \"5%\"\n  },\n  \"kubeReserved\": {\n    \"cpu\": \"70m\",\n    \"ephemeral-storage\": \"1Gi\",\n    \"memory\": \"343Mi\"\n  },\n  \"systemReservedCgroup\": \"/system\",\n  \"kubeReservedCgroup\": \"/runtime\"\n}\n"
I0730 08:21:23.398411   22854 check.go:231] Running 1 test_items
I0730 08:21:23.398497   22854 test.go:153] In flagTestItem.findValue 
I0730 08:21:23.398583   22854 test.go:247] Flag '--client-ca-file' does not exist
I0730 08:21:23.398748   22854 test.go:171] In pathTestItem.findValue /etc/kubernetes/pki/ca.crt
I0730 08:21:23.398887   22854 test.go:249] Path '{.authentication.x509.clientCAFile}' exists
I0730 08:21:23.398932   22854 check.go:255] Used auditConfig
I0730 08:21:23.398941   22854 check.go:287] Returning from execute on tests: finalOutput &check.testOutput{testResult:true, flagFound:false, actualResult:"{\n  \"kind\": \"KubeletConfiguration\",\n  \"apiVersion\": \"kubelet.config.k8s.io/v1beta1\",\n  \"address\": \"0.0.0.0\",\n  \"authentication\": {\n    \"anonymous\": {\n      \"enabled\": false\n    },\n    \"webhook\": {\n      \"cacheTTL\": \"2m0s\",\n      \"enabled\": true\n    },\n    \"x509\": {\n      \"clientCAFile\": \"/etc/kubernetes/pki/ca.crt\"\n    }\n  },\n  \"authorization\": {\n    \"mode\": \"Webhook\",\n    \"webhook\": {\n      \"cacheAuthorizedTTL\": \"5m0s\",\n      \"cacheUnauthorizedTTL\": \"30s\"\n    }\n  },\n  \"clusterDomain\": \"cluster.local\",\n  \"hairpinMode\": \"hairpin-veth\",\n  \"readOnlyPort\": 0,\n  \"cgroupDriver\": \"systemd\",\n  \"cgroupRoot\": \"/\",\n  \"featureGates\": {\n    \"RotateKubeletServerCertificate\": true,\n    \"KubeletCredentialProviders\": true\n  },\n  \"protectKernelDefaults\": true,\n  \"serializeImagePulls\": false,\n  \"serverTLSBootstrap\": true,\n  \"tlsCipherSuites\": [\n    \"TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256\",\n    \"TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256\",\n    \"TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305\",\n    \"TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305\",\n    \"TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_RSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_RSA_WITH_AES_128_GCM_SHA256\"\n  ],\n  \"clusterDNS\": [\n    \"172.20.0.10\"\n  ],\n  \"kubeAPIQPS\": 10,\n  \"kubeAPIBurst\": 20,\n  \"evictionHard\": {\n    \"memory.available\": \"100Mi\",\n    \"nodefs.available\": \"10%\",\n    \"nodefs.inodesFree\": \"5%\"\n  },\n  \"kubeReserved\": {\n    \"cpu\": \"70m\",\n    \"ephemeral-storage\": \"1Gi\",\n    \"memory\": \"343Mi\"\n  },\n  \"systemReservedCgroup\": \"/system\",\n  \"kubeReservedCgroup\": \"/runtime\"\n}", ExpectedResult:"'{.authentication.x509.clientCAFile}' is present"}
I0730 08:21:23.398986   22854 check.go:184] Command: "/bin/cat /etc/kubernetes/kubelet/kubelet-config.json" TestResult: true State: "PASS" 
I0730 08:21:23.398995   22854 check.go:110] -----   Running check 3.2.4   -----
I0730 08:21:23.426263   22854 check.go:309] Command: "/bin/ps -fC kubelet"
I0730 08:21:23.426294   22854 check.go:310] Output:
 "UID        PID  PPID  C STIME TTY          TIME CMD\nroot      2839     1  1 Jul29 ?        00:14:22 /usr/bin/kubelet --config /etc/kubernetes/kubelet/kubelet-config.json --kubeconfig /var/lib/kubelet/kubeconfig --container-runtime-endpoint unix:///run/containerd/containerd.sock --image-credential-provider-config /etc/eks/image-credential-provider/config.json --image-credential-provider-bin-dir /etc/eks/image-credential-provider --node-ip=10.254.193.104 --pod-infra-container-image=602401143452.dkr.ecr.us-west-2.amazonaws.com/eks/pause:3.5 --v=2 --cloud-provider=aws --container-runtime=remote --node-labels=eks.amazonaws.com/nodegroup-image=ami-0a419d1a5b24a5d95,eks.amazonaws.com/capacityType=ON_DEMAND,eks.amazonaws.com/nodegroup=mng-al2 --max-pods=8\n"
I0730 08:21:23.428508   22854 check.go:309] Command: "/bin/cat /etc/kubernetes/kubelet/kubelet-config.json"
I0730 08:21:23.428718   22854 check.go:310] Output:
 "{\n  \"kind\": \"KubeletConfiguration\",\n  \"apiVersion\": \"kubelet.config.k8s.io/v1beta1\",\n  \"address\": \"0.0.0.0\",\n  \"authentication\": {\n    \"anonymous\": {\n      \"enabled\": false\n    },\n    \"webhook\": {\n      \"cacheTTL\": \"2m0s\",\n      \"enabled\": true\n    },\n    \"x509\": {\n      \"clientCAFile\": \"/etc/kubernetes/pki/ca.crt\"\n    }\n  },\n  \"authorization\": {\n    \"mode\": \"Webhook\",\n    \"webhook\": {\n      \"cacheAuthorizedTTL\": \"5m0s\",\n      \"cacheUnauthorizedTTL\": \"30s\"\n    }\n  },\n  \"clusterDomain\": \"cluster.local\",\n  \"hairpinMode\": \"hairpin-veth\",\n  \"readOnlyPort\": 0,\n  \"cgroupDriver\": \"systemd\",\n  \"cgroupRoot\": \"/\",\n  \"featureGates\": {\n    \"RotateKubeletServerCertificate\": true,\n    \"KubeletCredentialProviders\": true\n  },\n  \"protectKernelDefaults\": true,\n  \"serializeImagePulls\": false,\n  \"serverTLSBootstrap\": true,\n  \"tlsCipherSuites\": [\n    \"TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256\",\n    \"TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256\",\n    \"TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305\",\n    \"TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305\",\n    \"TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_RSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_RSA_WITH_AES_128_GCM_SHA256\"\n  ],\n  \"clusterDNS\": [\n    \"172.20.0.10\"\n  ],\n  \"kubeAPIQPS\": 10,\n  \"kubeAPIBurst\": 20,\n  \"evictionHard\": {\n    \"memory.available\": \"100Mi\",\n    \"nodefs.available\": \"10%\",\n    \"nodefs.inodesFree\": \"5%\"\n  },\n  \"kubeReserved\": {\n    \"cpu\": \"70m\",\n    \"ephemeral-storage\": \"1Gi\",\n    \"memory\": \"343Mi\"\n  },\n  \"systemReservedCgroup\": \"/system\",\n  \"kubeReservedCgroup\": \"/runtime\"\n}\n"
I0730 08:21:23.428851   22854 check.go:231] Running 1 test_items
I0730 08:21:23.428949   22854 test.go:153] In flagTestItem.findValue 
I0730 08:21:23.428997   22854 test.go:247] Flag '--read-only-port' does not exist
I0730 08:21:23.429164   22854 test.go:171] In pathTestItem.findValue 0
I0730 08:21:23.429234   22854 test.go:249] Path '{.readOnlyPort}' exists
I0730 08:21:23.429300   22854 check.go:255] Used auditConfig
I0730 08:21:23.429393   22854 check.go:287] Returning from execute on tests: finalOutput &check.testOutput{testResult:true, flagFound:false, actualResult:"{\n  \"kind\": \"KubeletConfiguration\",\n  \"apiVersion\": \"kubelet.config.k8s.io/v1beta1\",\n  \"address\": \"0.0.0.0\",\n  \"authentication\": {\n    \"anonymous\": {\n      \"enabled\": false\n    },\n    \"webhook\": {\n      \"cacheTTL\": \"2m0s\",\n      \"enabled\": true\n    },\n    \"x509\": {\n      \"clientCAFile\": \"/etc/kubernetes/pki/ca.crt\"\n    }\n  },\n  \"authorization\": {\n    \"mode\": \"Webhook\",\n    \"webhook\": {\n      \"cacheAuthorizedTTL\": \"5m0s\",\n      \"cacheUnauthorizedTTL\": \"30s\"\n    }\n  },\n  \"clusterDomain\": \"cluster.local\",\n  \"hairpinMode\": \"hairpin-veth\",\n  \"readOnlyPort\": 0,\n  \"cgroupDriver\": \"systemd\",\n  \"cgroupRoot\": \"/\",\n  \"featureGates\": {\n    \"RotateKubeletServerCertificate\": true,\n    \"KubeletCredentialProviders\": true\n  },\n  \"protectKernelDefaults\": true,\n  \"serializeImagePulls\": false,\n  \"serverTLSBootstrap\": true,\n  \"tlsCipherSuites\": [\n    \"TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256\",\n    \"TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256\",\n    \"TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305\",\n    \"TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305\",\n    \"TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_RSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_RSA_WITH_AES_128_GCM_SHA256\"\n  ],\n  \"clusterDNS\": [\n    \"172.20.0.10\"\n  ],\n  \"kubeAPIQPS\": 10,\n  \"kubeAPIBurst\": 20,\n  \"evictionHard\": {\n    \"memory.available\": \"100Mi\",\n    \"nodefs.available\": \"10%\",\n    \"nodefs.inodesFree\": \"5%\"\n  },\n  \"kubeReserved\": {\n    \"cpu\": \"70m\",\n    \"ephemeral-storage\": \"1Gi\",\n    \"memory\": \"343Mi\"\n  },\n  \"systemReservedCgroup\": \"/system\",\n  \"kubeReservedCgroup\": \"/runtime\"\n}", ExpectedResult:"'{.readOnlyPort}' is equal to '0'"}
I0730 08:21:23.429530   22854 check.go:184] Command: "/bin/cat /etc/kubernetes/kubelet/kubelet-config.json" TestResult: true State: "PASS" 
I0730 08:21:23.429616   22854 check.go:110] -----   Running check 3.2.5   -----
I0730 08:21:23.457507   22854 check.go:309] Command: "/bin/ps -fC kubelet"
I0730 08:21:23.457620   22854 check.go:310] Output:
 "UID        PID  PPID  C STIME TTY          TIME CMD\nroot      2839     1  1 Jul29 ?        00:14:22 /usr/bin/kubelet --config /etc/kubernetes/kubelet/kubelet-config.json --kubeconfig /var/lib/kubelet/kubeconfig --container-runtime-endpoint unix:///run/containerd/containerd.sock --image-credential-provider-config /etc/eks/image-credential-provider/config.json --image-credential-provider-bin-dir /etc/eks/image-credential-provider --node-ip=10.254.193.104 --pod-infra-container-image=602401143452.dkr.ecr.us-west-2.amazonaws.com/eks/pause:3.5 --v=2 --cloud-provider=aws --container-runtime=remote --node-labels=eks.amazonaws.com/nodegroup-image=ami-0a419d1a5b24a5d95,eks.amazonaws.com/capacityType=ON_DEMAND,eks.amazonaws.com/nodegroup=mng-al2 --max-pods=8\n"
I0730 08:21:23.458903   22854 check.go:309] Command: "/bin/cat /etc/kubernetes/kubelet/kubelet-config.json"
I0730 08:21:23.458936   22854 check.go:310] Output:
 "{\n  \"kind\": \"KubeletConfiguration\",\n  \"apiVersion\": \"kubelet.config.k8s.io/v1beta1\",\n  \"address\": \"0.0.0.0\",\n  \"authentication\": {\n    \"anonymous\": {\n      \"enabled\": false\n    },\n    \"webhook\": {\n      \"cacheTTL\": \"2m0s\",\n      \"enabled\": true\n    },\n    \"x509\": {\n      \"clientCAFile\": \"/etc/kubernetes/pki/ca.crt\"\n    }\n  },\n  \"authorization\": {\n    \"mode\": \"Webhook\",\n    \"webhook\": {\n      \"cacheAuthorizedTTL\": \"5m0s\",\n      \"cacheUnauthorizedTTL\": \"30s\"\n    }\n  },\n  \"clusterDomain\": \"cluster.local\",\n  \"hairpinMode\": \"hairpin-veth\",\n  \"readOnlyPort\": 0,\n  \"cgroupDriver\": \"systemd\",\n  \"cgroupRoot\": \"/\",\n  \"featureGates\": {\n    \"RotateKubeletServerCertificate\": true,\n    \"KubeletCredentialProviders\": true\n  },\n  \"protectKernelDefaults\": true,\n  \"serializeImagePulls\": false,\n  \"serverTLSBootstrap\": true,\n  \"tlsCipherSuites\": [\n    \"TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256\",\n    \"TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256\",\n    \"TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305\",\n    \"TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305\",\n    \"TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_RSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_RSA_WITH_AES_128_GCM_SHA256\"\n  ],\n  \"clusterDNS\": [\n    \"172.20.0.10\"\n  ],\n  \"kubeAPIQPS\": 10,\n  \"kubeAPIBurst\": 20,\n  \"evictionHard\": {\n    \"memory.available\": \"100Mi\",\n    \"nodefs.available\": \"10%\",\n    \"nodefs.inodesFree\": \"5%\"\n  },\n  \"kubeReserved\": {\n    \"cpu\": \"70m\",\n    \"ephemeral-storage\": \"1Gi\",\n    \"memory\": \"343Mi\"\n  },\n  \"systemReservedCgroup\": \"/system\",\n  \"kubeReservedCgroup\": \"/runtime\"\n}\n"
I0730 08:21:23.458971   22854 check.go:231] Running 2 test_items
I0730 08:21:23.458981   22854 test.go:153] In flagTestItem.findValue 
I0730 08:21:23.458987   22854 test.go:247] Flag '--streaming-connection-idle-timeout' does not exist
I0730 08:21:23.459602   22854 test.go:171] In pathTestItem.findValue 
I0730 08:21:23.459630   22854 test.go:249] Path '{.streamingConnectionIdleTimeout}' does not exist
I0730 08:21:23.459635   22854 check.go:255] Used auditConfig
I0730 08:21:23.459643   22854 test.go:153] In flagTestItem.findValue 
I0730 08:21:23.459649   22854 test.go:247] Flag '--streaming-connection-idle-timeout' does not exist
I0730 08:21:23.460035   22854 test.go:171] In pathTestItem.findValue 
I0730 08:21:23.460083   22854 test.go:249] Path '{.streamingConnectionIdleTimeout}' does not exist
I0730 08:21:23.460157   22854 check.go:255] Used auditConfig
I0730 08:21:23.460169   22854 check.go:287] Returning from execute on tests: finalOutput &check.testOutput{testResult:true, flagFound:false, actualResult:"{\n  \"kind\": \"KubeletConfiguration\",\n  \"apiVersion\": \"kubelet.config.k8s.io/v1beta1\",\n  \"address\": \"0.0.0.0\",\n  \"authentication\": {\n    \"anonymous\": {\n      \"enabled\": false\n    },\n    \"webhook\": {\n      \"cacheTTL\": \"2m0s\",\n      \"enabled\": true\n    },\n    \"x509\": {\n      \"clientCAFile\": \"/etc/kubernetes/pki/ca.crt\"\n    }\n  },\n  \"authorization\": {\n    \"mode\": \"Webhook\",\n    \"webhook\": {\n      \"cacheAuthorizedTTL\": \"5m0s\",\n      \"cacheUnauthorizedTTL\": \"30s\"\n    }\n  },\n  \"clusterDomain\": \"cluster.local\",\n  \"hairpinMode\": \"hairpin-veth\",\n  \"readOnlyPort\": 0,\n  \"cgroupDriver\": \"systemd\",\n  \"cgroupRoot\": \"/\",\n  \"featureGates\": {\n    \"RotateKubeletServerCertificate\": true,\n    \"KubeletCredentialProviders\": true\n  },\n  \"protectKernelDefaults\": true,\n  \"serializeImagePulls\": false,\n  \"serverTLSBootstrap\": true,\n  \"tlsCipherSuites\": [\n    \"TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256\",\n    \"TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256\",\n    \"TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305\",\n    \"TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305\",\n    \"TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_RSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_RSA_WITH_AES_128_GCM_SHA256\"\n  ],\n  \"clusterDNS\": [\n    \"172.20.0.10\"\n  ],\n  \"kubeAPIQPS\": 10,\n  \"kubeAPIBurst\": 20,\n  \"evictionHard\": {\n    \"memory.available\": \"100Mi\",\n    \"nodefs.available\": \"10%\",\n    \"nodefs.inodesFree\": \"5%\"\n  },\n  \"kubeReserved\": {\n    \"cpu\": \"70m\",\n    \"ephemeral-storage\": \"1Gi\",\n    \"memory\": \"343Mi\"\n  },\n  \"systemReservedCgroup\": \"/system\",\n  \"kubeReservedCgroup\": \"/runtime\"\n}", ExpectedResult:"'{.streamingConnectionIdleTimeout}' is present OR '{.streamingConnectionIdleTimeout}' is not present"}
I0730 08:21:23.460291   22854 check.go:184] Command: "/bin/cat /etc/kubernetes/kubelet/kubelet-config.json" TestResult: true State: "PASS" 
I0730 08:21:23.460302   22854 check.go:110] -----   Running check 3.2.6   -----
I0730 08:21:23.477421   22854 check.go:309] Command: "/bin/ps -fC kubelet"
I0730 08:21:23.477640   22854 check.go:310] Output:
 "UID        PID  PPID  C STIME TTY          TIME CMD\nroot      2839     1  1 Jul29 ?        00:14:22 /usr/bin/kubelet --config /etc/kubernetes/kubelet/kubelet-config.json --kubeconfig /var/lib/kubelet/kubeconfig --container-runtime-endpoint unix:///run/containerd/containerd.sock --image-credential-provider-config /etc/eks/image-credential-provider/config.json --image-credential-provider-bin-dir /etc/eks/image-credential-provider --node-ip=10.254.193.104 --pod-infra-container-image=602401143452.dkr.ecr.us-west-2.amazonaws.com/eks/pause:3.5 --v=2 --cloud-provider=aws --container-runtime=remote --node-labels=eks.amazonaws.com/nodegroup-image=ami-0a419d1a5b24a5d95,eks.amazonaws.com/capacityType=ON_DEMAND,eks.amazonaws.com/nodegroup=mng-al2 --max-pods=8\n"
I0730 08:21:23.481631   22854 check.go:309] Command: "/bin/cat /etc/kubernetes/kubelet/kubelet-config.json"
I0730 08:21:23.481828   22854 check.go:310] Output:
 "{\n  \"kind\": \"KubeletConfiguration\",\n  \"apiVersion\": \"kubelet.config.k8s.io/v1beta1\",\n  \"address\": \"0.0.0.0\",\n  \"authentication\": {\n    \"anonymous\": {\n      \"enabled\": false\n    },\n    \"webhook\": {\n      \"cacheTTL\": \"2m0s\",\n      \"enabled\": true\n    },\n    \"x509\": {\n      \"clientCAFile\": \"/etc/kubernetes/pki/ca.crt\"\n    }\n  },\n  \"authorization\": {\n    \"mode\": \"Webhook\",\n    \"webhook\": {\n      \"cacheAuthorizedTTL\": \"5m0s\",\n      \"cacheUnauthorizedTTL\": \"30s\"\n    }\n  },\n  \"clusterDomain\": \"cluster.local\",\n  \"hairpinMode\": \"hairpin-veth\",\n  \"readOnlyPort\": 0,\n  \"cgroupDriver\": \"systemd\",\n  \"cgroupRoot\": \"/\",\n  \"featureGates\": {\n    \"RotateKubeletServerCertificate\": true,\n    \"KubeletCredentialProviders\": true\n  },\n  \"protectKernelDefaults\": true,\n  \"serializeImagePulls\": false,\n  \"serverTLSBootstrap\": true,\n  \"tlsCipherSuites\": [\n    \"TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256\",\n    \"TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256\",\n    \"TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305\",\n    \"TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305\",\n    \"TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_RSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_RSA_WITH_AES_128_GCM_SHA256\"\n  ],\n  \"clusterDNS\": [\n    \"172.20.0.10\"\n  ],\n  \"kubeAPIQPS\": 10,\n  \"kubeAPIBurst\": 20,\n  \"evictionHard\": {\n    \"memory.available\": \"100Mi\",\n    \"nodefs.available\": \"10%\",\n    \"nodefs.inodesFree\": \"5%\"\n  },\n  \"kubeReserved\": {\n    \"cpu\": \"70m\",\n    \"ephemeral-storage\": \"1Gi\",\n    \"memory\": \"343Mi\"\n  },\n  \"systemReservedCgroup\": \"/system\",\n  \"kubeReservedCgroup\": \"/runtime\"\n}\n"
I0730 08:21:23.481965   22854 check.go:231] Running 1 test_items
I0730 08:21:23.482104   22854 test.go:153] In flagTestItem.findValue 
I0730 08:21:23.482164   22854 test.go:247] Flag '--protect-kernel-defaults' does not exist
I0730 08:21:23.482506   22854 test.go:171] In pathTestItem.findValue true
I0730 08:21:23.482590   22854 test.go:249] Path '{.protectKernelDefaults}' exists
I0730 08:21:23.482685   22854 check.go:255] Used auditConfig
I0730 08:21:23.482763   22854 check.go:287] Returning from execute on tests: finalOutput &check.testOutput{testResult:true, flagFound:false, actualResult:"{\n  \"kind\": \"KubeletConfiguration\",\n  \"apiVersion\": \"kubelet.config.k8s.io/v1beta1\",\n  \"address\": \"0.0.0.0\",\n  \"authentication\": {\n    \"anonymous\": {\n      \"enabled\": false\n    },\n    \"webhook\": {\n      \"cacheTTL\": \"2m0s\",\n      \"enabled\": true\n    },\n    \"x509\": {\n      \"clientCAFile\": \"/etc/kubernetes/pki/ca.crt\"\n    }\n  },\n  \"authorization\": {\n    \"mode\": \"Webhook\",\n    \"webhook\": {\n      \"cacheAuthorizedTTL\": \"5m0s\",\n      \"cacheUnauthorizedTTL\": \"30s\"\n    }\n  },\n  \"clusterDomain\": \"cluster.local\",\n  \"hairpinMode\": \"hairpin-veth\",\n  \"readOnlyPort\": 0,\n  \"cgroupDriver\": \"systemd\",\n  \"cgroupRoot\": \"/\",\n  \"featureGates\": {\n    \"RotateKubeletServerCertificate\": true,\n    \"KubeletCredentialProviders\": true\n  },\n  \"protectKernelDefaults\": true,\n  \"serializeImagePulls\": false,\n  \"serverTLSBootstrap\": true,\n  \"tlsCipherSuites\": [\n    \"TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256\",\n    \"TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256\",\n    \"TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305\",\n    \"TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305\",\n    \"TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_RSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_RSA_WITH_AES_128_GCM_SHA256\"\n  ],\n  \"clusterDNS\": [\n    \"172.20.0.10\"\n  ],\n  \"kubeAPIQPS\": 10,\n  \"kubeAPIBurst\": 20,\n  \"evictionHard\": {\n    \"memory.available\": \"100Mi\",\n    \"nodefs.available\": \"10%\",\n    \"nodefs.inodesFree\": \"5%\"\n  },\n  \"kubeReserved\": {\n    \"cpu\": \"70m\",\n    \"ephemeral-storage\": \"1Gi\",\n    \"memory\": \"343Mi\"\n  },\n  \"systemReservedCgroup\": \"/system\",\n  \"kubeReservedCgroup\": \"/runtime\"\n}", ExpectedResult:"'{.protectKernelDefaults}' is equal to 'true'"}
I0730 08:21:23.482985   22854 check.go:184] Command: "/bin/cat /etc/kubernetes/kubelet/kubelet-config.json" TestResult: true State: "PASS" 
I0730 08:21:23.483073   22854 check.go:110] -----   Running check 3.2.7   -----
I0730 08:21:23.513775   22854 check.go:309] Command: "/bin/ps -fC kubelet"
I0730 08:21:23.513957   22854 check.go:310] Output:
 "UID        PID  PPID  C STIME TTY          TIME CMD\nroot      2839     1  1 Jul29 ?        00:14:22 /usr/bin/kubelet --config /etc/kubernetes/kubelet/kubelet-config.json --kubeconfig /var/lib/kubelet/kubeconfig --container-runtime-endpoint unix:///run/containerd/containerd.sock --image-credential-provider-config /etc/eks/image-credential-provider/config.json --image-credential-provider-bin-dir /etc/eks/image-credential-provider --node-ip=10.254.193.104 --pod-infra-container-image=602401143452.dkr.ecr.us-west-2.amazonaws.com/eks/pause:3.5 --v=2 --cloud-provider=aws --container-runtime=remote --node-labels=eks.amazonaws.com/nodegroup-image=ami-0a419d1a5b24a5d95,eks.amazonaws.com/capacityType=ON_DEMAND,eks.amazonaws.com/nodegroup=mng-al2 --max-pods=8\n"
I0730 08:21:23.515311   22854 check.go:309] Command: "/bin/cat /etc/kubernetes/kubelet/kubelet-config.json"
I0730 08:21:23.515458   22854 check.go:310] Output:
 "{\n  \"kind\": \"KubeletConfiguration\",\n  \"apiVersion\": \"kubelet.config.k8s.io/v1beta1\",\n  \"address\": \"0.0.0.0\",\n  \"authentication\": {\n    \"anonymous\": {\n      \"enabled\": false\n    },\n    \"webhook\": {\n      \"cacheTTL\": \"2m0s\",\n      \"enabled\": true\n    },\n    \"x509\": {\n      \"clientCAFile\": \"/etc/kubernetes/pki/ca.crt\"\n    }\n  },\n  \"authorization\": {\n    \"mode\": \"Webhook\",\n    \"webhook\": {\n      \"cacheAuthorizedTTL\": \"5m0s\",\n      \"cacheUnauthorizedTTL\": \"30s\"\n    }\n  },\n  \"clusterDomain\": \"cluster.local\",\n  \"hairpinMode\": \"hairpin-veth\",\n  \"readOnlyPort\": 0,\n  \"cgroupDriver\": \"systemd\",\n  \"cgroupRoot\": \"/\",\n  \"featureGates\": {\n    \"RotateKubeletServerCertificate\": true,\n    \"KubeletCredentialProviders\": true\n  },\n  \"protectKernelDefaults\": true,\n  \"serializeImagePulls\": false,\n  \"serverTLSBootstrap\": true,\n  \"tlsCipherSuites\": [\n    \"TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256\",\n    \"TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256\",\n    \"TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305\",\n    \"TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305\",\n    \"TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_RSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_RSA_WITH_AES_128_GCM_SHA256\"\n  ],\n  \"clusterDNS\": [\n    \"172.20.0.10\"\n  ],\n  \"kubeAPIQPS\": 10,\n  \"kubeAPIBurst\": 20,\n  \"evictionHard\": {\n    \"memory.available\": \"100Mi\",\n    \"nodefs.available\": \"10%\",\n    \"nodefs.inodesFree\": \"5%\"\n  },\n  \"kubeReserved\": {\n    \"cpu\": \"70m\",\n    \"ephemeral-storage\": \"1Gi\",\n    \"memory\": \"343Mi\"\n  },\n  \"systemReservedCgroup\": \"/system\",\n  \"kubeReservedCgroup\": \"/runtime\"\n}\n"
I0730 08:21:23.515791   22854 check.go:231] Running 2 test_items
I0730 08:21:23.515912   22854 test.go:153] In flagTestItem.findValue 
I0730 08:21:23.515998   22854 test.go:247] Flag '--make-iptables-util-chains' does not exist
I0730 08:21:23.516185   22854 test.go:171] In pathTestItem.findValue 
I0730 08:21:23.516270   22854 test.go:249] Path '{.makeIPTablesUtilChains}' does not exist
I0730 08:21:23.516351   22854 check.go:255] Used auditConfig
I0730 08:21:23.516450   22854 test.go:153] In flagTestItem.findValue 
I0730 08:21:23.516553   22854 test.go:247] Flag '--make-iptables-util-chains' does not exist
I0730 08:21:23.516699   22854 test.go:171] In pathTestItem.findValue 
I0730 08:21:23.516836   22854 test.go:249] Path '{.makeIPTablesUtilChains}' does not exist
I0730 08:21:23.516903   22854 check.go:255] Used auditConfig
I0730 08:21:23.516957   22854 check.go:287] Returning from execute on tests: finalOutput &check.testOutput{testResult:true, flagFound:false, actualResult:"{\n  \"kind\": \"KubeletConfiguration\",\n  \"apiVersion\": \"kubelet.config.k8s.io/v1beta1\",\n  \"address\": \"0.0.0.0\",\n  \"authentication\": {\n    \"anonymous\": {\n      \"enabled\": false\n    },\n    \"webhook\": {\n      \"cacheTTL\": \"2m0s\",\n      \"enabled\": true\n    },\n    \"x509\": {\n      \"clientCAFile\": \"/etc/kubernetes/pki/ca.crt\"\n    }\n  },\n  \"authorization\": {\n    \"mode\": \"Webhook\",\n    \"webhook\": {\n      \"cacheAuthorizedTTL\": \"5m0s\",\n      \"cacheUnauthorizedTTL\": \"30s\"\n    }\n  },\n  \"clusterDomain\": \"cluster.local\",\n  \"hairpinMode\": \"hairpin-veth\",\n  \"readOnlyPort\": 0,\n  \"cgroupDriver\": \"systemd\",\n  \"cgroupRoot\": \"/\",\n  \"featureGates\": {\n    \"RotateKubeletServerCertificate\": true,\n    \"KubeletCredentialProviders\": true\n  },\n  \"protectKernelDefaults\": true,\n  \"serializeImagePulls\": false,\n  \"serverTLSBootstrap\": true,\n  \"tlsCipherSuites\": [\n    \"TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256\",\n    \"TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256\",\n    \"TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305\",\n    \"TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305\",\n    \"TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_RSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_RSA_WITH_AES_128_GCM_SHA256\"\n  ],\n  \"clusterDNS\": [\n    \"172.20.0.10\"\n  ],\n  \"kubeAPIQPS\": 10,\n  \"kubeAPIBurst\": 20,\n  \"evictionHard\": {\n    \"memory.available\": \"100Mi\",\n    \"nodefs.available\": \"10%\",\n    \"nodefs.inodesFree\": \"5%\"\n  },\n  \"kubeReserved\": {\n    \"cpu\": \"70m\",\n    \"ephemeral-storage\": \"1Gi\",\n    \"memory\": \"343Mi\"\n  },\n  \"systemReservedCgroup\": \"/system\",\n  \"kubeReservedCgroup\": \"/runtime\"\n}", ExpectedResult:"'{.makeIPTablesUtilChains}' is present OR '{.makeIPTablesUtilChains}' is not present"}
I0730 08:21:23.517079   22854 check.go:184] Command: "/bin/cat /etc/kubernetes/kubelet/kubelet-config.json" TestResult: true State: "PASS" 
I0730 08:21:23.517165   22854 check.go:110] -----   Running check 3.2.8   -----
I0730 08:21:23.526844   22854 check.go:309] Command: "/bin/ps -fC kubelet"
I0730 08:21:23.526998   22854 check.go:310] Output:
 "UID        PID  PPID  C STIME TTY          TIME CMD\nroot      2839     1  1 Jul29 ?        00:14:22 /usr/bin/kubelet --config /etc/kubernetes/kubelet/kubelet-config.json --kubeconfig /var/lib/kubelet/kubeconfig --container-runtime-endpoint unix:///run/containerd/containerd.sock --image-credential-provider-config /etc/eks/image-credential-provider/config.json --image-credential-provider-bin-dir /etc/eks/image-credential-provider --node-ip=10.254.193.104 --pod-infra-container-image=602401143452.dkr.ecr.us-west-2.amazonaws.com/eks/pause:3.5 --v=2 --cloud-provider=aws --container-runtime=remote --node-labels=eks.amazonaws.com/nodegroup-image=ami-0a419d1a5b24a5d95,eks.amazonaws.com/capacityType=ON_DEMAND,eks.amazonaws.com/nodegroup=mng-al2 --max-pods=8\n"
I0730 08:21:23.527024   22854 check.go:231] Running 1 test_items
I0730 08:21:23.527035   22854 test.go:153] In flagTestItem.findValue 
I0730 08:21:23.527041   22854 test.go:247] Flag '--hostname-override' does not exist
I0730 08:21:23.527403   22854 check.go:255] Used auditCommand
I0730 08:21:23.527433   22854 check.go:287] Returning from execute on tests: finalOutput &check.testOutput{testResult:true, flagFound:false, actualResult:"UID        PID  PPID  C STIME TTY          TIME CMD\nroot      2839     1  1 Jul29 ?        00:14:22 /usr/bin/kubelet --config /etc/kubernetes/kubelet/kubelet-config.json --kubeconfig /var/lib/kubelet/kubeconfig --container-runtime-endpoint unix:///run/containerd/containerd.sock --image-credential-provider-config /etc/eks/image-credential-provider/config.json --image-credential-provider-bin-dir /etc/eks/image-credential-provider --node-ip=10.254.193.104 --pod-infra-container-image=602401143452.dkr.ecr.us-west-2.amazonaws.com/eks/pause:3.5 --v=2 --cloud-provider=aws --container-runtime=remote --node-labels=eks.amazonaws.com/nodegroup-image=ami-0a419d1a5b24a5d95,eks.amazonaws.com/capacityType=ON_DEMAND,eks.amazonaws.com/nodegroup=mng-al2 --max-pods=8", ExpectedResult:"'--hostname-override' is not present"}
I0730 08:21:23.527474   22854 check.go:184] Command: "" TestResult: true State: "PASS" 
I0730 08:21:23.527485   22854 check.go:110] -----   Running check 3.2.9   -----
I0730 08:21:23.542900   22854 check.go:309] Command: "/bin/ps -fC kubelet"
I0730 08:21:23.542918   22854 check.go:310] Output:
 "UID        PID  PPID  C STIME TTY          TIME CMD\nroot      2839     1  1 Jul29 ?        00:14:22 /usr/bin/kubelet --config /etc/kubernetes/kubelet/kubelet-config.json --kubeconfig /var/lib/kubelet/kubeconfig --container-runtime-endpoint unix:///run/containerd/containerd.sock --image-credential-provider-config /etc/eks/image-credential-provider/config.json --image-credential-provider-bin-dir /etc/eks/image-credential-provider --node-ip=10.254.193.104 --pod-infra-container-image=602401143452.dkr.ecr.us-west-2.amazonaws.com/eks/pause:3.5 --v=2 --cloud-provider=aws --container-runtime=remote --node-labels=eks.amazonaws.com/nodegroup-image=ami-0a419d1a5b24a5d95,eks.amazonaws.com/capacityType=ON_DEMAND,eks.amazonaws.com/nodegroup=mng-al2 --max-pods=8\n"
I0730 08:21:23.544688   22854 check.go:309] Command: "/bin/cat /etc/kubernetes/kubelet/kubelet-config.json"
I0730 08:21:23.544701   22854 check.go:310] Output:
 "{\n  \"kind\": \"KubeletConfiguration\",\n  \"apiVersion\": \"kubelet.config.k8s.io/v1beta1\",\n  \"address\": \"0.0.0.0\",\n  \"authentication\": {\n    \"anonymous\": {\n      \"enabled\": false\n    },\n    \"webhook\": {\n      \"cacheTTL\": \"2m0s\",\n      \"enabled\": true\n    },\n    \"x509\": {\n      \"clientCAFile\": \"/etc/kubernetes/pki/ca.crt\"\n    }\n  },\n  \"authorization\": {\n    \"mode\": \"Webhook\",\n    \"webhook\": {\n      \"cacheAuthorizedTTL\": \"5m0s\",\n      \"cacheUnauthorizedTTL\": \"30s\"\n    }\n  },\n  \"clusterDomain\": \"cluster.local\",\n  \"hairpinMode\": \"hairpin-veth\",\n  \"readOnlyPort\": 0,\n  \"cgroupDriver\": \"systemd\",\n  \"cgroupRoot\": \"/\",\n  \"featureGates\": {\n    \"RotateKubeletServerCertificate\": true,\n    \"KubeletCredentialProviders\": true\n  },\n  \"protectKernelDefaults\": true,\n  \"serializeImagePulls\": false,\n  \"serverTLSBootstrap\": true,\n  \"tlsCipherSuites\": [\n    \"TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256\",\n    \"TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256\",\n    \"TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305\",\n    \"TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305\",\n    \"TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_RSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_RSA_WITH_AES_128_GCM_SHA256\"\n  ],\n  \"clusterDNS\": [\n    \"172.20.0.10\"\n  ],\n  \"kubeAPIQPS\": 10,\n  \"kubeAPIBurst\": 20,\n  \"evictionHard\": {\n    \"memory.available\": \"100Mi\",\n    \"nodefs.available\": \"10%\",\n    \"nodefs.inodesFree\": \"5%\"\n  },\n  \"kubeReserved\": {\n    \"cpu\": \"70m\",\n    \"ephemeral-storage\": \"1Gi\",\n    \"memory\": \"343Mi\"\n  },\n  \"systemReservedCgroup\": \"/system\",\n  \"kubeReservedCgroup\": \"/runtime\"\n}\n"
I0730 08:21:23.544735   22854 check.go:231] Running 1 test_items
I0730 08:21:23.544745   22854 test.go:153] In flagTestItem.findValue 
I0730 08:21:23.544751   22854 test.go:247] Flag '--event-qps' does not exist
I0730 08:21:23.545087   22854 test.go:171] In pathTestItem.findValue 
I0730 08:21:23.545105   22854 test.go:249] Path '{.eventRecordQPS}' does not exist
I0730 08:21:23.545109   22854 check.go:255] Used auditConfig
I0730 08:21:23.545115   22854 check.go:287] Returning from execute on tests: finalOutput &check.testOutput{testResult:false, flagFound:false, actualResult:"{\n  \"kind\": \"KubeletConfiguration\",\n  \"apiVersion\": \"kubelet.config.k8s.io/v1beta1\",\n  \"address\": \"0.0.0.0\",\n  \"authentication\": {\n    \"anonymous\": {\n      \"enabled\": false\n    },\n    \"webhook\": {\n      \"cacheTTL\": \"2m0s\",\n      \"enabled\": true\n    },\n    \"x509\": {\n      \"clientCAFile\": \"/etc/kubernetes/pki/ca.crt\"\n    }\n  },\n  \"authorization\": {\n    \"mode\": \"Webhook\",\n    \"webhook\": {\n      \"cacheAuthorizedTTL\": \"5m0s\",\n      \"cacheUnauthorizedTTL\": \"30s\"\n    }\n  },\n  \"clusterDomain\": \"cluster.local\",\n  \"hairpinMode\": \"hairpin-veth\",\n  \"readOnlyPort\": 0,\n  \"cgroupDriver\": \"systemd\",\n  \"cgroupRoot\": \"/\",\n  \"featureGates\": {\n    \"RotateKubeletServerCertificate\": true,\n    \"KubeletCredentialProviders\": true\n  },\n  \"protectKernelDefaults\": true,\n  \"serializeImagePulls\": false,\n  \"serverTLSBootstrap\": true,\n  \"tlsCipherSuites\": [\n    \"TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256\",\n    \"TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256\",\n    \"TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305\",\n    \"TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305\",\n    \"TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_RSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_RSA_WITH_AES_128_GCM_SHA256\"\n  ],\n  \"clusterDNS\": [\n    \"172.20.0.10\"\n  ],\n  \"kubeAPIQPS\": 10,\n  \"kubeAPIBurst\": 20,\n  \"evictionHard\": {\n    \"memory.available\": \"100Mi\",\n    \"nodefs.available\": \"10%\",\n    \"nodefs.inodesFree\": \"5%\"\n  },\n  \"kubeReserved\": {\n    \"cpu\": \"70m\",\n    \"ephemeral-storage\": \"1Gi\",\n    \"memory\": \"343Mi\"\n  },\n  \"systemReservedCgroup\": \"/system\",\n  \"kubeReservedCgroup\": \"/runtime\"\n}", ExpectedResult:"'{.eventRecordQPS}' is present"}
I0730 08:21:23.545164   22854 check.go:184] Command: "/bin/cat /etc/kubernetes/kubelet/kubelet-config.json" TestResult: false State: "WARN" 
I0730 08:21:23.545174   22854 check.go:110] -----   Running check 3.2.10   -----
I0730 08:21:23.554723   22854 check.go:309] Command: "/bin/ps -fC kubelet"
I0730 08:21:23.554758   22854 check.go:310] Output:
 "UID        PID  PPID  C STIME TTY          TIME CMD\nroot      2839     1  1 Jul29 ?        00:14:22 /usr/bin/kubelet --config /etc/kubernetes/kubelet/kubelet-config.json --kubeconfig /var/lib/kubelet/kubeconfig --container-runtime-endpoint unix:///run/containerd/containerd.sock --image-credential-provider-config /etc/eks/image-credential-provider/config.json --image-credential-provider-bin-dir /etc/eks/image-credential-provider --node-ip=10.254.193.104 --pod-infra-container-image=602401143452.dkr.ecr.us-west-2.amazonaws.com/eks/pause:3.5 --v=2 --cloud-provider=aws --container-runtime=remote --node-labels=eks.amazonaws.com/nodegroup-image=ami-0a419d1a5b24a5d95,eks.amazonaws.com/capacityType=ON_DEMAND,eks.amazonaws.com/nodegroup=mng-al2 --max-pods=8\n"
I0730 08:21:23.556101   22854 check.go:309] Command: "/bin/cat /etc/kubernetes/kubelet/kubelet-config.json"
I0730 08:21:23.556132   22854 check.go:310] Output:
 "{\n  \"kind\": \"KubeletConfiguration\",\n  \"apiVersion\": \"kubelet.config.k8s.io/v1beta1\",\n  \"address\": \"0.0.0.0\",\n  \"authentication\": {\n    \"anonymous\": {\n      \"enabled\": false\n    },\n    \"webhook\": {\n      \"cacheTTL\": \"2m0s\",\n      \"enabled\": true\n    },\n    \"x509\": {\n      \"clientCAFile\": \"/etc/kubernetes/pki/ca.crt\"\n    }\n  },\n  \"authorization\": {\n    \"mode\": \"Webhook\",\n    \"webhook\": {\n      \"cacheAuthorizedTTL\": \"5m0s\",\n      \"cacheUnauthorizedTTL\": \"30s\"\n    }\n  },\n  \"clusterDomain\": \"cluster.local\",\n  \"hairpinMode\": \"hairpin-veth\",\n  \"readOnlyPort\": 0,\n  \"cgroupDriver\": \"systemd\",\n  \"cgroupRoot\": \"/\",\n  \"featureGates\": {\n    \"RotateKubeletServerCertificate\": true,\n    \"KubeletCredentialProviders\": true\n  },\n  \"protectKernelDefaults\": true,\n  \"serializeImagePulls\": false,\n  \"serverTLSBootstrap\": true,\n  \"tlsCipherSuites\": [\n    \"TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256\",\n    \"TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256\",\n    \"TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305\",\n    \"TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305\",\n    \"TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_RSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_RSA_WITH_AES_128_GCM_SHA256\"\n  ],\n  \"clusterDNS\": [\n    \"172.20.0.10\"\n  ],\n  \"kubeAPIQPS\": 10,\n  \"kubeAPIBurst\": 20,\n  \"evictionHard\": {\n    \"memory.available\": \"100Mi\",\n    \"nodefs.available\": \"10%\",\n    \"nodefs.inodesFree\": \"5%\"\n  },\n  \"kubeReserved\": {\n    \"cpu\": \"70m\",\n    \"ephemeral-storage\": \"1Gi\",\n    \"memory\": \"343Mi\"\n  },\n  \"systemReservedCgroup\": \"/system\",\n  \"kubeReservedCgroup\": \"/runtime\"\n}\n"
I0730 08:21:23.556173   22854 check.go:231] Running 2 test_items
I0730 08:21:23.556184   22854 test.go:153] In flagTestItem.findValue 
I0730 08:21:23.556190   22854 test.go:247] Flag '--rotate-certificates' does not exist
I0730 08:21:23.556270   22854 test.go:171] In pathTestItem.findValue 
I0730 08:21:23.556277   22854 test.go:249] Path '{.rotateCertificates}' does not exist
I0730 08:21:23.556281   22854 check.go:255] Used auditConfig
I0730 08:21:23.556436   22854 test.go:153] In flagTestItem.findValue 
I0730 08:21:23.556446   22854 test.go:247] Flag '--rotate-certificates' does not exist
I0730 08:21:23.556598   22854 test.go:171] In pathTestItem.findValue 
I0730 08:21:23.556620   22854 test.go:249] Path '{.rotateCertificates}' does not exist
I0730 08:21:23.556625   22854 check.go:255] Used auditConfig
I0730 08:21:23.556635   22854 check.go:287] Returning from execute on tests: finalOutput &check.testOutput{testResult:true, flagFound:false, actualResult:"{\n  \"kind\": \"KubeletConfiguration\",\n  \"apiVersion\": \"kubelet.config.k8s.io/v1beta1\",\n  \"address\": \"0.0.0.0\",\n  \"authentication\": {\n    \"anonymous\": {\n      \"enabled\": false\n    },\n    \"webhook\": {\n      \"cacheTTL\": \"2m0s\",\n      \"enabled\": true\n    },\n    \"x509\": {\n      \"clientCAFile\": \"/etc/kubernetes/pki/ca.crt\"\n    }\n  },\n  \"authorization\": {\n    \"mode\": \"Webhook\",\n    \"webhook\": {\n      \"cacheAuthorizedTTL\": \"5m0s\",\n      \"cacheUnauthorizedTTL\": \"30s\"\n    }\n  },\n  \"clusterDomain\": \"cluster.local\",\n  \"hairpinMode\": \"hairpin-veth\",\n  \"readOnlyPort\": 0,\n  \"cgroupDriver\": \"systemd\",\n  \"cgroupRoot\": \"/\",\n  \"featureGates\": {\n    \"RotateKubeletServerCertificate\": true,\n    \"KubeletCredentialProviders\": true\n  },\n  \"protectKernelDefaults\": true,\n  \"serializeImagePulls\": false,\n  \"serverTLSBootstrap\": true,\n  \"tlsCipherSuites\": [\n    \"TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256\",\n    \"TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256\",\n    \"TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305\",\n    \"TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305\",\n    \"TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_RSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_RSA_WITH_AES_128_GCM_SHA256\"\n  ],\n  \"clusterDNS\": [\n    \"172.20.0.10\"\n  ],\n  \"kubeAPIQPS\": 10,\n  \"kubeAPIBurst\": 20,\n  \"evictionHard\": {\n    \"memory.available\": \"100Mi\",\n    \"nodefs.available\": \"10%\",\n    \"nodefs.inodesFree\": \"5%\"\n  },\n  \"kubeReserved\": {\n    \"cpu\": \"70m\",\n    \"ephemeral-storage\": \"1Gi\",\n    \"memory\": \"343Mi\"\n  },\n  \"systemReservedCgroup\": \"/system\",\n  \"kubeReservedCgroup\": \"/runtime\"\n}", ExpectedResult:"'{.rotateCertificates}' is present OR '{.rotateCertificates}' is not present"}
I0730 08:21:23.556787   22854 check.go:184] Command: "/bin/cat /etc/kubernetes/kubelet/kubelet-config.json" TestResult: true State: "PASS" 
I0730 08:21:23.556813   22854 check.go:110] -----   Running check 3.2.11   -----
I0730 08:21:23.568323   22854 check.go:309] Command: "/bin/ps -fC kubelet"
I0730 08:21:23.568360   22854 check.go:310] Output:
 "UID        PID  PPID  C STIME TTY          TIME CMD\nroot      2839     1  1 Jul29 ?        00:14:22 /usr/bin/kubelet --config /etc/kubernetes/kubelet/kubelet-config.json --kubeconfig /var/lib/kubelet/kubeconfig --container-runtime-endpoint unix:///run/containerd/containerd.sock --image-credential-provider-config /etc/eks/image-credential-provider/config.json --image-credential-provider-bin-dir /etc/eks/image-credential-provider --node-ip=10.254.193.104 --pod-infra-container-image=602401143452.dkr.ecr.us-west-2.amazonaws.com/eks/pause:3.5 --v=2 --cloud-provider=aws --container-runtime=remote --node-labels=eks.amazonaws.com/nodegroup-image=ami-0a419d1a5b24a5d95,eks.amazonaws.com/capacityType=ON_DEMAND,eks.amazonaws.com/nodegroup=mng-al2 --max-pods=8\n"
I0730 08:21:23.569933   22854 check.go:309] Command: "/bin/cat /etc/kubernetes/kubelet/kubelet-config.json"
I0730 08:21:23.570060   22854 check.go:310] Output:
 "{\n  \"kind\": \"KubeletConfiguration\",\n  \"apiVersion\": \"kubelet.config.k8s.io/v1beta1\",\n  \"address\": \"0.0.0.0\",\n  \"authentication\": {\n    \"anonymous\": {\n      \"enabled\": false\n    },\n    \"webhook\": {\n      \"cacheTTL\": \"2m0s\",\n      \"enabled\": true\n    },\n    \"x509\": {\n      \"clientCAFile\": \"/etc/kubernetes/pki/ca.crt\"\n    }\n  },\n  \"authorization\": {\n    \"mode\": \"Webhook\",\n    \"webhook\": {\n      \"cacheAuthorizedTTL\": \"5m0s\",\n      \"cacheUnauthorizedTTL\": \"30s\"\n    }\n  },\n  \"clusterDomain\": \"cluster.local\",\n  \"hairpinMode\": \"hairpin-veth\",\n  \"readOnlyPort\": 0,\n  \"cgroupDriver\": \"systemd\",\n  \"cgroupRoot\": \"/\",\n  \"featureGates\": {\n    \"RotateKubeletServerCertificate\": true,\n    \"KubeletCredentialProviders\": true\n  },\n  \"protectKernelDefaults\": true,\n  \"serializeImagePulls\": false,\n  \"serverTLSBootstrap\": true,\n  \"tlsCipherSuites\": [\n    \"TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256\",\n    \"TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256\",\n    \"TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305\",\n    \"TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305\",\n    \"TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_RSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_RSA_WITH_AES_128_GCM_SHA256\"\n  ],\n  \"clusterDNS\": [\n    \"172.20.0.10\"\n  ],\n  \"kubeAPIQPS\": 10,\n  \"kubeAPIBurst\": 20,\n  \"evictionHard\": {\n    \"memory.available\": \"100Mi\",\n    \"nodefs.available\": \"10%\",\n    \"nodefs.inodesFree\": \"5%\"\n  },\n  \"kubeReserved\": {\n    \"cpu\": \"70m\",\n    \"ephemeral-storage\": \"1Gi\",\n    \"memory\": \"343Mi\"\n  },\n  \"systemReservedCgroup\": \"/system\",\n  \"kubeReservedCgroup\": \"/runtime\"\n}\n"
I0730 08:21:23.570162   22854 check.go:231] Running 1 test_items
I0730 08:21:23.570171   22854 test.go:153] In flagTestItem.findValue 
I0730 08:21:23.570178   22854 test.go:247] Flag 'RotateKubeletServerCertificate' does not exist
I0730 08:21:23.570324   22854 test.go:171] In pathTestItem.findValue true
I0730 08:21:23.570347   22854 test.go:249] Path '{.featureGates.RotateKubeletServerCertificate}' exists
I0730 08:21:23.570352   22854 check.go:255] Used auditConfig
I0730 08:21:23.570358   22854 check.go:287] Returning from execute on tests: finalOutput &check.testOutput{testResult:true, flagFound:false, actualResult:"{\n  \"kind\": \"KubeletConfiguration\",\n  \"apiVersion\": \"kubelet.config.k8s.io/v1beta1\",\n  \"address\": \"0.0.0.0\",\n  \"authentication\": {\n    \"anonymous\": {\n      \"enabled\": false\n    },\n    \"webhook\": {\n      \"cacheTTL\": \"2m0s\",\n      \"enabled\": true\n    },\n    \"x509\": {\n      \"clientCAFile\": \"/etc/kubernetes/pki/ca.crt\"\n    }\n  },\n  \"authorization\": {\n    \"mode\": \"Webhook\",\n    \"webhook\": {\n      \"cacheAuthorizedTTL\": \"5m0s\",\n      \"cacheUnauthorizedTTL\": \"30s\"\n    }\n  },\n  \"clusterDomain\": \"cluster.local\",\n  \"hairpinMode\": \"hairpin-veth\",\n  \"readOnlyPort\": 0,\n  \"cgroupDriver\": \"systemd\",\n  \"cgroupRoot\": \"/\",\n  \"featureGates\": {\n    \"RotateKubeletServerCertificate\": true,\n    \"KubeletCredentialProviders\": true\n  },\n  \"protectKernelDefaults\": true,\n  \"serializeImagePulls\": false,\n  \"serverTLSBootstrap\": true,\n  \"tlsCipherSuites\": [\n    \"TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256\",\n    \"TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256\",\n    \"TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305\",\n    \"TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305\",\n    \"TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_RSA_WITH_AES_256_GCM_SHA384\",\n    \"TLS_RSA_WITH_AES_128_GCM_SHA256\"\n  ],\n  \"clusterDNS\": [\n    \"172.20.0.10\"\n  ],\n  \"kubeAPIQPS\": 10,\n  \"kubeAPIBurst\": 20,\n  \"evictionHard\": {\n    \"memory.available\": \"100Mi\",\n    \"nodefs.available\": \"10%\",\n    \"nodefs.inodesFree\": \"5%\"\n  },\n  \"kubeReserved\": {\n    \"cpu\": \"70m\",\n    \"ephemeral-storage\": \"1Gi\",\n    \"memory\": \"343Mi\"\n  },\n  \"systemReservedCgroup\": \"/system\",\n  \"kubeReservedCgroup\": \"/runtime\"\n}", ExpectedResult:"'{.featureGates.RotateKubeletServerCertificate}' is equal to 'true'"}
I0730 08:21:23.570404   22854 check.go:184] Command: "/bin/cat /etc/kubernetes/kubelet/kubelet-config.json" TestResult: true State: "PASS" 
I0730 08:21:23.570413   22854 check.go:110] -----   Running check 3.3.1   -----
I0730 08:21:23.570420   22854 check.go:145] No tests defined
[INFO] 3 Worker Node Security Configuration
[INFO] 3.1 Worker Node Configuration Files
[PASS] 3.1.1 Ensure that the kubeconfig file permissions are set to 644 or more restrictive (Manual)
[PASS] 3.1.2 Ensure that the kubelet kubeconfig file ownership is set to root:root (Manual)
[PASS] 3.1.3 Ensure that the kubelet configuration file has permissions set to 644 or more restrictive (Manual)
[PASS] 3.1.4 Ensure that the kubelet configuration file ownership is set to root:root (Manual)
[INFO] 3.2 Kubelet
[PASS] 3.2.1 Ensure that the Anonymous Auth is Not Enabled (Automated)
[PASS] 3.2.2 Ensure that the --authorization-mode argument is not set to AlwaysAllow (Automated)
[PASS] 3.2.3 Ensure that a Client CA File is Configured (Manual)
[PASS] 3.2.4 Ensure that the --read-only-port is disabled (Manual)
[PASS] 3.2.5 Ensure that the --streaming-connection-idle-timeout argument is not set to 0 (Automated)
[PASS] 3.2.6 Ensure that the --protect-kernel-defaults argument is set to true (Automated)
[PASS] 3.2.7 Ensure that the --make-iptables-util-chains argument is set to true (Automated) 
[PASS] 3.2.8 Ensure that the --hostname-override argument is not set (Manual)
[WARN] 3.2.9 Ensure that the --eventRecordQPS argument is set to 0 or a level which ensures appropriate event capture (Automated)
[PASS] 3.2.10 Ensure that the --rotate-certificates argument is not present or is set to true (Manual)
[PASS] 3.2.11 Ensure that the RotateKubeletServerCertificate argument is set to true (Manual)
[INFO] 3.3 Container Optimized OS
[WARN] 3.3.1 Prefer using a container-optimized OS when possible (Manual)

== Remediations node ==
3.2.9 If using a Kubelet config file, edit the file to set eventRecordQPS: to an appropriate level.
If using command line arguments, edit the kubelet service file
/etc/systemd/system/kubelet.service on each worker node and
set the below parameter in KUBELET_SYSTEM_PODS_ARGS variable.
Based on your system, restart the kubelet service. For example:
systemctl daemon-reload
systemctl restart kubelet.service

3.3.1 audit test did not run: No tests defined

== Summary node ==
14 checks PASS
0 checks FAIL
2 checks WARN
0 checks INFO

== Summary total ==
14 checks PASS
0 checks FAIL
2 checks WARN
0 checks INFO
```
::::

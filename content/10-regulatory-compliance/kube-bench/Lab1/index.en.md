---
title : "Lab 1 - Validating using kube-bench CLI on Amazon Linux 2 Worker node"
weight : 21
---

In this lab, we will install kube-bench directly in one of the linux nodes and run the CIS Amazon EKS Benchmark node assessment against eks-1.2.0 node controls.
1. Open the [AWS Cloud9 console](https://console.aws.amazon.com/cloud9/) created for the workshop 
2. List Amazon EKS cluster nodes
```shell
kubectl get nodes
```
::::expand{header="Check Output"}
```shell
NAME                                           STATUS   ROLES    AGE    VERSION
ip-10-254-168-73.us-west-2.compute.internal    Ready    <none>   2d2h   v1.25.11-eks-a5565ad
ip-10-254-178-204.us-west-2.compute.internal   Ready    <none>   26m    v1.25.9-eks-0a21954
ip-10-254-193-104.us-west-2.compute.internal   Ready    <none>   2d2h   v1.25.11-eks-a5565ad
```
::::
3. Select one of the worker node from the AWS console
   ![AWS Console Instance](/static/images/regulatory-compliance/kube-bench/Lab1/instance.jpg)
   
4. Connect the Instance through Sessions Manager
   ![SSM Connect](/static/images/regulatory-compliance/kube-bench/Lab1/ssm-connect.jpg)
   
5. Install kube-bench using the commands below.
```shell
KUBEBENCH_URL=$(curl -s https://api.github.com/repos/aquasecurity/kube-bench/releases/latest | jq -r '.assets[] | select(.name | contains("amd64.rpm")) | .browser_download_url')
```
6. Install kubebench package with yum command
```shell
sudo yum install -y $KUBEBENCH_URL
```
7. Run the kube bench command
```shell
kube-bench --benchmark eks-1.2.0
```

The output will look like below.

```bash
] 3 Worker Node Security Configuration
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

[INFO] 4 Policies
[INFO] 4.1 RBAC and Service Accounts
[WARN] 4.1.1 Ensure that the cluster-admin role is only used where required (Manual)
[WARN] 4.1.2 Minimize access to secrets (Manual)
[WARN] 4.1.3 Minimize wildcard use in Roles and ClusterRoles (Manual)
[WARN] 4.1.4 Minimize access to create pods (Manual)
[WARN] 4.1.5 Ensure that default service accounts are not actively used. (Manual)
[WARN] 4.1.6 Ensure that Service Account Tokens are only mounted where necessary (Manual)
[WARN] 4.1.7 Avoid use of system:masters group (Manual)
[WARN] 4.1.8 Limit use of the Bind, Impersonate and Escalate permissions in the Kubernetes cluster (Manual)
[INFO] 4.2 Pod Security Policies
[WARN] 4.2.1 Minimize the admission of privileged containers (Automated)
[WARN] 4.2.2 Minimize the admission of containers wishing to share the host process ID namespace (Automated)
[WARN] 4.2.3 Minimize the admission of containers wishing to share the host IPC namespace (Automated)
[WARN] 4.2.4 Minimize the admission of containers wishing to share the host network namespace (Automated)
[WARN] 4.2.5 Minimize the admission of containers with allowPrivilegeEscalation (Automated)
[WARN] 4.2.6 Minimize the admission of root containers (Automated)
[WARN] 4.2.7 Minimize the admission of containers with added capabilities (Manual)
[WARN] 4.2.8 Minimize the admission of containers with capabilities assigned (Manual)
[INFO] 4.3 CNI Plugin
[WARN] 4.3.1 Ensure CNI plugin supports network policies (Manual)
[WARN] 4.3.2 Ensure that all Namespaces have Network Policies defined (Manual)
[INFO] 4.4 Secrets Management
[WARN] 4.4.1 Prefer using secrets as files over secrets as environment variables (Manual)
[WARN] 4.4.2 Consider external secret storage (Manual)
[INFO] 4.6 General Policies
[WARN] 4.6.1 Create administrative boundaries between resources using namespaces (Manual)
[WARN] 4.6.2 Apply Security Context to Your Pods and Containers (Manual)
[WARN] 4.6.3 The default namespace should not be used (Manual)

== Remediations policies ==
4.1.1 Identify all clusterrolebindings to the cluster-admin role. Check if they are used and
if they need this role or if they could use a role with fewer privileges.
Where possible, first bind users to a lower privileged role and then remove the
clusterrolebinding to the cluster-admin role :
kubectl delete clusterrolebinding [name]

4.1.2 Where possible, remove get, list and watch access to secret objects in the cluster.

4.1.3 Where possible replace any use of wildcards in clusterroles and roles with specific
objects or actions.

4.1.4 Where possible, remove create access to pod objects in the cluster.

4.1.5 Create explicit service accounts wherever a Kubernetes workload requires specific access
to the Kubernetes API server.
Modify the configuration of each default service account to include this value
automountServiceAccountToken: false

4.1.6 Modify the definition of pods and service accounts which do not need to mount service
account tokens to disable it.

4.1.7 Remove the system:masters group from all users in the cluster.

4.1.8 Where possible, remove the impersonate, bind and escalate rights from subjects.

4.2.1 Create a PSP as described in the Kubernetes documentation, ensuring that
the .spec.privileged field is omitted or set to false.

4.2.2 Create a PSP as described in the Kubernetes documentation, ensuring that the
.spec.hostPID field is omitted or set to false.

4.2.3 Create a PSP as described in the Kubernetes documentation, ensuring that the
.spec.hostIPC field is omitted or set to false.

4.2.4 Create a PSP as described in the Kubernetes documentation, ensuring that the
.spec.hostNetwork field is omitted or set to false.

4.2.5 Create a PSP as described in the Kubernetes documentation, ensuring that the
.spec.allowPrivilegeEscalation field is omitted or set to false.

4.2.6 Create a PSP as described in the Kubernetes documentation, ensuring that the
.spec.runAsUser.rule is set to either MustRunAsNonRoot or MustRunAs with the range of
UIDs not including 0.

4.2.7 Ensure that allowedCapabilities is not present in PSPs for the cluster unless
it is set to an empty array.

4.2.8 Review the use of capabilities in applications running on your cluster. Where a namespace
contains applications which do not require any Linux capabities to operate consider adding
a PSP which forbids the admission of containers which do not drop all capabilities.

4.3.1 As with RBAC policies, network policies should adhere to the policy of least privileged
access. Start by creating a deny all policy that restricts all inbound and outbound traffic
from a namespace or create a global policy using Calico.

4.3.2 Follow the documentation and create NetworkPolicy objects as you need them.

4.4.1 If possible, rewrite application code to read secrets from mounted secret files, rather than
from environment variables.

4.4.2 Refer to the secrets management options offered by your cloud provider or a third-party
secrets management solution.

4.6.1 Follow the documentation and create namespaces for objects in your deployment as you need
them.

4.6.2 Follow the Kubernetes documentation and apply security contexts to your pods. For a
suggested list of security contexts, you may refer to the CIS Security Benchmark for Docker
Containers.

4.6.3 Ensure that namespaces are created to allow for appropriate segregation of Kubernetes
resources and that all new resources are created in a specific namespace.


== Summary policies ==
0 checks PASS
0 checks FAIL
23 checks WARN
0 checks INFO

[INFO] 5 Managed Services
[INFO] 5.1 Image Registry and Image Scanning
[WARN] 5.1.1 Ensure Image Vulnerability Scanning using Amazon ECR image scanning or a third-party provider (Manual)
[WARN] 5.1.2 Minimize user access to Amazon ECR (Manual)
[WARN] 5.1.3 Minimize cluster access to read-only for Amazon ECR (Manual)
[WARN] 5.1.4 Minimize Container Registries to only those approved (Manual)
[INFO] 5.2 Identity and Access Management (IAM)
[WARN] 5.2.1 Prefer using dedicated Amazon EKS Service Accounts (Manual)
[INFO] 5.3 AWS Key Management Service (KMS)
[WARN] 5.3.1 Ensure Kubernetes Secrets are encrypted using Customer Master Keys (CMKs) managed in AWS KMS (Manual)
[INFO] 5.4 Cluster Networking
[WARN] 5.4.1 Restrict Access to the Control Plane Endpoint (Manual)
[WARN] 5.4.2 Ensure clusters are created with Private Endpoint Enabled and Public Access Disabled (Manual)
[WARN] 5.4.3 Ensure clusters are created with Private Nodes (Manual)
[WARN] 5.4.4 Ensure Network Policy is Enabled and set as appropriate (Manual)
[WARN] 5.4.5 Encrypt traffic to HTTPS load balancers with TLS certificates (Manual)
[INFO] 5.5 Authentication and Authorization
[WARN] 5.5.1 Manage Kubernetes RBAC users with AWS IAM Authenticator for Kubernetes (Manual)
[INFO] 5.6 Other Cluster Configurations
[WARN] 5.6.1 Consider Fargate for running untrusted workloads (Manual)

== Remediations managedservices ==
5.1.1 To utilize AWS ECR for Image scanning please follow the steps below:

To create a repository configured for scan on push (AWS CLI):
aws ecr create-repository --repository-name $REPO_NAME --image-scanning-configuration scanOnPush=true --region $REGION_CODE

To edit the settings of an existing repository (AWS CLI):
aws ecr put-image-scanning-configuration --repository-name $REPO_NAME --image-scanning-configuration scanOnPush=true --region $REGION_CODE

Use the following steps to start a manual image scan using the AWS Management Console.
    Open the Amazon ECR console at https://console.aws.amazon.com/ecr/repositories.
    From the navigation bar, choose the Region to create your repository in.
    In the navigation pane, choose Repositories.
    On the Repositories page, choose the repository that contains the image to scan.
    On the Images page, select the image to scan and then choose Scan.

5.1.2 Before you use IAM to manage access to Amazon ECR, you should understand what IAM features
are available to use with Amazon ECR. To get a high-level view of how Amazon ECR and other
AWS services work with IAM, see AWS Services That Work with IAM in the IAM User Guide.

5.1.3 You can use your Amazon ECR images with Amazon EKS, but you need to satisfy the following prerequisites.

The Amazon EKS worker node IAM role (NodeInstanceRole) that you use with your worker nodes must possess
the following IAM policy permissions for Amazon ECR.

{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ecr:BatchCheckLayerAvailability",
                "ecr:BatchGetImage",
                "ecr:GetDownloadUrlForLayer",
                "ecr:GetAuthorizationToken"
            ],
            "Resource": "*"
        }
    ]
}

5.1.4 No remediation
5.2.1 No remediation
5.3.1 This process can only be performed during Cluster Creation.

Enable 'Secrets Encryption' during Amazon EKS cluster creation as described
in the links within the 'References' section.

5.4.1 No remediation
5.4.2 No remediation
5.4.3 No remediation
5.4.4 No remediation
5.4.5 No remediation
5.5.1 Refer to the 'Managing users or IAM roles for your cluster' in Amazon EKS documentation.

5.6.1 Create a Fargate profile for your cluster Before you can schedule pods running on Fargate
in your cluster, you must define a Fargate profile that specifies which pods should use
Fargate when they are launched. For more information, see AWS Fargate profile.

Note: If you created your cluster with eksctl using the --fargate option, then a Fargate profile has
already been created for your cluster with selectors for all pods in the kube-system
and default namespaces. Use the following procedure to create Fargate profiles for
any other namespaces you would like to use with Fargate.


== Summary managedservices ==
0 checks PASS
0 checks FAIL
13 checks WARN
0 checks INFO

== Summary total ==
14 checks PASS
0 checks FAIL
38 checks WARN
0 checks INFO
```
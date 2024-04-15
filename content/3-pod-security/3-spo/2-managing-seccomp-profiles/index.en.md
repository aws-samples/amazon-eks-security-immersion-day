---
title : "Managing Seccomp Profiles"
weight : 22
---

In this section, we will use the Security Profiles Operator to create and manage seccomp profiles and bind them to workloads.

## Creating a seccomp profile ##

We will use `SeccompProfile` object to create profiles. `SeccompProfile` objects can restrict syscalls within a container, limiting the access of your application.

Run below command to create the `SeccompProfile` object:

```bash
cat > ~/environment/seccompprofile.yaml <<EOF
apiVersion: v1
kind: Namespace
metadata:
  name: \$SCP_NS
---
apiVersion: security-profiles-operator.x-k8s.io/v1beta1
kind: SeccompProfile
metadata:
  name: \$SP_NAME
  namespace: \$SCP_NS
spec:
  defaultAction: SCMP_ACT_LOG
EOF
```

## Deploy the seccomp profile

Run below command to deploy the seccomp profile `profile1` in Namespace `sc-profiles`.

```bash
export SP_NAME=profile1
export SCP_NS=scp-ns
envsubst < ~/environment/seccompprofile.yaml > ~/environment/sc-profile1.yaml
kubectl apply -f ~/environment/sc-profile1.yaml
```

::::expand{header="Check Output"}
```bash
namespace/scp-ns created
seccompprofile.security-profiles-operator.x-k8s.io/profile1 created
```
::::

Check if the profile has been installed.

```bash
kubectl get seccompprofile $SP_NAME -n $SCP_NS -o wide
```

::::expand{header="Check Output"}
```bash
NAME       STATUS      AGE     LOCALHOSTPROFILE
profile1   Installed   8m18s   operator/scp-ns/profile1.json
```
::::

The seccomp profile will be saved in `/var/lib/kubelet/seccomp/operator/<namespace>/<name>.json` on the cluster nodes.

### Applying seccomp profiles to a pod ###

Create a pod to apply one of the created profiles (We will create an `NGINX Unprivileged Docker Image` that runs NGINX as a non root, unprivilegded user.).

Run below command to create the test pod:

```bash
cat > ~/environment/test-pod-template.yaml <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: scp-test-pod
spec:
  securityContext:
    seccompProfile:
      type: Localhost
      localhostProfile: operator/\$SCP_NS/\$SP_NAME.json
  containers:
    - name: test-container
      image: public.ecr.aws/nginx/nginx-unprivileged:stable-bullseye-perl
EOF
```

```bash
envsubst < ~/environment/test-pod-template.yaml > ~/environment/scp-test-pod.yaml
kubectl apply -f ~/environment/scp-test-pod.yaml
```

::::expand{header="Check Output"}
```bash
pod/scp-test-pod created
```
::::








This completes the SPO setup on Amazon EKS cluster.


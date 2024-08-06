---
title : "Managing SELinux Profiles"
weight : 22
---

In this section, we will use the Security Profiles Operator to create and manage SELinux profiles and bind them to workloads.

## Creating SELinux profiles ##

We can use `SelinuxProfile` object to create profles.

The `SelinuxProfile` object has several features that allow for better security hardening and readability:
*  restricts the profiles to inherit from to the current namespace or a system-wide profile. Because there are typically many profiles installed on the system, but only a subset should be used by cluster workloads, the inheritable system profiles are listed in the spod instance in `spec.selinuxOptions.allowedSystemProfiles`. Depending on what distribution your nodes run, the base profile might vary, on RHEL-based systems, you might want to look at what profiles are shipped in the `container-selinux` RPM package.
* Performs basic validation of the permissions, classes and labels
* Adds a new keyword `@self` that describes the process using the policy. This allows to reuse a policy between workloads and namespaces easily, as the "usage" of the policy (see below) is based on the name and namespace.
* Adds features for better security hardening and readability compared to writing a profile directly in the SELinux CIL language.

1. Create a policy that can be used with a non-privileged workload by creating the following `SelinuxProfile` object:

```bash
cat > ~/environment/selinuxprofile.yaml <<EOF
apiVersion: v1
kind: Namespace
metadata:
  name: \$SCP_SE_NS
---
apiVersion: security-profiles-operator.x-k8s.io/v1alpha2
kind: SelinuxProfile
metadata:
  name: nginx-secure
  namespace: \$SCP_NS
spec:
  allow:
    "@self":
      tcp_socket:
        - listen
    http_cache_port_t:
      tcp_socket:
        - name_bind
    node_t:
      tcp_socket:
        - node_bind
  inherit:
    - kind: System
      name: container
EOF
```

```bash
export SCP_SE_NS=scp-selinux
envsubst < ~/environment/selinuxprofile.yaml > ~/environment/selinux-profile1.yaml
kubectl apply -f ~/environment/selinux-profile1.yaml
```

::::expand{header="Check Output"}
```bash
namespace/scp-selinux created
selinuxprofile.security-profiles-operator.x-k8s.io/nginx-secure created
```
::::

After the policy is created, we can run this command to make sure it's installed:

```bash
kubectl get selinuxprofile -n $SCP_SE_NS
```
::::expand{header="Check Output"}
```bash
NAME           USAGE   STATE
nginx-secure 
```
::::




















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

Confirm the profile was applied correctly to the pod by running the following command:

```bash
kubectl get pod scp-test-pod --output=jsonpath='{.spec.securityContext}' | jq .
```

::::expand{header="Check Output"}
```bash
{
  "seccompProfile": {
    "localhostProfile": "operator/scp-ns/profile1.json",
    "type": "Localhost"
  }
}
```
::::

### Binding workloads to profiles with ProfileBindings

You can use the `ProfileBinding` resource to bind a security profile to the `SecurityContext` of a container.

To bind a pod that uses a `public.ecr.aws/nginx/nginx-unprivileged:stable-bullseye-perl` image to the example `SeccompProfile` profile, create a `ProfileBinding` object in the same namespace with the pod and the `SecurityProfile` objects:

```bash
cat > ~/environment/profile-binding-template.yaml <<EOF
apiVersion: security-profiles-operator.x-k8s.io/v1alpha1
kind: ProfileBinding
metadata:
  namespace: \$SCP_NS
  name: nginx-binding
spec:
  profileRef:
    kind: SeccompProfile 
    name: \$SP_NAME
  image: public.ecr.aws/nginx/nginx-unprivileged:stable-bullseye-perl
EOF
```

```bash
envsubst < ~/environment/profile-binding-template.yaml > ~/environment/scp-profile-binding.yaml
kubectl apply -f ~/environment/scp-profile-binding.yaml
```

::::expand{header="Check Output"}
```bash
profilebinding.security-profiles-operator.x-k8s.io/nginx-binding created
```
::::

Label the namespace with `enable-binding=true` by running the following command:

```bash
kubectl label ns $SCP_NS spo.x-k8s.io/enable-binding=true
```

::::expand{header="Check Output"}
```bash
namespace/scp-ns labeled
```
::::

Define a pod named `test-scp-binding-pod.yaml`

```bash
cat > ~/environment/test-scp-binding-pod.yaml <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: test-scp-binding-pod
  namespace: scp-ns
spec:
  containers:
    - name: test-container
      image: public.ecr.aws/nginx/nginx-unprivileged:stable-bullseye-perl
EOF
```

Create the pod:

```bash
kubectl create -f ~/environment/test-scp-binding-pod.yaml 
```

`Note: If the pod already exists, you must re-create the pod for the binding to work properly.`

Confirm the pod inherits the `ProfileBinding` by running the following command:

```bash
kubectl get pods test-scp-binding-pod -n $SCP_NS -o jsonpath='{.spec.containers[*].securityContext.seccompProfile}' | jq .
```

::::expand{header="Check Output"}
```bash
{
  "localhostProfile": "operator/scp-ns/profile1.json",
  "type": "Localhost"
}
```
::::

### Recording profiles from workloads

The Security Profiles Operator can record system calls with `ProfileRecoding` objects, making it easier to create baseline profiles for applications. 

When using the log enricher for recording seccomp profiles, verify that log enricher feature is enabled. 

## Using the log enricher

The operator ships with a log enrichment feature, which is disabled by default. The reason for that is the log enricher container runs in previleged mode to be able to read the audit logs from the cluster nodes. 

In order for log enricher to work properly, we need to have [auditd](https://man7.org/linux/man-pages/man8/auditd.8.html) installed and run on all worker nodes.

## Install `auditd` on Kubernetes nodes


Run below command to install `auditd` onto the Kubernetes worker nodes:

```bash
# Get the list of node names
nodes=$(kubectl get nodes -o custom-columns=NAME:.metadata.name | tail -n +2)

# Loop through each node to find its EC2 instance ID
instance_ids=()
for node in $nodes; do
  # Get the instance ID from the node's label
  instance_id=$(kubectl get node $node -o jsonpath='{.spec.providerID}' | cut -d'/' -f5)
  instance_ids+=($instance_id)
done

# Convert the instance_ids array to a space-separated string
instance_ids_str=$(IFS=' ' ; echo "${instance_ids[*]}")

# Send a command to uninstall chronicled and install auditd on all instances
aws ssm send-command \
  --instance-ids $instance_ids_str \
  --document-name "AWS-RunShellScript" \
  --comment "Uninstalling chronicled and installing auditd" \
  --parameters commands="sudo yum remove -y chronicled; sudo yum install -y audit; sudo systemctl start auditd" \
  --timeout-seconds 600 \
  --region us-west-2
```

::::expand{header="Check Output"}
```bash
{
    "Command": {
        "CommandId": "c76bf068-feca-48ad-a225-fd62697f3109",
        "DocumentName": "AWS-RunShellScript",
        "DocumentVersion": "$DEFAULT",
        "Comment": "Uninstalling chronicled and installing auditd",
        "ExpiresAfter": "2024-05-21T23:15:18.791000+00:00",
        "Parameters": {
            "commands": [
                "sudo yum remove -y chronicled; sudo yum install -y audit; sudo systemctl start auditd"
            ]
        },
        "InstanceIds": [],
        "Targets": [],
        "RequestedDateTime": "2024-05-21T22:05:18.791000+00:00",
        "Status": "Pending",
        "StatusDetails": "Pending",
        "OutputS3Region": "us-west-2",
        "OutputS3BucketName": "",
        "OutputS3KeyPrefix": "",
        "MaxConcurrency": "50",
        "MaxErrors": "0",
        "TargetCount": 0,
        "CompletedCount": 0,
        "ErrorCount": 0,
        "DeliveryTimedOutCount": 0,
        "ServiceRole": "",
        "NotificationConfig": {
            "NotificationArn": "",
            "NotificationEvents": [],
            "NotificationType": ""
        },
        "CloudWatchOutputConfig": {
            "CloudWatchLogGroupName": "",
            "CloudWatchOutputEnabled": false
        },
        "TimeoutSeconds": 600,
        "AlarmConfiguration": {
            "IgnorePollAlarmFailure": false,
            "Alarms": []
        },
        "TriggeredAlarms": []
    }
}
```

## Enable log enricher feature:

```
kubectl -n security-profiles-operator patch spod spod --type=merge -p '{"spec":{"enableLogEnricher":true}}'
```

::::expand{header="Check Output"}
```bash
securityprofilesoperatordaemon.security-profiles-operator.x-k8s.io/spod patched
```
## Examine the log enricher output on the running pods:

```
kubectl -n security-profiles-operator logs -f ds/spod log-enricher --tail 10
```
::::expand{header="Check Output"}
```bash
Found 3 pods, using pod/spod-5nbvs
I0516 08:13:07.654039 4190800 enricher.go:446] "audit" logger="log-enricher" timestamp="1715847187.650:21196375" type="seccomp" node="ip-192-168-86-155.us-west-2.compute.internal" namespace="scp-ns" pod="scp-test-pod" container="redis" executable="/usr/local/bin/redis-server" pid=3723190 syscallID=39 syscallName="getpid"
I0516 08:13:07.654263 4190800 enricher.go:446] "audit" logger="log-enricher" timestamp="1715847187.650:21196376" type="seccomp" node="ip-192-168-86-155.us-west-2.compute.internal" namespace="scp-ns" pod="scp-test-pod" container="redis" executable="/usr/local/bin/redis-server" pid=3723190 syscallID=257 syscallName="openat"
I0516 08:13:07.654463 4190800 enricher.go:446] "audit" logger="log-enricher" timestamp="1715847187.650:21196377" type="seccomp" node="ip-192-168-86-155.us-west-2.compute.internal" namespace="scp-ns" pod="scp-test-pod" container="redis" executable="/usr/local/bin/redis-server" pid=3723190 syscallID=0 syscallName="read"
I0516 08:13:07.654683 4190800 enricher.go:446] "audit" logger="log-enricher" timestamp="1715847187.650:21196378" type="seccomp" node="ip-192-168-86-155.us-west-2.compute.internal" namespace="scp-ns" pod="scp-test-pod" container="redis" executable="/usr/local/bin/redis-server" pid=3723190 syscallID=3 syscallName="close"
I0516 08:13:07.654886 4190800 enricher.go:446] "audit" logger="log-enricher" timestamp="1715847187.650:21196379" type="seccomp" node="ip-192-168-86-155.us-west-2.compute.internal" namespace="scp-ns" pod="scp-test-pod" container="redis" executable="/usr/local/bin/redis-server" pid=3723190 syscallID=232 syscallName="epoll_wait"
I0516 08:13:07.754390 4190800 enricher.go:446] "audit" logger="log-enricher" timestamp="1715847187.750:21196380" type="seccomp" node="ip-192-168-86-155.us-west-2.compute.internal" namespace="scp-ns" pod="scp-test-pod" container="redis" executable="/usr/local/bin/redis-server" pid=3723190 syscallID=39 syscallName="getpid"
I0516 08:13:07.754883 4190800 enricher.go:446] "audit" logger="log-enricher" timestamp="1715847187.750:21196381" type="seccomp" node="ip-192-168-86-155.us-west-2.compute.internal" namespace="scp-ns" pod="scp-test-pod" container="redis" executable="/usr/local/bin/redis-server" pid=3723190 syscallID=257 syscallName="openat"
I0516 08:13:07.755308 4190800 enricher.go:446] "audit" logger="log-enricher" timestamp="1715847187.750:21196382" type="seccomp" node="ip-192-168-86-155.us-west-2.compute.internal" namespace="scp-ns" pod="scp-test-pod" container="redis" executable="/usr/local/bin/redis-server" pid=3723190 syscallID=0 syscallName="read"
I0516 08:13:07.755610 4190800 enricher.go:446] "audit" logger="log-enricher" timestamp="1715847187.750:21196383" type="seccomp" node="ip-192-168-86-155.us-west-2.compute.internal" namespace="scp-ns" pod="scp-test-pod" container="redis" executable="/usr/local/bin/redis-server" pid=3723190 syscallID=3 syscallName="close"
I0516 08:13:07.755892 4190800 enricher.go:446] "audit" logger="log-enricher" timestamp="1715847187.750:21196384" type="seccomp" node="ip-192-168-86-155.us-west-2.compute.internal" namespace="scp-ns" pod="scp-test-pod" container="redis" executable="/usr/local/bin/redis-server" pid=3723190 syscallID=232 syscallName="epoll_wait"
```

The startup of the `test-scp-binding-pod` already invokes a large amount of `syscalls`, which are now all available within human readable way within the log enricher. 
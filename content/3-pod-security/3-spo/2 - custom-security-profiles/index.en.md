---
title : "Custom Security Profiles with SPO"
weight : 22
---

Now that you have the Security Profiles Operator (SPO) installed in your Amazon EKS cluster, let's dive into creating and applying custom security profiles. This powerful feature allows you to tailor security settings to your specific application needs.

## Understanding Security Profiles

Security profiles in Kubernetes are powerful tools that allow you to control and restrict the capabilities of containers running in your cluster. They provide an additional layer of security by limiting what actions a container can perform at the system level. The two main types of security profiles supported by the Security Profiles Operator (SPO) are SeccompProfiles and AppArmor profiles. 

For this guide, we'll focus on SeccompProfiles, which define the system calls that a container is allowed to make.

## SeccompProfiles (Secure Computing Mode Profiles)

SeccompProfiles define which system calls a container is allowed to make to the host kernel. System calls are the fundamental interface between an application and the Linux kernel.

Key points about SeccompProfiles:

* <b>Default Action:</b> SeccompProfiles specify a default action for any system call not explicitly allowed. This is typically set to either block the call or allow it.
* <b>Allowlist Approach:</b> Best practice is to use an allowlist approach, where you explicitly specify which system calls are allowed, and all others are blocked.
* <b>Granular Control:</b> You can allow or deny specific system calls, providing fine-grained control over container behavior.
* <b>Performance Impact:</b> Properly configured SeccompProfiles have minimal performance impact while significantly enhancing security.
* <b>Portability:</b> SeccompProfiles are generally more portable across different Linux distributions compared to AppArmor profiles.

### Step 1: Create a Custom SeccompProfile

Let's two basic SeccompProfiles. One is for auditing system calls and another is for allowing only specific system calls.

Run below commands to create the `SeccompProfile` objects:

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
  name: audit
  namespace: \$SCP_NS
spec:
  defaultAction: SCMP_ACT_LOG
---
apiVersion: security-profiles-operator.x-k8s.io/v1beta1
kind: SeccompProfile
metadata:
  name: allow-specific-profile
  namespace: \$SCP_NS
spec:
  defaultAction: SCMP_ACT_ERRNO
  syscalls:
    - action: SCMP_ACT_ALLOW
      names:
        - read
        - write
        - open
EOF
```

The `audit` profile:

* Uses `SCMP_ACT_TRACE` as the default action, which will trace all system calls for auditing purposes.
* Has an empty syscalls list, meaning it will audit all system calls.

The `allow-specific-profile`:

* Uses `SCMP_ACT_ERRNO` as the default action, which blocks all system calls by default.
* Explicitly allows only the `read`, `write`, and `open` system calls.

Save this YAML to a file named `~/environment/seccompprofile.yaml`

### Step 2: Apply the SeccompProfile

Apply the custom SeccompProfile to your cluster:

```bash
export SCP_NS=scp-ns
envsubst < ~/environment/seccompprofile.yaml > ~/environment/sc-profile1.yaml
kubectl apply -f ~/environment/sc-profile1.yaml
```

::::expand{header="Check Output"}
```bash
namespace/scp-ns created
seccompprofile.security-profiles-operator.x-k8s.io/audit created
seccompprofile.security-profiles-operator.x-k8s.io/allow-specific-profile created
```
::::

### Step 3: Verify the SeccompProfile

Check if the SeccompProfile was created successfully:

```bash
kubectl get seccompprofile {audit,allow-specific-profile} -n $SCP_NS -o wide
```

::::expand{header="Check Output"}
```bash
NAME       STATUS      AGE     LOCALHOSTPROFILE
audit                    Installed   76s   operator/scp-ns/audit.json
allow-specific-profile   Installed   76s   operator/scp-ns/allow-specific-profile.json
```
::::

You should see your custom profile listed.

The seccomp profile will also be saved in `/var/lib/kubelet/seccomp/operator/<namespace>/<name>.json` directory on the cluster nodes.

### Step 4: Use the Custom Profile in a Pod ##

Now, let's create a Pod that uses the `audit` custom SeccompProfile:

```bash
cat > ~/environment/audit-pod-template.yaml <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: scp-audit-pod
  namespace: \$SCP_NS
spec:
  securityContext:
    seccompProfile:
      type: Localhost
      localhostProfile: operator/\$SCP_NS/audit.json
  containers:
  - name: nginx
    image: nginx
EOF
```

```bash
envsubst < ~/environment/audit-pod-template.yaml > ~/environment/scp-audit-pod.yaml
kubectl apply -f ~/environment/scp-audit-pod.yaml
```

::::expand{header="Check Output"}
```bash
pod/scp-audit-pod created
```
::::

Confirm the profile was applied correctly to the pod by running the following command:

```bash_
kubectl get pod scp-audit-pod -n $SCP_NS --output=jsonpath='{.spec.securityContext}' | jq .
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
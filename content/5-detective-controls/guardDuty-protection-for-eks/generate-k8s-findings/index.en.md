---
title : "Generate Kubernetes Findings"
weight : 22
---

In this section, we will generate some Kubernetes findings in your Amazon EKS cluster using your Cloud9 instance.

Go to your Cloud9 terminal and run the following commands to generate the sample findings.

### [`Policy:Kubernetes/AnonymousAccessGranted`](https://docs.aws.amazon.com/guardduty/latest/ug/guardduty_finding-types-kubernetes.html#policy-kubernetes-anonymousaccessgranted)

This finding means **The `system:anonymous` user was granted API permission on a Kubernetes cluster.**

Run the following in your terminal to create the YAML manifest that has a ClusterRole and a ClusterRoleBinding definition.

```bash
cat << EoF > anonymous.yaml
### Finding type: Policy:Kubernetes/AnonymousAccessGranted

apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: anonymous-admin
subjects:
  - kind: User
    name: system:anonymous
    namespace: default
roleRef:
  kind: ClusterRole
  name: view
  apiGroup: rbac.authorization.k8s.io
EoF
```

As you can see, we are granting the user `system:anonymous` with access to the view ClusterRole. This will allow an anonymous user to view all objects in your cluster using the kubernetes API. This is generally an unexpected configuration and should be reviewed. Run kubectl apply to apply this configuration. You can see more details fo this finding [here](https://docs.aws.amazon.com/guardduty/latest/ug/guardduty_finding-types-kubernetes.html#policy-kubernetes-anonymousaccessgranted) 


```bash
kubectl apply -f anonymous.yaml
```

::::expand{header="Check Output"}
```bash
clusterrolebinding.rbac.authorization.k8s.io/anonymous-admin created
```
::::

Go back [AWS GuardDuty console](console.aws.amazon.com/guardduty) and check that a finding is generated for this.

::alert[If the finding doesn’t appear in the GuardDuty Console, change the name under metadata (ex: **anonymous-admin2**) in the anonymous.yaml file and re-run the `kubectl apply -f anonymous.yaml`]{header="Note"}


![Anonymous Finding](/static/images/detective-controls/AnonFinding.png)


### [`Policy:Kubernetes/AdminAccessToDefaultServiceAccount`](https://docs.aws.amazon.com/guardduty/latest/ug/guardduty_finding-types-kubernetes.html#policy-kubernetes-adminaccesstodefaultserviceaccount)

This finding means **The default service account was granted admin privileges on a Kubernetes cluster.**

From your terminal, run the command below to create the YAML manifest for the finding.


```bash
cat << EoF > elevate.yaml
### Finding type: Policy:Kubernetes/AdminAccessToDefaultServiceAccount

apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: default-service-acct-admin
subjects:
  - kind: ServiceAccount
    name: default
    namespace: default
roleRef:
  kind: ClusterRole
  name: cluster-admin
  apiGroup: rbac.authorization.k8s.io
EoF
```

Here you can see, we have a ClusterRole and a ClusterRoleBinding definition that is binding the default service account in the default namespace to the cluster-admin ClusterRole. Any pod not associated to a specific service account make use of the default service account in their namespace. This configuration can provide unintentional elevated admin privileges to pods. More information about this [here](https://docs.aws.amazon.com/guardduty/latest/ug/guardduty_finding-types-kubernetes.html#policy-kubernetes-adminaccesstodefaultserviceaccount)
. Run kubectl apply to apply this configuration.

```bash
kubectl apply -f elevate.yaml
```

::::expand{header="Check Output"}
```bash
clusterrolebinding.rbac.authorization.k8s.io/default-service-acct-admin created
```
::::

Go back AWS GuardDuty console and check that a finding is generated for this.


![Eleveated Access to Serviceaccount](/static/images/detective-controls/eleveatedaccesstoserviceaccount.png)


### [`PrivilegeEscalation:Kubernetes/PrivilegedContainer` and `Persistence:Kubernetes/ContainerWithSensitiveMount`](https://docs.aws.amazon.com/guardduty/latest/ug/guardduty_finding-types-kubernetes.html)

These findings means **A privileged container with root level access was launched on your Kubernetes cluster.** and **A container was launched with a sensitive external host path mounted inside.**


```bash
cat << EoF > pod_with_sensitive_mount.yaml
###  Finding type: PrivilegeEscalation:Kubernetes/PrivilegedContainer
###  Finding type: Kubernetes/ContainerWithSensitiveMount Incident

apiVersion: apps/v1
kind: Deployment
metadata:
  name: ubuntu-privileged-with-mount
spec:
  selector:
    matchLabels:
      app: ubuntu-privileged-with-mount
  replicas: 1
  template:
    metadata:
      labels:
        app: ubuntu-privileged-with-mount
    spec:
      containers:
      - name: ubuntu-privileged-with-mount
        image: nginx
        securityContext:
          privileged: true
        volumeMounts:
        - mountPath: /test-pd
          name: test-volume
      volumes:
      - name: test-volume
        hostPath:
          path: /etc
          type: Directory
EoF
```


This yaml file generates 2 findings using a single Kubernetes deployment spec. The first is related to privileged container with root level access. This is accomplished through the `privileged: true` setting in the securityContext configuration of the nginx container spec. Secondly, the container mounts /etc directory on the host as a writable volume. More information about the two findings here - [sensitive mount](https://docs.aws.amazon.com/guardduty/latest/ug/guardduty_finding-types-kubernetes.html#persistence-kubernetes-containerwithsensitivemount)
and [privileged container](https://docs.aws.amazon.com/guardduty/latest/ug/guardduty_finding-types-kubernetes.html#privilegeescalation-kubernetes-privilegedcontainer)


Run `kubectl apply` to apply this configuration.

```bash
kubectl apply -f pod_with_sensitive_mount.yaml
```

::::expand{header="Check Output"}
```bash
deployment.apps/ubuntu-privileged-with-mount created
```
::::


Go to AWS GuardDuty Console to check the findings.

![GDprevilegedandSensitive](/static/images/detective-controls/GDprevilegedandSensitive.png)


Let's take a moment to review findings' detail. Click on each finding in the GuardDuty console to open its detail.

As an example, click `PolicyKubernetes/AdminAccessToDefaultServiceAccount` finding. In the finding details, examine the Action section.

Click the body of Parameters to determine when the finding was generated, what kind of API object was the target for the API call.


### [`Policy:Kubernetes/ExposedDashboard`](https://docs.aws.amazon.com/guardduty/latest/ug/guardduty_finding-types-kubernetes.html#persistence-kubernetes-containerwithsensitivemount)

This finding means **The dashboard for a Kubernetes cluster was exposed to the internet**

This finding informs you that Kubernetes dashboard for your cluster was exposed to the internet by a Load Balancer service. An exposed dashboard makes the management interface of your cluster accessible from the internet and allows adversaries to exploit any authentication and access control gaps that may be present.

To simulate this we'll need to expose the Kubernetes dashboard to the Internet with service type `LoadBalancer`.

First off, we'll install the Kubernetes dashboard component. We'll be using the version v2.7.0 of the dashboard, which is compatible with Kubernetes cluster v1.25 based on the [release notes](https://github.com/kubernetes/dashboard/releases/tag/v2.7.0).

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.7.0/aio/deploy/recommended.yaml
```


::::expand{header="Check Output"}
```bash
namespace/kubernetes-dashboard created
serviceaccount/kubernetes-dashboard created
service/kubernetes-dashboard created
secret/kubernetes-dashboard-certs created
secret/kubernetes-dashboard-csrf created
secret/kubernetes-dashboard-key-holder created
configmap/kubernetes-dashboard-settings created
role.rbac.authorization.k8s.io/kubernetes-dashboard created
clusterrole.rbac.authorization.k8s.io/kubernetes-dashboard created
rolebinding.rbac.authorization.k8s.io/kubernetes-dashboard created
clusterrolebinding.rbac.authorization.k8s.io/kubernetes-dashboard created
deployment.apps/kubernetes-dashboard created
service/dashboard-metrics-scraper created
deployment.apps/dashboard-metrics-scraper created
```
::::

Let us patch the `kubernetes-dashboard` service to be type `LoadBalancer`.

```bash
kubectl patch svc kubernetes-dashboard -n kubernetes-dashboard -p='{"spec": {"type": "LoadBalancer"}}'
```

::::expand{header="Check Output"}
```bash
service/kubernetes-dashboard patched
```
::::


![k8s-dashboard](/static/images/detective-controls/k8s-dashboard.png)

Within a few minutes we'll see the finding `Policy:Kubernetes/ExposedDashboard` in the GuardDuty portal.


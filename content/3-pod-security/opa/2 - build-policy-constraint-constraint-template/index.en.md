---
title : "Use case #1: Restrict privileged containers in the cluster"
weight : 22
---

In this section, we will define a new constraint template and constraint that will force the cluster to use unprivileged containers.


1. Build Constraint Templates

ConstraintTemplate describes the Rego that enforces the constraint and the schema of the constraint. The schema constraint allows the author of the constraint (cluster admin) to define the constraint behavior.

In this scenario, the cluster administrator will force the cluster to use unprivileged containers. The OPA Gatekeeper will look for the securitycontext field and determine whether 'privileged=true' is present. If this is the case, the request will fail.

:::code{showCopyAction=true showLineNumbers=false language=bash}
cd ~/environment
cat > constrainttemplate.yaml <<EOF
apiVersion: templates.gatekeeper.sh/v1beta1
kind: ConstraintTemplate
metadata:
  name: k8spspprivilegedcontainer
spec:
  crd:
    spec:
      names:
        kind: K8sPSPPrivilegedContainer
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8spspprivileged

        violation[{"msg": msg, "details": {}}] {
            c := input_containers[_]
            c.securityContext.privileged
            msg := sprintf("Privileged container is not allowed: %v, securityContext: %v", [c.name, c.securityContext])
        }

        input_containers[c] {
            c := input.review.object.spec.containers[_]
        }

        input_containers[c] {
            c := input.review.object.spec.initContainers[_]
        }
EOF
:::


Create the ConstraintTemplate using the following command

:::code{showCopyAction=true showLineNumbers=false language=bash}
kubectl create -f constrainttemplate.yaml
:::

::::expand{header="Check Output"}
```bash
constrainttemplate.templates.gatekeeper.sh/k8spspprivilegedcontainer created
```
::::

2. Build Constraint

To enforce the policy, we will use the constraint below, which will ensure that all newly created pods are not privileged.

:::code{showCopyAction=true showLineNumbers=false language=bash}
cd ~/environment
cat > constraint.yaml <<EOF
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sPSPPrivilegedContainer
metadata:
  name: psp-privileged-container
spec:
  match:
    kinds:
      - apiGroups: [""]
        kinds: ["Pod"]
EOF
:::

Create the Constraint using the following command

:::code{showCopyAction=true showLineNumbers=false language=bash}
kubectl create -f constraint.yaml
:::

::::expand{header="Check Output"}
```bash
k8spspprivilegedcontainer.constraints.gatekeeper.sh/psp-privileged-container created
```
::::

3. Test the policy, if the use of unprivileged containers is enforced in the cluster

First, check for the CRD constraint and constrainttemplate were created.

:::code{showCopyAction=true showLineNumbers=false language=bash}
kubectl get constraint
kubectl get constrainttemplate
:::

::::expand{header="Check Output"}
```bash
Admin:~/environment $ kubectl get constraint
NAME                       ENFORCEMENT-ACTION   TOTAL-VIOLATIONS
psp-privileged-container
Admin:~/environment $ kubectl get constrainttemplate
NAME                        AGE
k8spspprivilegedcontainer   61s
```
::::

Second, let’s try to deploy a privileged nginx pod:

:::code{showCopyAction=true showLineNumbers=false language=bash}

cd ~/environment
cat > example.yaml <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: bad-nginx
  labels:
    app: bad-nginx
spec:
  containers:
  - name: nginx
    image: nginx
    securityContext:
      privileged: true
EOF
kubectl create -f example.yaml
:::

You should now see an error message similar to below:

::::expand{header="Check Output"}
![OPA](/static/images/pod-security/opa/opa-constraint1.png)
::::

:::code{showCopyAction=true showLineNumbers=false language=bash}
Error from server (Forbidden): error when creating "example.yaml": admission webhook "validation.gatekeeper.sh" denied the request: [psp-privileged-container] Privileged container is not allowed: nginx, securityContext: {"privileged": true}
:::


Additionally, check the Controller manager logs to see the webhook requests sent by the Kubernetes API server for validation and mutation, as well as the Audit logs to check for policy compliance on objects that already exist in the cluster.
::::expand{header="Check Output"}

Controller Manager Logs

![OPA](/static/images/pod-security/opa/controller-logs1.PNG)

Audit Controller Logs

![OPA](/static/images/pod-security/opa/audit-logs1.PNG)

::::

The request was denied by the Kubernetes API because it did not meet the requirement of unprivileged containers imposed by the OPA Gatekeeper constraint.



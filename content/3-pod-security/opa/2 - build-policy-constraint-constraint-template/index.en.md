---
title : "Use case #1: Restrict privileged containers in the cluster"
weight : 22
---

In this section, we would be defining new constraint template and constraint that will force the use of privileged containers in the cluster.

1. Build Constraint Templates

ConstraintTemplate describes the Rego that enforces the constraint and the schema of the constraint. The schema constraint allows the author of the constraint (cluster admin) to define the contraint behavior.

In this example, the cluster admin will force the use of unprivileged containers in the cluster. The OPA Gatekeeper will look for the securitycontext field and check if `privileged=true`. If it’s the case, then, the request will fail.

:::code{showCopyAction=true showLineNumbers=false language=bash}
cat > /tmp/constrainttemplate.yaml <<EOF
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
kubectl create -f /tmp/constrainttemplate.yaml
:::

::::expand{header="Check Output"}
```bash
constrainttemplate.templates.gatekeeper.sh/k8spspprivilegedcontainer created
```
::::

2. Build Constraint

The cluster admin will use the constraint to inform the OPA Gatekeeper to enforce the policy. For our example, as cluster admin we want to enforce that all the created pod should not be privileged.

:::code{showCopyAction=true showLineNumbers=false language=bash}
cat > /tmp/constraint.yaml <<EOF
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
kubectl create -f /tmp/constraint.yaml
:::

::::expand{header="Check Output"}
```bash
k8spspprivilegedcontainer.constraints.gatekeeper.sh/psp-privileged-container created
```
::::

### 3. Test if the use of unprivileged containers is enforced in the cluster

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
Error from server (Forbidden): error when creating "/tmp/example.yaml": admission webhook "validation.gatekeeper.sh" denied the request: [psp-privileged-container] Privileged container is not allowed: nginx, securityContext: {"privileged": true}
:::



Also observe the OPA Audit Controller and Controller manager logs to see the webhook requests being issued by the Kubernetes API server.

::::expand{header="Check Output"}

Controller Manager Logs

![OPA](/static/images/pod-security/opa/controller-logs1.png)

Audit Controller Logs

![OPA](/static/images/pod-security/opa/audit-logs1.png)

::::

The request was denied by Kubernetes API, because it didn’t meet the requirement from the constraint forced by OPA Gatekeeper.


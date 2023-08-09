---
title : "Use case #3: Enforce labels for objects"
weight : 22
---

In this section, we will define a new constraint template as well as a constraint that enforces the inclusion of labels for namespaces and pods.

1. Build Constraint Templates

The template below defines a general constraint that checks for the presence of labels. Once created, the template can be used to create constraints that require the definition of a specific label or set of labels on an object.

:::code{showCopyAction=true showLineNumbers=false language=bash}
cd ~/environment
cat > constrainttemplate.yaml <<EOF
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8srequiredlabels
  annotations:
    metadata.gatekeeper.sh/title: "Required Labels"
    metadata.gatekeeper.sh/version: 1.0.0
    description: >-
      Requires resources to contain specified labels, with values matching
      provided regular expressions.
spec:
  crd:
    spec:
      names:
        kind: K8sRequiredLabels
      validation:
        openAPIV3Schema:
          type: object
          properties:
            message:
              type: string
            labels:
              type: array
              description: >-
                A list of labels and values the object must specify.
              items:
                type: object
                properties:
                  key:
                    type: string
                    description: >-
                      The required label.
                  allowedRegex:
                    type: string
                    description: >-
                      If specified, a regular expression the annotation's value
                      must match. The value must contain at least one match for
                      the regular expression.
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8srequiredlabels

        get_message(parameters, _default) = msg {
          not parameters.message
          msg := _default
        }

        get_message(parameters, _default) = msg {
          msg := parameters.message
        }

        violation[{"msg": msg, "details": {"missing_labels": missing}}] {
          provided := {label | input.review.object.metadata.labels[label]}
          required := {label | label := input.parameters.labels[_].key}
          missing := required - provided
          count(missing) > 0
          def_msg := sprintf("you must provide labels: %v", [missing])
          msg := get_message(input.parameters, def_msg)
        }

        violation[{"msg": msg}] {
          value := input.review.object.metadata.labels[key]
          expected := input.parameters.labels[_]
          expected.key == key
          # do not match if allowedRegex is not defined, or is an empty string
          expected.allowedRegex != ""
          not re_match(expected.allowedRegex, value)
          def_msg := sprintf("Label <%v: %v> does not satisfy allowed regex: %v", [key, value, expected.allowedRegex])
          msg := get_message(input.parameters, def_msg)
        }

EOF

:::


Create the ConstraintTemplate using the following command

:::code{showCopyAction=true showLineNumbers=false language=bash}
kubectl create -f constrainttemplate.yaml
:::

::::expand{header="Check Output"}
```bash
constrainttemplate.templates.gatekeeper.sh/k8srequiredlabels created
```
::::

2. Build Constraint

Below example contraint defines that any `namespace` objects that are created must have a value set for the `owner` label. 

:::code{showCopyAction=true showLineNumbers=false language=bash}
cd ~/environment
cat > constraint.yaml <<EOF
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sRequiredLabels
metadata:
  name: all-ns-must-have-owner-label
spec:
  match:
    kinds:
      - apiGroups: [""]
        kinds: ["Namespace"]
  parameters:
    message: "All namespaces must have an owner label"
    labels:
      - key: owner
EOF
:::

Create the Constraint using the following command

:::code{showCopyAction=true showLineNumbers=false language=bash}
kubectl create -f constraint.yaml
:::

::::expand{header="Check Output"}
```bash
k8srequiredlabels.constraints.gatekeeper.sh/all-ns-must-have-owner-label created
```
::::

3. Test the policy

First, check for the CRD constraint and constrainttemplate were created.

:::code{showCopyAction=true showLineNumbers=false language=bash}
kubectl get constraint
kubectl get constrainttemplate
:::

::::expand{header="Check Output"}
```bash
Admin:~/environment $ kubectl get constraint
NAME                       ENFORCEMENT-ACTION   TOTAL-VIOLATIONS
k8srequiredlabels.constraints.gatekeeper.sh/all-ns-must-have-owner-label
Admin:~/environment $ kubectl get constrainttemplate
NAME                        AGE
k8srequiredlabels           2m18s
```
::::

Second, let’s try to create namespace without `owner` label:

:::code{showCopyAction=true showLineNumbers=false language=bash}

cd ~/environment
cat > example.yaml <<EOF
apiVersion: v1
kind: Namespace
metadata:
  name: test-opa
spec: {}
EOF
kubectl create -f example.yaml
:::

You should now see an error message similar to below:
::::expand{header="Check Output"}
![OPA](/static/images/pod-security/opa/opa-constraint3.PNG)
::::

:::code{showCopyAction=true showLineNumbers=false language=bash}
Error from server (Forbidden): error when creating "example.yaml": admission webhook "validation.gatekeeper.sh" denied the request: [all-ns-must-have-owner-label] All namespaces must have an owner label
:::

Additionally, check the Controller manager logs to see the webhook requests sent by the Kubernetes API server for validation and mutation, as well as the Audit logs to check for policy compliance on objects that already exist in the cluster.

::::expand{header="Check Output"}

Controller Manager Logs

![OPA](/static/images/pod-security/opa/controller-logs3.PNG)

Audit Controller Logs

![OPA](/static/images/pod-security/opa/audit-logs3.PNG)

::::

The request was denied by the Kubernetes API because it did not comply with the constraint imposed by OPA Gatekeeper that all namespace objects created must have a value set for the owner label.




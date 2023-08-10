---
title : "Use case #2: Whitelist only known registry"
weight : 22
---

This section will define a new constraint template and constraint that will verify that every pod's image comes from a known registry on a whitelist.

1. Build Constraint Templates

In the example below, the cluster administrator will mandate that only known image repositories be used in the cluster. 

:::code{showCopyAction=true showLineNumbers=false language=bash}
cd ~/environment
cat > constrainttemplate.yaml <<EOF
apiVersion: templates.gatekeeper.sh/v1beta1
kind: ConstraintTemplate
metadata:
  name: k8swhitelistedimages
spec:
  crd:
    spec:
      names:
        kind: k8sWhitelistedImages
      validation:
        # Schema for the parameters field
        openAPIV3Schema:
          properties:
            images:
              type: array
              items: string
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8swhitelistedimages
        whitelisted_images = {images |
            images = input.parameters.images[_]
        }
    
        images_whitelisted(str, patterns) {
            image_matches(str, patterns[_])
        }
    
        image_matches(str, pattern) {
            contains(str, pattern)
        }
        violation[{"msg": msg}] {
          input.review.object
          image := input.review.object.spec.containers[_].image
          name := input.review.object.metadata.name
          not images_whitelisted(image, whitelisted_images)
          msg := sprintf("pod %q has invalid image %q. Please, contact your DevOps. Follow the whitelisted images %v", [name, image, whitelisted_images])
        }
EOF

:::


Create the ConstraintTemplate using the following command

:::code{showCopyAction=true showLineNumbers=false language=bash}
kubectl create -f constrainttemplate.yaml
:::

::::expand{header="Check Output"}
```bash
constrainttemplate.templates.gatekeeper.sh/k8swhitelistedimages created
```
::::

2. Build Constraint

To enforce the policy, we will use the constraint below, which will ensure that all newly created pods image comes from a known registry on a whitelist


:::code{showCopyAction=true showLineNumbers=false language=bash}
cd ~/environment
cat > constraint.yaml <<EOF
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: k8sWhitelistedImages
metadata:
  name: k8senforcewhitelistedimages
spec:
  match:
    kinds:
      - apiGroups: [""]
        kinds: ["Pod"]
  parameters:
    images:
      # AWS Internal ECR registries
      - 999999999999.dkr.ecr.us-east-1.amazonaws.com/
      # AWS Public Registries
      - 888888888888.dkr.ecr.us-west-2.amazonaws.com/
      - 888888888888.dkr.ecr.us-east-1.amazonaws.com/
      # Images used by the infrastructure services inside the kubernetes cluster
      - amazon/aws-node-termination-handler
      - amazon/aws-alb-ingress-controller
      - amazon/aws-efs-csi-driver
      - amazon/cloudwatch-agent
      - docker.io/amazon/aws-alb-ingress-controller
      - nvidia/k8s-device-plugin
      - k8s.gcr.io/autoscaling/cluster-autoscaler
      - k8s.gcr.io/metrics-server-amd64
      - quay.io/coreos/kube-state-metrics
      - quay.io/kubernetes-ingress-controller/nginx-ingress-controller
      - kubernetesui/dashboard
      - kubernetesui/metrics-scraper
      - jtblin/kube2iam
      - grafana/grafana
      - prom/alertmanager
      - prom/prometheus
      - openpolicyagent/gatekeeper
      # Images for support
      - amazon/aws-cli
      - radial/busyboxplus
      - docker.io/radial/busyboxplus
      - busybox
EOF
:::

Create the Constraint using the following command

:::code{showCopyAction=true showLineNumbers=false language=bash}
kubectl create -f constraint.yaml
:::

::::expand{header="Check Output"}
```bash
k8swhitelistedimages.constraints.gatekeeper.sh/k8senforcewhitelistedimages created
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
k8swhitelistedimages.constraints.gatekeeper.sh/k8senforcewhitelistedimages
Admin:~/environment $ kubectl get constrainttemplate
NAME                        AGE
k8swhitelistedimages   4m15s
```
::::

Second, let’s try to deploy a nginx pod from unknown registry:

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
EOF
kubectl create -f example.yaml
:::

You should now see an error message similar to below:
::::expand{header="Check Output"}
![OPA](/static/images/pod-security/opa/opa-constraint2.PNG)
::::

:::code{showCopyAction=true showLineNumbers=false language=bash}
Error from server (Forbidden): error when creating "example.yaml": admission webhook "validation.gatekeeper.sh" denied the request: [k8senforcewhitelistedimages] pod "bad-nginx" has invalid image "nginx". Please, contact your DevOps. Follow the whitelisted images {"888888888888.dkr.ecr.us-east-1.amazonaws.com/", "888888888888.dkr.ecr.us-west-2.amazonaws.com/", "999999999999.dkr.ecr.us-east-1.amazonaws.com/", "amazon/aws-alb-ingress-controller", "amazon/aws-cli", "amazon/aws-efs-csi-driver", "amazon/aws-node-termination-handler", "amazon/cloudwatch-agent", "busybox", "docker.io/amazon/aws-alb-ingress-controller", "docker.io/radial/busyboxplus", "grafana/grafana", "jtblin/kube2iam", "k8s.gcr.io/autoscaling/cluster-autoscaler", "k8s.gcr.io/metrics-server-amd64", "kubernetesui/dashboard", "kubernetesui/metrics-scraper", "nvidia/k8s-device-plugin", "openpolicyagent/gatekeeper", "prom/alertmanager", "prom/prometheus", "quay.io/coreos/kube-state-metrics", "quay.io/kubernetes-ingress-controller/nginx-ingress-controller", "radial/busyboxplus"}
:::

Additionally, check the Controller manager logs to see the webhook requests sent by the Kubernetes API server for validation and mutation, as well as the Audit logs to check for policy compliance on objects that already exist in the cluster.

::::expand{header="Check Output"}

Controller Manager Logs

![OPA](/static/images/pod-security/opa/controller-logs2.PNG)

Audit Controller Logs

![OPA](/static/images/pod-security/opa/audit-logs2.PNG)

::::

The request was denied by Kubernetes API, because it didn’t meet the requirement of known registries on whitelist imposed by OPA Gatekeeper constraint.


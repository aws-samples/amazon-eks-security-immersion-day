---
title : "Use case #2: Whitelist only known registry"
weight : 22
---

In this section, we would be defining new constraint template and constraint that will validate every Pod‘s image comes from a known registry in a whitelist.

1. Build Constraint Templates

In the below example, the cluster admin will force the use of only known image repositories in the cluster. 

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

The cluster admin will use the constraint to inform the OPA Gatekeeper to enforce the policy. For our example, as cluster admin we want to enforce that all the created pod should be from a known registry list in a whitelist.

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

3. Test the policy, if every Pod‘s image comes from a known registry in a whitelist is enforced in the cluster

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

Also observe the OPA Audit Controller and Controller manager logs to see the webhook requests being issued by the Kubernetes API server.

::::expand{header="Check Output"}

Controller Manager Logs

![OPA](/static/images/pod-security/opa/controller-logs2.PNG)

Audit Controller Logs

![OPA](/static/images/pod-security/opa/audit-logs2.PNG)

::::

The request was denied by Kubernetes API, because it didn’t meet the requirement from the constraint forced by OPA Gatekeeper.


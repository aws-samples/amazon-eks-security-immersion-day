---
title : "OPA Gatekeeper setup in EKS"
weight : 22
---

In this section, we will setup OPA Gatekeeper within the cluster.

1. Run the following commands to deploy OPA Gatekeeper using Prebuilt docker images

:::code{showCopyAction=true showLineNumbers=false language=bash}
kubectl apply -f https://raw.githubusercontent.com/open-policy-agent/gatekeeper/master/deploy/gatekeeper.yaml
:::

::::expand{header="Check Output"}
```bash
namespace/gatekeeper-system created
resourcequota/gatekeeper-critical-pods created
customresourcedefinition.apiextensions.k8s.io/assign.mutations.gatekeeper.sh created
customresourcedefinition.apiextensions.k8s.io/assignimage.mutations.gatekeeper.sh created
customresourcedefinition.apiextensions.k8s.io/assignmetadata.mutations.gatekeeper.sh created
customresourcedefinition.apiextensions.k8s.io/configs.config.gatekeeper.sh created
customresourcedefinition.apiextensions.k8s.io/constraintpodstatuses.status.gatekeeper.sh created
customresourcedefinition.apiextensions.k8s.io/constrainttemplatepodstatuses.status.gatekeeper.sh created
customresourcedefinition.apiextensions.k8s.io/constrainttemplates.templates.gatekeeper.sh created
customresourcedefinition.apiextensions.k8s.io/expansiontemplate.expansion.gatekeeper.sh created
customresourcedefinition.apiextensions.k8s.io/expansiontemplatepodstatuses.status.gatekeeper.sh created
customresourcedefinition.apiextensions.k8s.io/modifyset.mutations.gatekeeper.sh created
customresourcedefinition.apiextensions.k8s.io/mutatorpodstatuses.status.gatekeeper.sh created
customresourcedefinition.apiextensions.k8s.io/providers.externaldata.gatekeeper.sh created
serviceaccount/gatekeeper-admin created
role.rbac.authorization.k8s.io/gatekeeper-manager-role created
clusterrole.rbac.authorization.k8s.io/gatekeeper-manager-role created
rolebinding.rbac.authorization.k8s.io/gatekeeper-manager-rolebinding created
clusterrolebinding.rbac.authorization.k8s.io/gatekeeper-manager-rolebinding created
secret/gatekeeper-webhook-server-cert created
service/gatekeeper-webhook-service created
deployment.apps/gatekeeper-audit created
deployment.apps/gatekeeper-controller-manager created
poddisruptionbudget.policy/gatekeeper-controller-manager created
mutatingwebhookconfiguration.admissionregistration.k8s.io/gatekeeper-mutating-webhook-configuration created
validatingwebhookconfiguration.admissionregistration.k8s.io/gatekeeper-validating-webhook-configuration created

```
::::

2. To validate that OPA Gatekeeper is running within your cluster run the following command:

:::code{showCopyAction=true showLineNumbers=false language=bash}
kubectl get pods -n gatekeeper-system
:::

The output will look like below.

```bash
NAME                                             READY   STATUS    RESTARTS      AGE
gatekeeper-audit-6584df88df-nsf28                1/1     Running   1 (37s ago)   41s
gatekeeper-controller-manager-5ff69b954d-nvzsb   1/1     Running   0             41s
gatekeeper-controller-manager-5ff69b954d-pmm7v   1/1     Running   0             41s
gatekeeper-controller-manager-5ff69b954d-t59kk   1/1     Running   0             41s
```


If you notice the `gatekeeper-audit-6584df88df-nsf28` pod is created when we deploy the OpaGatekeeperAddOn. The audit functionality enables periodic evaluations of replicated resources against the Constraints enforced in the cluster to detect pre-existing misconfigurations. Gatekeeper stores audit results as violations listed in the status field of the relevant Constraint. The `gatekeeper-controller-manager` is simply there to manage the OpaGatekeeperAddOn. 

3. Once OPA Gatekeeper pods are in 'Running' state, monitor Audit controller and Controller manager component logs for webhook requests that are being issued by the Kubernetes API server.

Run the following command in **separate terminal window** to monitor Audit controller logs 

:::code{showCopyAction=true showLineNumbers=false language=bash}
kubectl logs -l control-plane=audit-controller -n gatekeeper-system -f 
:::

::::expand{header="Check Output"}
```bash
{"level":"info","ts":1691054570.044209,"logger":"controller","msg":"resource count","metaKind":"upgrade","count":0}
{"level":"info","ts":1691054570.0442343,"logger":"controller","msg":"resource","metaKind":"upgrade","kind":"AssignMetadata","group":"mutations.gatekeeper.sh","version":"v1alpha1"}
{"level":"info","ts":1691054570.0488415,"logger":"controller","msg":"resource count","metaKind":"upgrade","count":0}
{"level":"info","ts":1691054570.0620747,"logger":"controller","msg":"resource","metaKind":"upgrade","kind":"Provider","group":"externaldata.gatekeeper.sh","version":"v1alpha1"}
{"level":"info","ts":1691054570.065626,"logger":"KubeAPIWarningLogger","msg":"externaldata.gatekeeper.sh/v1alpha1 is deprecated. Use externaldata.gatekeeper.sh/v1beta1 instead."}
{"level":"info","ts":1691054570.065955,"logger":"controller","msg":"resource count","metaKind":"upgrade","count":0}
{"level":"info","ts":1691054572.327456,"logger":"readiness-tracker","msg":"readiness satisfied, no further collection"}
{"level":"info","ts":1691054629.8365571,"logger":"controller","msg":"auditing constraints and violations","process":"audit","audit_id":"2023-08-03T09:23:49Z","event_type":"audit_started"}
{"level":"info","ts":1691054629.8529487,"logger":"controller","msg":"no constraint is found with apiversion","process":"audit","audit_id":"2023-08-03T09:23:49Z","constraint apiversion":"constraints.gatekeeper.sh/v1beta1"}
{"level":"info","ts":1691054629.8529873,"logger":"controller","msg":"auditing is complete","process":"audit","audit_id":"2023-08-03T09:23:49Z","event_type":"audit_finished"}

```
::::

Run the following command in **separate terminal window** to monitor Controller manager logs 

:::code{showCopyAction=true showLineNumbers=false language=bash}
kubectl logs -l control-plane=controller-manager -n gatekeeper-system -f 
:::

::::expand{header="Check Output"}
```bash
{"level":"info","ts":1691054569.154963,"logger":"controller","msg":"resource count","metaKind":"upgrade","count":0}
{"level":"info","ts":1691054569.1549916,"logger":"controller","msg":"resource","metaKind":"upgrade","kind":"ModifySet","group":"mutations.gatekeeper.sh","version":"v1alpha1"}
{"level":"info","ts":1691054569.1592152,"msg":"Starting workers","controller":"externaldata-controller","worker count":1}
{"level":"info","ts":1691054569.160231,"logger":"controller","msg":"resource count","metaKind":"upgrade","count":0}
{"level":"info","ts":1691054569.1602528,"logger":"controller","msg":"resource","metaKind":"upgrade","kind":"Assign","group":"mutations.gatekeeper.sh","version":"v1alpha1"}
{"level":"info","ts":1691054569.1637428,"logger":"controller","msg":"resource count","metaKind":"upgrade","count":0}
{"level":"info","ts":1691054569.213409,"logger":"controller","msg":"resource","metaKind":"upgrade","kind":"Provider","group":"externaldata.gatekeeper.sh","version":"v1alpha1"}
{"level":"info","ts":1691054569.216204,"logger":"KubeAPIWarningLogger","msg":"externaldata.gatekeeper.sh/v1alpha1 is deprecated. Use externaldata.gatekeeper.sh/v1beta1 instead."}
{"level":"info","ts":1691054569.216296,"logger":"controller","msg":"resource count","metaKind":"upgrade","count":0}
{"level":"info","ts":1691054570.6133084,"logger":"readiness-tracker","msg":"readiness satisfied, no further collection"}
{"level":"info","ts":1691054570.425286,"logger":"controller","msg":"resource","metaKind":"upgrade","kind":"ModifySet","group":"mutations.gatekeeper.sh","version":"v1alpha1"}
{"level":"info","ts":1691054570.4296567,"logger":"controller","msg":"resource count","metaKind":"upgrade","count":0}
{"level":"info","ts":1691054570.4389153,"msg":"Starting workers","controller":"constraint-controller","worker count":1}
{"level":"info","ts":1691054570.438918,"msg":"Starting workers","controller":"externaldata-controller","worker count":1}
{"level":"info","ts":1691054570.4442906,"logger":"controller","msg":"resource","metaKind":"upgrade","kind":"Provider","group":"externaldata.gatekeeper.sh","version":"v1alpha1"}
{"level":"info","ts":1691054570.4474301,"logger":"KubeAPIWarningLogger","msg":"externaldata.gatekeeper.sh/v1alpha1 is deprecated. Use externaldata.gatekeeper.sh/v1beta1 instead."}
{"level":"info","ts":1691054570.447586,"logger":"controller","msg":"resource count","metaKind":"upgrade","count":0}
{"level":"info","ts":1691054570.4498425,"msg":"Starting workers","controller":"modifyset-controller","worker count":1}
{"level":"info","ts":1691054570.4542532,"msg":"Starting workers","controller":"assignmetadata-controller","worker count":1}
{"level":"info","ts":1691054571.0831826,"logger":"readiness-tracker","msg":"readiness satisfied, no further collection"}
{"level":"info","ts":1691054569.9443588,"logger":"controller","msg":"resource","metaKind":"upgrade","kind":"AssignImage","group":"mutations.gatekeeper.sh","version":"v1alpha1"}
{"level":"info","ts":1691054569.947655,"logger":"controller","msg":"resource count","metaKind":"upgrade","count":0}
{"level":"info","ts":1691054569.9517624,"msg":"Starting workers","controller":"constraint-controller","worker count":1}
{"level":"info","ts":1691054569.9617753,"msg":"Starting workers","controller":"assignmetadata-controller","worker count":1}
{"level":"info","ts":1691054569.9618478,"msg":"Starting workers","controller":"externaldata-controller","worker count":1}
{"level":"info","ts":1691054569.9641025,"msg":"Starting workers","controller":"modifyset-controller","worker count":1}
{"level":"info","ts":1691054569.9651625,"logger":"controller","msg":"resource","metaKind":"upgrade","kind":"Provider","group":"externaldata.gatekeeper.sh","version":"v1alpha1"}
{"level":"info","ts":1691054569.9685936,"logger":"KubeAPIWarningLogger","msg":"externaldata.gatekeeper.sh/v1alpha1 is deprecated. Use externaldata.gatekeeper.sh/v1beta1 instead."}
{"level":"info","ts":1691054569.9686935,"logger":"controller","msg":"resource count","metaKind":"upgrade","count":0}
{"level":"info","ts":1691054570.4463212,"logger":"readiness-tracker","msg":"readiness satisfied, no further collection"}

```
::::

You can follow the OPA logs to see the webhook requests being issued by the Kubernetes API server.

This completes the OPA Gatekeeper setup on Amazon EKS cluster. In order to define and enforce the policy, OPA Gatekeeper uses a framework [OPA Constraint Framework](https://github.com/open-policy-agent/frameworks/tree/master/constraint)


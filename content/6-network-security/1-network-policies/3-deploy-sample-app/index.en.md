---
title : "Deploy Sample Application"
weight : 22
---

In this section, let us deploy a sample NGINX application called `demo-app` and a simple client application in the `default` namespace. Additionally, we’ll create another client application in a non-default namespace called `another-ns`.

Clone the repository for sample applications.

```bash
cd ~/environment
git clone https://github.com/aws-samples/eks-network-policy-examples.git
```
## Scenario #0: Kubernetes default behavior without any network policies

By default, Kubernetes allows all pods to communicate with each other with no restrictions.

![default-app-1](/static/images/6-network-security/1-network-policies/default-app-1.png)

### Deploy the Sample Application

Run the below command to deploy the sample application.

```bash
cd ~/environment/eks-network-policy-examples/advanced
kubectl apply -f manifests/
```

::::expand{header="Check Output"}
```bash
namespace/another-ns created
service/demo-app created
configmap/demo-app-index created
deployment.apps/demo-app created
pod/client-one created
pod/client-two created
pod/another-client-one created
pod/another-client-two created
```
::::

Ensure that client and demo app pods are running in the `default` namespace.

```bash
kubectl get all
```

::::expand{header="Check Output"}
```bash
NAME                                                READY   STATUS             RESTARTS        AGE
pod/client-one                                      1/1     Running            0               47m
pod/client-two                                      1/1     Running            0               47m
pod/demo-app-6667fd5868-v27mj                       1/1     Running            0               47m

NAME                 TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)   AGE
service/demo-app     ClusterIP   172.20.98.60   <none>        80/TCP    47m
service/kubernetes   ClusterIP   172.20.0.1     <none>        443/TCP   3d3h

NAME                                           READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/demo-app                       1/1     1            1           47m

NAME                                                      DESIRED   CURRENT   READY   AGE
replicaset.apps/demo-app-6667fd5868                       1         1         1       47m
```
::::


Ensure that another client app pods are running in the `another-ns` namespace.


```bash
kubectl get all -n another-ns
```

::::expand{header="Check Output"}
```bash
NAME                     READY   STATUS    RESTARTS        AGE
pod/another-client-one   1/1     Running   1 (4m49s ago)   64m
pod/another-client-two   1/1     Running   0               64m
```
::::

### Verify connectivity between the pods in the same namespace

By default pods can communicate other pods seamlessely in a k8s cluster. Lets test the connectivity to `demo-app` application from with in the namespace and across namespaces.

Test the connectivity from **client pod** to **demo-app** pod with in same `default` namespace.

```bash
kubectl exec -it client-one -- curl --max-time 3 demo-app
kubectl exec -it client-two -- curl --max-time 3 demo-app
```
You would see below response for each command, indicating successful API call.

::::expand{header="Check Output"}
```html
<!DOCTYPE html>
<html>
  <head>
    <title>Welcome to Amazon EKS!</title>
    <style>
        html {color-scheme: light dark;}
        body {width: 35em; margin: 0 auto; font-family: Tahoma, Verdana, Arial, sans-serif;}
    </style>
  </head>
  <body>
    <h1>Welcome to Amazon EKS!</h1>
    <p>If you see this page, you are able successfully access the web application as the network policy allows.</p>
    <p>For online documentation and installation instructions please refer to
      <a href="https://docs.aws.amazon.com/eks/latest/userguide/eks-networking.html">Amazon EKS Networking</a>.<br/><br/>
      The migration guides are available at
      <a href="https://docs.aws.amazon.com/eks/latest/userguide/eks-networking.html">Amazon EKS Network Policy Migration</a>.
    </p>
    <p><em>Thank you for using Amazon EKS.</em></p>
</body>
</html>
```
::::

### Verify connectivity between the pods across namespaces

Test the connectivity from **another client pod** from `another-ns` namespace to **demo-app** pod in the `default` namespace.

```bash
kubectl exec -it another-client-one -n another-ns -- curl --max-time 3 demo-app.default
kubectl exec -it another-client-two -n another-ns -- curl --max-time 3 demo-app.default
```
You would see below response for each command, indicating successful API call.

::::expand{header="Check Output"}
```html
<!DOCTYPE html>
<html>
  <head>
    <title>Welcome to Amazon EKS!</title>
    <style>
        html {color-scheme: light dark;}
        body {width: 35em; margin: 0 auto; font-family: Tahoma, Verdana, Arial, sans-serif;}
    </style>
  </head>
  <body>
    <h1>Welcome to Amazon EKS!</h1>
    <p>If you see this page, you are able successfully access the web application as the network policy allows.</p>
    <p>For online documentation and installation instructions please refer to
      <a href="https://docs.aws.amazon.com/eks/latest/userguide/eks-networking.html">Amazon EKS Networking</a>.<br/><br/>
      The migration guides are available at
      <a href="https://docs.aws.amazon.com/eks/latest/userguide/eks-networking.html">Amazon EKS Network Policy Migration</a>.
    </p>
    <p><em>Thank you for using Amazon EKS.</em></p>
</body>
</html>
```
::::

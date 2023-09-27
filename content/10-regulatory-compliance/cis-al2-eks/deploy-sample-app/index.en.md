---
title : "Deploy a sample nginx pod on the custom ami Amazon Linux  nodes"
weight : 23
---

With a working cluster and managed node group, we can deploy a sample application to make sure everything is running properly. For this example, we’ll use a simple nginx deployment to deploy pods to the cluster into the custome ami  nodegroup using Kubernetes pod scheduling property [nodeSelector](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/#nodeselector). We can then verify the pods are running, and the nginx webserver started correctly:

```bash
cd ~/environment/amazon-eks-custom-amis
cat > nginx-deploy.yaml <<EOF
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
spec:
  selector:
    matchLabels:
      app: nginx
  replicas: 1
  template:
    metadata:
      labels:
        app: nginx
    spec:
      nodeSelector:
        eks.amazonaws.com/nodegroup: custom-ng-amd
      containers:
      - image: public.ecr.aws/nginx/nginx:latest
        imagePullPolicy: Always
        name: nginx
        resources:
          limits:
            cpu:  100m
            memory: 200Mi
          requests:
            cpu: 100m
            memory: 200Mi        
        ports:
        - name: http
          containerPort: 80
---
EOF

kubectl apply -f nginx-deploy.yaml
```

::::expand{header="Check Output"}
```bash
deployment.apps/nginx created
```
::::

Run below command to check pod status.

```bash
kubectl get pod
```

The output looks like below:

```bash
NAME                                READY   STATUS             RESTARTS       AGE
nginx-74d589986c-xqkqb              1/1     Running            0                 8s
```

Run the below command to exec into the pod and run a curl command:

```bash
POD_NAME=$(kubectl get pods -l=app=nginx -o=jsonpath={.items..metadata.name})
kubectl exec -it  $POD_NAME -- /bin/bash
```

Run a simple curl command to ensure that our nginx sample application is running inside the pod.

```bash
root@nginx-74d589986c-xqkqb:/# curl 127.0.0.1:80
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
<style>
....
root@nginx-74d589986c-xqkqb:/# exit
exit
```

Run the below command to access the logs from the pod and then Ctrl + C to exit from the container log output:

```bash
 kubectl logs -f  $POD_NAME  
```

The output looks like the following:

```bash
 /docker-entrypoint.sh: /docker-entrypoint.d/ is not empty, will attempt to perform configuration
...
...
2022/11/23 08:12:47 [notice] 1#1: start worker process 29
2022/11/23 08:12:47 [notice] 1#1: start worker process 30
127.0.0.1 - - [23/Nov/2022:08:24:29 +0000] "GET / HTTP/1.1" 200 615 "-" "curl/7.74.0" "-"
^C
```



---
title : "Create and mount an AWS Secrets Manager Secret in an Amazon EKS Pod"
weight : 27
---

### **Create SecretProviderClass to specify which secret to mount in the pod**

Create SecretProviderClass custom resource with provider\:aws. The SecretProviderClass must be in the same namespace as the pod using it later.

```text
cd ~/environment
cat << EOF > nginx-deployment-spc.yaml
---
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: nginx-deployment-spc
spec:
  provider: aws
  parameters:
    objects: |
        - objectName: "dbsecret_eksid"
          objectType: "secretsmanager"
EOF

kubectl apply -f nginx-deployment-spc.yaml

kubectl get SecretProviderClass
```

::::expand{header="For successful resource creation, the final output looks like below,"}

```bash
secretproviderclass.secrets-store.csi.x-k8s.io/nginx-deployment-spc created

NAME                   AGE
nginx-deployment-spc   3s
```

::::

### **Deploy POD and Mount secret in the POD**

We will create a deployment that will deploy a POD that uses existing serviceaccount *"nginx-deployment-sa"*.  This POD is configured to mount secrets at path *"/mnt/secrets"* based on the SecretProviderClass *"nginx-deployment-spc"* to retrieve secrets from the AWS Secrets Manager.

```bash
cd ~/environment
cat << EOF > nginx-deployment.yaml
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  labels:
    app: nginx
spec:
  replicas: 1
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      serviceAccountName: nginx-deployment-sa
      containers:
      - name: nginx-deployment
        image: nginx
        ports:
        - containerPort: 80
        volumeMounts:
        - name: secrets-store-inline
          mountPath: "/mnt/secrets"
          readOnly: true
      volumes:
      - name: secrets-store-inline
        csi:
          driver: secrets-store.csi.k8s.io
          readOnly: true
          volumeAttributes:
            secretProviderClass: nginx-deployment-spc
EOF
```

Create a deployment and verify creation of PODs

```bash
kubectl apply -f nginx-deployment.yaml
sleep 8
kubectl get pods -l app=nginx -o wide
```

::::expand{header="Check Output"}

```bash
deployment.apps/nginx-deployment created

NAME                                READY   STATUS    RESTARTS   AGE   IP              NODE                                          NOMINATED NODE   READINESS GATES
nginx-deployment-7f7ddc8488-djk2f   1/1     Running   0          15s   10.254.189.41   ip-10-254-162-47.us-west-2.compute.internal   <none>           <none>
```

::::

### **Verify the mounted secret**

To verify the secret has been mounted properly, use the following command and confirm that your secret value appears.

```bash
kubectl exec $(kubectl get pods | awk '/nginx-deployment/{print $1}' | head -1) -- cat /mnt/secrets/dbsecret_eksid; echo
```

::::expand{header="The mounted secret value appears as," defaultExpanded=true}

```json
{"username":"testdb_user", "password":"super-sekret"}
```

::::

The output shows that the secret fetched from AWS Secrets Manager and mounted under volume *"/mnt/secrets"*.

Notice that value of the JSON formatted secret is available as a single string in the file. If you would like to fetch individual values from the keys of JSON formatted secret and make it available as Kubernetes native secret object, proceed to the next section.

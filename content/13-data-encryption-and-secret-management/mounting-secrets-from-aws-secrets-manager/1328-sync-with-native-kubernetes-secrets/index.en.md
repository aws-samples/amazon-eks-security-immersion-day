---
title : "Sync with Native Kubernetes Secrets"
weight : 28
---

### **Create SecretProviderClass to extract key-value pairs**

Let’s create a SecretProviderClass custom resource and use [jmesPath](https://jmespath.org/) field in the spec file. Use of jmesPath allows extracting specific key-value from a JSON-formatted secret. It is a provider-specific feature from [ASCP](https://github.com/aws/secrets-store-csi-driver-provider-aws).

secretObjects spec section allows specifying the Kubernetes native secret structure synced from the objects: extracted from the JSON formatted secret using jmesPath. The feature is provided by the standard [Secret Store CSI Driver](https://secrets-store-csi-driver.sigs.k8s.io/topics/sync-as-kubernetes-secret.html).

```bash
cd ~/environment
cat << EOF > nginx-deployment-spc-k8s-secrets.yaml
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: nginx-deployment-spc-k8s-secrets
spec:
  provider: aws
  parameters: 
    objects: |
      - objectName: "dbsecret_eksid"
        objectType: "secretsmanager"
        jmesPath:
          - path: username
            objectAlias: dbusername
          - path: password
            objectAlias: dbpassword
  # Create k8s secret. It requires volume mount first in the pod and then sync.
  secretObjects:                
    - secretName: my-secret-01
      type: Opaque
      data:
        #- objectName: <objectName> or <objectAlias> 
        - objectName: dbusername
          key: db_username_01
        - objectName: dbpassword
          key: db_password_01
EOF

kubectl apply -f nginx-deployment-spc-k8s-secrets.yaml

sleep 5

kubectl get SecretProviderClass nginx-deployment-spc-k8s-secrets
```

::::expand{header="The output indicates the resource nginx-deployment-spc-k8s-secrets created successfully."}

```bash
secretproviderclass.secrets-store.csi.x-k8s.io/nginx-deployment-spc-k8s-secrets created

NAME                               AGE
nginx-deployment-spc-k8s-secrets   9s
```

::::

### **Mount Secret Volumes in POD and setup secrets as Environment Variables**

We will configure a POD to mount volumes for individually extracted key-value pairs from secret. Once the pod is created with secrets volume mounts, the Secrets Store CSI Driver then creates and syncs with Kubernetes secret object my-secret-01. POD can then populate Environment variables from the Kubernetes secret.

```bash
cat << EOF > nginx-deployment-k8s-secrets.yaml
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment-k8s-secrets
  labels:
    app: nginx-k8s-secrets
spec:
  replicas: 1
  selector:
    matchLabels:
      app: nginx-k8s-secrets
  template:
    metadata:
      labels:
        app: nginx-k8s-secrets
    spec:
      serviceAccountName: nginx-deployment-sa
      containers:
      - name: nginx-deployment-k8s-secrets
        image: nginx
        imagePullPolicy: IfNotPresent
        ports:
          - containerPort: 80
        volumeMounts:
          - name: secrets-store-inline
            mountPath: "/mnt/secrets"
            readOnly: true
        env:
          - name: DB_USERNAME_01
            valueFrom:
              secretKeyRef:
                name: my-secret-01
                key: db_username_01
          - name: DB_PASSWORD_01
            valueFrom:
              secretKeyRef:
                name: my-secret-01
                key: db_password_01
      volumes:
        - name: secrets-store-inline
          csi:
            driver: secrets-store.csi.k8s.io
            readOnly: true
            volumeAttributes:
              secretProviderClass: nginx-deployment-spc-k8s-secrets
EOF

kubectl apply -f nginx-deployment-k8s-secrets.yaml

sleep 5

kubectl get pods -l "app=nginx-k8s-secrets"

```

::::expand{header="Check Output"}
```bash
deployment.apps/nginx-deployment-k8s-secrets created

NAME                                           READY   STATUS    RESTARTS   AGE
nginx-deployment-k8s-secrets-9969576b6-r47jw   1/1     Running   0          80s
```
::::

### **Verify the result**

Get a shell prompt within the pod by running the following commands. Verify the secret mounted as separate files for each extracted key-value pair and corresponding environment variables set as well.

```bash
export POD_NAME=$(kubectl get pods -l app=nginx-k8s-secrets -o jsonpath='{.items[].metadata.name}')
kubectl exec -it ${POD_NAME} -- /bin/bash
```

::::expand{header="Check Output"}
```bash
root@nginx-deployment-k8s-secrets-9969576b6-r47jw:/#
```
::::

At the shell prompt of POD, run the following set of commands and watch the output.

```bash
export PS1='# '
cd /mnt/secrets
ls -l   #--- List mounted secrets

cat dbusername; echo  
cat dbpassword; echo
cat dbsecret_eksid; echo

env | grep DB    #-- Display two ENV variables set from the secret values
sleep 2
exit

```

::::expand{header="The output shows the information as displayed here. The last exit command in the shell window exits from the pod’s shell." defaultExpanded=true}

```text
# cd /mnt/secrets
# ls -l   #--- List mounted secrets
total 12
-rw-r--r-- 1 root root 12 Aug 16 23:08 dbpassword
-rw-r--r-- 1 root root 53 Aug 16 23:08 dbsecret_eksid
-rw-r--r-- 1 root root 11 Aug 16 23:08 dbusername
# 
# cat dbusername; echo  
testdb_user
# cat dbpassword; echo
super-sekret
# cat dbsecret_eksid; echo
{"username":"testdb_user", "password":"super-sekret"}
# 
# env | grep DB    #-- Display two ENV variables set from the secret values
DB_USERNAME_01=testdb_user
DB_PASSWORD_01=super-sekret
# sleep 2
# exit

```

::::

Observe the following:

- Files *"dbusername"* and *"dbpassword"* contains extracted values from the JSON formatted secret *dbsecret_eksid*.
- *"/mnt/secrets"* key-values pairs extracted in separate files based on jmesPath specification.
- Environment variables *"DB_USERNAME_01"* and *"DB_PASSWORD_01"* are mapped from Kubernetes secrets object *"my-secret-01"*
  which was created automatically by the CSI driver during POD deployment.

Lets check the Kubernetes secret created by CSI driver during POD creation.

```bash
kubectl describe secrets my-secret-01
```

::::expand{header="Check the details of Kubernetes secret below," defaultExpanded=true}

```text
Name:         my-secret-01
Namespace:    default
Labels:       secrets-store.csi.k8s.io/managed=true
Annotations:  <none>

Type:  Opaque

Data
====
db_password_01:  12 bytes
db_username_01:  11 bytes
```

::::

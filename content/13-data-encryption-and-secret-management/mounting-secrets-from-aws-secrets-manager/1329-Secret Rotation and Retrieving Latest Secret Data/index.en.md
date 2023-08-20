---
title : "Secret Rotation and Retrieving Latest Secret Data"
weight : 29
---

If you use Secrets Manager automatic rotation for your secrets, you can also use the Secrets Store CSI Driver rotation reconciler feature to ensure you are retrieving the latest secret from Secrets Manager.

When the secret/key is updated in AWS Secrets manager after the initial pod deployment, the updated secret will be periodically updated in the pod mount and the Kubernetes Secret. 
<!---
Based on how your application is consuming secret data, you have to consider following:

- **Mount Kubernetes Secret as volume** - Use auto rotation feature from AWS Secrets manager with Sync kubernetes secrets feature in Secrets Store CSI Driver. Application will need to watch for changes from the mounted Kubernetes Secret volume. When the Kubernetes Secret is updated by the CSI Driver, the corresponding volume contents are automatically updated
- **Application reads the data from container’s filesystem** - Use rotation feature in Secrets Store CSI Driver. Application will need to watch for the file change from the volume mounted by the CSI driver.
- **Using Kubernetes secret for environment variable** - The pod needs to be restarted to get the latest secret as environment variable.
--->

Let's change the secret data in AWS Secret Manager secret using CLI to simulate secret rotation using below command,

```bash
aws secretsmanager put-secret-value \
    --secret-id dbsecret_eksid\
    --secret-string "{\"username\":\"newdb_user\",\"password\":\"newdb-sekret \"}"
```

::::expand{header="Sample Output"}

```text
{
    "ARN": "arn:aws:secretsmanager:us-west-2:111122223333:secret:dbsecret_eksid-aOZejK",
    "Name": "dbsecret_eksid",
    "VersionId": "e54968a1-584f-4852-95f6-70b5de883120",
    "VersionStages": [
        "AWSCURRENT"
    ]
}
```
::::

**Important**
You may need to wait for ~1-2 minutes before executing following commands to verify the new secret values in POD.

### **Verify the result**

Get a shell prompt within the pod by running the following commands. Verify the secret mounted as separate files for each extracted key-value pair and corresponding environment variables set as well.

```bash
export POD_NAME=$(kubectl get pods -l app=nginx-k8s-secrets -o jsonpath='{.items[].metadata.name}')
kubectl exec -it ${POD_NAME} -- /bin/bash
```

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
-rw-r--r-- 1 root root 13 Aug 20 16:20 dbpassword
-rw-r--r-- 1 root root 52 Aug 20 16:20 dbsecret_eksid
-rw-r--r-- 1 root root 10 Aug 20 16:20 dbusername
# 
# cat dbusername; echo  
newdb_user
# cat dbpassword; echo
newdb-sekret 
# cat dbsecret_eksid; echo
{"username":"newdb_user","password":"newdb-sekret "}
# 
# env | grep DB    #-- Display two ENV variables set from the secret values
DB_USERNAME_01=testdb_user
DB_PASSWORD_01=super-sekret
# sleep 2
# exit
```

::::

Observe the following:

```text
- Files "dbusername" and "dbpassword" contains new secret data from the JSON formatted secret dbsecret_eksid.
- "/mnt/secrets" key-values pairs extracted in separate files based on jmesPath specification.
- Environment variables "DB_USERNAME_01" and "DB_PASSWORD_01" are mapped from Kubernetes secrets object "my-secret-01" 
  which was created automatically by the CSI driver during POD deployment and still returning old secret data.
```

When using Kubernetes secret for environment variable, the POD needs to be restarted to get the latest secret as environment variable. Let's restart POD using following command,

```bash
kubectl rollout restart deployment/nginx-deployment-k8s-secrets
```

We can verify the updated value of environment variables *DB_USERNAME_01* and *DB_PASSWORD_01* using following command,

```bash
export POD_NAME=$(kubectl get pods -l app=nginx-k8s-secrets -o jsonpath='{.items[].metadata.name}')
kubectl exec -it ${POD_NAME} -- /bin/bash
```

At the shell prompt of POD, run the following set of commands and watch the output.

```bash
export PS1='# '
env | grep DB    #-- Display two ENV variables set from the secret values
sleep 2
exit
```

::::expand{header="The output shows the information as displayed here. The last exit command in the shell window exits from the pod’s shell." defaultExpanded=true}

```text
export PS1='# '
# env | grep DB    #-- Display two ENV variables set from the secret values
DB_USERNAME_01=newdb_user
DB_PASSWORD_01=newdb-sekret 
# sleep 2
# exit
```

::::

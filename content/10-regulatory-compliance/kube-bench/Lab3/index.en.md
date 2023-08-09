---
title : "Lab 3 - Kube-bench Integration with AWS Security Hub"
weight : 21
---

In this lab, we will integrate kube-bench with AWS Security Hub to publish findings.
1. Open the [AWS Cloud9 console](https://console.aws.amazon.com/cloud9/) created for the workshop 
2. Enable Security Hub in the account
```shell
aws securityhub enable-security-hub \
    --enable-default-standards \
    --tags '{"Name": "eks_security_im_day"}'
```
3. Search of kube-bench in integrations in [AWS Security Hub](https://console.aws.amazon.com/securityhub/) and accept findings:
![Kube-bench integration](/static/images/regulatory-compliance/kube-bench/Lab3/kube-bench-integration.jpg)

4. Create a policy for the kube-bench job service account role
```shell
cat >my-policy.json <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": "securityhub:BatchImportFindings",
            "Resource": [
                "arn:aws:securityhub:${AWS_REGION}::product/aqua-security/kube-bench"
            ]
        }
    ]
}
EOF
PolicyArn=$(aws iam create-policy --policy-name kube-bench-policy --policy-document file://my-policy.json --output text --query Policy.Arn)
```
5. Create a service account
```shell
eksctl create iamserviceaccount --name kube-bunch-sa --namespace default --cluster eksworkshop-eksctl --role-name kube-bunch-role  \
    --attach-policy-arn $PolicyArn --approve
```
6. Configure kube-bench job with `--asff` to send findings to AWS Security Hub)
```shell
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: kube-bench-eks-config
data:
  config.yaml: |
    AWS_ACCOUNT: $AWS_ACCOUNT_ID
    AWS_REGION: $AWS_REGION
    CLUSTER_ARN: "arn:aws:eks:$AWS_REGION:$AWS_ACCOUNT_ID:cluster/$EKS_CLUSTER"

---
apiVersion: batch/v1
kind: Job
metadata:
  name: kube-bench
spec:
  template:
    spec:
      hostPID: true
      containers:
        - name: kube-bench
          image: docker.io/aquasec/kube-bench:latest
          command:
            [
              "kube-bench",
              "run",
              "--targets",
              "node",
              "--benchmark",
              "eks-1.2.0",
              "--asff",
            ]
          env:
            - name: NODE_NAME
              valueFrom:
                fieldRef:
                  fieldPath: spec.nodeName
          volumeMounts:
            - name: var-lib-kubelet
              mountPath: /var/lib/kubelet
              readOnly: true
            - name: etc-systemd
              mountPath: /etc/systemd
              readOnly: true
            - name: etc-kubernetes
              mountPath: /etc/kubernetes
              readOnly: true
            - name: kube-bench-eks-config
              mountPath: "/opt/kube-bench/cfg/eks-1.2.0/config.yaml"
              subPath: config.yaml
              readOnly: true
      restartPolicy: Never
      serviceAccountName: kube-bunch-sa
      volumes:
        - name: var-lib-kubelet
          hostPath:
            path: "/var/lib/kubelet"
        - name: etc-systemd
          hostPath:
            path: "/etc/systemd"
        - name: etc-kubernetes
          hostPath:
            path: "/etc/kubernetes"
        - name: kube-bench-eks-config
          configMap:
            name: kube-bench-eks-config
            items:
              - key: config.yaml
                path: config.yaml
EOF
```
7. Verify the jobs
```shell
kubectl get jobs
```
::::expand{header="Check Output"}
```shell
NAME         COMPLETIONS   DURATION   AGE
kube-bench   1/1           10s        6m28s
```
::::
8. View the findings in security hub
![Security Hub](/static/images/regulatory-compliance/kube-bench/Lab3/security-hub.jpg)
---
title : "Amazon GuardDuty EKS Runtime Monitoring EKS Add-on"
weight : 21
---

In the earlier section, we enabled EKS protection for Amazon GuardDuty.

Under **EKS Protection**, go to **EKS clusters runtime coverage** to check the status.

![GDRuneTimeAgenthealthy](/static/images/detective-controls/GDRuneTimeAgenthealthy.png)


Go to EKS Console and ensure that Amazon GuardDuty EKS Runtime Monitoring EKS Managed Add-on is deployed into the EKS cluster.

![GDRuneTimeAgent](/static/images/detective-controls/GDRuneTimeAgent.png)

If you select **Manage agent automatically** option, the EKS add-on agent will be automatically updated to newer versions of the agent, when the Kubernetes versions are upgraded. If automated agent management is not configured then you will need to manually deploy and update the agent to EKS clusters. Check [documentation](https://docs.aws.amazon.com/guardduty/latest/ug/eks-runtime-monitoring-security-agent-manual.html) for details.

Below is the deployment Architecture for the GuardDuty security agent.

![GDAgentArch](/static/images/detective-controls/GDAgentArch.png)


The GuardDuty Agent utilizes the worker node **Instance Identity Role** for temporary credentials for sending security telemetry to the GuardDuty back-end. That means, unlike other agents or controllers, which reqquires specific IAM permissions configured via IAM Roles for service accounts(IRSA), you dont have to configure any special IAM permissions for the Agent.

You can see that IRSA is not used (which means Instance Node Role is used by default) for GuardDuty Agent pod i.e. the Service Account assigned GuardDuty Agent pod for the does not have any annotation with an IAM Role.


```bash
WSParticipantRole:~/environment $ kubectl -n amazon-guardduty describe sa aws-guardduty-agent
Name:                aws-guardduty-agent
Namespace:           amazon-guardduty
Labels:              k8s-app=aws-guardduty-agent
Annotations:         <none>
Image pull secrets:  <none>
Mountable secrets:   <none>
Tokens:              <none>
Events:              <none>
```

The EKS Runtime Monitoring agent is deployed as Daemonset in the EKS Cluster. Let us check if the pods are running.

```bash
WSParticipantRole:~/environment $ kubectl get pod -n amazon-guardduty
NAME                        READY   STATUS    RESTARTS   AGE
aws-guardduty-agent-rbl82   1/1     Running   0          10m
aws-guardduty-agent-xfnhs   1/1     Running   0          10m
```

The Amazon EKS add-on for GuardDuty (`aws-guardduty-agent`) is designed to a light weight agent to minimize any impact on customer workloads. It uses less resources for its operation since all of the processing for Runtime Monitoring runs on the Amazon GuardDuty backend.

Run below command to see resource usage of the Amazon EKS add-on for GuardDuty.

```bash
WSParticipantRole:~/environment $ kubectl -n amazon-guardduty get ds -o yaml
```

As you see in the below output, it uses 200m of cpu and 256MN of memory.

```yaml
....
          image: 039403964562.dkr.ecr.us-west-2.amazonaws.com/aws-guardduty-agent:v1.1.0
          name: aws-guardduty-agent
          resources:
            limits:
              cpu: "1"
              memory: 1Gi
            requests:
              cpu: 200m
              memory: 256Mi
          securityContext:
            allowPrivilegeEscalation: false
            capabilities:
              add:
              - SYS_PTRACE
              - SYS_ADMIN
          terminationMessagePath: /dev/termination-log
          terminationMessagePolicy: File
          volumeMounts:
          - mountPath: /run/docker.sock
            name: docker-sock
            readOnly: true
          - mountPath: /run/containerd/containerd.sock
            name: containerd-sock
            readOnly: true
          - mountPath: /proc
            name: host-proc
            readOnly: true
...

```

**Pricing**

Both EKS Audit Log Monitoring and EKS Runtime Monitoring offer 30 day trial period. Amazon EKS audit log analysis is charged per 1 million audit logs per month, is prorated, and is discounted with volume. Runtime Monitoring pricing is based on the number and size of protected EKS workloads, measured in virtual CPUs (vCPUs). Check [documentation](https://aws.amazon.com/guardduty/pricing/) for details.



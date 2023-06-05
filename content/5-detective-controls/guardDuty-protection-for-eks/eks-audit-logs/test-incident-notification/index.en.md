---
title : "Test Incident Notification"
weight : 24
---

Now, let’s generate another GuardDuty finding in your Cloud9 terminal to check if the EventBridge rule routes events from GuardDuty to the target SNS topic, and sends an email notification to you.

#### [`Execution:Kubernetes/ExecInKubeSystemPod`](https://docs.aws.amazon.com/guardduty/latest/ug/guardduty_finding-types-kubernetes.html#execution-kubernetes-execinkubesystempod)


This time we will generate a new finding related to a command being executed inside a pod within the kube-system namespace. More information about this [here](https://docs.aws.amazon.com/guardduty/latest/ug/guardduty_finding-types-kubernetes.html#execution-kubernetes-execinkubesystempod).

Run the below commands to generate this finding. Note, the exact pod name varies in the second command. Use the pod name you see for the aws-node pod as displayed in the output of the first command.


```bash
AWS_NODE_POD=`kubectl get pods -n kube-system -l k8s-app=aws-node -o name | head -n 1`
kubectl -n kube-system exec $AWS_NODE_POD -- /app/grpc-health-probe  -addr=:50051
```

The output looks like below

```bash
Defaulted container "aws-node" out of: aws-node, aws-vpc-cni-init (init)
{"level":"info","ts":"2023-04-03T06:41:13.817Z","caller":"/root/sdk/go1.19.2/src/runtime/proc.go:250","msg":"status: SERVING"}
```

Go back to the [Amazon GuardDuty console](https://console.aws.amazon.com/guardduty/home) to check if a finding is generated.

![GDexecinkubepods](/static/images/detective-controls/GDexecinkubepods.png)


Amazon GuardDuty sends a notification to the Eventbridge.

After the event is emitted from GuardDuty and an Eventbridge rule is triggered, you should receive an email through the subscription on the SNS topic shortly after.

::alert[Sometime, the Email Notification may take longer time. In that case, you can check your Email later.]{header="Note"}

The Email Notification will like below once it is arrived.

![GDEmailNotification](/static/images/detective-controls/GDEmailNotification.png)

You can monitor Eventbridge metrics by CloudWatch. See details [here](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-monitoring.html)

You can try re-generating the other finding types by modifying the name of resource in the yaml files.



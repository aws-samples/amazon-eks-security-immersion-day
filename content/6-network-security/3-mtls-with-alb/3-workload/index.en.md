---
title : "Deploy a Sample Workload"
weight : 12
---

## Deploy a Sample Workload

The workload is a backend web service that displays a simple text. The workload in the cluster is exposed to other clients using an internal Application Load Balancer.

Create an example Workload with the manifest below and save the file as `mtls.yaml`

```bash
cat << EOF > workload.yaml
kind: Deployment
apiVersion: apps/v1
metadata:
  name: mtls-app
  namespace: mtls
  labels:
    app: mtls
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mtls
  template:
    metadata:
      labels:
        app: mtls
    spec:
      containers:
      - name: mtls-app
        image: hashicorp/http-echo
        args:
          - "-text=Amazon EKS Security Immersion Workshop - mTLS with ALB in Amazon EKS"
---
kind: Service
apiVersion: v1
metadata:
  name: mtls-service
  namespace: mtls
spec:
  selector:
    app: mtls
  ports:
    - port: 80 
      targetPort: 5678
      protocol: TCP
  type: NodePort
    
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  namespace: mtls
  name: mtls-ingress
  annotations:
    alb.ingress.kubernetes.io/scheme: internal
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/load-balancer-name: mtls-eks
    # Listen port configuration
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS": 80}, {"HTTPS": 443}, {"HTTPS": 8080}, {"HTTPS": 8443}]'
    ## TLS Settings
    alb.ingress.kubernetes.io/certificate-arn: ${CERTIFICATE_ARN}  # the ARN we imported to AWS Certificate Manager in previous lab
    alb.ingress.kubernetes.io/ssl-policy: ELBSecurityPolicy-TLS13-1-2-2021-06 
spec:
  ingressClassName: alb
  rules:
    - host: "mtls.${CUSTOM_DOMAIN_NAME}"
      http:
        paths:
        - path: /
          pathType: Prefix
          backend:
            service:
              name: mtls-service
              port:
                number: 80 
EOF
```

Create the workload

```bash
kubectl create -f workload.yaml 
```

Verify the workload

```bash
kubectl get all,ingress -n mtls
```

::::expand{header="Check Output"}
```bash
NAME                            READY   STATUS    RESTARTS   AGE
pod/mtls-app-6459cb6456-6tp7s   1/1     Running   0          2m49s

NAME                   TYPE       CLUSTER-IP       EXTERNAL-IP   PORT(S)        AGE
service/mtls-service   NodePort   172.20.110.182   <none>        80:31116/TCP   2m49s

NAME                       READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/mtls-app   1/1     1            1           2m49s

NAME                                  DESIRED   CURRENT   READY   AGE
replicaset.apps/mtls-app-6459cb6456   1         1         1       2m49s

NAME                                     CLASS   HOSTS                               ADDRESS                                                    PORTS   AGE
ingress.networking.k8s.io/mtls-ingress   alb     mtls.vpc-lattice-custom-domain.io   internal-mtls-eks-1944096030.us-west-2.elb.amazonaws.com   80      2m49s
```
::::

You can also check Application Loadbalancer in [AWS EC2 console](https://console.aws.amazon.com/ec2/home?#LoadBalancers:). Wait till you confirm that the Internal loadbalancer created is in an active state"

![ec2-alb.png](/static/images/6-network-security/3-mtls-with-alb/ec2-alb.png)

Confirm that mTLS is turned off for all the listeners. For example, click the Application Load Balancer's HTTPS 443 Listener to confirm Mutual authentication (mTLS) is turned off

![mtls-off](/static/images/6-network-security/3-mtls-with-alb/mtls-off.png)

Verify you can access the application exposed with the ALB internally

```bash
curl -k https://mtls.vpc-lattice-custom-domain.io
```

or

```bash
curl https://mtls.vpc-lattice-custom-domain.io --cacert manifests/root_cert.pem 
```

::::expand{header="Check Output"}
```bash
WSParticipantRole:~/environment $ curl -k https://mtls.vpc-lattice-custom-domain.io
Amazon EKS Security Immersion Workshop - mTLS with ALB in Amazon EKS
WSParticipantRole:~/environment $ curl https://mtls.vpc-lattice-custom-domain.io --cacert manifests/root_cert.pem 
Amazon EKS Security Immersion Workshop - mTLS with ALB in Amazon EKS
```
::::

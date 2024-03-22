---
title : "Enable mTLS in ALB"
weight : 13
---

Let’s enable mTLS by editing the ingress manifest we previously deployed to the cluster. In this example, the listener HTTPS:80 is set to passthrough mode, the listener HTTPS:443 will be set to verify mode and will be associated with the provided `trust-store-arn arn:aws:elasticloadbalancing:trustStoreArn` we created earlier. The remaining listeners HTTPS:8080 and HTTPS:8443 will be set to default mTLS mode (i.e., off).

```bash
cat << EOF > ingress.yaml
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
    # mTLS configuration
    alb.ingress.kubernetes.io/mutual-authentication: '[{"port": 80, "mode": "passthrough"}, 
                                        {"port": 443, "mode": "verify", "trustStore": "$TRUSTORE_ARN", "ignoreClientCertificateExpiry" : true}]'
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

Apply the manifest to update the existing ingress:

```bash
kubectl apply -f ingress.yaml
```

Navigate to Application Loadbalancer in [AWS EC2 console](https://us-west-2.console.aws.amazon.com/ec2/home?region=us-west-2#LoadBalancers:) to verify that the listeners now been updated.
![mtls-listeners](/static/images/6-network-security/3-mtls-with-alb/mtls-listeners.png)


Navigate to Application Loadbalancer in [AWS EC2 console](https://us-west-2.console.aws.amazon.com/ec2/home?region=us-west-2#LoadBalancers:), confirm that the HTTPS 443 Listener now has Mutual authentication (mTLS) set to "Verify with trust store" using the trust store we created and HTTPS 80 Listener set to passthrough mode.

![mtls-on](/static/images/6-network-security/3-mtls-with-alb/mtls-on.png)

Confirm that you can no longer access the application exposed with the internal ALB without using a certificate trusted by the ACM PCA.

```bash
curl -k https://mtls.vpc-lattice-custom-domain.io
```

or

```bash
curl https://mtls.vpc-lattice-custom-domain.io --cacert manifests/root_cert.pem 
```

::::expand{header="Check Output"}
```bash
curl: (35) Recv failure: Connection reset by peer
```
::::


Create a sample pod that will use the client certificate we requested from the ACM PCA with the manifest below with a file name `client.yaml`

```bash
cat << EOF > client.yaml
apiVersion: v1
kind: Pod
metadata:
  name: mtls-client
  namespace: mtls
spec:
  containers:
    - name: mtls-client-container
      image: nginx
      args:
      - /bin/sh
      - -c
      - >
        while true;
        do
          curl -sk "\${ENDPOINT}" --cert /etc/secret-volume/tls.crt --key /etc/secret-volume/tls.key;
          sleep 60
        done
      env:
      - name: ENDPOINT
        value: "https://mtls.${CUSTOM_DOMAIN_NAME}"
      volumeMounts:
        - name: secret-volume
          mountPath: /etc/secret-volume
          readOnly: true
  volumes:
    - name: secret-volume
      secret:
        secretName: mtls-cert-client
EOF
```

Apply the manifest and confirm that the pod is running:

```bash
kubectl apply -f client.yaml
kubectl get pods -n mtls
```

::::expand{header="Check Output"}
```bash
NAME                        READY   STATUS    RESTARTS   AGE
mtls-app-6459cb6456-6tp7s   1/1     Running   0          37m
mtls-client                 1/1     Running   0          11s
```
::::

Verify that the pod is able to connect with the application using a mutual TLS

```bash
kubectl logs mtls-client -n mtls
```

::::expand{header="Check Output"}
```
kubectl logs mtls-client -n mtls
Amazon EKS Security Immersion Workshop - mTLS with ALB in Amazon EKS
```
::::


You can retrieve the certificate issued to the test client pod and use it to test the internal ALB enabled with mTLS

```bash
kubectl get secret mtls-cert-client -n mtls -o jsonpath='{.data.tls\.crt}' | base64 --decode > tls.crt
kubectl get secret mtls-cert-client -n mtls -o jsonpath='{.data.tls\.key}' | base64 --decode > tls.key
```

Use the retrieved key pair to authenticate with the internal ALB.

```bash
curl -k https://mtls.vpc-lattice-custom-domain.io --key tls.key --cert tls.crt -v
```

or

```bash
curl https://mtls.vpc-lattice-custom-domain.io --cacert manifests/root_cert.pem --key tls.key --cert tls.crt -v
```

You should see a **200** HTTP response only when the certificate and key is specified in the curl command.

::::expand{header="Check Output"}
```bash
*   Trying 10.254.166.201:443...
* Connected to mtls.vpc-lattice-custom-domain.io (10.254.166.201) port 443
* ALPN: curl offers h2,http/1.1
* Cipher selection: ALL:!EXPORT:!EXPORT40:!EXPORT56:!aNULL:!LOW:!RC4:@STRENGTH
* TLSv1.2 (OUT), TLS handshake, Client hello (1):
* TLSv1.2 (IN), TLS handshake, Server hello (2):
* TLSv1.2 (IN), TLS handshake, Certificate (11):
* TLSv1.2 (IN), TLS handshake, Server key exchange (12):
* TLSv1.2 (IN), TLS handshake, Request CERT (13):
* TLSv1.2 (IN), TLS handshake, Server finished (14):
* TLSv1.2 (OUT), TLS handshake, Certificate (11):
* TLSv1.2 (OUT), TLS handshake, Client key exchange (16):
* TLSv1.2 (OUT), TLS handshake, CERT verify (15):
* TLSv1.2 (OUT), TLS change cipher, Change cipher spec (1):
* TLSv1.2 (OUT), TLS handshake, Finished (20):
* TLSv1.2 (IN), TLS change cipher, Change cipher spec (1):
* TLSv1.2 (IN), TLS handshake, Finished (20):
* SSL connection using TLSv1.2 / ECDHE-RSA-AES128-GCM-SHA256
* ALPN: server accepted h2
* Server certificate:
*  subject: CN=*.vpc-lattice-custom-domain.io
*  start date: Mar 21 13:11:42 2024 GMT
*  expire date: Apr 20 14:11:42 2025 GMT
*  issuer: C=US; O=Example Corp; OU=Sales; ST=WA; CN=www.vpc-lattice-custom-domain.io.io; L=Seattle
*  SSL certificate verify result: self signed certificate in certificate chain (19), continuing anyway.
* using HTTP/2
* [HTTP/2] [1] OPENED stream for https://mtls.vpc-lattice-custom-domain.io/
* [HTTP/2] [1] [:method: GET]
* [HTTP/2] [1] [:scheme: https]
* [HTTP/2] [1] [:authority: mtls.vpc-lattice-custom-domain.io]
* [HTTP/2] [1] [:path: /]
* [HTTP/2] [1] [user-agent: curl/8.3.0]
* [HTTP/2] [1] [accept: */*]
> GET / HTTP/2
> Host: mtls.vpc-lattice-custom-domain.io
> User-Agent: curl/8.3.0
> Accept: */*
> 
**< HTTP/2 200** 
< date: Thu, 21 Mar 2024 15:18:56 GMT
< content-type: text/plain; charset=utf-8
< content-length: 69
< x-app-name: http-echo
< x-app-version: 1.0.0
< 
Amazon EKS Security Immersion Workshop - mTLS with ALB in Amazon EKS
* Connection #0 to host mtls.vpc-lattice-custom-domain.io left intact
```
::::

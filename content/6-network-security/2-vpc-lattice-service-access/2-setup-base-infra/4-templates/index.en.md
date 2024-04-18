---
title : "Create Template Files for Gateway, Apps and Routes"
weight : 13
---

In this section, we will create multiple template files, which we will be using later in the workshop to instantiate various manifest files.

## Create template for Gateway 

This will create a template file to later create `Namespace` and `Gateway` Kubernetes objects. The Gateway  will have HTTP and HTTPS listeners, and HTTPS listenet with custom domain that will terminate TLS using associated ACM certificate.

```bash
cat > templates/gateway-template.yaml <<EOF
apiVersion: v1
kind: Namespace
metadata:
  name: \$GATEWAY_NAMESPACE
---
apiVersion: gateway.networking.k8s.io/v1beta1
kind: Gateway
metadata:
  name: \$GATEWAY_NAME
  namespace: \$GATEWAY_NAMESPACE
spec:
  gatewayClassName: amazon-vpc-lattice
  listeners:
  - name: http-listener
    port: 80
    protocol: HTTP
    allowedRoutes:
      kinds:
      - kind: HTTPRoute
      namespaces:
        from: Selector
        selector:
          matchLabels:
            allow-attachment-to-infra-gw: "true"
  - name: https-listener-with-default-domain
    port: 443
    protocol: HTTPS
    allowedRoutes:
      kinds:
      - kind: HTTPRoute
      namespaces:
        from: Selector
        selector:
          matchLabels:
            allow-attachment-to-infra-gw: "true"
  - name: https-listener-with-custom-domain
    port: 443
    protocol: HTTPS
    allowedRoutes:
      kinds:
      - kind: HTTPRoute
      namespaces:
        from: Selector
        selector:
          matchLabels:
            allow-attachment-to-infra-gw: "true"    
    tls:
      mode: Terminate
      options:
        application-networking.k8s.aws/certificate-arn: \$CERTIFICATE_ARN                  
EOF
```

## Create template for K8s Application Deployment & Service.  

This template will be used to create our applications:
- Namespace
- Deployment
- Service

There are commended sections that will be enabled on generated applications manifests when required.

```bash
cat > templates/app-template.yaml <<EOF
apiVersion: v1
kind: Namespace
metadata:
  name: \$APPNAME
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: \$APPNAME-\$VERSION
  namespace: \$APPNAME
  labels:
    app: \$APPNAME-\$VERSION
spec:
  replicas: 1
  selector:
    matchLabels:
      app: \$APPNAME-\$VERSION
  template:
    metadata:
      annotations:
       vpc-lattices-svcs.amazonaws.com/agent-inject: "true"
      labels:
        app: \$APPNAME-\$VERSION
    spec:
      containers:
      - name: \$APPNAME-\$VERSION
        image: public.ecr.aws/seb-demo/http-server:v1.10
        env:
        - name: PodName
          value: "Hello from \$APPNAME-\$VERSION"
#addcacert        - name: CA_ARN
#addcacert          value: "\$CA_ARN"
        securityContext:
          runAsUser: 101
#addprestop        lifecycle:
#addprestop          preStop:
#addprestop            exec:
#addprestop              command: ["/bin/sh", "-c", "sleep 15"]          
#addcert        volumeMounts:
#addcert        - name: root-cert
#addcert          mountPath: /cert/
#addcert          readOnly: true
#addcert      volumes:
#addcert      - name: root-cert
#addcert        configMap:
#addcert          name: app-root-cert
#addprestop      terminationGracePeriodSeconds: 15
---
apiVersion: v1
kind: Service
metadata:
  name: \$APPNAME-\$VERSION
  namespace: \$APPNAME
spec:
  selector:
    app: \$APPNAME-\$VERSION
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8090
EOF
```

## Create Template for HTTPRoute

Then we create different `HTTPRoute` templates that we will use to demonstrate VPC lattice use cases, with some `IAMAuthPolicy` in some case that will configure the Authentication policy we want to be applied on VPC Lattice services.

### Create Template for HTTPRoute with Default Domain and HTTP Listener

```bash
cat > templates/route-template-http-default-domain.yaml <<EOF
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  name: \$APPNAME
  namespace: \$APPNAME
spec:
  parentRefs:
  - kind: Gateway
    name: \$GATEWAY_NAME
    namespace: \$GATEWAY_NAMESPACE  
    sectionName: http-listener
  rules:
  - backendRefs:
    - name: \$APPNAME-\$VERSION
      kind: Service
      port: 80
    matches:
      - path:
          type: PathPrefix
          value: /      
EOF
```

### Create Template for HTTPRoute with Default Domain and HTTPS Listener

```bash
cat > templates/route-template-https-default-domain.yaml  <<EOF
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  name: \$APPNAME
  namespace: \$APPNAME
spec:
  parentRefs:
  - kind: Gateway
    name: \$GATEWAY_NAME
    namespace: \$GATEWAY_NAMESPACE  
    sectionName: http-listener
  - kind: Gateway
    name: \$GATEWAY_NAME
    namespace: \$GATEWAY_NAMESPACE  
    sectionName: https-listener-with-default-domain    
  rules:
  - backendRefs:
    - name: \$APPNAME-\$VERSION
      kind: Service
      port: 80
    matches:
      - path:
          type: PathPrefix
          value: /      
EOF
```

### Create Template for HTTPRoute with Custom Domain and HTTPS Listener and Create IAMAuthPolicy

```bash
cat > templates/route-template-https-custom-domain.yaml  <<EOF
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  name: \$APPNAME
  namespace: \$APPNAME
spec:
  hostnames:
  - \$APPNAME.\$CUSTOM_DOMAIN_NAME
  parentRefs:
  - kind: Gateway
    name: \$GATEWAY_NAME
    namespace: \$GATEWAY_NAMESPACE  
    sectionName: http-listener
  - kind: Gateway
    name: \$GATEWAY_NAME
    namespace: \$GATEWAY_NAMESPACE  
    sectionName: https-listener-with-custom-domain   
  rules:
  - backendRefs:
    - name: \$APPNAME-\$VERSION
      kind: Service
      port: 80
    matches:
      - path:
          type: PathPrefix
          value: /  
---
apiVersion: application-networking.k8s.aws/v1alpha1
kind: IAMAuthPolicy
metadata:
    name: \${APPNAME}-iam-auth-policy
    namespace: \$APPNAME
spec:
    targetRef:
        group: "gateway.networking.k8s.io"
        kind: HTTPRoute
        namespace: \$APPNAME
        name: \$APPNAME
    policy: |
        {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": "arn:aws:iam::\${ACCOUNT_ID}:root"
                    },
                    "Action": "vpc-lattice-svcs:Invoke",
                    "Resource": "*",
                    "Condition": {
                        "StringEquals": {
                            "vpc-lattice-svcs:SourceVpc": [
                                "\$EKS_CLUSTER1_VPC_ID",
                                "\$EKS_CLUSTER2_VPC_ID"
                            ],
                            "aws:PrincipalTag/eks-cluster-name": "\$EKS_CLUSTER1_NAME",
                            "aws:PrincipalTag/kubernetes-namespace": "\$SOURCENAMESPACE"                             
                        }
                    }                    
                }
            ]
        }              
EOF
```


### Create Template for HTTPRoute with Custom Domain and HTTPS Listener and Weighted Routing, and ServiceImport

```bash
cat > templates/route-template-http-custom-domain-weighted.yaml  <<EOF
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  name: \$APPNAME
  namespace: \$APPNAME
spec:
  hostnames:
  - \$APPNAME.\$CUSTOM_DOMAIN_NAME
  parentRefs:
  - kind: Gateway
    name: \$GATEWAY_NAME
    namespace: \$GATEWAY_NAMESPACE  
    sectionName: https-listener-with-custom-domain
  rules:
  - backendRefs:
    - name: \$APPNAME-\$VERSION1
      kind: Service
      port: 80
      weight: 50
    - name: \$APPNAME-\$VERSION2
      kind: ServiceImport
      port: 80
      weight: 50      
    matches:
      - path:
          type: PathPrefix
          value: /
---
apiVersion: application-networking.k8s.aws/v1alpha1
kind: IAMAuthPolicy
metadata:
    name: \${APPNAME}-iam-auth-policy
    namespace: \$APPNAME
spec:
    targetRef:
        group: "gateway.networking.k8s.io"
        kind: HTTPRoute
        namespace: \$APPNAME
        name: \$APPNAME
    policy: |
        {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": "arn:aws:iam::\${ACCOUNT_ID}:root"
                    },
                    "Action": "vpc-lattice-svcs:Invoke",
                    "Resource": "*",
                    "Condition": {
                        "StringEquals": {
                            "vpc-lattice-svcs:SourceVpc": [
                                "\$EKS_CLUSTER1_VPC_ID",
                                "\$EKS_CLUSTER2_VPC_ID"
                            ],
                            "aws:PrincipalTag/AllowTag": "true",
                            "aws:PrincipalTag/eks-cluster-name": "\$EKS_CLUSTER1_NAME",
                            "aws:PrincipalTag/k8s-namespace": "\$SOURCENAMESPACE"
                        }
                    }                    
                }
            ]
        }          
EOF
```
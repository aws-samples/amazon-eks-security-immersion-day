---
title : "Create Template Files for Gateway, Apps and Routes"
weight : 13
---

In this section, we will create multiple template files, which we will be using later in the workshop to instantiate various manifest files.

## Create template for Gateway 

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
  annotations:
    application-networking.k8s.aws/lattice-vpc-association: "true"
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
        #from: Same
        #from: All
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
        #from: Same
        #from: All
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
        #from: Same
        #from: All
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

```bash
cat > templates/app-template.yaml <<EOF
apiVersion: v1
kind: Namespace
metadata:
  name: \$APPNAME
  labels:
    allow-attachment-to-infra-gw: "true"  
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
        image: public.ecr.aws/x2j8p8w7/http-server:latest
        env:
        - name: PodName
          value: "Hello from \$APPNAME-\$VERSION"

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

## Create Template for HTTPRoute with Default Domain and HTTP Listener

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
    - name: \$APPNAME-\$VERSION1
      kind: Service
      port: 80
    matches:
      - path:
          type: PathPrefix
          value: /      
EOF
```

## Create Template for HTTPRoute with Custom Domain and HTTP Listener

```bash
cat > templates/route-template-http-custom-domain.yaml <<EOF
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
  rules:
  - backendRefs:
    - name: \$APPNAME-\$VERSION1
      kind: Service
      port: 80
    matches:
      - path:
          type: PathPrefix
          value: /      
EOF
```

## Create Template for HTTPRoute with Custom Domain and HTTP Listener and Weighted Routing

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
    sectionName: http-listener
  rules:
  - backendRefs:
    - name: \$APPNAME-\$VERSION1
      kind: Service
      port: 80
      weight: 100
    matches:
      - path:
          type: PathPrefix
          value: /
  - backendRefs:
    - name: \$APPNAME-\$VERSION1
      kind: Service
      port: 80
      weight: 50
    - name: \$APPNAME-\$VERSION2
      kind: Service
      port: 80
      weight: 50 
    matches:
      - path:
          type: PathPrefix
          value: /v2
EOF
```


## Create Template for HTTPRoute with Default Domain and HTTPS Listener

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

## Create Template for HTTPRoute with Custom Domain and HTTPS Listener

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
EOF
```


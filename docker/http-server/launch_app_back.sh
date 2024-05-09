#!/bin/sh
#cat /app/index.js.in | envsubst \$DEPLOY_REGION,\$APP_DOMAIN > /app/index.js

#Add our private CA in our trust store
if [ -n "$CA_ARN" ]; then
  aws acm-pca get-certificate-authority-certificate --certificate-authority-arn $CA_ARN --region $AWS_REGION --output text > /etc/pki/ca-trust/source/anchors/internal.pem
  update-ca-trust extract
fi

#node --use-openssl-ca /app/index.js

/bin/sh -c /app/http-servers
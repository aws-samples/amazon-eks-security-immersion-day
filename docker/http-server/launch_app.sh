#!/bin/sh

#Add our private CA in our trust store
if [ -n "$CA_ARN" ]; then
  aws acm-pca get-certificate-authority-certificate --certificate-authority-arn $CA_ARN --region $AWS_REGION --output text > /etc/pki/ca-trust/source/anchors/internal.pem
  update-ca-trust extract
fi

/bin/sh -c /app/http-servers
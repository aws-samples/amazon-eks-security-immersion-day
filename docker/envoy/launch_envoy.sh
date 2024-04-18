#!/bin/sh

# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

cat /etc/envoy/envoy.yaml.in | envsubst \$AWS_REGION,\$JWT_AUDIENCE,\$JWT_JWKS,\$JWT_ISSUER,\$JWKS_HOST,\$APP_DOMAIN > /etc/envoy/envoy.yaml
aws acm-pca get-certificate-authority-certificate --certificate-authority-arn $CA_ARN --region $AWS_REGION --output text > /etc/pki/ca-trust/source/anchors/internal.pem
update-ca-trust extract

cat /etc/envoy/envoy.yaml
/tmp/envoy --base-id 1 -l trace -c /etc/envoy/envoy.yaml

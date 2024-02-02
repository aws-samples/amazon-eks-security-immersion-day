---
title : "Exploring Bottlerocket Settings"
weight : 25
---

In this section of the workshop, you will explore [Bottlerocket settings](https://bottlerocket.dev/en/os/latest/#/api/settings-index/) using the `apiclient` in the `control` container. Any settings you can modify with `apiclient`, you can configure using EC2 [user data](https://github.com/bottlerocket-os/bottlerocket#using-user-data) in TOML format.

1. With Amazon EKS, Bottlerocket uses the aws-iam-authenticator to generate a token to authenticate to the API server and submit a CSR to the signing API.

```bash
apiclient get settings.kubernetes.authentication-mode
```

::::expand{header="Check Output"}
```
{
  "settings": {
    "kubernetes": {
      "authentication-mode": "aws"
    }
  }
}
```
::::

2. Kernel lockdown in integrity mode (recommended) limits an attacker’s ability to overwrite the kernel’s memory or modify its code. It also can prevent an attacker from loading unsigned kernel modules. Only kernel modules included in the Bottlerocket image can be loaded. In the k8s variants of Bottlerocket, kernel lockdown is set to `integrity` mode by default.

```bash
apiclient get settings.kernel.lockdown
```

::::expand{header="Check Output"}
```
{
  "settings": {
    "kernel": {
      "lockdown": "integrity"
    }
  }
}
```
::::

3. You can review the `motd` message in the settings.

```bash
apiclient get settings.motd
```

::::expand{header="Check Output"}
```
{
  "settings": {
    "motd": "Welcome to Bottlerocket!"
  }
}
```
::::

4. You can review all the current settings with one command.

```bash
apiclient get settings | jq
```

::::expand{header="Check Output"}
```
{
  "settings": {
    "autoscaling": {
      "should-wait": false
    },
    "aws": {
      "profile": "default",
      "region": "us-west-2"
    },
    "cloudformation": {
      "logical-resource-id": "",
      "should-signal": false,
      "stack-name": ""
    },
    "host-containers": {
      "admin": {
        "enabled": true,
        "source": "328549459982.dkr.ecr.us-west-2.amazonaws.com/bottlerocket-admin:v0.11.2",
        "superpowered": true,
        "user-data": "eyJzc2giOnsiYXV0aG9yaXplZC1rZXlzIjpbXX19"
      },
      "control": {
        "enabled": true,
        "source": "328549459982.dkr.ecr.us-west-2.amazonaws.com/bottlerocket-control:v0.7.6",
        "superpowered": false
      }
    },
    "kernel": {
      "lockdown": "integrity"
    },
    "kubernetes": {
      "api-server": "https://8F356254E58C9.gr7.us-west-2.eks.amazonaws.com",
      "authentication-mode": "aws",
      "cloud-provider": "external",
      "cluster-certificate": "LS0tLS1CRUdJRUJBUVVBQTRJQkR3QXdnZ0VLCkFvSUJBUURUVUxLVWFTYnpjb1NzQ1pzVDV3R3QzeHdXWkRQRFNlcmtKZUhPR1N3RXpjL0pmM2ZSbm4xNDRiTjAKVW84bXZxY2t5RUtNbytsRkdLMDd0U3Z0VVFUOGpLaWR3MzlFVWNyRFN2eE9mYmJkTUh1cjFSeXdxS3RBd3FYVwpEVDlDNmVoUnFvdDd3YURJRkUraUZCNGZjVDZkdlV0SzgyMnlCNis0NHdIazFQR2xjbTh0ZkdYbjdXaXEwQ2hDClZPVFlCYnkrWlZxNWUrelI2NFg4bGZxdW8wSEpvMGp4UDc4NzVKWVBEY2N2TklYYUV0UzdMRjN2WEYrZ29yRVYKZGo3YzUxdGh0Rk1hblB1cEplL0FOaXdJSUx5MmRqYVJpY3BhSi9DWU9wUTNOWWZMSSt3blFScTQzZ2VXQWZYaApkbWxXcU13alBLWC9pWUlLNHVEQytNdWM0VWFOQWdNQkFBR2pXVEJYTUE0R0ExVWREd0VCL3dRRUF3SUNwREFQCkJnTlZIUk1CQWY4RUJUQURBUUgvTUIwR0ExVWREZ1FXQkJUZlp5bHBGTTlPR1NZbWRmZTE3ZTZ0V3Bwc1pUQVYKQmdOVkhSRUVEakFNZ2dwcmRXSmxjbTVsZEdWek1BMEdDU3FHU0liM0RRRUJDd1VBQTRJQkFRQ3FYVFM3ckIxTgpxa1ZUK1BaWWtET1FpY1dhclNXSzY3TFpvSU1aeGkzVGNoTFVEdGFydmlxUjkvNXpqdzEvWHR2Qm1jZmZnSlYyCnVYSGZQcGlnUXdoSEYxQXorYXpveHpqR0xtbnkxa2V3akZ4aTBJMXo3eTl5ZkxtYlFiYkZuQk81Y1N0M05WZmUKSTM1a3V0NmtVSzJRYXk2WVNsbEpZMTRRbFg3VExpNkNmY0czRW1PQU4vZHpCMjNQVjFTemJUazNzQ1BQZUZsZApJZEFLV2xFZGVPenJDWGcvTDlZalFWUXdiTHpHaU8wcXV1L0JldFJheThhSlRrb3h4RjMyZ20zYjFubjRDeHdCCmNuZlZ2OUxKM3FYaERsSm5vQk1ucS85RXNQeExjTHZoUmpRYzlOUWY1THNMM2hGaVJHY3QvN0Y1YnN2akg0VXIKbWZSYURiT0E1OHVRCi0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K",
      "cluster-dns-ip": "172.20.0.10",
      "cluster-domain": "cluster.local",
      "cluster-name": "eksworkshop-eksctl",
      "credential-providers": {
        "ecr-credential-provider": {
          "cache-duration": "12h",
          "enabled": true,
          "environment": null,
          "image-patterns": [
            "*.dkr.ecr.*.amazonaws.com",
            "*.dkr.ecr.*.amazonaws.com.cn",
            "*.dkr.ecr-fips.*.amazonaws.com",
            "*.dkr.ecr.us-iso-east-1.c2s.ic.gov",
            "*.dkr.ecr.us-isob-east-1.sc2s.sgov.gov"
          ]
        }
      },
      "hostname-override": "ip-10-254-220-109.us-west-2.compute.internal",
      "max-pods": 8,
      "node-ip": "10.254.220.109",
      "node-labels": {
        "eks.amazonaws.com/capacityType": "ON_DEMAND",
        "eks.amazonaws.com/nodegroup": "mng-br",
        "eks.amazonaws.com/nodegroup-image": "ami-01053be6b7b982aac"
      },
      "pod-infra-container-image": "6024.dkr.ecr.us-west-2.amazonaws.com/eks/pause:3.1-eksbuild.1",
      "provider-id": "aws:///us-west-2c/i-0436d",
      "seccomp-default": false,
      "server-tls-bootstrap": true,
      "standalone-mode": false
    },
    "metrics": {
      "metrics-url": "https://metrics.bottlerocket.aws/v1/metrics",
      "send-metrics": true,
      "service-checks": [
        "apiserver",
        "chronyd",
        "containerd",
        "host-containerd",
        "kubelet"
      ]
    },
    "motd": "Welcome to Bottlerocket!",
    "network": {
      "hostname": "ip-10-254-220-109.us-west-2.compute.internal"
    },
    "ntp": {
      "time-servers": [
        "169.254.169.123",
        "2.amazon.pool.ntp.org"
      ]
    },
    "oci-defaults": {
      "capabilities": {
        "audit-write": true,
        "chown": true,
        "dac-override": true,
        "fowner": true,
        "fsetid": true,
        "kill": true,
        "mknod": true,
        "net-bind-service": true,
        "net-raw": true,
        "setfcap": true,
        "setgid": true,
        "setpcap": true,
        "setuid": true,
        "sys-chroot": true
      },
      "resource-limits": {
        "max-open-files": {
          "hard-limit": 1048576,
          "soft-limit": 65536
        }
      }
    },
    "oci-hooks": {
      "log4j-hotpatch-enabled": false
    },
    "updates": {
      "ignore-waves": false,
      "metadata-base-url": "https://updates.bottlerocket.aws/2020-07-07/aws-k8s-1.28/x86_64/",
      "seed": 1907,
      "targets-base-url": "https://updates.bottlerocket.aws/targets/",
      "version-lock": "latest"
    }
  }
}
```
::::

5. Exit out of the `control` container.

```bash
exit
```

6. You can check the Bottlerocket settings explicitly added through the EC2 user data in TOML format.

```bash
aws ec2 describe-instance-attribute --attribute userData --instance-id $INSTANCE_ID | jq -r .UserData.Value | base64 --decode
```

::::expand{header="Check Output"}
```
[settings.kubernetes]
"cluster-name" = "eksworkshop-eksctl"
"api-server" = "https://8F356254E58C9.gr7.us-west-2.eks.amazonaws.com"
"cluster-certificate" = "LS0tLS1CRUdJRUJBUVVBQTRJQkR3QXdnZ0VLCkFvSUJBUURUVUxLVWFTYnpjb1NzQ1pzVDV3R3QzeHdXWkRQRFNlcmtKZUhPR1N3RXpjL0pmM2ZSbm4xNDRiTjAKVW84bXZxY2t5RUtNbytsRkdLMDd0U3Z0VVFUOGpLaWR3MzlFVWNyRFN2eE9mYmJkTUh1cjFSeXdxS3RBd3FYVwpEVDlDNmVoUnFvdDd3YURJRkUraUZCNGZjVDZkdlV0SzgyMnlCNis0NHdIazFQR2xjbTh0ZkdYbjdXaXEwQ2hDClZPVFlCYnkrWlZxNWUrelI2NFg4bGZxdW8wSEpvMGp4UDc4NzVKWVBEY2N2TklYYUV0UzdMRjN2WEYrZ29yRVYKZGo3YzUxdGh0Rk1hblB1cEplL0FOaXdJSUx5MmRqYVJpY3BhSi9DWU9wUTNOWWZMSSt3blFScTQzZ2VXQWZYaApkbWxXcU13alBLWC9pWUlLNHVEQytNdWM0VWFOQWdNQkFBR2pXVEJYTUE0R0ExVWREd0VCL3dRRUF3SUNwREFQCkJnTlZIUk1CQWY4RUJUQURBUUgvTUIwR0ExVWREZ1FXQkJUZlp5bHBGTTlPR1NZbWRmZTE3ZTZ0V3Bwc1pUQVYKQmdOVkhSRUVEakFNZ2dwcmRXSmxjbTVsZEdWek1BMEdDU3FHU0liM0RRRUJDd1VBQTRJQkFRQ3FYVFM3ckIxTgpxa1ZUK1BaWWtET1FpY1dhclNXSzY3TFpvSU1aeGkzVGNoTFVEdGFydmlxUjkvNXpqdzEvWHR2Qm1jZmZnSlYyCnVYSGZQcGlnUXdoSEYxQXorYXpveHpqR0xtbnkxa2V3akZ4aTBJMXo3eTl5ZkxtYlFiYkZuQk81Y1N0M05WZmUKSTM1a3V0NmtVSzJRYXk2WVNsbEpZMTRRbFg3VExpNkNmY0czRW1PQU4vZHpCMjNQVjFTemJUazNzQ1BQZUZsZApJZEFLV2xFZGVPenJDWGcvTDlZalFWUXdiTHpHaU8wcXV1L0JldFJheThhSlRrb3h4RjMyZ20zYjFubjRDeHdCCmNuZlZ2OUxKM3FYaERsSm5vQk1ucS85RXNQeExjTHZoUmpRYzlOUWY1THNMM2hGaVJHY3QvN0Y1YnN2akg0VXIKbWZSYURiT0E1OHVRCi0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K"
"cluster-dns-ip" = "172.20.0.10"
"max-pods" = 8
[settings.kubernetes.node-labels]
"eks.amazonaws.com/nodegroup-image" = "ami-01053be6b7b982aac"
"eks.amazonaws.com/capacityType" = "ON_DEMAND"
"eks.amazonaws.com/nodegroup" = "mng-br"
```
::::

7. Scale-in Bottlerocket MNG to stop incurring EC2 costs for the instances.

```bash
eksctl scale nodegroup -c $CLUSTER_NAME -n $MNG_NAME -r $AWS_REGION --nodes 0
```

::::expand{header="Check Output"}
```
2023-12-22 06:37:38 [ℹ]  scaling nodegroup "mng-br" in cluster eksworkshop-eksctl
2023-12-22 06:37:38 [ℹ]  initiated scaling of nodegroup
2023-12-22 06:37:38 [ℹ]  to see the status of the scaling run `eksctl get nodegroup --cluster eksworkshop-eksctl --region us-west-2 --name mng-br`
```
::::

8. Remove bootstrap container images from the Cloud9 workspace and ECR repository.

```bash
docker rmi $ECR_REPO:v1

docker rmi $ECR_REPO_URI:v1

aws ecr delete-repository \
  --repository-name $ECR_REPO \
  --region $AWS_REGION \
  --force
```

::::expand{header="Check Output"}
```
Untagged: br-bootstrap:v1
```
```
Untagged: ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/br-bootstrap:v1
Untagged: ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/br-bootstrap@sha256:181647d18932ca46cc43d28f8370d5edd33310d36581b1238446aea1dd14c29f
Deleted: sha256:a218d96b68a700634ba56ff59a6804f7d27a60cfd84bf1165d27308f3ff8fe50
Deleted: sha256:b62bdeb62519576453790af00ad50e815c764951d046d7feecb543ffa262e0a9
Deleted: sha256:d0ed8a17adaedc901e99f37f51bdef642f49809b52f78c03839fab352925d68a
Deleted: sha256:89442bfc5268678cfd01d045fa7bbb87c71ce48f436c301526390e972b651ba6
Deleted: sha256:645b5b6df6018d94a33f62ecca02b581f3f0ec7c65e95e68b0ba3b33fa08a34e
```
```
{
    "repository": {
        "repositoryArn": "arn:aws:ecr:us-west-2:ACCOUNT_ID:repository/br-bootstrap",
        "registryId": "ACCOUNT_ID",
        "repositoryName": "br-bootstrap",
        "repositoryUri": "ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/br-bootstrap",
        "createdAt": "2024-02-02T03:14:11.624000+00:00",
        "imageTagMutability": "IMMUTABLE"
    }
}
```
::::

---
title : "Lab: Amazon EKS  Pod Security"
weight : 53
---

# Introduction

The following hands-on lab is based on the Amazon EKS testing done with PSA and PSS. This testing can be reviewed in the [AWS Samples OSS project on GitHub](https://github.com/aws-samples/k8s-psa-pss-testing).

## Lab assumptions

Amazon EKS 1.23 (or later version) is provisioned and `kubectl` CLI is installed and connected to the cluster

## Steps

1. Clone the GitHub repo: https://github.com/aws-samples/k8s-psa-pss-testing

2. Review the [Testing Summary](https://github.com/aws-samples/k8s-psa-pss-testing#testing-summary), [Testing Outcomes](https://github.com/aws-samples/k8s-psa-pss-testing#testing-outcomes), [Testing Assumptions](https://github.com/aws-samples/k8s-psa-pss-testing#testing-assumptions), and [Testing Setup and Execution](https://github.com/aws-samples/k8s-psa-pss-testing#testing-setup-and-execution) before getting started.

3. Change directory into the [tests](https://github.com/aws-samples/k8s-psa-pss-testing/tree/main/tests) directory.

4. Modify the `policy-test` Kubernetes Namespace in the `0-ns.yaml` file to set the desired PSA mode and PSS profile settings.

5. Execute the `tests.sh` script to apply the Kubernetes resources. The outcomes of the tests should match the README.md file.

> Use the [Testing Scenarios](https://github.com/aws-samples/k8s-psa-pss-testing#testing-scenarios) to guide your testing.

6. Between each test run, execute the `clean.sh` script to delete the resources created by the `tests.sh` script.

7. Change the `policy-test` Namespace settings and run the next test scenario.

> __Note:__ If you have time and are so inclined, feel free to mix PSA modes and PSS profiles to go beyond the documented test scenarios.

# Summary

PSA and PSS are the native Kubernetes replacement for PSP; moreover, PSA and PSS can coexist with PSP in the same cluster, to facilitate PSP replacement. Testing of PSA and PSS with Amazon EKS 1.23 is documented in this [AWS Samples OSS project](https://github.com/aws-samples/k8s-psa-pss-testing).

The default configurations of PSA and PSS are part of Amazon EKS 1.23+, and Kubernetes Namespaces can be configured with labels to opt into Pod security defined by PSS and implemented by PSA. With appropriate policies you can successfully replace PSP.


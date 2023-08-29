---
title : "Solution Architecture - DevSecOps piepline pushing containers to EKS"
weight : 21
---

1. Navigate to the [Amazon Inspector console](https://console.aws.amazon.com/inspector/v2/home).
2. Select **Get Started**, then select **Enable Inspector**.
3. To configure **Enhanced Scanning** with ECR, navigate to ECR console.
4. Select **Private registry** from the left navigation panel, then select **Edit** in the **Scanning configuration** section.
5. Select **Enhanced scanning** for **Scan type**.
6. Under `Continuous scanning filters`, enter **monolith-service** in the textbox and click on `Add filter`. Ensure the checkbox **Continuously scan all repositories** is unselected.
7. Under `Scan on push filters`, enter **monolith-service** in the textbox and click on `Add filter`. Ensure the checkbox **Scan on push all repositories** is unselected.
8. Select **Save**.


### Enhanced scanning

Enhanced scanning is a capability offered with Amazon Inspector which provides automated continuous scanning. Inspector identifies vulnerabilities in both operating system and programming language (such as Python, Java, Ruby etc.) packages in real time.

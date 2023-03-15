---
title : "Centralized View on Vulnerabilities with AWS Security Hub"
weight : 23
---

So far you have been able to capture vulnerabilities from  containers using Amazon ECR and Amazon Inspector.

Without an automated process to gain the visibility into the vulnerability landscape in your environment, it is also tedious to hop between services to target a single challenge.

This is where AWS Security Hub comes in.

## AWS Security Hub

![sechub](/static/images/image-security/manage-image-cve-with-inspector/sechub.png)

As the name suggests, AWS Security Hub provides you a centralized hub with a comprehensive view of your security state in AWS and helps you check your environment against security industry standards and best practices.

Security Hub natively integrates with [AWS security services](https://aws.amazon.com/products/security/) as well as third-party partner products and helps you analyze your security trends and identify the highest priority security issues.

For this workshop, you will enable integration with Patch Manager and Inspector.

1. Navigate to the [Security Hub console](https://console.aws.amazon.com/securityhub/home)
2. Select **Go to Security Hub**. For **Enable AWS Security Hub**, select **Enable Security Hub**.
3. Use the left hand navigation panel to select **Integrations**. You will notice that **Amazon: Inspector** integrations is enabled by default.
4. With Security Hub just turned on, the Security score, passed and failed checks counts, and graphs may not show data yet. It can take up to 24 hours for all of this to populate after turning the service on.
5. Once the findings are populated, you can create insights by using the **Product name** filter.
6. Select **Insights** from the left hand navigation panel. Then select **Create insight**.
7. Remove the existing filters, use the **Product name** filter from the **Add filter** dropdown. Keep the comparison operator as default (**is**). Type **Inspector** for the filter. Click **Apply**.
![create-insights](/static/images/image-security/manage-image-cve-with-inspector/create-insights.png)
8. To create an insight, you **must** choose how your findings are grouped by using the 'Group by' filter. Choose **Severity label** for the **Group by** filter. Select **Create insight**.
![create-insights-2](/static/images/image-security/manage-image-cve-with-inspector/create-insights-2.png)
9.  Type in the **Insight** for `Insight name` and select **Create insight**.
10.  You can view the custom insight in the insights console.

![custom-insight](/static/images/image-security/manage-image-cve-with-inspector/custom-insight.png)

11. The insight has 2 components parts. Under the filters section, you will see a summary of the findings based on the filters.

![insight-details](/static/images/image-security/manage-image-cve-with-inspector/insight-details.png)

13. On the right hand panel, you will see analysis and distribution based on Severity label, AWS account ID, Resource type, Resource ID and Product name.

![insight2](/static/images/image-security/manage-image-cve-with-inspector/insight2.png)





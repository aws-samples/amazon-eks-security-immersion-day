---
title : "Multi Cluster VPC Lattice Use cases"
weight : 14
---

In this section, we will execute the following modules. It is recommended to execute these modules in the same order mentioned.

Now that we have see how to work with HTTPS on Custom Domain and integrating with IAM Auth Access Controls, we are going to use this setup as a baseline for next modules.

1. [**Deploy AWS Gateway API Controller and Gateway Resource**](1-deploy-gw-api-controller)
2. [**Usecase 5: Service Connectivity from Cluster1 to Cluster2**](2-service-connect-from-cluster1-to-cluster2)
3. [**Usecase 6: Service Connectivity from Cluster2 to Cluster1**](3-service-connect-from-cluster2-to-cluster1)
4. [**Usecase 7: Spread a same service onto the 2 different clusters (using serviceImport/serviceExport)**](4-export-import-services)

Use Case 6 show cross-cluster connectivity in HTTPS + IAM auth on custom domain names.

![](/static/images/6-network-security/2-vpc-lattice-service-access/lattice-usecase6.png)
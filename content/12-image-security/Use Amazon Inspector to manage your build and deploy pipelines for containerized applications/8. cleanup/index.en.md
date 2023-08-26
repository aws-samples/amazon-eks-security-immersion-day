---
title : "Cleanup"
weight : 29
---

You created a few resources for this workshop. If you are participating in an AWS hosted event, then you don't need to clean up anything. The temporary accounts will get deleted after the workshop.

If are running this workshop in your own account, you would need to follow the below steps to cleanup the environment you set up for the workshop.

1. Amazon Inspector:
    Navigate to the Amazon Inspector console, select **Settings**, then **General**. For **Deactivate Amazon Inspector**, select **Deactivate Inspector**. In the confirmation prompt, type **deactivate** then select **Deactivate Inspector**.
2. Amazon ECR container repository:
    Navigate to the Amazon ECR console, select **Repositories**, and then select the **monolith-service**. Select **Delete**. In the confirmation prompt, type **delete** then select **Delete**.
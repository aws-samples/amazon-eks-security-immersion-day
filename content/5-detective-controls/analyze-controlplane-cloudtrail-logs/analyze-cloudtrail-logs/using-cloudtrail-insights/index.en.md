---
title : "Using AWS CloudTrail Insights"
weight : 23
---

We'll take a look at some [AWS CloudTrail Insights](https://console.aws.amazon.com/cloudtrail/home#/insights) from the AWS Console. 

### Scenario : Let's unearth suspecious/unusual activitiy

::alert[To generate high volume of Traffic, I have scaled managed nodes]


![Insights Data](/static/images/detective-controls/log-insights/cloudtrail-insights-errors.png)

Quickly scanning the list of CloudTrail Insights, we can find multiple events with high API rate.  

Let's click on "CreateNetworkInterface" to see more details.

![High API Data](/static/images/detective-controls/log-insights/cloudtrail-insights-2.png)


You can see the high API rate between 2PM to 4PM. 

Explore "CloudTrail events" tab & "Insights event record". 

![CloudTrail Events Data](/static/images/detective-controls/log-insights/cloudtrail-insights-3.png)

![CloudTrail Insights event Record](/static/images/detective-controls/log-insights/cloudtrail-insights-4.png)

The provided information offers a clear understanding of the reasons behind the elevated call volume and the underlying factors contributing to it.

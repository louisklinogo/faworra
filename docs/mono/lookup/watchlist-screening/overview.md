---
title: "Watchlist Screening"
source_url: "https://docs.mono.co/docs/lookup/watchlist-screening/overview"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Screen individuals and businesses against sanctions, PEP, and watchlist datasets using Mono Watchlist Screening."
---# Watchlist Screening

Last updated March 24th, 2026

## Overview

Mono Watchlist Screening is a Lookup feature designed to help businesses identify potential compliance risks when onboarding individuals and companies. It enables automated screening against global and local watchlists, including sanctions lists, politically exposed persons (PEPs), and other high-risk datasets.

Screening can be performed in real-time or in batches, with results including match status, risk level, match score, and detailed explanations. The system also supports continuous monitoring, allowing businesses to receive alerts if a previously screened entity is later flagged.

To use Watchlist Screening, partners must have access to Lookup and integrate with the Watchlist Screening APIs.

## Why Use Watchlist Screening?

1.  **Compliance Readiness:** Meet regulatory requirements by screening customers against global sanctions lists, PEP databases, and adverse media during onboarding.

2.  **Risk Mitigation:** Detect high-risk individuals and entities before account creation, reducing exposure to fraud, money laundering, and reputational damage.

3.  **Continuous Monitoring:** Start recurring checks on previously screened profiles to stay informed about changes in risk status over time.

4.  **Audit Trail:** Maintain comprehensive records of all screening activities for compliance reviews, investigations, and regulatory audits.

5.  **Automated Workflow:** Integrate seamlessly into your onboarding flow with webhooks and polling endpoints for real-time status updates.


## Features

**1\. Multi-Dataset Screening**

Screen against multiple global and local risk datasets in a single API call.

-   **Sanctions Lists:** Screen against OFAC, EU, UN, and local regulatory sanctions.
-   **PEP Databases:** Identify politically exposed persons across global and regional lists.
-   **Adverse Media:** Flag individuals with negative press coverage or criminal records.
-   **Custom Watchlists:** Support for entity-specific and industry-specific risk lists.

**2\. Individual and Entity Screening**

Comprehensive screening coverage for both personal and corporate profiles.

-   **Individual Screening:** Screen using name, date of birth, gender, BVN, and country.
-   **Entity Screening:** Screen companies using name, address, and country of operation.

**3\. Batch Screening**

Screen multiple individuals or entities in a single API call.

-   **Bulk Operations:** Process hundreds of screenings simultaneously.
-   **Efficiency:** Improve operational efficiency for large-scale onboarding.

**4\. Risk Scoring and Match Analysis**

Get actionable insights from screening results with detailed match analysis.

-   **Match Score:** Numerical confidence score indicating the strength of a match.
-   **Risk Level:** Categorical risk classification (low, medium, high).
-   **Matched Fields:** Detailed breakdown of which input fields matched risk records.
-   **Risk Reason:** Clear explanation of why a match was flagged.

**5\. Continuous Monitoring**

Set up ongoing monitoring to track previously screened subjects for future risk changes.

-   **Recurring Checks:** Automatically re-screen monitored profiles on a schedule.
-   **Real-time Alerts:** Receive webhooks when a monitored subject's risk status changes.
-   **Stop/Start Anytime:** Control monitoring lifecycle with simple API calls.

**6\. Audit Logging**

Maintain comprehensive records of all screening activities for compliance and investigative purposes.

-   **Event Timestamps:** Track when each screening lifecycle event occurred.
-   **Event Types:** Record match found, match updated, and screening created events.
-   **Searchable Records:** Easily retrieve audit logs by screening ID.

**7\. Screening Reports**

Generate downloadable PDF reports for compliance reviews and regulatory submissions.

-   **Executive Summary:** High-level risk assessment for stakeholders.
-   **Detailed Match Analysis:** In-depth breakdown of all matched records.
-   **Source Documentation:** Reference to the datasets that flagged each match.

## Use Cases

Watchlist Screening is designed for businesses that need to meet compliance requirements and reduce risk during onboarding and ongoing customer relationships.

-   **Customer Onboarding (KYC/KYB):** Screen individuals or companies during onboarding to ensure they are not on sanctions lists or flagged as high-risk entities.

-   **Compliance & AML Checks:** Meet regulatory requirements by performing mandatory AML checks against global and local watchlists.

-   **Ongoing Monitoring:** Continuously monitor customers and receive alerts if their risk status changes over time.

-   **Batch Screening:** Screen multiple users or entities at once to improve operational efficiency.


## Pricing

Pricing is charged per successful screening or active monitored subject.

<table class="w-full space-y-2.5 border-separate border-spacing-y-2.5 my-5 first:mt-0"><tbody class="[&amp;:first-child_tr]:bg-gray-100 [&amp;:first-child_tr]:font-medium"><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">Feature</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">Cost</td></tr></tbody><tbody class="[&amp;:first-child_tr]:bg-gray-100 [&amp;:first-child_tr]:font-medium"><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">Screening</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">NGN 1,000</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">Monitoring</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">NGN 5,000 / month per subject</td></tr></tbody></table>

## Frequently Asked Questions

##### What is Watchlist Screening?

It is a feature that allows businesses to check individuals or companies against sanctions lists, PEP databases, and other risk datasets.

##### Can I screen multiple users at once?

Yes, batch screening is supported.

##### How do I get notified of matches?

Webhooks are sent when screening is completed or when a monitored subject is flagged.

##### Does it support ongoing monitoring?

Yes, businesses can enable monitoring to receive alerts on future risk changes.

##### What kind of results are returned?

Results include match status, risk level, match score, explanation, and optional PDF reports.

#### On this page

Overview

Why Use Watchlist

Features

use cases

Pricing

FAQs

---
title: "Overview"
source_url: "https://docs.mono.co/docs/financial-data/enrichment/overview"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Enhance raw financial data with transaction categorization, merchant metadata, and account insights using Mono's enrichment APIs."
---# Overview

Last updated June 7th, 2024

### Introduction

Our data enrichment APIs are designed to empower you with deeper financial insights into your customers' financial accounts. Through functionalities such as transaction categorization, metadata addition, and statement insights generation, these APIs offer valuable tools to enhance financial decision-making and streamline processes.

![Prerequisites](/images/callout/bulb.png)

Prerequisites

Before you begin to use the Data Enrichment APIs, make sure to complete the following essential steps:

-   [Create an App](/docs/create-app) with the product scope set to `connect` and fetch the generated secret key.
-   [Configure a Webhook URL](/docs/webhooks) to receive real-time updates.

### Data Enrichment Features

The three API features under the Data Enrichment product are explained as follows:

##### 1\. Transaction Categorisation

The Transaction Categorisation API enables automatic categorization of financial transactions. By analyzing transaction data, this API assigns categories such as groceries, utilities, or entertainment to each transaction, making it easier for users to track and manage their spending.

##### 2.Transaction Metadata

The Transaction Metadata API enriches transactions with additional details, providing a more comprehensive view of each financial activity. This can include merchant information, geographical data, and transaction types.

##### 3.Statement Insights

The Statement Insights API analyzes all transactions linked to a provided account ID and generates insightful summaries. This includes balance summaries, transaction patterns, and unusual activity detection, which are sent to users via webhook.

### Key Benefits:

-   **Improved Financial Insights:** Gain a deeper understanding of financial transactions through categorization and metadata.

-   **Enhanced Decision-Making:** Use enriched data to make informed financial decisions.

-   **Streamlined Processes:** Automate the analysis and categorization of financial data for efficiency.


### Common Validations

-   When your business status is blocked, disabled or does not have connect enabled, the error below is sent:

### Request

123456

```js
{
    "status": "failed",
    "message": "Your Business is not authorized to access this endpoint, kindly contact support.",
    "timestamp": "2024-07-10T11:44:23.606Z",
    "data": null
}
```

-   When your Mono Dashboard app product is not connect, the error below is sent:

### Request

123456

```js
{
    "status": "failed",
    "message": "Unauthorized key. Enable the app for Mono Connect or contact support.",
    "timestamp": "2024-07-10T11:44:23.606Z",
    "data": null
}
```

#### On this page

overview

prerequisites

features

key benefits

common validations

---
title: "Watchlist Screening Integration Guide"
source_url: "https://docs.mono.co/docs/lookup/watchlist-screening/integration-guide"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Step-by-step guide to integrate Mono Watchlist Screening into your compliance workflow."
---# Watchlist Screening Integration Guide

Last updated March 24th, 2026

## Overview

This guide walks you through the steps to integrate watchlist screening into your compliance workflow. Mono Watchlist Screening helps you screen individuals and entities against sanctions lists, politically exposed persons (PEPs), and other risk datasets as part of onboarding and ongoing compliance workflows.

![Prerequisites](/images/callout/bulb.png)

Prerequisites

To get started, you need to:

-   Sign up on the [Partner Dashboard](https://app.mono.co/signup) and complete KYB.
-   [Create an app](/docs/create-app) with the `lookup` scope and retrieve your Secret key.
-   Configure a [webhook URL](/docs/webhooks) in your dashboard to receive event notifications.

![Request Headers](/images/callout/bulb.png)

Request Headers

Include the following header in every request:

-   `mono-sec-key` (required): `live_sk_xxxxxxxxxxxxxxxxxxxx`

## Process Flow Summary

1.  **Partner submits a screening request** - Providing required details for an individual or entity.

2.  **Mono processes the screening** - The system checks the input against multiple watchlists and datasets.

3.  **A screening result is generated** - Including a status, a match score, a flag indicating whether a match was found, a risk level, and a risk reason.

4.  **Result retrieval**: Partner fetches detailed screening results via API or a PDF format.

5.  **Webhook notification** - Sent when screening is completed or if a match is found.

6.  **Monitoring (optional)** - Partner enables ongoing monitoring to track future changes in risk status.


## API Integration Steps

With the prerequisite steps already completed, the typical Watchlist Screening workflow has five stages:

-   Step 1: Submit a screening request
-   Step 2: Poll the screening result endpoint until processing completes
-   Step 3: Start monitoring for subjects that need ongoing checks
-   Step 4: Handle webhook events for asynchronous updates

## Workflow

### Step 1: Submit a Screening Request

Initiate screening by sending a POST request with either an individual or entity payload.

![Batch Screening](/images/callout/bulb.png)

Batch Screening

Need to screen multiple subjects at once? Use [Batch Screening](/api/watchlist/batch-screening) to submit multiple screening requests in a single API call.

### Request

12345678910111213

```js
curl --request POST \
  --url https://api.withmono.com/v3/lookup/watchlist \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --header 'mono-sec-key: YOUR_MONO_SECRET_KEY' \
  --data '{
    "type": "individual",
    "name": "Amina Kolade",
    "date_of_birth": "1941-08-17",
    "gender": "female",
    "bvn": "22300000000",
    "country": "ng"
  }'
```

##### Individual payload

### Request

12345678

```js
{
  "type": "individual",
  "name": "Amina Kolade",
  "date_of_birth": "1941-08-17",
  "gender": "female",
  "bvn": "22300000000",
  "country": "ng"
}
```

##### Entity payload

### Request

123456

```js
{
  "type": "entity",
  "name": "Rosneft",
  "address": "russia",
  "country": "ru"
}
```

##### Response

### Request

123456789

```js
{
  "status": "successful",
  "message": "Request completed successfully",
  "timestamp": "2026-03-24T10:43:39.831Z",
  "data": {
    "id": "aml_scr_16934a4a4ea2bba9a7855b7f3f74714b",
    "status": "processing"
  }
}
```

### Step 2: Poll for Results

Poll the screening status endpoint until the record moves from `processing` to `completed`.

### Request

1234

```js
curl --request GET \
  --url https://api.withmono.com/v3/lookup/watchlist/{id} \
  --header 'accept: application/json' \
  --header 'mono-sec-key: YOUR_MONO_SECRET_KEY'
```

##### Completed Response

### Request

1234567891011121314151617181920212223

```js
{
  "status": "successful",
  "message": "Request completed successfully",
  "timestamp": "2026-03-24T10:45:09.969Z",
  "data": {
    "id": "aml_scr_3f3a3683dec3b895914ad2b6c953a002",
    "status": "completed",
    "type": "individual",
    "match_found": true,
    "match_score": 57.5,
    "risk_level": "high",
    "risk_reason": "Match found on EU SANCTIONS,NIBSS",
    "report_url": null,
    "matched_fields": [
      {
        "input_field": "name",
        "input_value": "Amina Kolade",
        "matched_value": "Amina Kolade",
        "confidence_score": 100
      }
    ]
  }
}
```

##### Processing Response

### Request

12345678910

```js
{
  "status": "successful",
  "message": "Watchlist screening is still processing, please try again later",
  "timestamp": "2026-03-24T10:45:14.631Z",
  "data": {
    "id": "aml_scr_c957dbe8cc42a663abfadc085d2a8f08",
    "status": "processing",
    "message": "Watchlist screening is still processing, please try again later"
  }
}
```

### Step 3: Start Monitoring (Optional)

Set up ongoing monitoring to track future changes in risk status for previously screened subjects.

### Request

123456789101112

```js
curl --request POST \
  --url https://api.withmono.com/v3/lookup/watchlist/monitor \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --header 'mono-sec-key: YOUR_MONO_SECRET_KEY' \
  --data '{
    "type": "individual",
    "name": "Tariq Bassey",
    "date_of_birth": "1941-08-17",
    "gender": "male",
    "country": "ng"
  }'
```

##### Response

### Request

123456789

```js
{
  "status": "successful",
  "message": "Request completed successfully",
  "timestamp": "2026-03-24T10:45:02.273Z",
  "data": {
    "id": "aml_scr_c957dbe8cc42a663abfadc085d2a8f08",
    "status": "successful"
  }
}
```

To stop monitoring, send a DELETE request to `https://api.withmono.com/v3/lookup/watchlist/monitor/{id}`.

### Step 4: Handle Webhook Events

Configure a webhook endpoint so your application can react to completed screenings, failed attempts, match updates, and monitoring events without constant polling.

The main events emitted by Watchlist Screening include:

-   `mono.events.watchlist.screening_created`
-   `mono.events.watchlist.match_found`
-   `mono.events.watchlist.match_not_found`
-   `mono.events.watchlist.match_updated`
-   `mono.events.watchlist.attempt_failed`
-   `mono.events.watchlist.attempt_completed`
-   `mono.events.watchlist.monitoring_created`
-   `mono.events.watchlist.monitoring_completed`

Use the screening `id` included in the webhook payload to fetch the latest screening details from the result endpoint when you need the full decision payload.

![Webhook Setup](/images/callout/bulb.png)

Webhook Setup

See the [Webhook Events](/docs/lookup/watchlist-screening/webhook-events) page for the full event list, payload examples, and webhook handling guidance.

## Resources

[Submit Screening](/api/watchlist/submit-screening)

[Batch Screening](/api/watchlist/batch-screening)

[Get Screening Result](/api/watchlist/get-screening-result)

[Get Audit Log](/api/watchlist/get-audit-log)

[Start Monitoring](/api/watchlist/start-monitoring)

[Stop Monitoring](/api/watchlist/stop-monitoring)

[Get Screening Report](/api/watchlist/get-screening-report)

[Webhook Events](/docs/lookup/watchlist-screening/webhook-events)

#### On this page

Overview

Authentication and Environment

Process Flow

API Integration Steps

step 1 submit screening request

Step 2 poll for results

Step 3 monitoring

Step 4 handle webhooks

Resources

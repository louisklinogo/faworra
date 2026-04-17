---
title: "Watchlist Screening Webhook Events"
source_url: "https://docs.mono.co/docs/lookup/watchlist-screening/webhook-events"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Complete reference for all webhook events emitted by Mono Watchlist Screening."
---# Watchlist Screening Webhook Events

Last updated March 24th, 2026

## Overview

Mono Watchlist Screening sends webhook notifications to your configured endpoint when screening events occur. This enables you to react to completed screenings, monitoring changes, and failed attempts in real time.

![Prerequisites](/images/callout/bulb.png)

Prerequisites

Before you begin receiving webhooks, you must:

-   Configure a POST webhook endpoint on your server.
-   Add the webhook URL in the Mono dashboard for your app.
-   Return a `2xx` response after successfully processing each event.

![Security](/images/callout/bulb.png)

Security

Validate every webhook request with your webhook secret before processing the payload. See the [Webhook Setup Guide](/docs/webhooks) for the recommended verification flow.

## Webhook Event Types

<table class="w-full space-y-2.5 border-separate border-spacing-y-2.5 my-5 first:mt-0"><tbody class="[&amp;:first-child_tr]:bg-gray-100 [&amp;:first-child_tr]:font-medium"><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><strong>Event</strong></td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">Description</td></tr></tbody><tbody class="[&amp;:first-child_tr]:bg-gray-100 [&amp;:first-child_tr]:font-medium"><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">mono.events.watchlist.screening_created</code></td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">Screening request was created</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">mono.events.watchlist.match_found</code></td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">A risk match was identified during screening</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">mono.events.watchlist.match_not_found</code></td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">No risk matches found during screening</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">mono.events.watchlist.match_updated</code></td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">Risk status changed for a monitored subject</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">mono.events.watchlist.monitoring_created</code></td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">Monitoring was successfully created</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">mono.events.watchlist.monitoring_completed</code></td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">Monitoring was stopped or completed</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">mono.events.watchlist.attempt_failed</code></td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">An error occurred while processing the screening</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">mono.events.watchlist.attempt_completed</code></td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">Screening attempt completed</td></tr></tbody></table>

#### Screening Created

Sent when a new screening request is created.

### Request

123456789101112131415161718

```js
{
  "event": "mono.events.watchlist.screening_created",
  "data": {
    "id": "aml_scr_9c64b7937f92c96873825371db06a61d",
    "type": "individual",
    "profile": {
      "type": "individual",
      "name": "Chukwuma Adamu",
      "date_of_birth": "1941-08-17",
      "bvn": "22123412341",
      "gender": "male",
      "address": "12 Admiralty Way, Lekki",
      "country": "ng"
    }
  },
  "app": "6103e431826f2a228d448874",
  "business": "60cc8f95ba1772018c5c6b1d"
}
```

#### Match Found

Sent when a risk match is identified during screening.

### Request

1234567891011121314151617181920

```js
{
  "event": "mono.events.watchlist.match_found",
  "data": {
    "match_found": true,
    "action": "Make a call to the screening result endpoint for more details",
    "id": "aml_scr_9c64b7937f92c96873825371db06a61d",
    "type": "individual",
    "profile": {
      "type": "individual",
      "name": "Chukwuma Adamu",
      "date_of_birth": "1941-08-17",
      "bvn": "22123412341",
      "gender": "male",
      "address": "12 Admiralty Way, Lekki",
      "country": "ng"
    }
  },
  "app": "6103e431826f2a228d448874",
  "business": "60cc8f95ba1772018c5c6b1d"
}
```

#### Match Not Found

Sent when no risk matches are found during screening.

### Request

1234567891011121314151617181920

```js
{
  "event": "mono.events.watchlist.match_not_found",
  "data": {
    "match_found": false,
    "action": "",
    "id": "aml_scr_9c64b7937f92c96873825371db06a61d",
    "type": "individual",
    "profile": {
      "type": "individual",
      "name": "Chukwuma Adamu",
      "date_of_birth": "1941-08-17",
      "bvn": "22123412341",
      "gender": "male",
      "address": "12 Admiralty Way, Lekki",
      "country": "ng"
    }
  },
  "app": "6103e431826f2a228d448874",
  "business": "60cc8f95ba1772018c5c6b1d"
}
```

#### Match Updated

Sent when the risk status changes for a monitored subject.

### Request

1234567891011121314151617181920

```js
{
  "event": "mono.events.watchlist.match_updated",
  "data": {
    "match_found": true,
    "action": "Make a call to the screening result endpoint for more details",
    "id": "aml_scr_9c64b7937f92c96873825371db06a61d",
    "type": "individual",
    "profile": {
      "type": "individual",
      "name": "Chukwuma Adamu",
      "date_of_birth": "1941-08-17",
      "bvn": "22123412341",
      "gender": "male",
      "address": "12 Admiralty Way, Lekki",
      "country": "ng"
    }
  },
  "app": "6103e431826f2a228d448874",
  "business": "60cc8f95ba1772018c5c6b1d"
}
```

#### Monitoring Created

Sent when monitoring is successfully created for a subject.

### Request

123456789101112131415161718

```js
{
  "event": "mono.events.watchlist.monitoring_created",
  "data": {
    "id": "aml_scr_9c64b7937f92c96873825371db06a61d",
    "type": "individual",
    "profile": {
      "type": "individual",
      "name": "Chukwuma Adamu",
      "date_of_birth": "1941-08-17",
      "bvn": "22123412341",
      "gender": "male",
      "address": "12 Admiralty Way, Lekki",
      "country": "ng"
    }
  },
  "app": "6103e431826f2a228d448874",
  "business": "60cc8f95ba1772018c5c6b1d"
}
```

#### Monitoring Completed

Sent when monitoring is stopped or completes.

### Request

123456789101112131415161718

```js
{
  "event": "mono.events.watchlist.monitoring_completed",
  "data": {
    "id": "aml_scr_9c64b7937f92c96873825371db06a61d",
    "type": "individual",
    "profile": {
      "type": "individual",
      "name": "Chukwuma Adamu",
      "date_of_birth": "1941-08-17",
      "bvn": "22123412341",
      "gender": "male",
      "address": "12 Admiralty Way, Lekki",
      "country": "ng"
    }
  },
  "app": "6103e431826f2a228d448874",
  "business": "60cc8f95ba1772018c5c6b1d"
}
```

#### Attempt Failed

Sent when an error occurs while processing the screening.

### Request

12345678910

```js
{
  "event": "mono.events.watchlist.attempt_failed",
  "data": {
    "id": "aml_scr_9c64b7937f92c96873825371db06a61d",
    "type": "individual",
    "reason": "An error occurred while fetching identity"
  },
  "app": "6103e431826f2a228d448874",
  "business": "60cc8f95ba1772018c5c6b1d"
}
```

#### Attempt Completed

Sent when a screening attempt completes.

### Request

12345678910111213

```js
{
  "event": "mono.events.watchlist.attempt_completed",
  "data": {
    "id": "aml_scr_9c64b7937f92c96873825371db06a61d",
    "type": "individual",
    "match_found": true,
    "match_score": 100,
    "risk_level": "low",
    "report_url": "https://abc.com"
  },
  "app": "6103e431826f2a228d448874",
  "business": "60cc8f95ba1772018c5c6b1d"
}
```

#### On this page

Overview

Prerequisites

Security

Webhook Event Types

Screening Events

Monitoring Events

Attempt Events

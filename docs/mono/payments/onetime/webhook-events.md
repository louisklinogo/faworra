---
title: "Webhook Events"
source_url: "https://docs.mono.co/docs/payments/onetime/webhook-events"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Real-time notification reference for successful, failed, and cancelled one-time payment events."
---# Webhook Events

Last updated January 8th, 2026

### Overview

Our DirectPay webhook events are fired based on the following triggers:

1.  Successful payment webhook event
2.  Failed payment webhook event
3.  Abandoned payment webhook event
4.  Cancelled payment webhook event

### Webhook Triggers

1

Successful Payment Webhooks

After a successful payment, two webhook events will be sent:

1.  Account connected event.
2.  Payment successful event.

#### Account Connected event (mono.events.account\_connected)

Using the Account ID here, you can fetch the customer details like Name, BVN, Account Number, and much more via our [Information API](https://mono.co).

### Request

123456

```js
{
  "event": "mono.events.account_connected",
  "data": {
    "id": "611d575feef5d3371ca9d0d8"
  }
}
```

#### Payment Successful event (direct\_debit.payment\_successful)

With the reference here, you can verify the status of a one-time payment using the [Verify payment status API.](https://mono.co)

direct\_debit.payment\_successful

### Request

123456789101112131415161718192021222324252627282930313233343536373839404142434445464748495051525354

```js
{
  "event": "direct_debit.payment_successful",
  "event_id": "PsmZW6jiY6vDuDHeFmvsiJudamnPHuKhAKyoMFPznWs",
  "timestamp": "2026-01-07T10:10:50.186Z",
  "data": {
    "type": "onetime-debit",
    "object": {
      "_id": "65aa7939564a694c67789012",
      "id": "txd_wzb8uhew4j9ngru43a123456",
      "status": "successful",
      "message": "Payment was successful",
      "description": "new payment",
      "amount": 20000,
      "fee": 6100,
      "currency": "NGN",
      "liveMode": true,
      "account": {
        "status": "AVAILABLE",
        "linked": true,
        "_id": "65aa7935564a694c67123456",
        "name": "SAMUEL OLAMIDE",
        "accountNumber": "0123456789",
        "currency": "NGN",
        "balance": 50000,
        "type": "SAVINGS ACCOUNT",
        "bvn": null,
        "authMethod": "mobile_banking",
        "liveMode": true,
        "app": "61e3798cbbe2010771123456",
        "institution": {
          "_id": "5f2d08c060b92e2888287707",
          "name": "First Bank",
          "bankCode": "011",
          "type": "PERSONAL_BANKING",
          "icon": "https://mono-public-bucket.s3.eu-west-2.amazonaws.com/images/first-bank-icon.png"
        },
        "scope": [
          "payments"
        ],
        "created_at": "2021-07-18T18:54:23.491Z",
        "updated_at": "2021-07-18T18:55:16.055Z"
      },
      "reference": "123456789012",
      "verified": true,
      "business": "60cc8f95ba1772018c123456",
      "created_at": "2021-08-18T18:54:23.491Z",
      "updated_at": "2021-08-18T18:55:16.055Z",
      "method": "transfer",
      "flagged": false,
      "flag_reasons": null,
      "held_settlement": false,
    }
  }
}
```

### Handling duplicate webhook deliveries

Mono may send the same webhook event more than once due to network retries or system redundancy. To prevent duplicate processing of the same event, always check the `event_id` field before processing webhooks. Store processed event IDs and skip any events you've already handled.

#### Example implementation (Node.js)

### Request

12345678910111213141516171819202122232425262728

```js
const express = require('express');
const app = express();

// Store processed event IDs (use a database in production)
const processedEvents = new Set();

app.post('/webhooks/mono', express.json(), (req, res) => {
  const { event, event_id, data } = req.body;

  // Check if already processed
  if (processedEvents.has(event_id)) {
    return res.status(200).json({ message: 'Already processed' });
  }

  // Process the webhook
  console.log(`Processing ${event} with ID ${event_id}`);

  // Your business logic here
  if (event === 'direct_debit.payment_successful') {
    // Handle successful debit
    console.log(`Debit successful: ${data.reference_number}`);
  }

  // Mark as processed
  processedEvents.add(event_id);

  res.status(200).json({ message: 'Webhook received' });
});
```

### Webhook Retry behavior

Mono uses an exponential backoff system to retry failed webhook deliveries. When a webhook delivery fails (returns a non-200 HTTP status code), Mono will automatically retry the delivery with the following behavior:

-   **Initial retry delay**: 30 seconds after the first failure

-   **Backoff multiplier**: ×2 (each retry delay doubles the previous delay)

-   **Retry delay sequence**: 30 seconds, 1 minute, 2 minutes, 4 minutes, 8 minutes, 16 minutes, 32 minutes, 1 hour, and so on

-   **Maximum delay cap**: 4 hours between retry attempts

-   **Total retry attempts**: 25 attempts

-   **Maximum retry window**: 48 hours from the initial delivery attempt

-   **HTTP status codes that trigger retries**: Any non-200 status code (including 4xx and 5xx errors)

-   **Event ID consistency**: The same `event_id` is reused across all retry attempts for a given webhook event. This unique identifier ensures that each webhook delivery can be tracked and helps partners easily detect and prevent duplicate notifications in their systems. It also helps us enforce the requirement that the same event does not get delivered twice to the same webhook.


#### On this page

overview

webhooks triggers

Handling Duplicate Webhooks

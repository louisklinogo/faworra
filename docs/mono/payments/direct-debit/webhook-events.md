---
title: "Direct Debit Webhook Events"
source_url: "https://docs.mono.co/docs/payments/direct-debit/webhook-events"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Detailed guide to mandate lifecycle events and debit transaction notifications."
---# Direct Debit Webhook Events

## Last updated March 31st, 2026

GSM has been upgraded to Sweep (Effective March 25th, 2026)

We’ve rolled out an update to the **Direct Debit API** regarding the `mandate_type` field for Mono Sweep.

#### What’s changing

The mandate type has been updated from **`gsm`** to **`sweep`** across the Direct Debit APIs and webhook events.

#### Where this applies

The updated value will appear in:

-   Webhook events including:

`events.mandates.created`, `events.mandates.approved`, `events.mandates.ready`

If you have any questions or need assistance updating your integration, please reach out to our support team.

### Overview

Our Direct Debit webhook events are categorised based on the following:

1.  Mandate webhook events.
2.  Debit webhook events.

### 1\. Mandate webhook events

These are webhooks that are triggered when some specific direct debit mandate actions have been taken. We have itemised them down below:

-   Mandate created event.
-   Mandate rejected event.
-   Mandate approved event.
-   Mandate ready-to-debit event.
-   Mandate paused event.
-   Mandate cancelled event.
-   Mandate reinstated event.
-   Mandate expired event.

##### a. Mandate-created event:

This webhook is sent when a direct debit mandate has been successfully created on your end.

### Request

12345678910111213141516171819202122232425262728293031

```js
{
  "event": "events.mandates.created",
  "event_id": "65f9c4a2e1b123456789",
  "timestamp": "2023-12-14T10:41:42.016Z",
  "data": {
    "id": "mmc_664b428e362a3",
    "status": "initiated",
    "mandate_type": "emandate",
    "debit_type": "variable",
    "ready_to_debit": false,
    "nibss_code": "RC/5008/4942090",
    "approved": false,
    "reference": "ZONO240520",
    "account_name": "Samuel Olamide",
    "account_number": "0100013078",
    "bank": "GTB TESTING",
    "customer": "664769512f321a8c",
    "description": "Mono TEST",
    "live_mode": false,
    "message": "The mandate has been successfully initiated and is awaiting
     customer approval. Once approved, you can begin debiting customers
     based on the agreed terms",
    "start_date": "2024-09-12T00:00:00.000Z",
    "end_date": "2024-12-25T00:00:00.000Z",
    "date": "2024-05-20T12:31:10.481Z",
    "amount": 200020,
    "fee_bearer": "business",
    "app": "662fd4468d1db5",
    "business": "60cc8f95bac5c6b1d"
  }
}
```

##### b. Mandate rejected event:

This webhook is triggered when a created direct debit mandate has been rejected.

### Request

123456789101112131415161718192021222324

```js
{
  "event": "events.mandates.rejected",
  "event_id": "65f9c4a2e1b123456789",
  "timestamp": "2023-12-14T10:41:42.016Z",
  "data": {
    "id": "mmc_65795ef187e8bc6f0c112345",
    "mandate_type": "emandate",
    "debit_type": "variable",
    "status": "rejected",
    "approved": false,
    "reference": "TPS-blablaba-03",
    "account_name": "SAMUEL OLAMIDE",
    "account_number": "0123456789",
    "bank": "ZENITH INTERNATIONAL BANK PLC",
    "customer": "60cc8f95ba1772018c123456",
    "description": "Mono subscriptions",
    "message": "Mandate was rejected by Bank",
    "start_date": "2023-12-13T00:00:00.000Z",
    "end_date": "2024-05-25T00:00:00.000Z",
    "date": "2023-12-13T08:36:17.114Z",
    "app": "60cc8f95ba1772018c123456",
    "business": "60cc8f95ba1772018c123456"
  }
}
```

##### c. Mandate approved event:

This webhook is triggered when a created direct debit mandate has been successfully approved.

### Request

1234567891011121314151617181920212223242526272829

```js
{
  "event": "events.mandates.approved",
  "event_id": "65f9c4a2e1b123456789",
  "timestamp": "2023-12-14T10:41:42.016Z",
  "data": {
    "id": "mmc_664b428362a3",
    "status": "approved",
    "mandate_type": "emandate",
    "debit_type": "variable",
    "ready_to_debit": false,
    "nibss_code": "RC/5008/4942090",
    "approved": true,
    "reference": "ZONO240520",
    "account_name": "Samuel Olamide",
    "account_number": "0100013078",
    "bank": "GTB TESTING",
    "customer": "664769512f321a8c",
    "description": "Mono TPS TEST",
    "live_mode": false,
    "message": "Mandate approved",
    "start_date": "2024-09-12T00:00:00.000Z",
    "end_date": "2024-12-25T00:00:00.000Z",
    "date": "2024-05-20T12:31:10.481Z",
    "amount": 200020,
    "fee_bearer": "business",
    "app": "662fd49468d1db5",
    "business": "60cc8f95c5c6b1d"
  }
}
```

##### d. Mandate ready-to-debit event:

This webhook is triggered when a mandate has been approved and the account is ready to be debited.

### Request

123456789101112131415161718192021222324252627

```js
{
  "event": "events.mandates.ready",
  "event_id": "65f9c4a2e1b123456789",
  "timestamp": "2023-12-14T10:41:42.016Z",
  "data": {
    "id": "mmc_66476972650cb58",
    "status": "approved",
    "mandate_type": "emandate",
    "debit_type": "variable",
    "ready_to_debit": true,
    "nibss_code": "RC000014/1000/00026",
    "approved": true,
    "reference": "ZONO2349416",
    "account_name": "SAMUEL OLAMIDE",
    "account_number": "0100013078",
    "bank": "GUARANTY TRUST BANK PLC",
    "description": "Mono TEST",
    "message": "Mandate is now ready for debiting",
    "start_date": "2024-08-12T00:00:00.000Z",
    "end_date": "2024-12-25T00:00:00.000Z",
    "date": "2024-05-17T14:28:09.034Z",
    "amount": 200000,
    "fee_bearer": "business",
    "app": "662fd49d68d1db5",
    "business": "60cc8fc5c6b1d"
  }
}
```

##### e. Mandate paused event:

When a direct debit mandate has been paused, the webhook below is triggered.

### Request

1234567891011121314151617

```js
{
  "event": "events.mandate.action.pause",
  "event_id": "65f9c4a2e1b123456789",
  "timestamp": "2023-12-14T10:41:42.016Z",
  "data": {
    "mandate": "mmc_6571f4e55c7d1843d7d162e9",
    "status": "success",
    "response_code": "",
    "message": "This mandate is now paused and can't be used for
    debit or balance inquiry, but you can reinstate it back.",
    "timestamps": "2023-12-14T10:40:47.713Z",
    "documentation": "https://mono.co/docs/error-codes/400",
    "data": null,
    "app": "60cc8f95ba1772018c123456",
    "business": "60cc8f95ba1772018c123456"
  }
}
```

##### f. Mandate cancelled event:

This webhook is triggered when a created/approved direct debit mandate has been cancelled.

### Request

12345678910111213141516

```js
{
  "event": "events.mandate.action.cancel",
  "event_id": "65f9c4a2e1b123456789",
  "timestamp": "2023-12-14T10:41:42.016Z",
  "data": {
    "mandate": "mmc_6579495142cc7e8894f6e031",
    "status": "success",
    "response_code": "",
    "message": "This mandate is now cancelled and deleted, and can’t be used again",
    "timestamps": "2023-12-14T10:34:30.114Z",
    "documentation": "https://mono.co/docs/error-codes/400",
    "data": null,
    "app": "60cc8f95ba1772018c123456",
    "business": "60cc8f95ba1772018c123456"
  }
}
```

##### g. Mandate reinstated event:

When a direct debit mandate has been paused, we send the webhook below when this mandate has been reinstated.

### Request

1234567891011121314151617

```js
{
  "event": "events.mandate.action.reinstate",
  "event_id": "65f9c4a2e1b123456789",
  "timestamp": "2023-12-14T10:41:42.016Z",
  "data": {
    "mandate": "mmc_6571f4e55c7d1843d7d162e9",
    "status": "success",
    "response_code": "",
    "message": "The mandate has been reinstated successfully and is
     now active for debit and balance inquiry",
    "timestamps": "2023-12-14T10:40:19.322Z",
    "documentation": "https://mono.co/docs/error-codes/400",
    "data": null,
    "app": "60cc8f95ba1772018c123456",
    "business": "60cc8f95ba1772018c123456"
  }
}
```

##### h. Mandate expired event:

This webhook is sent when a mandate has passed its end date and is no longer valid for debits.

### Request

12345678910111213141516171819202122232425262728293031323334353637

```js
{
  "event": "events.mandates.expired",
  "event_id": "65f9c4a2e1b123456789",
  "timestamp": "2026-03-12T10:02:08.305Z",
  "data": {
    "id": "mmc_69b28f20a7cd771e57306a38",
    "status": "expired",
    "mandate_type": "emandate",
    "debit_type": "fixed",
    "ready_to_debit": false,
    "nibss_code": "RD2040803048",
    "approved": false,
    "reference": "gagi9xkj4vorrjxlass3bui8",
    "account_name": "JANE DOE",
    "account_number": "110022334455",
    "bank": "Access Bank",
    "bank_code": "044",
    "customer": "668409b58003c253a72e843f",
    "description": "Test",
    "live_mode": true,
    "message": "Mandate expired",
    "start_date": "2026-03-12T10:02:07.283Z",
    "end_date": "2026-03-17T22:59:59.999Z",
    "date": "2026-03-12T10:02:08.305Z",
    "initial_debit_date": "2026-03-12T10:02:07.283Z",
    "amount": 20000,
    "fee_bearer": "business",
    "meta": {
      "customFields": {
        "Subscriber code": "12345"
      }
    },
    "verification_method": "transfer_verification",
    "app": "6577752ab09e981a19a7fb1c",
    "business": "60cc8f95ba1772018c5c6b1d"
  }
}
```

### 2\. Debit webhook events

When a direct debit action is taken, either of the two results below will be shared:

-   Processing direct debit event.
-   Successful direct debit event.
-   Failed direct debit event.

##### a. Processing direct debit event:

This processing webhook is sent to indicate a debit transaction is pending confirmation. When the transaction is finally confirmed as successful or failed, a webhook is sent and the status will be updated.

### Request

12345678910111213141516171819202122232425262728293031

```js
{
  "event": "events.mandates.debit.processing",
  "event_id": "65f9c4a2e1b123456789",
  "timestamp": "2023-12-14T10:41:42.016Z",
  "data": {
    "status": "processing",
    "message": "Payment is currently in processing state, please wait for a final state webhook before giving value",
    "event": "processing",
    "response_code": "99",
    "amount": 140000,
    "mandate": "mmc_66b724f8be2c101e38151234",
    "reference_number": "LBA3B086406D4851234A",
    "account_details": {
      "bank_code": "058",
      "account_name": "HASSAN ABDULHAMID TOMIWA",
      "account_number": "0123456789",
      "bank_name": "GUARANTY TRUST BANK PLC"
    },
    "beneficiary": {
      "bank_code": "000",
      "account_number": "P000001",
      "bank_name": "MONO SETTLEMENT WALLET"
    },
    "date": "2024-08-12T00:32:17.192Z",
    "live_mode": true,
    "app": "661fb072e5fcc75328866c9a",
    "fee_bearer": "business",
    "business": "630c84e6059cbfc70fdaag15",
    "customer": "66b724f51a0fe7906d05d617"
  }
}
```

##### b. Successful direct debit event:

The webhook below is sent whenever an account has been debited successfully

### Request

12345678910111213141516171819202122232425262728293031323334

```js
{
  "event": "events.mandates.debit.successful",
  "event_id": "65f9c4a2e1b123456789",
  "timestamp": "2023-12-14T10:41:42.016Z",
  "data": {
    "success": true,
    "status": "successful",
    "message": "Account debited successfully.",
    "response_code": "00",
    "amount": 50000,
    "mandate": "mmc_6571f4e55c7d1843d7d162e9",
    "reference_number": "Ah20141329b841234",
    "fee": 1000,
    "fee_bearer": "business",
    "narration": "Subscription",
    "app": "60cc8f95ba1772018c123456",
    "session_id": "999999250919103136775149584552",
    "business": "60cc8f95ba1772018c123456",
    "customer": "6570ee1115ddbc5528fea1c8",
    "account_details": {
      "bank_code": "058",
      "account_name": "SAMUEL OLAMIDE",
      "account_number": "0123456789",
      "bank_name": "GUARANTY TRUST BANK PLC"
    },
    "beneficiary": {
      "bank_code": "000",
      "account_name": "Mono",
      "account_number": "P000001",
      "bank_name": "MONO SETTLEMENT WALLET"
    },
    "date": "2023-12-14T10:41:42.016Z",
  }
}
```

##### c. Failed direct debit event:

This webhook is sent whenever a direct debit process performed is failed.

### Request

12345678910111213141516171819202122232425262728293031

```js
{
  "event": "events.mandates.debit.failed",
  "event_id": "65f9c4a2e1b123456789",
  "timestamp": "2023-12-14T10:41:42.016Z",
  "data": {
    "success": false,
    "status": "failed",
    "message": "",
    "response_code": "96",
    "amount": 50000,
    "customer": "6570ee1115ddbc5528fea1c8",
    "mandate": "mmc_6571f4e55c7d1843d7d162e9",
    "reference_number": "Ah20141329b841841",
    "account_details": {
      "bank_code": "058",
      "account_name": "SAMUEL OLAMIDE",
      "account_number": "0123456789",
      "bank_name": "GUARANTY TRUST BANK PLC"
    },
    "beneficiary": {
      "bank_code": "000",
      "account_name": "SAMUEL OLAMIDE",
      "account_number": "P000000",
      "bank_name": "MONO SETTLEMENT WALLET"
    },
    "date": "2023-12-14T10:41:42.016Z",
    "fee_bearer": "business",
    "app": "60cc8f95ba1772018c123456",
    "business": "60cc8f95ba1772018c123456"
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
  if (event === 'events.mandates.debit.successful') {
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

Mandate Webhook Events

Debit Webhook Events

Handling Duplicate Webhooks

---
title: "Disburse Webhooks"
source_url: "https://docs.mono.co/docs/disburse/webhook-events"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Real-time notification reference for successful and failed disbursement batches and single payouts."
---# Disburse Webhooks

Last updated March 5th, 2026

## Overview

Webhooks are used to notify your application of asynchronous events in the Disburse API, such as successful transfers. This page details all available webhook events, their payloads, and best practices for verification and handling.

![Prerequisites](/images/callout/bulb.png)

Prerequisites

Before you begin to receive webhooks, you must:

-   Create a POST endpoint on your server and configured a webhook URL in the Mono [Partner Dashboard](https://app.mono.co).
-   Always validate the webhook request. Add code to your endpoint to validate the request with the webhook secret key, process the event, and return a response with status 2xx.

![Security](/images/callout/bulb.png)

Security

All Webhook requests are sent with a `mono-webhook-secret` header for verification. It should match the secret you passed when creating the webhook or the one available on your dashboard. See the [Webhook Setup Guide](/docs/webhooks) for more information.

## Webhooks

Here are the available webhook events.

-   Disbursement Processing
-   Disbursement Cancelled
-   Disbursement Completed
-   Disbursement Transaction Successful
-   Disbursement Transaction Failed
-   Disbursement Account Created
-   Disbursement Account Approved
-   Disbursement Account Enabled
-   Disbursement Account Disabled

#### Disbursement Processing

This is sent when a disbursement is initiated.

### Request

12345678910

```js
{
    "event": "event.disbursement.processing",
    "data": {
        "reference": "disburse7345923",
        "status": "processing",
        "message": "Disbursement is currently in processing state, please wait for a final state webhook before giving value.",
        "app": "69989083f7682ba3968b0125",
        "business": "67adaad3d23314578c205d10"
    }
}
```

#### Disbursement Cancelled

This is sent when a disbursement has been cancelled, after calling the transition disbursement endpoint.

### Request

12345678910

```js
{
  "event": "event.disbursement.cancelled",
  "data": {
    "status": "cancelled",
    "message": "Disbursement has been cancelled",
    "reference": "disbursetest2",
    "app": "6980b45867f91e8b62501e15",
    "business": "60cc8f95ba1772018c5c6b1d"
  }
}
```

#### Disbursement Completed

This is sent when an instant or scheduled disbursement has been completed.

### Request

12345678910111213141516171819202122232425

```js
{
    "event": "event.disbursement.completed",
    "data": {
        "message": "Disbursement has been successfully completed",
        "reference": "disburse7345923",
        "total_amount": 2000000,
        "total_fee": 3500,
        "status": "failed",
        "transactions_count": 1,
        "processing": {
            "count": 0,
            "amount": 0
        },
        "successful": {
            "count": 0,
            "amount": 0
        },
        "failed": {
            "count": 1,
            "amount": 2000000
        },
        "app": "69989083f7682ba3968b0125",
        "business": "67adaad3d23314578c205d10"
    }
}
```

#### Disbursement Transaction Successful

### Request

12345678910111213141516

```js
{
    "event": "event.disbursement.transaction.successful",
    "data": {
        "message": "Disbursement was successful",
        "disbursement_reference": "disburse73459273",
        "reference": "transfer123",
        "status": "successful",
        "account_number": "2081233241",
        "bank_code": "672",
        "amount": 40000,
        "fee": 3500,
        "narration": "transfer narration",
        "app": "69989083f7682ba3968b0125",
        "business": "67adaad3d23314578c205d10"
    }
}
```

#### Disbursement Transaction Failed

### Request

12345678910111213141516

```js
{
    "event": "event.disbursement.transaction.failed",
    "data": {
        "message": "This disbursement has failed",
        "disbursement_reference": "disburse7345923",
        "reference": "transfer123",
        "status": "failed",
        "account_number": "2209750405",
        "bank_code": "057",
        "amount": 2000000,
        "fee": 3500,
        "narration": "transfer narration",
        "app": "69989083f7682ba3968b0125",
        "business": "67adaad3d23314578c205d10"
    }
}
```

#### Disbursement Account Created

### Request

1234567891011121314151617

```js
{
    "event": "event.disburse.account.created",
    "data": {
        "message": "Disbursement account has been created",
        "account_id": "699891bd620926af016ce335",
        "account_number": "2081233241",
        "bank_code": "672",
        "mandate_id": "69a1647bf165c234dda48015",
        "status": "created",
        "created_at": "2026-02-20T16:54:21.078Z",
        "updated_at": "2026-02-27T09:31:40.065Z",
        "ready_to_debit": false,
        "approved": false,
        "app": "69989083f7682ba3968b0125",
        "business": "67adaad3d23314578c205d10"
    }
}
```

#### Disbursement Account Approved

### Request

12345678910111213141516171819

```js
{
    "event": "event.disburse.account.approved",
    "data": {
        "message": "Disbursement account has been approved",
        "account_id": "688a27e22f88771f773973ed",
        "account_number": "0759854965",
        "bank_code": "044",
        "mandate_id": "689ef99073f7dabd251a8c28",
        "status": "approved",
        "created_at": "2025-07-30T14:10:42.679Z",
        "updated_at": "2025-08-15T09:10:40.235Z",
        "account_name": "ANITA ISIOMA ONWUEMENE",
        "bank_name": "Access Bank",
        "ready_to_debit": false,
        "approved": true,
        "app": "6863d3203d265bb9b75bae78",
        "business": "60cc8f95ba1772018c5c6b1d"
    }
}
```

#### Disbursement Account Enabled

### Request

12345678910111213141516

```js
{
    "event": "event.disburse.account.enabled",
    "data": {
        "message": "Disbursement account has been enabled",
        "account_id": "699891bd620926af016ce335",
        "account_number": "2081233241",
        "bank_code": "672",
        "status": "enabled",
        "created_at": "2026-02-20T16:54:21.078Z",
        "updated_at": "2026-02-26T08:16:26.078Z",
        "ready_to_debit": true,
        "approved": true,
        "app": "69989083f7682ba3968b0125",
        "business": "67adaad3d23314578c205d10"
    }
}
```

#### Disbursement Account Disabled

### Request

12345678910111213141516

```js
{
    "event": "event.disburse.account.disabled",
    "data": {
        "message": "Disbursement account has been disabled",
        "account_id": "699891bd620926af016ce335",
        "account_number": "2081233241",
        "bank_code": "672",
        "status": "disabled",
        "created_at": "2026-02-20T16:54:21.078Z",
        "updated_at": "2026-02-26T08:16:20.950Z",
        "ready_to_debit": false,
        "approved": false,
        "app": "69989083f7682ba3968b0125",
        "business": "67adaad3d23314578c205d10"
    }
}
```

#### On this page

Overview

Prerequisites

Security

Disbursement Status Events

Disbursement Transaction Events

Disbursement Account Events

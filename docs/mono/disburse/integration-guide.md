---
title: "Disburse Integration Guide"
source_url: "https://docs.mono.co/docs/disburse/integration-guide"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Technical guide for setting up funding sources, initiating disbursement batches, and managing recipients."
---# Disburse Integration Guide

Last updated March 5th, 2026

## Overview

This guide walks you through integrating the Disburse API into your application. With it, you can link funding accounts, initiate instant or scheduled disbursements, and manage bulk transfers securely. By following this guide, you can implement a seamless payment experience with Mono Disburse.

![Prerequisites](/images/callout/bulb.png)

Prerequisites

To get started, you need to:

-   Sign up on the [Partner Dashboard](https://app.mono.co/signup) and complete KYB.
-   [Create a `disburse` app](/docs/create-app) and retrieve your Secret key.
-   Configure a [webhook URL](/docs/webhooks) in your dashboard to receive event notifications (you can use [webhook.site](https://webhook.site/) for testing).

### How it works

After creating a Disburse App via the dashboard:

1.  **Setup a source account**: This involves creating a source account and authorizing the linked mandate. This account serves as the source of funds for the disbursement.

2.  **You initiate a disbursement**: Specifying the `type` (**instant** or **scheduled**), `source` (**wallet** or **mandate**), along with a `reference`, `total amount`, and a detailed `list of recipients`.

3.  **Mono processes the disbursement**: This involves debiting the specified mandate source (Account) and sending the money to the recipients.

4.  **Real-time updates**: Mono tracks batch and individual transaction statuses, sends webhooks for batch and distribution-level events, and allows statuses to be retrieved via API.


### Disburse Workflow Status

1.  `initiated`: The disbursement (transfer batch) is created.

2.  `ready`: The disbursement is prepared and ready to be processed.

3.  `processing`: The disbursement has been picked up for execution.

4.  `securing`: The funds are being debited from the source (e.g., wallet or account).

5.  `secured`: The funds have been successfully debited from the source and verified.

6.  `transferring`: The fund transfer to the beneficiaries is about to start as a batch.

7.  `transferred`: The batch transfer request has been successfully created.

8.  `successful`: All transactions in the batch were successful.

9.  `failed`: All transactions in the batch failed.

10.  `completed`: The batch contains a mix of successful and failed transactions.


![Request Headers](/images/callout/bulb.png)

Request Headers

Include the following header in your request for authentication. This is important for all endpoints.

-   `mono-sec-key` (required): live\_sk\_xxxxxxxxxxxxxxxxxxxx

This also determines the environment you're using. For example, if you're using the sandbox environment, your key will be prefixed with `test_sk` and `live_sk` for the live (production) environment.

##### NOTE: Disburse is currently only available on the `live` environment.

## API Integration Steps

With the above prerequisite steps already taken, please note that there are four stages for completing the integration process:

-   Step 1: Create a Business Source Account

-   Step 2: Initiate a Disbursement

-   Step 3: Manage Scheduled Disbursements (if you created a scheduled disbursement)

-   Step 4: Track Status & Webhooks


## Step 1: Create a Business Source Account

Before initiating disbursements, you need a funding source. Create a source account that will be linked to your app. This source account is connected to a mandate, which is the official debit instruction for funds.

### Request

123456789

```js
curl -X POST https://api.withmono.com/v3/payments/disburse/source-accounts \
  -H "mono-sec-key: test_sk_xxxxxxxxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "app": "62229d670c34e0c3b9139f44",
    "account_number": "1122334455",
    "bank_code": "044",
    "email": "olamide@neem.co"
}'
```

##### Body Request Descriptions

<table class="w-full space-y-2.5 border-separate border-spacing-y-2.5 my-5 first:mt-0"><tbody class="[&amp;:first-child_tr]:bg-gray-100 [&amp;:first-child_tr]:font-medium"><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><strong>Field</strong></td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">Type</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">Description</td></tr></tbody><tbody class="[&amp;:first-child_tr]:bg-gray-100 [&amp;:first-child_tr]:font-medium"><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><strong>app</strong></td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">String</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">A unique identifier for the application you're configuring the disbursement in. (You will get this from the dashboard).</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><strong>account_number</strong></td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">String</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">The NUBAN of the bank account to be linked.</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><strong>bank_code</strong></td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">String</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">The NIP code of the bank account to be linked. You can find the codes <a target="_self" class="inline-block font-medium text-blue-500" href="/api/direct-debit/mandate/get-banks">here</a>.</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><strong>email</strong></td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">String</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">An email address associated with the app. Can be the business owner or app creator.</td></tr></tbody></table>

#### Response

### Request

123456789

```js
{
  "status": "successful",
  "message": "Business account created successfully",
  "timestamp": "2025-08-20T14:11:00.489Z",
  "data": {
    "id": "68a4ac5200dcc73621111111",
    "mandate_activation_url": "https://authorise.mono.co/RD4605211111"
  }
}
```

A successful request will return a mandate\_activation\_url and an ID. To enable payouts using this account, you must navigate to the provided URL and approve the mandate which authorizes Mono to debit the account.

## Step 2: Initiate a Disbursement

Once the mandate is ready for debit, i.e ( after the ready to debit event is received), you can initiate either an instant or scheduled disbursement.

1.  Instant Disbursement: Executes immediately.

2.  Scheduled Disbursement: Created first, then triggered later.


### Instant Disbursement

### Request

12345678910111213141516171819202122232425

```js
// Instant Disbursement

curl -X POST https://api.withmono.com/v3/payments/disburse/disbursements \
  -H "mono-sec-key: YOUR_MONO_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "reference": "disburse704592203061269674432",
    "source": "mandate",
    "account": "688a0b672f88111f11d11ab2",
    "type": "instant",
    "total_amount": 20000,
    "description": "testing distribution",
    "distribution": [
        {
            "reference": "tran0sfdfer123",
            "recipient_email": "olamide@neem.com",
            "account": {
			  "account_number": "0011223344",
			  "bank_code": "044"
			},
            "amount": 20000,
            "narration": "transfer narration"
        }
    ]
}'
```

You’ll get a response confirming that the batch has been created with status pending.

#### Response

### Request

12345678910

```js
{
    "status": "successful",
    "message": "Disbursement request received",
    "timestamp": "2025-08-01T09:42:59.668Z",
    "data": {
        "id": "688a0b672f88000f23d11ab2f",
        "reference": "disburse704592203061269674432",
        "status": "pending"
    }
}
```

### Scheduled Disbursement

### Request

12345678910111213

```js
// Scheduled Disbursement

curl -X POST https://api.withmono.com/v3/payments/disburse/disbursements \
  -H "mono-sec-key: YOUR_MONO_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "reference": "Disburse422233249d9324402926004",
    "source": "mandate",
    "account": "688a0b672f88111f11d11ab2",
    "type": "scheduled",
    "total_amount": 50000,
    "description": "testing distribution scheduled 3"
}'
```

![Scheduled Disbursements](/images/callout/bulb.png)

Scheduled Disbursements

At the point of creation, a scheduled disbursement will have no distributions (recipients). You will need to add these later using the [Add Distributions API](/api/disburse/add-distributions-to-batch).

#### Response

### Request

12345678910

```js
{
    "status": "successful",
    "message": "Scheduled disbursement created",
    "timestamp": "2025-08-01T09:42:59.668Z",
    "data": {
        "id": "688a0b672f88000f23d11ab2f",
        "reference": "disburse704592203061269674432",
        "status": "created"
    }
}
```

## Step 3: Manage Scheduled Disbursements (Optional)

If you created a scheduled disbursement, you can either:

-   Add distributions (more recipients)

-   Update distributions (modify details)

-   Trigger or cancel the batch


### Add Distributions to a Scheduled Disbursement

### Request

123456789101112131415

```js
// Add Distributions to batch
curl -X POST https://api.withmono.com/v3/payments/disburse/disbursements/{id}/distributions \
  -H "mono-sec-key: YOUR_MONO_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{
  "distribution": [
    {
      "recipient_email": "mary@example.com",
      "bank_code": "033",
      "narration": "july salary",
      "account_number": "1029381212",
      "amount": 250000
    }
  ]
}'
```

#### Response

### Request

123456789101112131415161718192021222324

```js
{
    "status": "successful",
    "message": "Distribution added successfully",
    "timestamp": "2025-08-01T09:49:59.766Z",
    "data": {
        "status": "successful",
        "summary": {
            "valid": 1,
            "invalid": 0
        },
        "valid_accounts": [
            {
                "id": "TmAdOoEpQWeGVhIDtqiI",
                "bank_code": "044",
                "account_number": "1234567890",
                "account_name": "Mono isioma account",
                "beneficiary_id": "6759a0a9708ee02f9f21b6b4",
                "email": "mary@example.com",
                "reference": "Testidngref6"
            }
        ],
        "invalid_accounts": []
    }
}
```

### Trigger or Cancel a Scheduled Disbursement

### Request

1234567

```js
// Trigger
curl -X POST https://api.withmono.com/v3/payments/disburse/disbursements/{id}/transition \
  -H "mono-sec-key: YOUR_MONO_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "trigger"
  }'
```

This moves the batch into processing or cancelled depending on the action.

#### Response

### Request

123456789

```js
{
    "status": "successful",
    "message": "Disbursement updated successfully",
    "timestamp": "2025-08-01T10:52:51.386Z",
    "data": {
        "status": "processing",
        "id": "688c94d5b947fac1455fa502"
    }
}
```

### Update a Distribution details

### Request

1234567891011121314

```js
curl -X PUT https://api.withmono.com/v3/payments/disburse/disbursements/{id}/distributions/{distribution_id}/update \
  -H "mono-sec-key: YOUR_MONO_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "distribution": [
      {
        "recipient_email": "mary@example.com",
        "bank_code": "033",
        "narration": "july salary"
        "account_number": "1029384756",
        "amount": 250000
      }
    ]
}'
```

This updates the details of distributions in a batch of a scheduled disbursement.

#### Response

### Request

123456789

```js
{
    "status": "successful",
    "message": "Distribution updated successfully",
    "timestamp": "2025-08-01T10:51:40.394Z",
    "data": {
        "success": true,
        "message": "Distribution updated successfully"
    }
}
```

## Step 4: Track Status & Webhooks

Mono manages the disbursement workflow through states

`initiated` → `ready` → `processing` → `securing` → `transferred` → `successful/failed`.

You can monitor these in two ways:

### 1\. Fetch a Disbursement via API:

### Request

12

```js
GET https://api.withmono.com/v3/payments/disburse/disbursements/{id} \
  -H "mono-sec-key: YOUR_MONO_SECRET_KEY"
```

#### Response

### Request

12345678910111213141516171819202122

```js
{
    "status": "successful",
    "message": "Disbursement fetched successfully",
    "timestamp": "2025-08-01T10:52:28.775Z",
    "data": {
        "id": "622d11d3b711fac1455fa502",
        "reference": "Disburse4222332499324402926004",
        "status": "initiated",
        "description": "testing distribution scheduled 3",
        "type": "scheduled",
        "total_amount": 20000,
        "distributions_count": 1,
        "approved_by": "Samuel Olamide",
        "approval_date": "2025-08-01T10:20:05.274Z",
        "total_records_count": 1,
        "total_successful_amount": "0",
        "successful_transactions_count": 0,
        "total_failed_amount": "0",
        "failed_transactions_count": 0,
        "created_at": "2025-08-01T10:20:05.279Z"
    }
}
```

### 2\. Listen to Webhooks

-   event.disbursement.processing

-   event.disbursement.completed

-   event.disbursement.transaction.successful

-   event.disbursement.transaction.failed


#### Example webhook payload

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

#### On this page

Overview

How it works

Disburse Workflow Status

Authentication and Environment

Integration Steps

Step 1 Create Source Account

Step 2 Initiate Disbursement

Step 3 Manage Scheduled Disbursements

Step 4 Track Status Webhooks

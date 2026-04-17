---
title: "Real-Time Data"
source_url: "https://docs.mono.co/docs/financial-data/realtime-data"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Understand how Mono's real-time data sync works to provide the most up-to-date transaction and balance information."
---# Real-Time Data

Last updated March 10th, 2026

## Overview

![Note](/images/callout/bulb.png)

Note

This service was formerly known as Data Sync.

This feature enables you to retrieve the most recent financial data from your customer's linked account. We silently fetch data from the bank if persistent access is available; otherwise, [re-authorization](/docs/financial-data/reauth-link) is requested from the user.

## How It Works

-   Step 1: Partners add `x-realtime` in their API header for endpoints like [balance](/api/bank-data/accounts/account-balance) and [transactions](/api/bank-data/transactions).

-   Step 2: After initiating the call, we return the X-HAS-NEW-DATA: true | false , X-JOB-ID and X-JOB-STATUS in the response headers. These headers provide information on the job's progress and indicates if new data is available.

-   Step 3: On completion of the job, the mono.accounts.jobs.update webhook is triggered to notify partners of the job’s status. Business will also receive the mono.accounts.account\_updated webhook, providing updates on the sync status.

-   Step 4: If account doesn't require reauth, the balance or transactions endpoint returns updated data. If the account requires reauthorization, this is returned as failed in the response headers as well as the jobs mono.accounts.jobs.update webhook. The business then users the [reauthorization endpoint](/api/bank-data/authorisation/initiate-account-reauth) to trigger a reauthentication by the user.


## Authentication

Requests to the API for real time data must include the following in the header:

-   **Mono Security Key:** `mono-sec-key: live_sk_example`
-   **x-realtime:** `true`

# API Response Headers

The responses in the endpoints below will include the following header:

-   `x-has-new-data: true | false` - Indicates if the user has new data and it was fetched.

-   `x-job-id: "string"` - This represents a unique identifier for an asynchronous job or task. It’s a string that helps track the status and progress of the job as it processes in the background.

-   `x-job-status: finished | processing | failed` - This header indicates the current status of the job associated with the `x-job-id`.


![X-JOB-STATUS](/images/callout/bulb.png)

X-JOB-STATUS

Job Status can have one of the following values:

-   FINISHED: The job has completed successfully.
-   PROCESSING: The job is currently being worked on and hasn’t finished yet.
-   FAILED: The job has encountered an error and didn’t complete successfully.

![X-HAS-NEW-DATA](/images/callout/bulb.png)

X-HAS-NEW-DATA

When X-HAS\_NEW\_DATA is returned as false, your business is not charged for the API call. This indicates there was no balance/transaction data update, and therefore, they won’t incur any charges.

Rate Limit

Note that real-time sessions for each account can only be performed at 5-minute intervals (5-minute rate limit). If you attempt to call the endpoint again within this interval and the real-time session is still in queue, we simply return the headers with the last job id and status unchanged.

# API Endpoints

Real Time can be retrieved using the following endpoints:

-   [Balance API](/api/bank-data/accounts/account-balance)
-   [Transactions API](/api/bank-data/transactions)

1

Account Balance

`get` https://api.withmono.com/v2/accounts/{id}/balance

v1.0

#### Response

### Request

123456789101112

```js
{
    "status": "successful",
    "message": "Request was successfully completed",
    "timestamp": "2024-07-05T12:20:59.336Z",
    "data": {
        "id": "666b166ce06be73",
        "name": "Samuel  Olamide",
        "account_number": "0200000043",
        "balance": 53769,
        "currency": "NGN"
    }
}
```

## Webhook Events

When real-time data is triggered, two webhooks are sent.

-   `mono.accounts.jobs.update`
-   `mono.events.account_updated`

### Job Update Webhook

This Webhook is sent to notify you of the job status i.e processing, failed, or finished

#### Sync Successful

If the sync was successful, you will receive the following response via the `mono.accounts.jobs.update` webhook:

### Request

1234567891011

```js
{
    "event": "mono.accounts.jobs.update",
    "data": {
        "account": "681b12e922f90e2319dea1a",
        "business": "64dr8w95ba1772018c5c6b1d",
        "app": "67c9aeea65e2244fge474b2d",
        "id": "681b431edb122e972b21fd4c",
        "name": "jobs.accounts.sync_statement",
        "status": "finished"
    }
}
```

#### Sync processing

If the sync is processing, you will receive the following response via the `mono.accounts.jobs.update` webhook:

### Request

1234567891011

```js
{
    "event": "mono.accounts.jobs.update",
    "data": {
        "account": "681b12e922f90e2319dea1a",
        "business": "64dr8w95ba1772018c5c6b1d",
        "app": "67c9aeea65e2244fge474b2d",
        "id": "681b431edb122e972b21fd4c",
        "name": "jobs.accounts.sync_statement",
        "status": "processing"
    }
}
```

#### Sync failed

If the sync fails, you will receive the following response via the `mono.accounts.jobs.update` webhook:

### Request

1234567891011

```js
{
    "event": "mono.accounts.jobs.update",
    "data": {
        "account": "681b12e922f90e2319dea1a",
        "business": "64dr8w95ba1772018c5c6b1d",
        "app": "67c9aeea65e2244fge474b2d",
        "id": "681b431edb122e972b21fd4c",
        "name": "jobs.accounts.sync_statement",
        "status": "failed"
    }
}
```

### Account Updated webhook

Shortly after the `mono.accounts.jobs.update` is sent, you will also receive the `mono.accounts.account_updated` webhook, providing updates on the sync status.

#### Webhook response sample

### Request

1234567891011121314151617181920212223242526272829303132333435

```js
{
    "event": "mono.events.account_updated",
    "data": {
        "account": {
            "_id": "66e2d530c293212b39d34aa8",
            "name": "SAMUEL OLAMIDE NOMO",
            "accountNumber": "0100000062",
            "currency": "NGN",
            "balance": 17542,
            "type": "SAVINGS ACCOUNT - INDIVIDUAL",
            "bvn": "22000000003",
            "authMethod": "mobile_banking",
            "institution": {
                "name": "Union Bank of Nigeria",
                "bankCode": "000018",
                "type": "PERSONAL_BANKING"
            },
            "created_at": "2024-09-12T11:49:04.416Z",
            "updated_at": "2024-09-13T09:58:00.950Z"
        },
        "meta": {
            "data_status": "AVAILABLE | PARTIAL | UNAVAILABLE",
            "auth_method": "internet_banking",
            "ref": "1804008877TEST",
            "sync_status": "SUCCESSFUL | FAILED | REAUTHORISATION_REQUIRED",
            "job_id": "68c9928e2f51b0693d5fffeb",
            "has_new_data": true,
            "retrieved_data": [
                "identity",
                "balance",
                "transactions"
      ]
        }
    }
}
```

If the `sync_status` is `successful` in the webhook response, you can proceed to call the transactions or balance endpoint to retrieve the updated data. This means that the `x-realtime` field in the headers should be set to `false` once the API call is successful to avoid creating a new realtime session for the customer’s account.

If the `sync_status` is `reauthorisation_required` in the webhook response, you can proceed to call the [Reauthorization endpoint](/docs/financial-data/reauth-link)

![NOTE](/images/callout/bulb.png)

NOTE

The meta object in the account updated event includes "has\_new\_data", this is only returned via the **(mono.events.account\_updated)** webhook event when new data is present after the job is completed. When "has\_new\_data" is not returned, this signigfies that new data is not available after the realtime call.

# Real-time Job Status

`get` https://api.withmono.com/v2/accounts/:id/jobs/:job-id

v1.0

#### Path Params

Requests to the API for real time data must include the following in the header:

-   **ID:** Account ID of a connected account
-   **JOB-ID:** This is a unique identifier returned in the response header when `x-realtime` is set to true.

#### Response

### Request

12345678910111213

```json
{
    "status": "successful",
    "message": "Job execution completed",
    "timestamp": "2024-09-25T09:16:58.051Z",
    "data": {
        "id": "66f3d4b3305261f275",
        "status": "processing | failed | finished",
        "name": "jobs.accounts.sync_balance | jobs.accounts.sync_statement",
        "account": "66f3caafc2d35bca",
        "business": "0cc8f95ba1772018c5c6",
        "app": "7abe44ccef6952869b",
    }
}
```

### Sync Scenarios and Data Status Behavior Definitions

<table class="w-full space-y-2.5 border-separate border-spacing-y-2.5 my-5 first:mt-0"><tbody class="[&amp;:first-child_tr]:bg-gray-100 [&amp;:first-child_tr]:font-medium"><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">Previous 'data_status'</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">Sync Outcome</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">New 'data_status'</td></tr></tbody><tbody class="[&amp;:first-child_tr]:bg-gray-100 [&amp;:first-child_tr]:font-medium"><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">FAILED</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">Balance or Transactions fetched</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">partial</code></td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">PARTIAL</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">Remaining data fetched</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">available</code></td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">PARTIAL</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">Still missing one of balance or transactions</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">partial</code></td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">UNAVAILABLE</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">Balance or Transactions fetched</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">partial</code></td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">AVAILABLE</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">Either balance or transactions synced</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">available</code></td></tr></tbody></table>

![Note](/images/callout/bulb.png)

Note

The data\_status in the account updated event (mono.events.account\_updated) don't change to FAILED due to bank-side issues, UNAVAILABLE is reflected in such cases.

#### On this page

overview

how it works

authentication

API response headers

API endpoints

Job Status Webhook Events

Real time Job Status

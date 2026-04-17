---
title: "WhatsApp Payment Integration Guide"
source_url: "https://docs.mono.co/docs/whatsapp-payment/integration-guide"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Learn how to programmatically initiate one-time and recurring debit requests via WhatsApp using Owo."
---# WhatsApp Payment Integration Guide

Last updated August 15th, 2025

## Overview

This guide outlines the steps to integrate the WhatsApp Payment API into your application. The API allows you to securely link user accounts, initiate one-time or recurring payments, and manage fund transfers using a WhatsApp-based authorization flow. By following this guide, you can implement a seamless payment experience without requiring complex SDK setups.

![Prerequisites](/images/callout/bulb.png)

Prerequisites

To get started, you need to:

-   Sign up on the [Partner Dashboard](https://app.mono.co/signup) and complete KYB.
-   [Create a `payments` app](/docs/create-app) and retrieve your Secret key.
-   Configure a [webhook URL](/docs/webhooks) in your dashboard to receive event notifications (you can use [webhook.site](https://webhook.site/) for testing).

## Integration Steps

The integration process involves five key stages:

1.  **Check User Status**: Verify if the user has an active Owo account.
2.  **Link Beneficiary**: Establish a trusted link with the user's account, optionally including an initial
    fund request.
3.  **Create Fund Request**: Initiate a one-time or recurring payment if not created during linking.
4.  **Handle Asynchronous Flow & Redirect**: Redirect users to the WhatsApp authorization URL.
5.  **Listen for Webhook Events**: Receive updates on linking, fund requests, and payment outcomes.

## Step 1: Check User Status

Before initiating any action, check if the user has an Owo account and its status using the following endpoint:

### Request

1

```js
GET https://api.withmono.com/owo/v1/users/status
```

### Query Parameters

-   `phone` (required): The user's phone number in E.164 format, without the leading + (e.g. 23480...).

### Request Headers

-   `mono-sec-key` (required): Your Owo secret API key.

### cURL Sample Request

### Request

1234

```bash
curl --request GET \
     --url https://api.withmono.com/owo/v1/users/status?phone=2348012345678 \
     --header 'accept: application/json' \
     --header 'mono-sec-key: your_secret_key'
```

### cURL Sample Response

### Request

123456789

```json
{
  "status": "successful",
  "message": "User is active and ready to perform transactions.",
  "timestamp": "2025-08-15T14:10:00.465Z",
  "data": {
    "exists": true,
    "status": "active"
  }
}
```

**Possible Status Values**:

-   `active`: The user has a fully active Owo account.
-   `pending_activation`: The user has started sign-up but not yet activated.
-   `not_found`: No Owo account exists for this phone number.

## Step 2: Link Beneficiary

To link a user's Owo account to your service, send a POST request to initiate the WhatsApp authorization flow. You can optionally include a `fund_request` to create a payment immediately upon linking.

### Request

1

```js
POST https://api.withmono.com/owo/v1/beneficiaries/link
```

### Request Body Parameters

1.) `phone` (required): User's phone number in E.164 format without `+`.

2.) `bvn` (optional): Required if user status is `not_found` or `pending_activation`.

3.) `fund_beneficiary` (required): Object containing destination account details.

-   `name` (required): Account holder's name (2-100 characters).

-   `nip_code` (required): 6-digit NIP bank code.

-   `account_number` (required): 10-digit NUBAN account number.


4.) `fund_request` (optional): Object to create an initial fund request (see Step 3 for details).

### Request Headers

-   `mono-sec-key` (required): Your Owo secret API key.

### cURL Sample Request

### Request

123456789101112131415161718192021222324252627

```bash
curl --request POST \
     --url https://api.withmono.com/owo/v1/beneficiaries/link \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --header 'mono-sec-key: your_secret_key' \
     --data '{
    "phone": "2347012345678",
    "bvn": "12345678901",
    "fund_beneficiary": {
        "name": "SAMUEL NEEM",
        "nip_code": "000013",
        "account_number": "0123456789"
    },
    "fund_request": {
        "reference": "ABCDEFabcdef123456",
        "description": "Weekly savings top-up",
        "amount": 1000000,
        "currency": "NGN",
        "type": "recurring",
        "schedule": {
            "period": "week",
            "interval": 1,
            "start_date": "2026-01-01",
            "end_date": "2026-12-31"
        }
    }
}'
```

### cURL Sample Response

### Request

12345678

```json
{
  "status": "successful",
  "message": "Request completed successfully",
  "timestamp": "2025-08-15T14:10:00.401Z",
  "data": {
    "redirect_url": "https://wa.me/2348012345678?text=Hi+Owo%2C+I+want+to+complete+my+account+linking."
  }
}
```

**Next Step**: Redirect the user to the `redirect_url` immediately to complete the WhatsApp authorization flow.

## Step 3: Create Fund Request

If a fund request was not included during beneficiary linking, create one for a one-time or recurring payment:

### Request

1

```js
POST https://api.withmono.com/owo/v1/fund-requests
```

### Request Body Parameters

1.) `phone` (required): User's phone number in E.164 format without `+`.

2.) `reference` (required): Unique alphanumeric string (8-32 characters).

3.) `type` (required): `onetime` or `recurring`.

4.) `description` (required): Brief payment description.

5.) `amount` (required): Payment amount in kobo.

6.) `currency` (required): `ngn`.

7.) `schedule` (required for `recurring`): Object defining the recurring schedule.

-   `period` (required): `day`, `week`, `month`, or `year`.

-   `interval` (required): Frequency interval (e.g., `2` for every 2 months).

-   `start_date` (required): ISO 8601 timestamp for first payment.

-   `end_date` (optional): ISO 8601 timestamp for schedule end.


### Request Headers

-   `mono-sec-key` (required): Your Owo secret API key.

### cURL Sample Request

### Request

12345678910111213141516171819

```bash
curl --request POST \
     --url https://api.withmono.com/owo/v1/fund-requests \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --header 'mono-sec-key: your_secret_key' \
     --data '{
    "phone": "2348069056016",
    "reference": "nlEhET3XhI9A",
    "type": "recurring",
    "description": "Monthly subscription",
    "amount": 67877,
    "currency": "NGN",
    "schedule": {
        "period": "month",
        "interval": 1,
        "start_date": "2025-09-01T00:00:00Z",
        "end_date": "2026-08-31T00:00:00Z"
    }
}'
```

### cURL Sample Response

### Request

12345678

```json
{
  "status": "successful",
  "message": "Request completed successfully",
  "timestamp": "2025-08-15T14:10:00.971Z",
  "data": {
    "redirect_url": "https://wa.me/2348072255993?text=Hi+Owo%2C+I+want+to+complete+my+fund+request."
  }
}
```

**Next Step**: Redirect the user to the `redirect_url` to authorize the payment via WhatsApp.

## Step 4: Handle Asynchronous Flow & Redirect

Owo's API is asynchronous due to the user authorization process:

1.  Initiating a beneficiary link or fund request returns a  `202`   accepted response with a  `redirect_url`.
2.  Redirect the user to this URL immediately to start the WhatsApp authorization flow.
3.  The resource (e.g., beneficiary link or fund request) is created only after the user completes the WhatsApp flow.
4.  Listen for webhook events to receive the final outcome (see Step 5).

![NOTE](/images/callout/bulb.png)

NOTE

The `redirect_url` is time-sensitive and tied to the user's most recent request. Redirect promptly to ensure a smooth user experience.

## Step 5: Listen for Webhook Events

Webhooks notify your application of key events, such as successful beneficiary linking, fund request creation, or payment outcomes. Configure your webhook URL in the [Partner Dashboard](https://dashboard.withmono.com/owo).

### Key Webhook Events

-   `owo.beneficiary.linked`: Sent when a user successfully links their account.
-   `owo.fundrequest.created`: Sent when a fund request is created after user authorization.
-   `owo.payment.successful`: Sent when a payment is successfully processed.

See the [WhatsApp Payment Webhooks](/docs/owo/webhook-events) page for a complete list of events and sample payloads.

### Webhook Verification

Verify webhook requests using the `mono-webhook-secret` header, which matches the secret you provided when configuring the webhook.

## Error Handling

Owo API uses a standard error response format:

### Generic Error (e.g., 404 Not Found)

### Request

123456

```json
{
  "status": "error",
  "message": "Fund request not found",
  "trace_id": "b40ceccb-8831-49d5-8ce9-d52e7f28d5d9",
  "timestamp": "2025-08-15T14:10:00.753Z"
}
```

### Validation Error (400 Bad Request)

### Request

123456789101112

```json
{
  "status": "error",
  "message": "Invalid payload",
  "trace_id": "c9bda089-aff2-4bff-89bf-404af317aae3",
  "timestamp": "2025-08-15T14:10:00.117Z",
  "errors": [
    {
      "field": "reference",
      "message": "Reference must be an alphanumeric string of 8-32 characters"
    }
  ]
}
```

**Tip**: Include the `trace_id` when contacting support for faster resolution.

## Pagination

Endpoints returning lists (e.g., `/beneficiaries`, `/fund-requests`) are paginated. Use the `limit` and `offset` query parameters:

-   `limit` (integer): Maximum items per page (default: 15, max: 100).
-   `offset` (integer): Number of items to skip (default: 0).

### Sample Paginated Response

### Request

1234567891011121314151617

```json
{
  "status": "successful",
  "message": "Request completed successfully",
  "timestamp": "2025-08-15T14:10:00.480Z",
  "data": [
    {
      "id": "ben_TYxCAKx5U6sR",
      "phone": "2348012345678",
      "name": "Samuel Neem"
    }
  ],
  "pagination": {
    "offset": 0,
    "limit": 15,
    "has_more": false
  }
}
```

#### On this page

Overview

Integration Steps

Step 1 Check User Status

Step 2 Link Beneficiary

Step 3 Create Fund Request

Step 4 Handle Asynchronous Flow

Step 5 Listen Webhooks

Error Handling

Pagination

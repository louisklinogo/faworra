---
title: "WhatsApp Payment Webhooks"
source_url: "https://docs.mono.co/docs/whatsapp-payment/webhook-events"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Real-time webhook event reference for WhatsApp payment fund requests and beneficiary updates."
---# WhatsApp Payment Webhooks

Last updated August 15th, 2025

## Overview

Webhooks are used to notify your application of asynchronous events in the WhatsApp Payment API, such as successful beneficiary linking, fund request creation, or payment outcomes. This page details all available webhook events, their payloads, and best practices for verification and handling.

![Prerequisites](/images/callout/bulb.png)

Prerequisites

-   Configure a webhook URL in the [Partner Dashboard](https://app.mono.co/signup).
-   Create a POST endpoint on your server that listens for incoming webhook data.
-   Validate the request with the secret key, process the event, and return the appropriate response.

## Webhook Structure

All webhook requests are sent as POST requests with the following structure:

### Request

12345678

```json
{
  "event": "event.name.here",
  "event_id": "evt_1a2b3c4d5e6f7g8h",
  "timestamp": "2025-08-15T14:10:00Z",
  "data": {
    // Event-specific payload
  }
}
```

## Verification

Each webhook request includes a `mono-webhook-secret` header. Verify that it matches the secret you provided during webhook setup to ensure the request is legitimate.

## Retry Policy

If your webhook endpoint is unavailable or returns a non-2xx response, Owo will retry delivery up to 5 times with exponential backoff (starting at 1 minute, up to 1 hour). Ensure your endpoint is reliable to avoid missing critical events.

## Security

-   **Verification**: Always verify the `mono-webhook-secret` header to confirm the webhook's authenticity.
-   **HTTPS**: Use a secure HTTPS endpoint for your webhook to protect sensitive data.
-   **Idempotency**: Use the `event_id` to deduplicate webhook events in case of retries.

![NOTE](/images/callout/bulb.png)

NOTE

Store webhook events in your database using the `event_id` to ensure idempotent processing and prevent duplicate actions.

## Beneficiary Events

### owo.beneficiary.linked

Sent when a user successfully links their Owo account to your service.

### Request

12345678910111213

```json
{
  "event": "owo.beneficiary.linked",
  "event_id": "evt_1a2b3c4d5e6f",
  "timestamp": "2025-08-15T14:10:00Z",
  "data": {
    "id": "bene_1a2b3c4d5e",
    "nickname": "PiggyVest Wallet",
    "phone": "2348012345678",
    "name": "PiggyVest Wallet",
    "account_number": "0123456789",
    "bank_code": "123456"
  }
}
```

### owo.beneficiary.unlinked

Sent when a beneficiary link is removed.

### Request

123456789

```json
{
  "event": "owo.beneficiary.unlinked",
  "event_id": "evt_2b3c4d5e6f7g",
  "timestamp": "2025-08-15T14:15:00Z",
  "data": {
    "id": "bene_1a2b3c4d5e",
    "phone": "2348012345678"
  }
}
```

## Fund Request Events

### owo.fundrequest.created

Sent when a fund request is successfully created after the user completes the WhatsApp authorization flow.

### Request

123456789101112131415161718192021

```json
{
  "event": "owo.fundrequest.created",
  "event_id": "evt_3c4d5e6f7g8h",
  "timestamp": "2025-08-15T14:20:00Z",
  "data": {
    "id": "frq_1a2b3c4d5e",
    "reference": "fr-partner-ref-abc987",
    "phone": "2348012345678",
    "type": "recurring",
    "beneficiary": "bene_1a2b3c4d5e",
    "description": "Weekly savings top-up",
    "amount": 500000,
    "currency": "NGN",
    "schedule": {
      "period": "week",
      "interval": 1,
      "start_date": "2025-09-01T09:00:00Z",
      "end_date": "2026-08-31T09:00:00Z"
    }
  }
}
```

### owo.fundrequest.approved

Sent when a fund request is approved by the user.

### Request

123456789101112

```json
{
  "event": "owo.fundrequest.approved",
  "event_id": "evt_4d5e6f7g8h9i",
  "timestamp": "2025-08-15T14:25:00Z",
  "data": {
    "id": "frq_1a2b3c4d5e",
    "message": "The user has approved the fund request",
    "status": "approved",
    "app": "app_12345",
    "business": "biz_67890"
  }
}
```

### owo.fundrequest.processing

Sent when a fund request is being processed.

### Request

123456789101112

```json
{
  "event": "owo.fundrequest.processing",
  "event_id": "evt_5e6f7g8h9i0j",
  "timestamp": "2025-08-15T14:30:00Z",
  "data": {
    "id": "frq_1a2b3c4d5e",
    "message": "The fund request is being processed",
    "status": "processing",
    "app": "app_12345",
    "business": "biz_67890"
  }
}
```

### owo.fundrequest.active

Sent when a recurring fund request becomes active and funds are being collected.

### Request

123456789101112

```json
{
  "event": "owo.fundrequest.active",
  "event_id": "evt_6f7g8h9i0j1k",
  "timestamp": "2025-09-01T09:00:00Z",
  "data": {
    "id": "frq_1a2b3c4d5e",
    "message": "The recurring fund request is now active and collections will begin",
    "status": "active",
    "app": "app_12345",
    "business": "biz_67890"
  }
}
```

### owo.fundrequest.completed

Sent when a fund request is completed.

### Request

123456789101112

```json
{
  "event": "owo.fundrequest.completed",
  "event_id": "evt_7g8h9i0j1k2l",
  "timestamp": "2026-08-31T09:00:00Z",
  "data": {
    "id": "frq_1a2b3c4d5e",
    "message": "The fund request has been completed",
    "status": "completed",
    "app": "app_12345",
    "business": "biz_67890"
  }
}
```

### owo.fundrequest.expired

Sent when a fund request expires due to lack of user approval within the time limit.

### Request

123456789101112

```json
{
  "event": "owo.fundrequest.expired",
  "event_id": "evt_8h9i0j1k2l3m",
  "timestamp": "2025-08-17T14:20:00Z",
  "data": {
    "id": "frq_1a2b3c4d5e",
    "message": "The fund request expired because the user did not approve it in time",
    "status": "expired",
    "app": "app_12345",
    "business": "biz_67890"
  }
}
```

## Payment Events

### owo.payment.successful

Sent when a debit attempt is successful.

### Request

12345678910111213141516

```json
{
  "event": "owo.payment.successful",
  "event_id": "evt_9i0j1k2l3m4n",
  "timestamp": "2025-09-01T09:05:20Z",
  "data": {
    "id": "pay_1a2b3c4d5e",
    "reference": "tx_partner_ref_1",
    "fund_request": "frq_1a2b3c4d5e",
    "beneficiary": "bene_1a2b3c4d5e",
    "status": "successful",
    "amount": 500000,
    "currency": "NGN",
    "processed_at": "2025-09-01T09:05:20Z",
    "session_id": "999999202507261029098765432109"
  }
}
```

### owo.payment.failed

Sent when a debit attempt fails after all retries are exhausted.

### Request

12345678910111213141516

```json
{
  "event": "owo.payment.failed",
  "event_id": "evt_0j1k2l3m4n5o",
  "timestamp": "2025-10-03T10:15:25Z",
  "data": {
    "id": "pay_2b3c4d5e6f",
    "reference": "tx_partner_ref_2",
    "fund_request": "frq_1a2b3c4d5e",
    "status": "failed",
    "message": "Insufficient funds",
    "amount": 500000,
    "currency": "NGN",
    "processed_at": "2025-10-03T10:15:25Z",
    "session_id": "999999202507261029112233445566"
  }
}
```

#### On this page

Overview

Webhook Structure

Beneficiary Events

Retry Policy

Security

Fund Request Events

Payment Events

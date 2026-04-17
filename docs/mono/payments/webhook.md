---
title: "Webhook Events"
source_url: "https://docs.mono.co/docs/payments/webhook"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Unified reference for common payment triggers across DirectPay and Direct Debit."
---# Webhook Events

Last updated September 24th, 2022

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

12345678910111213141516171819202122232425262728293031323334353637383940414243444546474849

```js
{
  "event": "direct_debit.payment_successful",
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
      "customer": "65aa78e567adacffd5123456",
      "reference": "123456789012",
      "liveMode": true,
      "verified": true,
      "business": "60cc8f95ba1772018c123456",
      "created_at": "2021-08-18T18:54:23.491Z",
      "updated_at": "2021-08-18T18:55:16.055Z"
    }
  }
}
```

#### On this page

overview

webhooks triggers

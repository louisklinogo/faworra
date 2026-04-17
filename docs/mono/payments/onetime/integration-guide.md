---
title: "One-time Payment Guide"
source_url: "https://docs.mono.co/docs/payments/onetime/integration-guide"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Step-by-step guide to initiating one-time payments, handling customer authorization, and tracking payment status."
---# One-time Payment Guide

Last updated September 9th, 2025

Get started by learning how to integrate DirectPay into your application. After finishing this guide you will be able to initiate transfer payments from your customer's bank account seamlessly.

### Overview

To integrate Directpay into your web or mobile app, the following steps need to be taken:

-   Initiate the payment request.

-   Await and confirm payment from the Customer.

-   Track or verify payment.


![Prerequisites](/images/callout/bulb.png)

Prerequisites

To get started, you need to:

-   Sign up on the [Partner Dashboard](https://app.mono.co/signup) and complete KYB.
-   [Create a `payments` app](/docs/create-app) and retrieve your Secret key.
-   Configure a [webhook URL](/docs/webhooks) in your dashboard to receive event notifications (you can use [webhook.site](https://webhook.site/) for testing).

### Step 1: Initiate the payment request

You need to initiate the payment request via the [API](/api/directpay/initiate) or Mono connect widget, which begins the payment process.

#### One-time payment

To initiate a one-time payment, an amount, type (i.e., onetime-debit), description, reference, account id (not required), and redirect URL can all be populated on the [Initiate endpoint](/api/directpay/initiate). Once all is provided, a payment link is generated, which your customers open in their browsers or on your mobile app in form of a web view.

### API request

### Request

12345678910111213141516171819

```js
curl --request POST \
     --url https://api.withmono.com/v2/payments/initiate \
     --header 'Accept: application/json' \
     --header 'Content-Type: application/json' \
     --header 'mono-sec-key: test_sk_from_your_dashboard' \
     --data '
{
    "amount": 20000,
    "type": "onetime-debit",
    "method": "account" // transfer, whatsapp (defaults is "account")
    "description": "testing",
    "reference": "ref0000100007",
    "redirect_url": "https://mono.co",
    "customer": {
		"name": "Samuel Olamide",
        "email": "samuel@neem.co"
    }
}
'
```

### API response

### Request

12345678910111213141516171819202122

```js
{
    "status": "successful",
    "message": "Payment Initiated Successfully",
    "timestamp": "2025-05-21T21:58:21.087Z",
    "data": {
        "id": "ODW2QV0WLIDG",
        "mono_url": "https://checkout.mono.co/ODW2QV0WLIDG",
        "type": "onetime-debit",
        "method": "transfer",
        "amount": 21000,
        "description": "Ticket",
        "reference": "ref03098",
        "customer": "67aa0961271cb661d8cbae3b",
        "institution": "5f2d08bf60b92e2888287704",
        "auth_method": "internet_banking",
        "redirect_url": "https://mono.co",
        "created_at": "2025-05-21T21:58:21.078Z",
        "updated_at": "2025-05-21T21:58:21.078Z",
        "meta": {},
        "liveMode": true
    }
}
```

![NOTE ON THE REDIRECT\_URL FIELD](/images/callout/bulb.png)

NOTE ON THE REDIRECT\_URL FIELD

The customer will be redirected to the redirect URL after a successful or failed attempt, the URL includes the reference that was passed when initializing the widget and status and reason in case of failure.

#### 👍 Success

${redirect\_url}?reference="reference"&status="successful"

#### 🚧 Failure

${redirect\_url}?reference="reference"&status="failed"&reason="widget\_closed"

### Step 2: Customer authorizes payment

Once the payment initiation has been created, the payment request needs to be presented to the consumer in order to allow them to select their bank and authorize the payment.

If the account id of a customer who is already linked to **Mono connect** is already present in the initiate endpoint above, they will be presented with an authorisation screen to input their OTP, token, pin etc immediately after the screen loads without them having to select bank and log in again.

![Method set to Whatsapp](/images/callout/bulb.png)

Method set to Whatsapp

If the method is set to whatsapp, the payment widget will guide the customer through WhatsApp to complete the transaction.

### Step 3: Track payment status

There are two ways this can be achieved.

a. Mono automatically sends a live [direct\_debit.payment\_successful](/docs/payments/onetime/webhook-events) event of a transaction, to the webhook URL added to your app on the Mono Dashboard. The payload of this webhook contains the Customer's Account ID, transaction amount, transaction time, reference, transaction status etc.

b. With our [Verify payment status API](/api/directpay/verify), you can trigger manually the status of a particular transaction via the reference which you've initially set on the Initiate endpoint. Once called, we provide all necessary payment information pertaining to a transaction as already highlighted in a. above.

![NOTE](/images/callout/bulb.png)

NOTE

1.  No webhook event will be sent until the payment process is completed end-to-end be it a successful or a failed transaction.
2.  If the transaction process is not completed end-to-end, the verify endpoint will return a 404 message
3.  Any payment that isn’t failed or successful returns the error below:

### Request

123456

```js
{
    "status": "failed",
    "message": "Invalid reference, payment not found",
    "timestamp": "2024-05-03T10:15:14.570Z",
    "data": null
}
```

### Returning Users Account ID

The Account ID field which can be found in the body params of our Initiate Payment [API](/api/directpay/initiate) is what enables payments for returning users. Once the Account ID of an already connected account from Mono Connect is provided on the Payment Initiation API (via **account**), your users or customers wouldn’t need to sign into the DirectPay Widget.

All that would be required of them would be to authorise the payment with their PIN, password or token on the payment widget. With this, the process of collecting payment from your customer's bank account is done with ease.

The following steps explain how this can be achieved:

1.  Onboard your customers via Mono Connect.
2.  Initiate payments via Customer's Account ID.

#### 1\. Onboard your customers via Mono Connect.

To set up payment for returning users, it is important to firstly set up Mono connect on your end. The guide [here](/docs/financial-data/integration-guide#integration-guide) gives a comprehensive step-by-step process on how to integrate Mono Connect so that you can get your customer's account ID.

#### 2\. Initiate payments via Customer's Account ID.

With step 1 out of the way, you can proceed to initiate payment with our Initiate a Payment [API](/api/directpay/initiate). In this step, you get to pass your **account id** as received above to the request body, alongside other info like amount, type, description, reference etc

With the payment link now generated, you can await and confirm payment from your Customer as they would be automatically signed in the payment widget while we await for them to authorise. Tracking and verifying payments can still be achieved as explained in steps 2 and 3 at the top.

### API request

### Request

123456789101112131415161718

```js
curl --request POST \
     --url https://api.withmono.com/v2/payments/initiate \
     --header 'Accept: application/json' \
     --header 'Content-Type: application/json' \
     --header 'mono-sec-key: test_sk_from_your_dashboard' \
     --data '
{
    "amount": 20000,
    "type": "onetime-debit",
    "description": "testing",
    "reference": "ref0000100000001",
    "account": "678f7bc977eb9afb06fff11f",
    "redirect_url": "https://mono.co",
    "customer": {
		"name": "Samuel Olamide",
        "email": "samuel@neem.co"
    }
}'
```

### Payment Institution Redirection

When initiating a payment through Directpay and having prior knowledge of the user's bank details, you can include an institution object in the Payment Initiation API request. This object includes:

-   `id`: This field expects the user's institution ID, obtainable from our bank listing endpoint [here](/api/miscellaneous/bank-coverage).

-   `auth_method`: Here, specify the authentication method of the institution, such as _mobile\_banking_ or _internet\_banking_.

-   `account_number`: For institutions like GTB, provide the account number method when utilizing the pay with account number (PWA) option on the widget.


Note: When providing the institution object, the `auth_method` field is optional.

Upon calling the Payment Initiation API with the institution object included in the payload, a URL is generated. Users can use this URL to complete the payment. Opening the URL displays the login page for the preconfigured institution.

### API request

### Request

123456789101112131415161718192021

```js
curl --request POST \
     --url https://api.withmono.com/v2/payments/initiate \
     --header 'Accept: application/json' \
     --header 'Content-Type: application/json' \
     --header 'mono-sec-key: test_sk_from_your_dashboard' \
     --data '
{
    "amount": 20000,
    "type": "onetime-debit",
    "description": "testing",
    "reference": "ref0000100000001",
    "redirect_url": "https://mono.co",
    "institution": {
        "id": "5f2d08bf60b92e2888287704",
        "auth_method": "internet_banking"
    },
    "customer": {
		"name": "Samuel Olamide",
        "email": "samuel@neem.co"
    }
}'
```

#### On this page

overview

Step 1 initiate the payment request

Step 2 customer authorizes payment

Step 3 track payment status

returning users account id

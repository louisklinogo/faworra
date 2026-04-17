---
title: "SDK Guide"
source_url: "https://docs.mono.co/docs/payments/sdk-guide"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Integrate the Mono DirectPay widget into your application for a seamless checkout experience."
---# SDK Guide

Last updated December 17th, 2023

## Overview

To easily integrate Directpay via the widget into your current solution, please proceed with the following steps below. This straightforward guide makes it easy to implement your application's payment features with Directpay.

Step 1: Make an API call to our Initiate Payments API
Step 2: Instantiate the Directpay widget with the Payment ID
Step 3: Verify payments via Webhooks or our Verify API

![Prerequisites](/images/callout/bulb.png)

Prerequisites

To get started, please ensure to:

-   Sign up on the [Mono Dashboard.](https://app.mono.co/signup)
-   [Create an App](/docs/create-app) and fetch the generated Secret Key.

### Integration Steps

#### Step 1: Make an API call to our Initiate Payments API

The first step to take will be to call our Initiate Payments API. The reason for taking this step is to get our Payment ID from our API response so we can easily pass this to the direct page widget for authorisation from your customers.

For a one-time debit, ensure to pass in these required fields such as your amount (**in Kobo**), payment type (one-time), a unique reference id (i.e minimum of 10 unique digits), a payment description to inform your user the purpose of this debit and your secret key in your headers which can be gotten from your already existing dashboard application.

Other non-required fields include an Account ID field, a redirect URL field (i.e to redirect users after a successful or failed payment; check [here](/api/directpay/redirect-urls) for more info) and a meta-object for extra payload information.

![Note](/images/callout/bulb.png)

Note

On your directpay widget, you can use packages such as [axios](https://npmjs.com/package/axios) or [node-fetch](https://www.npmjs.com/package/node-fetch) to call this API, then proceeding to send the Payment ID to your Directpay widget for completion as explained in Step 2.

**API Reference** [➡](/api/directpay/initiate)

### Request

12345678910111213141516171819202122232425

```curl
curl --request POST \
     --url https://api.withmono.com/v2/payments/initiate \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --header 'mono-sec-key: string' \
     --data '{
"amount": 20000,
"type": "onetime-debit",
"method": "account" //transfer,
"description": "testing",
"reference": "testing-10039819098",
"redirect_url": "https://mono.co",
"customer": {
    "email": "samuel@neem.com",
    "phone": "08122334455",
    "address": "home address",
    "identity": {
        "type": "bvn",
        "number": "22110033445"
    },
    "name": "Samuel Olamide"
},
"meta": {}
}
'
```

### Request

1234567891011121314151617181920

```js
{
    "status": "successful",
    "message": "Payment Initiated Successfully",
    "data": {
        "id": "ODXOMMMMMMM8O",
        "mono_url": "https://checkout.mono.co/ODXOMMMMMMM8O",
        "type": "onetime-debit",
        "method": "account",
        "amount": 20000,
        "description": "testing",
        "reference": "testing-1003981909",
        "customer": "65f7f6c7fa3999999980ecb70",
        "redirect_url": "https://mono.co",
        "created_at": "2024-03-18T08:09:43.787Z",
        "updated_at": "2024-03-18T08:09:43.787Z",
        "meta": {},
        "liveMode": true
    }
}

```

#### Step 2: Instantiate the Directpay widget with the Payment ID

With step one out of the way, we can now proceed with this step to instantiate our Directpay widget.

What you simply need to do here is to update your Directpay data callback in your [widget](https://github.com/withmono/connect.js) with the Payment ID field, which you have already received from Step 1 above and your scope callback to payments.

Upon payment successful completion from your customer, we can now move over to the next step.

**Callback Reference** [➡](https://github.com/withmono/connect.js)

### Request

12345678910111213

```js
...
...

const monoWidget = new Connect({
  key: "live_pk_from_your_dashboard",
  scope: "payments",
  data: {
    payment_id: "txreq_HeqMWnpWVvzdpMXiB4I123456"
  }
});

monoWidget.setup();
monoWidget.open()
```

#### Step 3: Verify payments via Webhooks or our Verify API

In this step, your customer is assumed to have completed payment whether successful or failed. Payment verification can now be done in two ways:

-   Webhook Events.
-   Verify Payment Status API.

#### Webhook Events.

With this out of the way, as soon as your customer authorises payments from their respective bank accounts via the Directpay widget, and it's either successful or failed, webhook events will be sent to this effect.

The various webhook events that get sent for a one-time payments can be found on our documentation page [here](/docs/payments/onetime/webhook-events).

![Note](/images/callout/bulb.png)

Note

On your directpay widget, you can use packages such as [axios](https://npmjs.com/package/axios) or [node-fetch](https://www.npmjs.com/package/node-fetch) to call this API, then proceeding to send the Payment ID to your Directpay widget for completion as explained in Step 2.

![Note](/images/callout/bulb.png)

Note

It is important to have a Webhook URL added to your Mono dashboard application. This would enable your business to recieve real-time webhook event notifications from your customers for both successful or failed payments. Without a webhook notification set up, tracking payment status might be more difficult.

Please check out this guide [here](https://docs.mono.co/docs/webhooks) on how to set up a webhook URL.

Verifying Payment

Please ensure to verify the payment status via the verify payment [endpoint](/api/directpay/verify) before proceeding to give value for the payment.

#### Verify Payment Status API.

Another alternative to verify payments from your customers is via their payment reference. This reference can be passed to the body request of our Verify Payments Status API to get the current status and customer information of any Directpay payment. Please don't forget to pass your Mono app secret key to your headers.

[**API Reference** ➡](/api/directpay/verify)

#### API request

### Request

12345

```curl
curl --request GET \
     --url https://api.withmono.com/v2/payments/verify/{reference} \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
'
```

#### API Response

### Request

1234567891011121314151617181920212223242526272829303132333435363738394041424344454647484950

```js
{
    "status": "successful",
    "message": "Payment retrieved successfully",
    "timestamp": "2024-04-27T21:57:26.609Z",
    "data": {
        "id": "txdsgcamwweg62h0msjfx512345",
        "channel": "account",
        "fee": 100,
        "type": "onetime-debit",
        "status": "successful",
        "amount": 20000,
        "currency": "NGN",
        "description": "DirectPay Demo",
        "reference": "demo_ref_mxy0mbi123",
        "live_mode": true,
        "account": {
            "id": "65c525b7a6ce43abef77c123",
            "name": "SAMUEL OLAMIDE",
            "account_number": "90123456789",
            "currency": "NGN",
            "balance": 478915,
            "type": "WALLET ACCOUNT",
            "bvn": "98765432123",
            "live_mode": true,
            "institution": {
                "name": "Opay",
                "type": "PERSONAL_BANKING",
                "timeout": 50000,
                "available": true,
                "base64_icon": "",
                "scope": [
                    "payments",
                    "financial_data"
                ],
                "bank_code": "100004"
            },
            "scope": [
                "payments"
            ]
        },
        "refunded": false,
        "device_fingerprint": "12345678-123b-45db-b678-91a0a2ed1234",
        "ip_address": "1.1.1.1",
        "created_at": "2024-04-10T01:51:54.189Z",
        "updated_at": "2024-04-12T05:24:51.396Z",
        "meta": {
            "locked": null
        }
    }
}
```

#### On this page

Overview

Step 1 Make an API call to Initiate Payments API

Step 2 Instantiate the Directpay widget

Step 3 Verify payments

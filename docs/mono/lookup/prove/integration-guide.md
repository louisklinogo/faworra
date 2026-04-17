---
title: "Mono Prove Integration Guide"
source_url: "https://docs.mono.co/docs/lookup/prove/integration-guide"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Seamlessly verify and validate user identities across Africa with Mono Prove."
---# Mono Prove Integration Guide

Last updated January 19th, 2026

## Overview

This guide will put you through the necessary steps to take when trying to integrate Mono Prove into your software solution via API. This is made possible via a generated URL that can be sent to users for them to complete the process without a need for setting up SDKs.

![Prerequisites](/images/callout/bulb.png)

Prerequisites

To get started, you need to:

-   Sign up on the [Partner Dashboard](https://app.mono.co/signup) and complete KYB.
-   [Create a `prove` app](/docs/create-app) and retrieve your Secret key.
-   Configure a [webhook URL](/docs/webhooks) in your dashboard to receive event notifications (you can use [webhook.site](https://webhook.site/) for testing).

![Re: Sandbox/Test Enviroment](/images/callout/bulb.png)

Re: Sandbox/Test Enviroment

-   Kindly note that to test Prove in sandbox you simply need to pass your test keys in the headers of your request. You can find the test keys on your dashboard as shown by [this guide](https://support.mono.co/en/articles/7066615-what-are-public-and-secret-keys).

-   We also send test webhooks in sandbox to simplify your integration experience.

-   The credentials passed for testing Prove in sandbox are random credentials.


## Integration Guide

With the above prerequisite steps already taken, please note that there are three stages for completing the integration process:

#### Step 1: Initiate Prove Session

Make an API call to the Initiate Prove API endpoint. The API response will provide the necessary session initiation data. This data will contain either a `mono_url` for browser-based flows, or a `request id` for SDK integrations.

#### Step 2: User Session Access Setup

There are two ways to access this, namely:

a. **SDK Integration:** Instantiate the Prove web or mobile SDK widget using the provided **request ID**.

b. **Prove Link:** Direct the user to the provided **mono\_url** in their web browser. Optionally the user may receive an email containing the same link.

#### Step 3: Identity Verification Onboarding:

The user will complete the identity verification process within the widget, which may include providing personal details, uploading/scanning documents, facial recognition, and granting necessary permissions.

## Step 1: Initiate Prove Session

Initiate a call to the Prove API endpoint as shown below, providing key parameters such as customer information, KYC level, and tier type etc, which returns a response that will include the necessary initiation data, providing either `mono_url` for browser-based completion or a `request id` for SDK integration.

### Request

123456789101112131415161718192021

```js
curl --request POST \
     --url https://api.withmono.com/v1/prove/initiate \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --header 'mono-sec-key: <Your Secret Key>' \
     --data '{
    "reference": "testreference123",
    "redirect_url": "https://mono.co",
    "kyc_level": "tier_1", // or tier_2 or tier_3
    "bank_accounts": true,
    "customer": {
        "name": "Samuel Olamide",
        "phone": "08012345678",
        "email": "samuel.olamide@neem.com",
        "address": "20, Angel's Place, Eke street off NTA road, Ikeja Lagos",
        "identity": {
            "type": "BVN", // can either be BVN or NIN
            "number": "12345678900"
        }
    }
}'
```

##### Body Request Descriptions

<table class="w-full space-y-2.5 border-separate border-spacing-y-2.5 my-5 first:mt-0"><tbody class="[&amp;:first-child_tr]:bg-gray-100 [&amp;:first-child_tr]:font-medium"><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><strong>Field</strong></td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">Type</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">Description</td></tr></tbody><tbody class="[&amp;:first-child_tr]:bg-gray-100 [&amp;:first-child_tr]:font-medium"><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><strong>reference</strong></td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">String</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">A unique identifier for the verification session (e.g., "test-reference-41").</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><strong>redirect_url</strong></td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">String</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">URL to redirect the user after verification completion (e.g., "https://mono.co").</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><strong>kyc_level</strong></td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">String</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">The level of KYC verification required. e.g tier_1, tier_2 or tier_3</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><strong>bank_accounts</strong></td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">Boolean</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">Determines if bank account details should be verified (true or false).</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><strong>customer.name</strong></td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">String</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">This field expects the name of the customer</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><strong>customer.email</strong></td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">String</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">This field expects the email of the customer</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><strong>customer.address</strong></td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">String</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">This field expects the address of the customer</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><strong>customer.phone</strong></td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">String</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">This field expects the phone number of the user. The customer must ensure that the provided phone number is linked to their BVN</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><strong>customer.identity.type</strong></td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">String</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">This field expects identity type i.e. bvn or nin</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><strong>customer.identity.number</strong></td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">String</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">This field expects the identity number</td></tr></tbody></table>

### Request

12345678910111213141516

```js
{
    "status": "successful",
    "message": "Request completed successfully",
    "timestamp": "2025-01-10T21:47:35.919Z",
    "data": {
        "id": "reRVZW59A3Q123",
        "customer": "67d18b0770caaed57fe3tb2bw",
        "mono_url": "https://prove.mono.co/reRVZW59A3Q123",
        "reference": "testreference123",
        "redirect_url": "https://mono.co",
        "bank_accounts": true,
        "kyc_level": "tier_1",
        "is_blacklisted": false
        "live_mode": true
    }
}
```

![KYC Level Breakdown](/images/callout/bulb.png)

KYC Level Breakdown

-   tier\_1: Validating only the BVN and NIN numbers and verifying ownership of the submitted identity numbers with facial recognition.

-   tier\_2: Validating BVN, NIN, a government-issued identification document, and verifying ownership of the submitted document with facial recognition.

-   tier\_3: Validating BVN, NIN, government ID, and address, verifying ownership of the submitted documents with facial recognition, and confirming the user resides at the provided address.


## Step 2: User Session Access Setup

Users in this step can complete verification through two convenient methods: integrating the Prove web or mobile SDK using a request ID or accessing the verification process via a unique Prove Link (mono\_url), which can also be sent via email for easy access. This can be achieved in either of the explained ways below:

##### Step 2a: SDK implementation

With step one out of the way, we can now proceed with this step to instantiate the prove widget via the vanilla js implementation.

What you simply need to do here is to update your Prove SDK [**widget**](https://github.com/withmono/prove.js) with the `requestid` field, which you have already received from Step 1 above.

Here’s the JavaScript SDK example below, you can find more Prove SDKs [here](https://github.com/withmono/).

### Request

123456789101112131415161718192021222324252627282930

```js
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
  </head>

  <div>
    <button id="cta" onclick="window.prove.open()">Click Me</button>
  </div>

  <body>
    <script src="../index.js" type="module"></script>
    <script type="module">
      import Prove from "../index.js";

      const prove = new Prove({
        requestId: "reRVZW59A3Q00I",
        onLoad: () => console.log("LOADED"),
        onEvent: console.log,
        onSuccess: console.log,
      });

      prove.setup();

      window.prove = prove;
    </script>
  </body>
</html>
```

![SDK Demo](/images/callout/bulb.png)

SDK Demo

You can find a demo web app that implements this flow [here](https://provesdkapp.netlify.app).

##### Step 2b: Instantiate the widget using the Mono URL.

To do this, send the user the `mono_url` gotten in the response from Step 1 (in this case, 'https://prove.mono.co/reRVZW59A3Q123'. They can open this link in their browser to complete the verification process.

![URL Demo](/images/callout/bulb.png)

URL Demo

You can find a demo web app that implements this flow [here](https://provepoc.netlify.app).

## Step 3: Identity Verification Onboarding.

To complete the verification, the user will be guided through a series of steps.

-   First, your user will need to enter their phone number and date of birth, followed by selecting their preferred OTP method.

-   Next, depending on their tier, after receiving and inputting the OTP, they will be prompted to verify their NIN/BVN and provide a government-issued ID, such as a passport or driver's license, along with their address.

-   Next, they will add their bank account details and grant permission for data access.

-   They will then choose their access type and perform a facial recognition check.


Please note: There are two access types available to users: Continuous access and one-time access. Continuous access grants access to the user's data indefinitely, while the one-time access enables users to determine a time frame for the data access granted.

-   Finally, they will have the option to save their data for future verifications before completing the process.

Upon successful completion, you'll receive a mono.prove.data\_verification\_successful webhook confirmation.

## Manual Face-ID Verification

The **Prove Face-ID Manual Review** feature enables you to manually validate users whose automated facial recognition attempts fail repeatedly. These failures may occur due to poor lighting, visual impairments, low-quality selfies, or potential fraudulent activity.

After **three unsuccessful automated attempts**, the system automatically transitions the session into a **manual review state** and notifies the partner to review the submitted images via the Partner Dashboard.

Kindly follow the steps below to manually validate users:

1.  Log in to the Mono Dashboard.

2.  On the Prove module, navigate to awaiting review tab.

3.  Click on the verification you want to review to open its details.

4.  -   From here, you can approve or reject the verification if the face-id matches or not
    -   Once a verification is approved, its status will update to successful, and the corresponding webhooks and email notifications will be sent to the business.
    -   If a verification is rejected, the system notifies the user via email and sends a verification.rejected webhook event to the business.

## Mono Prove Webhooks

Mono Prove uses webhooks to deliver key information about identity verification sessions. When a verification event occurs (initiation, success, cancellation, or expiration), Mono sends a POST request to your designated URL. This allows you to receive and process verification updates, such as session status and customer data, within your system's workflow.

##### 1\. Verification Initiated Webhook (mono.prove.data\_verification\_initiated)

This webhook is triggered when the initiate session is successfully created.

### Request

123456789101112131415161718

```js
  {
    "event": "mono.prove.data_verification_initiated",
    "data": {
      "app": "67b5c78477237d041a069bd0",
      "business": "60cc8f95ba1772018c5c6b1d",
      "id": "PRVQ1B9JR5123",
      "status": "pending",
      "reference": "test-reference-03",
      "created_at": "2025-02-28T09:24:32.823Z",
      "kyc_level": "tier_1",
      "bank_accounts": false,
      "is_blacklisted": false,
      "blacklist_count": 0,
      "meta": {
        "ref": "1234"
      }
    }
  }
```

##### 2\. Verification Successful Webhook (mono.prove.data\_verification\_successful)

This webhook is triggered when the customer data is verified and successfully shared with the business.

### Request

12345678910111213141516171819202122

```js
{
    "event": "mono.prove.data_verification_successful",
    "data": {
      "id": "PRVJM0POABY04",
      "customer": {
        "id": "67c07e5dcde95dbf8c2f2c7e",
        "name": "SAMUEL OLAMIDE",
        "email": "samuel@neem.co"
      },
      "reference": "ref-9",
      "status": "successful",
      "created_at": "2025-03-04T12:53:49.839Z",
      "kyc_level": "tier_1",
      "bank_accounts": true,
      "data_access": {
        "start_date": null,
        "end_date": null,
        "type": "permanent"
      },
      "app": "67b5c78477237d041a069bd0",
      "business": "60cc8f95ba1772018c5c6b1d"
    }
```

##### 3\. Verification Cancelled Webhook (mono.prove.data\_verification\_cancelled)

This webhook is triggered when a customer cancels their data verification.

### Request

123456789101112131415161718

```js
{
    "event": "mono.prove.data_verification_cancelled",
    "data": {
      "id": "PRVG62L211UN2",
      "customer": {
        "id": "67c07e5dcde95dbf8c2f2c7e",
        "name": "SAMUEL OLAMIDE",
        "email": "samuel@neem.co"
      },
      "reason": "I am not comfortable sending my ID photo",
      "reference": "ref-7",
      "status": "cancelled",
      "created_at": "2025-03-03T15:01:15.587Z",
      "kyc_level": "tier_2",
      "bank_accounts": true,
      "app": "67b5c78477237d041a069bd0",
      "business": "60cc8f95ba1772018c5c6b1d"
    }
```

##### 4\. Verification Expired Webhook (mono.prove.data\_verification\_expired)

This webhook is triggered when a customer's data verification expires after 24 hours of non-completion.

### Request

123456789101112131415161718192021222324252627

```js
{
    "event": "mono.prove.data_verification_expired",
    "data": {
      "id": "PRVXH82GO8123",
      "reference": "ref-6",
      "status": "expired",
      "created_at": "2025-03-03T12:20:20.829Z",
      "kyc_level": "tier_1",
      "bank_accounts": true,
      "app": "67b5c78477237d041a069bd0",
      "business": "60cc8f95ba1772018c5c6b1d",
      "attempts": 0, // otp authentication attempts
      "error_logs": [ //last 3 errors before link expiration
        {
          "timestamp": 1741006286345,
          "message": "Unable to complete request"
        },
        {
          "timestamp": 1741006398337,
          "message": "Unable to complete request"
        },
        {
          "timestamp": 1741009395153,
          "message": "Unable to complete request"
        }
      ]
    }
```

##### 5\. Verification Awaiting Review Webhook (mono.prove.data\_verification\_awaiting\_review)

This webhook event is sent after a customer makes three consecutive failed attempts for facial verification, the widget will automatically transition to the manual review state and this webhook event is sent.

### Request

1234567891011121314151617181920212223

```js
{
    "event": "mono.prove.data_verification_awaiting_review",
    "data": {
      "id": "PRVJM0POABY04",
      "customer": {
        "id": "67c07e5dcde95dbf8c2f2c7e",
        "name": "SAMUEL OLAMIDE",
        "email": "samuel@neem.co",
        "phone":"08107757033"
      },
      "reference": "ref-9",
      "status": "awaiting_review",
      "created_at": "2025-03-04T12:53:49.839Z",
      "kyc_level": "tier_1",
      "bank_accounts": true,
      "data_access": {
        "start_date":null,
        "end_date":null,
        "type": "permanent"
      },
      "app": "67b5c78477237d041a069bd0",
      "business": "60cc8f95ba1772018c5c6b1d"
    }
```

##### 6\. Verification Rejected Review Webhook (mono.prove.data\_verification\_awaiting\_review)

This webhook event is sent when the Face Id verification is rejected,

### Request

1234567891011121314151617181920

```js
"event": "mono.prove.data_verification_rejected",
    "data": {
      "id": "PRVXKVZVJKIF7",
      "customer": {
        "id": "6895e4317b220b847b9774b3",
        "name": "Toluwalase Olufemi",
        "email": "toluwalase@mono.co",
        "phone": "+2347058214091"
      },
      "reason": "Face doesn’t match ID",
      "reference": "bm04b67lntpdrer90y4w3m8n",
      "status": "rejected",
      "created_at": "2025-11-12T11:48:08.697Z",
      "kyc_level": "tier_1",
      "bank_accounts": false,
      "app": "67ac702ab84447f98209ecec",
      "business": "60cc8f95ba1772018c5c6b1d",
      "live_mode": true
    }
  }
```

## Resources

[Initiate Prove API](/api/prove/initiate)

[Fetch Customer Details](/api/prove/fetch-customer-details)

[Fetch All Shared Customers Details](/api/prove/fetch-all-customer-details)

[Blacklist Customer](/api/prove/blacklist-customer)

[Whtelist Customer](/api/prove/whitelist-customer)

[Revoke Data Access](/api/prove/revoke-data-access)

#### On this page

Overview

integration guide

step 1 initiate prove session

step 2 user session access setup

step 3 identity verification onboarding

manual face ID verification

mono prove webhooks

resources

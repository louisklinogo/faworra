---
title: "BVN Lookup Integration Guide"
source_url: "https://docs.mono.co/docs/lookup/bvn-igree"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Securely retrieve BVN identification details or a full list of associated bank accounts using the NIBSS iGree consent platform."
---# BVN Lookup Integration Guide

Last updated February 20th, 2026

## Overview

Our BVN lookup integration leverages the NIBSS iGree consent platform to enable retrieve your customers' BVN details or bank accounts associated with their BVN, with their consent. To effortlessly incorporate this feature into your application, please follow the steps outlined below.

⚠️ Billing Notice: BVN Lookup

All BVN Lookup API requests are billable, including failed lookups (e.g. BVN not found or invalid).

To avoid unnecessary charges:

-   Validate BVNs before calling the API (BVNs must be 11-digit numeric values).

-   Avoid bulk or blind verification of unverified BVNs.

-   Implement throttling and monitor failed request rates.


If you need BVN Lookup temporarily disabled to prevent charges, contact your account manager or email support@mono.co

![Prerequisites](/images/callout/bulb.png)

Prerequisites

To get started, you need to:

-   Sign up on the [Partner Dashboard](https://app.mono.co/signup) and complete KYB.
-   [Create a `lookup` app](/docs/create-app) and retrieve your Secret key.
-   Retrieve your Sandbox test credentials from the [Sandbox page](/docs/sandbox#lookup).

## Integration Steps

With the above prerequisite steps taken, please note that there are three stages for completing the integration process:

1.  Initiate Lookup: At this stage, your user must grant consent for the BVN lookup by providing their BVN ID. Depending on the desired extent of the BVN lookup, you have two options: passing "identity" as the scope to retrieve identity details or “bank\_accounts” to retrieve all bank accounts associated with the user’s BVN.

2.  Verify OTP: In this step, you should submit the user’s chosen verification method as indicated in the response from the previous stage.

3.  Fetch Details: You will need to supply the OTP sent to the user to access the information (either BVN Details or Bank accounts), depending on the scope specified during the initiation process.


### Step 1: Initiate Lookup

This API call initiates a BVN consent request by providing the BVN value and scope (if necessary). The `bvn` value should be passed as a required field in the request body. Upon successful initiation, the API will respond with a session ID and available verification methods.

To initiate a BVN lookup, send a POST request to the following endpoint:

### Request

1

```js
POST https://api.withmono.com/v2/lookup/bvn/initiate
```

### Request Body Parameters

-   bvn (required): The Bank Verification Number (BVN) you want to look up.

### cURL Sample Request

### Request

12345678

```curl
curl -X POST \
  -H "Content-Type: application/json" \
  -H "mono-sec-key: YOUR_MONO_SECRET_KEY" \
  -d '{
    "bvn": "12345678901"
    "scope": "bank_accounts" // or identity
  }' \
  https://api.withmono.com/v2/lookup/bvn/initiate
```

### Success Response

If the initiation request is successful, you will receive the following response:

### Request

12345678910111213141516171819202122232425

```js
{
  "status": "successful",
  "message": "BVN Lookup successfully initiated.",
  "data": {
    "session_id": "74c8fe70-ea2c-458e-a99f-3f7a6061632c",
    "methods": [
      {
        "method": "email",
        "hint": "An email with a verification code will be sent to tomi***jr@gmail.com"
      },
      {
        "method": "phone",
        "hint": "Sms with a verification code will be sent to phone 0818***6496"
      },
      {
        "method": "phone_1",
        "hint": "Sms with a verification code will be sent to phone 0818***9343"
      },
      {
        "method": "alternate_phone",
        "hint": "Sms with a verification code will be sent to your alternate phone number"
      }
    ]
  }
}
```

### Step 2: Verify OTP

This API call verifies the BVN using the OTP received by the user. You need to pass the `method` field with the chosen verification method and, if `alternate_phone` is selected, you must include the `phone_number` field with the associated phone number. Make sure to include the `x-session-id` header with the session ID received from Step 1.

To verify the BVN using the One-Time Password (OTP) received by the user, send a POST request to the following endpoint:

### Request

1

```js
POST https://api.withmono.com/v2/lookup/bvn/verify
```

### Request Body Parameters

-   method (required): The verification method. Choose from "phone", "phone\_1", "alternate\_phone", or "email".
-   phone\_number (required for method=alternate\_phone): The phone number associated with the alternate verification method.

### cURL Sample Request

### Request

123456789

```js
curl -X POST \
  -H "Content-Type: application/json" \
  -H "mono-sec-key: YOUR_MONO_SECRET_KEY" \
  -H "x-session-id: SESSION_ID_FROM_STEP_1" \
  -d '{
    "method": "alternate_phone",
    "phone_number": "08123456789"
  }' \
  https://api.withmono.com/v2/lookup/bvn/verify
```

### Success Response

If the verification request is successful, you will receive the following response:

### Request

123456

```js
{
    "status": "successful",
    "message": "Please enter the OTP that was sent to 09066662020",
    "timestamp": "2024-05-06T14:28:01.988Z",
    "data": null
}
```

### Step 3: Fetch Details

This stage retrieves either the BVN Details or Bank accounts, depending on the scope specified during the initiation process. Include the `otp` field in the request body. Make sure to include the `x-session-id` header with the session ID received from Step 1.

To fetch the details, send a POST request to the following endpoint:

### Request

1

```js
POST https://api.withmono.com/v2/lookup/bvn/details
```

### Request Body Parameters

-   otp (required): The One-Time Password (OTP) received by the user.

### cURL Sample Request

### Request

12345678

```js
curl -X POST \
  -H "Content-Type: application/json" \
  -H "mono-sec-key: YOUR_MONO_SECRET_KEY" \
  -H "x-session-id: SESSION_ID_FROM_STEP_1" \
  -d '{
    "otp": "123456"
  }' \
  https://api.withmono.com/v2/lookup/bvn/details
```

### Success Response (when scope is Identity)

If the request is successful and the scope during the BVN intiation was **identity**, you will receive the following response:

### Request

1234567891011121314151617181920212223242526

```js
{
  "status": "successful",
  "message": "BVN details successfully fetched.",
  "timestamp": "2024-04-30T09:44:04.577Z",
  "data": {
    "first_name": "Samuel",
    "last_name": "Olamide",
    "middle_name": "Nomo",
    "dob": "2020-01-06",
    "phone_number": "08012345616",
    "phone_number_2": null,
    "email": "nomo@test.com",
    "gender": "Male",
    "state_of_origin": "Lagos State",
    "bvn": "12345678901",
    "nin": "000000000",
    "nationality": "Nigeria",
    "address": "12 BEN STREET LAGOS",
    "registration_date": "2020-01-06",
    "lga_of_origin": "yaba",
    "lga_of_Residence": "yaba",
    "marital_status": "single",
    "watch_listed": true,
    "photoId": "image_base64"
  }
}
```

### Success Response (when scope is Bank Accounts)

If the request is successful and the scope during the BVN intiation was **bank\_accounts** , you will receive the following response:

### Request

12345678910111213141516171819202122232425262728293031

```js
{
  "status": "successful",
  "message": "BVN bank accounts successfully fetched.",
  "timestamp": "2026-02-18T08:55:02.979Z",
  "data": [
    {
      "account_name": "Samuel Olamide",
      "account_number": "1234567890",
      "account_type": "SAVINGS",
      "account_designation": "INDIVIDUAL",
      "institution": {
          "name": "OPAY DIGITAL SERVICES LIMITED",
          "branch": "4661483",
          "bank_code": "00711",
          "nip_code": "100004"
      }
    },
    {
      "account_name": "Olamide Samuel",
      "account_number": "1234509384",
      "account_type": "SAVINGS",
      "account_designation": "INDIVIDUAL",
      "institution": {
          "name": "Zenith Bank",
          "branch": "4653237",
          "bank_code": "057",
          "nip_code": "000015"
      }
    }
  ]
}
```

#### Institution object fields (`scope=bank_accounts`)

<table class="w-full space-y-2.5 border-separate border-spacing-y-2.5 my-5 first:mt-0"><tbody class="[&amp;:first-child_tr]:bg-gray-100 [&amp;:first-child_tr]:font-medium"><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">Field</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">Type</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">Description</td></tr></tbody><tbody class="[&amp;:first-child_tr]:bg-gray-100 [&amp;:first-child_tr]:font-medium"><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">name</code></td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">string</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">The official name of the financial institution.</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">bank_code</code></td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">string</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">The 3 to 5-digit code assigned by the CBN (e.g., <code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">058</code>, <code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">00711</code>).</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">nip_code</code></td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">string</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">The unique NIBSS Instant Payment identifier (e.g., <code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">000013</code>, <code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">100004</code>).</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">branch</code></td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">string</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">The internal branch identifier associated with the account.</td></tr></tbody></table>

![Implementation Note](/images/callout/bulb.png)

Implementation Note

If a bank is not yet mapped in our registry, the `nip_code` may return as `null`. In such cases, fall back to `bank_code` or `institution.name` for your internal logic.

![How BVN Lookup Endpoints Are Charged](/images/callout/bulb.png)

How BVN Lookup Endpoints Are Charged

Each endpoint in the BVN iGree lookup flow is charged separately:

1.  [**Initiate Lookup**](/api/bvn/initiate): Charged when you initiate a BVN lookup.
2.  [**Verify OTP**](/api/bvn/verify-otp): Charged when an OTP is sent to the user's contact method.
3.  [**Fetch Details**](/api/bvn/fetch-bvn): Charged when you successfully retrieve identity details or bank accounts.

See the pricing for the latest BVN lookup pricing [here](https://support.mono.co/en/articles/11071042-updated-mono-new-product-pricing-nigeria).

**Important**: During service downtimes, if you successfully verify OTP but cannot fetch details, you will still be charged for the Verify OTP endpoint as the OTP service provider has already incurred costs. We recommend monitoring service status announcements and implementing retry logic to handle such scenarios.

If you receive a non-200 response from any endpoint, you are not charged for that specific request.

#### On this page

Overview

Integration Steps

Step 1 Initiate Lookup

Step 2 Verify OTP

Step 3 fetch details

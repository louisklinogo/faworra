---
title: "TIN Lookup Integration Guide"
source_url: "https://docs.mono.co/docs/lookup/tin-lookup"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Verify Tax Identification Numbers for individuals and corporate entities with Lagos and FIRS records."
---# TIN Lookup Integration Guide

Last updated February 27th, 2026

## Overview

Our TIN Lookup service enables you to retrieve critical information associated with a Tax Identification Number (TIN). This guide will take you through the process of integrating this service into your application, allowing you to seamlessly access TIN-related details.

![Prerequisites](/images/callout/bulb.png)

Prerequisites

To get started, you need to:

-   Sign up on the [Partner Dashboard](https://app.mono.co/signup) and complete KYB.
-   [Create a `lookup` app](/docs/create-app) and retrieve your Secret key.
-   Retrieve your Sandbox test credentials from the [Sandbox page](/docs/sandbox#lookup).

## Integration Steps

## Step 1: Make a TIN Lookup Request

To retrieve TIN-related information, send a POST request to the following endpoint:

### Request

1

```js
POST https://api.withmono.com/v3/lookup/tin
```

### Request Body Parameters

-   `number` (required): Provide the Tax Identification Number (TIN) or the Corporate Affairs Commission (CAC) RC number for the lookup.
-   `channel` (required): Specify the channel as "tin" or "cac".

![Specifying Channels and Number](/images/callout/bulb.png)

Specifying Channels and Number

The TIN Lookup can be used to verify details of both individuals and businesses. For individuals, you can only pass `tin` in the `channel` field. However, for businesses, you can choose to pass either `tin` or `cac` in the `channel` field. When passing `cac` in the `channel` field, you must pass the RC number in the `number` field.

Include these two parameters in the request body to specify the TIN number and channel for the lookup.

### Request Headers

Include the following header in your request for authentication:

-   `mono-sec-key` (required): Your Mono secret key.

### cURL Sample Request

### Request

12345678

```js
curl -X POST \
  -H "Content-Type: application/json" \
  -H "mono-sec-key: YOUR_MONO_SECRET_KEY" \
  -d '{
    "number": "TIN_NUMBER", //RC_NUMBER
    "channel": "tin" // cac
  }' \
  https://api.withmono.com/v3/lookup/tin
```

## Step 2: Process the Response

The response for both individual and business TIN lookup requests are similar. What differentiates one from the other is the `tin_type` returned in the response, which can either be `individual` or `corporate`.

Individual TIN validation note

TINs in this flow can belong to individuals or corporates based on `tin_type`. For individual TIN validation (`tin_type: individual`), the upstream provider currently does not return `taxpayer_name`.

To complete matching on your end, use the returned `email` and `phone_number` fields to verify the customer against your existing records.

### Sample response for BUSINESSES

If the TIN lookup request is successful for a business, you will receive the following response:

### Request

123456789101112131415161718

```js

{
    "status": "successful",
    "message": "Lookup Successful",
    "timestamp": "2024-05-15T14:34:56.231Z",
    "data": {
        "taxpayer_name": "NOMO TECHNOLOGIES NIGERIA LIMITED",
        "cac_reg_number": "RC0000015",
        "firstin": "20000071-0001",
        "jittin": "1000800004",
        "nrs_tin": "2622431609295",
        "tax_office": "LTO FINANCIAL SERVICES",
        "phone_number": "08012345678",
        "email": "hi@nomo.co",
        "address": "PLOT 1230, AHMADU BELLO WAY, VICTORIA ISLAND, LAGOS, NIGERIA",
        "tin_type": "CORPORATE"
    }
}
```

### Sample response for INDIVIDUALS

If the TIN lookup request for an individual is successful, you will receive the following response:

### Request

123456789101112131415161718

```js

{
    "status": "successful",
    "message": "Lookup Successful",
    "timestamp": "2024-05-15T14:38:52.908Z",
    "data": {
        "taxpayer_name": null,
        "cac_reg_number": "1060000000",
        "firstin": "1060000000",
        "jittin": "1060000000",
        "nrs_tin": null,
        "tax_office": "Lagos Internal Revenue Service",
        "phone_number": "09087654321",
        "email": "samuel@nomo.co",
        "address": "9, Animashaun street, Lagos, Nigeria",
        "tin_type": "INDIVIDUAL"
    }
}
```

The response includes essential TIN-related information such as email, organization number, phone number, registration number, tax office, TIN type, and more.

#### On this page

Overview

Integration Steps

Step 1 Make a TIN Lookup Request

Step 2 Process the Response

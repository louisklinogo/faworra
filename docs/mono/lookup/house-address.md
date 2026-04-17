---
title: "House Address Verification Integration Guide"
source_url: "https://docs.mono.co/docs/lookup/house-address"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Verify physical addresses in Nigeria using meter numbers and power utility records with confidence matching."
---# House Address Verification Integration Guide

Last updated December 18th, 2025

## Overview

The House Address Verification service allows you to verify house addresses and retrieve associated information. This guide will walk you through the process of integrating this functionality into your application, enabling you to perform accurate and efficient address verification.

![Prerequisites](/images/callout/bulb.png)

Prerequisites

To get started, you need to:

-   Sign up on the [Partner Dashboard](https://app.mono.co/signup) and complete KYB.
-   [Create a `lookup` app](/docs/create-app) and retrieve your Secret key.
-   Retrieve your Sandbox test credentials from the [Sandbox page](/docs/sandbox#lookup).

## Integration Steps

## Step 1: Make a Verification Request

To verify a house address, send a POST request to the following endpoint:

### Request

1

```js
POST https://api.withmono.com/v3/lookup/address
```

### Request Body Parameters

-   `meter_number` (required): Provide the meter number associated with the address.
-   `address` (required): Provide a valid house address for verification.
-   `disco_code` (required): Provide a valid disco\_code for verification.

![Disco Codes](/images/callout/bulb.png)

Disco Codes

The disco\_code must be one of the following:

ABUJA, EKO, IKEJA, IBADAN, ENUGU, PH, JOS, KADUNA, KANO, BH, PROTOGY, PHISBOND, ACCESSPOWER, YOLA, ABIA, ADAMAWA, AKWA IBOM, ANAMBRA, BAUCHI, BAYELSA, BENUE, BORNO, CROSS RIVER, DELTA, EBONYI, EDO, EKITI, GOMBE, IMO, JIGAWA, KATSINA, KEBBI, KOGI, KWARA, LAGOS, NASSARAWA, NIGER, OGUN, ONDO, OSUN, OYO, PLATEAU, RIVERS, SOKOTO, TARABA, YOBE, ZAMFARA, FCT

Include these three parameters in the request body to specify the meter number, house address and disco\_code for verification.

### Request Headers

Include the following header in your request for authentication:

-   `mono-sec-key` (required): Your Mono secret key.

### cURL Sample Request

### Request

123456789

```js
curl -X POST \
  -H "Content-Type: application/json" \
  -H "mono-sec-key: YOUR_MONO_SECRET_KEY" \
  -d '{
    "meter_number": "METER_NUMBER",
    "address": "VALID_HOUSE_ADDRESS",
    "disco_code": "VALID_DISCO_CODE"
  }' \
  https://api.withmono.com/v3/lookup/address
```

## Step 2: Process the Response

If the verification request is successful, you will receive the following response:

### Request

123456789101112

```js
{
  "status": "successful",
  "message": "Address successfully verified.",
  "timestamp": "2024-02-28T15:00:20.917Z",
  "data": {
    "verified": true,
    "house_address": "OBA-AKRAN IKEJA LAGOS",
    "house_owner": "SAMUEL OLAMIDE",
    "confidence_level": 55,
    "disco_code": "IKEJA"
  }
}
```

![Understanding Confidence Level & Verified Flag](/images/callout/bulb.png)

Understanding Confidence Level & Verified Flag

The `confidence_level` parameter is a value ranging from **1 to 100**, representing how closely the provided address matches verified sources.

-   If `confidence_level` is **50 or above**, the `verified` flag will be `true`, indicating a strong match.

-   If `confidence_level` is **below 50**, the `verified` flag will be `false`, but other details (such as house address or owner) may still be returned for further review.


For example, if an address cannot be matched, the response may show `verified: false` and a low confidence level (e.g., 4), but additional data may still be provided to assist your verification process.

The response above contains information about the verified status, house address, house owner's name, confidence level, and DISCO code associated with the verified address.

#### On this page

Overview

Integration Steps

Step 1 Make a Verification Request

Step 2 Process the Response

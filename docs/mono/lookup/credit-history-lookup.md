---
title: "Credit History Lookup Integration Guide"
source_url: "https://docs.mono.co/docs/lookup/credit-history-lookup"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Retrieve consent-based credit reports and loan performance history from Nigeria's top credit bureaus."
---# Credit History Lookup Integration Guide

Last updated November 6th, 2024

## Overview

This lookup service enables businesses to retrieve a customer credit history directly from the two largest credit bureaus in Nigeria- Credit Bureau Limited (crc) and First Central Credit Bureau (xds) using only their BVN. This retrieval is subject to customer consent.

![Prerequisites](/images/callout/bulb.png)

Prerequisites

To get started, you need to:

-   Sign up on the [Partner Dashboard](https://app.mono.co/signup) and complete KYB.
-   [Create a `lookup` app](/docs/create-app) and retrieve your Secret key.
-   Retrieve your Sandbox test credentials from the [Sandbox page](/docs/sandbox#lookup).

## Integration Steps

## Step 1: Make a Credit History Lookup Request

To retrieve credit-history-related information, send a POST request to the following endpoint:

### Request

1

```js
POST https://api.withmono.com/v3/lookup/credit-history/{provider}
```

### Request Body Parameter

-   `bvn` (required): Provide a bank verification number for the lookup.

### Request Path Parameter

-   `provider` (required): Specify the provider as "crc", "xds" or "all".

![NOTE](/images/callout/bulb.png)

NOTE

`crc` represents Credit Bureau Limited, `xds` represents First Central Credit Bureau and `all` means credit history data from both institutions.

Include these two parameters in the request body and path parameter to specify the bvn and provider for the lookup.

### Request Headers

Include the following header in your request for authentication:

-   `mono-sec-key` (required): Your Mono secret key.

### cURL Sample Request

### Request

1234567

```js
curl -X POST \
  -H "Content-Type: application/json" \
  -H "mono-sec-key: YOUR_MONO_SECRET_KEY" \
  -d '{
    "bvn": "22*******44"
  }' \
  https://api.withmono.com/v3/lookup/credit-history/crc
```

## Step 2: Process the Response

If the credit history lookup request is successful, you will receive the following response:

### Request

123456789101112131415161718192021222324252627282930313233343536373839404142434445464748495051525354555657585960616263646566

```js

{
  "status": "successful",
  "message": "Report Fetched Successfully",
  "timestamp": "2024-02-28T15:00:20.917Z",
  "data": {
    "providers": ["xds"],
    "profile": {
      "full_name": "SAMUEL OLAMIDE",
      "dob": "26-06-2020",
      "address_history": [
        {
          "address": "8 Professor Gabriel Olusanya St, Lekki, Lagos",
          "type": "Residential",
          "date_reported": "18-12-2019"
        },
        {
          "address": "8 Professor Gabriel Olusanya St, Lekki, Lagos",
          "type": "Residential",
          "date_reported": "17-01-2020"
        }
      ],
      "email_addresses": ["samuel@neem.com"],
      "phone_numbers": ["08082838487"],
      "gender": "male",
      "identifications": [
        {
          "type": "BVN",
          "no": "1223345533454"
        },
        {
          "type": "NIN",
          "no": ""
        },
        {
          "type": "PENCOM",
          "no": ""
        }
      ]
    },
    "credit_history": [
      {
        "institution": "GUARANTY TRUST BANK PLC",
        "history": [
          {
            "date_opened": "30-06-2022",
            "opening_balance": 0,
            "currency": "NGN",
            "performance_status": "performing",
            "tenor": 0,
            "closed_date": "21-06-2022",
            "loan_status": "open",
            "repayment_frequency": "monthly",
            "repayment_amount": 23000000,
            "repayment_schedule": [
              {
                "date": "06-2022",
                "status": "pending"
              }
            ]
          }
        ]
      }
    ]
  }
}
```

The response includes essential identity and contact information, credit history, and all known home addresses amongst other details.

#### On this page

Overview

Integration Steps

Step 1 Make a Credit History Lookup Request

Step 2 Process the Response

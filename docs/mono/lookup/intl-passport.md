---
title: "Int'l Passport Lookup Integration Guide"
source_url: "https://docs.mono.co/docs/lookup/intl-passport"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Programmatically verify Nigerian international passport details, including expiry dates and document types."
---# Int'l Passport Lookup Integration Guide

Last updated December 17th, 2023

## Overview

Our Int'l Passport Lookup service enables you to verify detailed information about an international passport. This guide will walk you through the process of integrating this service into your application, allowing you to retrieve important passport details seamlessly.

![Prerequisites](/images/callout/bulb.png)

Prerequisites

To get started, you need to:

-   Sign up on the [Partner Dashboard](https://app.mono.co/signup) and complete KYB.
-   [Create a `lookup` app](/docs/create-app) and retrieve your Secret key.
-   Retrieve your Sandbox test credentials from the [Sandbox page](/docs/sandbox#lookup).

## Integration Steps

## Step 1: Make a Passport Lookup Request

To retrieve information about an international passport, send a POST request to the following endpoint:

### Request

1

```js
POST https://api.withmono.com/v3/lookup/passport
```

### Request Body Parameters

-   `passport_number` (required): Provide the passport number associated with the document.
-   `last_name` (required): Provide the last name as it appears on the passport document.
-   `date_of_birth` (required): This field expects the date of birth of this user. Expected DOB format: YYYY-MM-DD

Include these two parameters in the request body to specify the passport number and last name for the lookup.

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
    "passport_number": "PASSPORT_NUMBER",
    "last_name": "LAST_NAME_ON_PASSPORT",
    "date_of_birth": "DATE_OF_BIRTH"
  }' \
  https://api.withmono.com/v3/lookup/passport
```

## Step 2: Process the Response

If the passport lookup request is successful, you will receive the following response:

### Request

1234567891011121314151617181920

```js

{
    "status": "successful",
    "message": "Lookup Successful",
    "timestamp": "2024-07-10T15:19:55.510Z",
    "data": {
        "passport_number": "B50500882",
        "issued_date": null,
        "expiry_date": null,
        "document_type": "Standard E-passport",
        "issued_at": null,
        "first_name": "Abdulhamid",
        "last_name": "Hassan",
        "middle_name": "Tomiwa",
        "dob": "06/05/1996",
        "gender": "Male",
        "photo": null,
        "signature": null
    }
}
```

The response contains detailed information about the international passport, including the passport number, reference ID, issued date, expiry date, document type, issued location, name details, date of birth, gender, photo, signature, and mobile number.

#### On this page

Overview

Integration Steps

Step 1 Make a Passport Lookup Request

Step 2 Process the Response

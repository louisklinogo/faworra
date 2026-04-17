---
title: "Drivers License Lookup Integration Guide"
source_url: "https://docs.mono.co/docs/lookup/drivers-license"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Validate user identities using driver's license numbers, birth dates, and official FRSC records."
---# Drivers License Lookup Integration Guide

Last updated December 17th, 2023

## Overview

The driver's license lookup endpoint allows you to look up users' identity information using their driver's license number and a few other details. This guide will walk you through the process of integrating this functionality into your application, enabling you to perform an accurate and efficient verification process.

![Prerequisites](/images/callout/bulb.png)

Prerequisites

To get started, you need to:

-   Sign up on the [Partner Dashboard](https://app.mono.co/signup) and complete KYB.
-   [Create a `lookup` app](/docs/create-app) and retrieve your Secret key.
-   Retrieve your Sandbox test credentials from the [Sandbox page](/docs/sandbox#lookup).

## Integration Steps

## Step 1: Make a Lookup Request

To verify a driver's license information, send a POST request to the following endpoint:

### Request

1

```js
POST https://api.withmono.com/v3/lookup/driver_license
```

### Request Body Parameters

-   `license_number` (required): Provide the user's license number.
-   `date_of_birth` (required): Provide the user's DOB.
-   `first_name` (required): Provide the user's first name.
-   `last_name` (required): Provide the user's last name.

Include these parameters in the request body to specify the license number, date of birth, and first and last name.

### Request Headers

Include the following header in your request for authentication:

-   `mono-sec-key` (required): Your Mono secret key.

### cURL Sample Request

### Request

12345678910111213

```shell
curl --request POST \
     --url https://api.withmono.com/v3/lookup/driver_license \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --header 'mono-sec-key: test_sk_qu0oid3ice8xxkvjswa9' \
     --data '
{
  "license_number": "AAD23208212298",
  "date_of_birth": "1999-12-21",
  "first_name": "Samuel",
  "last_name": "Olamide"
}
'
```

## Step 2: Process the Response

If the verification request is successful, you will receive the following response:

### Request

1234567891011121314151617

```json
{
  "status": "successful",
  "message": "Lookup Successful",
  "timestamp": "2024-02-28T15:00:20.917Z",
  "data": {
    "gender": "Male",
    "photo": null,
    "license_no": "AAD23208212298",
    "first_name": "Samuel",
    "last_name": "Olamide",
    "middle_name": "Nomo",
    "issued_date": "2021-10-07",
    "expiry_date": "2026-06-04",
    "state_ofIssue": "OYO",
    "birth_date": "2020-06-01"
  }
}
```

The response contains information about the verified status, gender, date of issuing, and expiration, amongst other details.

#### On this page

Overview

Integration Steps

Step 1 Make a Lookup Request

Step 2 Process the Response

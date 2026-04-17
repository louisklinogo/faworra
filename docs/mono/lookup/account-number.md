---
title: "Account Number Integration Guide"
source_url: "https://docs.mono.co/docs/lookup/account-number"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Verify bank account holder names and associated BVN details using the Mono Account Number Lookup API."
---# Account Number Integration Guide

Last updated February 28th, 2024

## Overview

The Account Number lookup service allows you to retrieve information associated with a bank account number. Follow the steps below to integrate this functionality into your application.

![Prerequisites](/images/callout/bulb.png)

Prerequisites

To get started, you need to:

-   Sign up on the [Partner Dashboard](https://app.mono.co/signup) and complete KYB.
-   [Create a `lookup` app](/docs/create-app) and retrieve your Secret key.
-   Retrieve your Sandbox test credentials from the [Sandbox page](/docs/sandbox#lookup).

## Integration Steps

## Step 1: Make a Lookup Request

Send a POST request to the following endpoint to initiate the account number lookup:

### Request

1

```js
POST https://api.withmono.com/v3/lookup/account-number
```

### Request Body Parameters

-   `nip_code` (required): The nip code associated with the account. See the list of banks and their nip\_codes [here](https://docs.mono.co/api/miscellaneous/bank-coverage)
-   `account_number` (required): The 10-digit bank account number to lookup.

Include these two parameters in the request body to specify the bank and account number for the lookup.

### Request Headers

Include the following header in your request:

-   `mono-sec-key` (required): Your Mono secret key for authentication.

### cURL Sample Request

### Request

12345678

```curl
curl -X POST \
  -H "Content-Type: application/json" \
  -H "mono-sec-key: YOUR_MONO_SECRET_KEY" \
  -d '{
    "nip_code": "000013",
    "account_number": "0000000"
  }' \
  https://api.withmono.com/v3/lookup/account-number
```

## Step 2: Process the Response

If the request is successful, you will receive the following response:

### Request

1234567891011121314

```js
{
    "status": "successful",
    "message": "Lookup Successful",
    "timestamp": "2024-02-28T15:00:20.917Z",
    "data": {
        "name": "SAMUEL OLAMIDE NOMO",
        "account_number": "0000000",
        "bvn": "0000000000",
        "bank": {
          "name": "GTBank",
          "code": "000013"
        }
    }
}
```

The response contains detailed information about the account, including the account holder's name, account number, associated BVN, and bank details such as the bank name and code.

#### On this page

Overview

Integration Steps

Step 1 Make a Lookup Request

Step 2 Process the Response

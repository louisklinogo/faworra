---
title: "Reauth Link Initiation Guide"
source_url: "https://docs.mono.co/docs/financial-data/reauth-link"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Implement the Mono Re-authorization flow to maintain persistent access to user financial accounts after credential changes."
---# Reauth Link Initiation Guide

Last updated January 28th, 2026

## Overview

This guide will put you through the necessary steps to take when trying to successfully reauthorise an account that has MFA (Multi-factor Authorisation) enabled.

![Prerequisites](/images/callout/bulb.png)

Prerequisites

To get started, please ensure to:

-   Sign up on the [Mono Dashboard.](https://app.mono.co/signup)
-   [Create an App](/docs/create-app) and fetch the generated Secret Key.

## Integration Steps

With the above prerequisite steps taken, please note that there are three stages for completing the integration process:

1.  Initiate Reauth Linking: in this step, an Account reauth URL is generated which should be sent to your users to complete their account reauthorisation process for MFA enabled account, in cases where efforts to retrieve Real-time data returns a "Reauthorization Required" response.
2.  Data Status confirmation and Data Access: The user's financial data availability is confirmed, for financial data access.

## Step 1: Initiate Account Reauth URL

To initiate account reauth URl, send a POST request to the following endpoint:

### Request

1

```js
POST https://api.withmono.com/v2/accounts/initiate
```

### Request Body Parameter

-   `account` (required): This field expects the user's account id that you intend to reauthorise.
-   `scope` (required): Specify the scope as "reauth"
-   `meta` (optional): The meta object expects a "ref" key.
-   `meta.ref`: Specify a unique reference to enable you make ties to the account linked via generated URL.
-   `redirect_url` (optional): This field requires a valid URL for successful account linking redirection.

### Request Headers

Include the following header in your request for authentication:

-   `mono-sec-key` (required): Your Mono secret key.

### cURL Sample Request

### Request

12345678910

```js
curl --request POST \
  --url https://api.withmono.com/v2/accounts/initiate \
  --header 'Content-Type: application/json' \
  --header 'accept: application/json' \
  --data '{
    "meta": { "ref": "099777"},
    "scope": "reauth",
    "account": "65c4c03aa66a95b572cb5a86",
    "redirect_url": "https://mono.co"
    }'
```

### cURL Sample Response

### Request

123456789101112131415161718

```js
{
    "status": "successful",
    "message": "Request was successfully completed",
    "timestamp": "2024-05-01T09:16:35.817Z",
    "data": {
        "mono_url": "https://link.mono.co/ALTAYGCOV",
        "customer": "66312718b0f47",
        "account": "663127dedfbd0",
        "meta": {
            "ref": "099777"
        },
        "scope": "reauth",
        "institution": "5f5b530a67ffc15e5911e0d2",
        "auth_method": "internet_banking",
        "redirect_url": "https://mono.co",
        "created_at": "2024-05-01T09:16:35.809Z"
    }
}
```

## Step 2: Data Status confirmation and Data Access

After a successful account reauth process has taken place in the previous step, an account reauthorisation webhook is sent to your webhook with the account id sent in the payload:

### Request

1234567891011121314

```js
{
  {
    "event": "mono.events.account_reauthorized",
    "event_id": "klB7u33NMmWqAcfZ0V424IgXpN1FcRJFhF62r8Y6oY",
    "timestamp": "2026-01-27T21:00:38.850Z",
    "data": {
      "account": {
        "_id": "697527435Ab9c368c14524b2"
      },
      "app": "68cbf35e95f6deec038a43d9",
      "business": "68ca65a1943f6drecfs4d6c0"
    }
  }
}
```

Next, the data status of this account data status of this account needs to be confirmed as **AVAILABLE**, before going ahead to call the desired financial API endpoints for **updated** data.

All the possible values of a data status are `available`, `processing` or `failed`.

![NOTE](/images/callout/bulb.png)

NOTE

Please note that if you proceed to call our Financial APIs (e.g Transactions, Statements etc) without confirming your data status as **AVAILABLE** after reauthorising, updated data will not be available in your API response.

There are two approaches to getting the data status of a connected account. This can be done,

-   Via the Account Updated Webhook
-   Via the Account Details API

### Via the Account Updated Webhook

Depending on the speed and uptime of the linked bank, it can take roughly 0.1 seconds to a couple of minutes to receive this webhook [event](/docs/financial-data/account-update) on the webhook URL that you have [set up](/docs/webhooks) on your dashboard. Once received, the data status is provided in the meta-object of your JSON response.

Account updated webhook payload:

### Request

12345678910111213141516171819202122232425262728293031

```js
{
    "status": "successful",
    "message": "Request was successfully completed",
    "timestamp": "2024-05-01T09:04:01.459Z",
    "data": {
        "account": {
            "id": "6631279bdedfbd",
            "name": "Samuel Olamide",
            "account_number": "0131883461",
            "currency": "NGN",
            "balance": 22644,
            "type": "SAVINGS_ACCOUNT", // or BUSINESS_BANKING
              "institution": {
              "name": "GTBank",
              "bankCode": "058",
              "type": "PERSONAL_BANKING"
	          },
            "bvn": null // "9422"
        },
        "meta": {
        "data_status": "AVAILABLE | PARTIAL | UNAVAILABLE",
        "auth_method": "internet_banking",
        "ref": "180400887A",
        "retrieved_data": [
            "identity",
            "balance",
            "transactions"
      ]
    }
    }
}
```

### Via the Account Details API

With the Account ID in hand, you can manually query an account's data status by calling our Account Details [API](/docs/financial-data/account-information). Upon successful response, the data status gets returned in the meta-object as well, with other bank information relating to the user's bank account.

[API Reference](/api/bank-data/accounts/details)

### Request

1234

```bash
curl --request GET \\
     --url https://api.withmono.com/v2/accounts/65203b27f6323a96a4a83779 \\
     --header 'Accept: application/json' \\
     --header 'mono-sec-key: test_sk_adasdsadasddasd'
```

### Request

1234567891011121314151617181920212223242526272829303132333435

```js
{
    "status": "successful",
    "message": "Request was successfully completed",
    "timestamp": "2024-05-01T09:04:01.459Z",
    "data": {
        "account": {
            "id": "6631279bdedfbd",
            "name": "Samuel Olamide",
            "account_number": "0131883461",
            "currency": "NGN",
            "balance": 22644,
            "type": "SAVINGS_ACCOUNT", // or BUSINESS_BANKING
              "institution": {
              "name": "GTBank",
              "bankCode": "058",
              "type": "PERSONAL_BANKING"
	          },
            "bvn": "9422" // null
        },
        "customer": {
            "id": "682dd53a74682beb490a0ed4"
        },
        "meta": {
            "data_status": "AVAILABLE | PARTIAL | UNAVAILABLE",
            "auth_method": "internet_banking",
            "data_request_id": "ALP2JGV0I4KH",
            "session_id": "bOSKXZ6btpUHue5xUIlj",
            "retrieved_data": [
                "identity",
                "balance",
                "transactions"
            ]
        }
    }
}
```

With the above steps out of the way, we can now get the financial data of your user's connected account as data will be readily available.

For instance, you can fetch a user's updated financial data (e.g Transactions API) via their Account ID.

[API Reference](/api/bank-data/transactions)

### Request

1234

```bash
curl --request GET \\
     --url https://api.withmono.com/v2/accounts/65203b27f6323a96a4a83779/transactions \\
     --header 'Accept: application/json' \\
     --header 'mono-sec-key: test_sk_adasdsadasddasd'
```

### Request

12345678910111213141516171819202122232425262728293031

```js
{
    "status": "successful",
    "message": "Transaction retrieved successfully",
    "timestamp": "2024-04-12T06:18:17.117Z",
    "data": [
        {
            "id": "66141bbff58d2687e7d91234",
            "narration": "PG00001",
            "amount": 500,
            "type": "debit",
            "balance": 1500,
            "date": "2023-12-14T00:02:00.500Z",
            "category": "unknown"
        },
        {
            "id": "66141bbff58d2687e7d91235",
            "narration": "0000132312091322123456789012345 NIP TRANSFER",
            "amount": 1000,
            "type": "debit",
            "balance": 2000,
            "date": "2023-12-09T13:23:00.100Z",
            "category": "bank_charges"
        },
    ],
    "meta": {
        "total": 307,
        "page": 1,
        "previous": null,
        "next": "https://api.withmono.com/v2/66141b98aaa34e17e8cfdb76/transactions?page=2"
    }
}
```

#### On this page

Overview

Integration Steps

Step 1 Initiate account linking

Step 2 Retrieve Account ID

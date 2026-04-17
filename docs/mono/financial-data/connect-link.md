---
title: "Connect Link Integration Guide"
source_url: "https://docs.mono.co/docs/financial-data/connect-link"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Integrate account linking into your application using Mono Connect's hosted link and redirection flow."
---# Connect Link Integration Guide

Last updated January 28th, 2025

## Overview

This guide will put you through the necessary steps to take when trying to Integrate Mono Connect into your software solution via API. This is made possible via a generated URL that can be sent to users for them to complete the account linking process without a need for setting up SDKs.

![Prerequisites](/images/callout/bulb.png)

Prerequisites

To get started, please ensure to:

-   Sign up on the [Mono Dashboard.](https://app.mono.co/signup)
-   [Create an App](/docs/create-app) and fetch the generated Secret Key.

## Integration Steps

With the above prerequisite steps taken, please note that there are three stages for completing the integration process:

1.  Initiate Account Linking: At this stage, an account linking URL is generated which should be sent to your users to complete that account linking stage.
2.  Retrieve Account ID: The user's account id is retrieved via webhook and saved to your database.
3.  Data Status confirmation and Data Access: The user's financial data availability is confirmed, for financial data access.

## Step 1: Initiate Account Linking

To initiate account linking, send a POST request to the following endpoint:

### Request

1

```js
POST https://api.withmono.com/v2/accounts/initiate
```

### Request Body Parameter

-   `customer` (required): This object field expects the user's customer information i.e name and email
-   `customer.name` (required): Provide the user's name
-   `customer.email` (required): Provide the user's email
-   `scope` (required): Specify the scope as "auth"
-   `meta` (optional): The meta object expects a "ref" key.
-   `meta.ref`: Specify a unique reference to enable you make ties to the account linked via generated URL.
-   `redirect_url` (required): This field requires a valid URL for successful account linking redirection.

### Request Headers

Include the following header in your request for authentication:

-   `mono-sec-key` (required): Your Mono secret key.

### cURL Sample Request

### Request

123456789101112131415

```js
curl --request POST \
     --url https://api.withmono.com/v2/accounts/initiate \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --header 'mono-sec-key: string' \
     --data '{
    "customer": {
        "name": "Samuel Olamide",
        "email": "samuel@neem.com"
    },
    "meta": { "ref": "99008877TEST"},
    "scope": "auth",
    "redirect_url": "https://mono.co"
}
'
```

### cURL Sample Response

### Request

123456789101112131415

```js
{
    "status": "successful",
    "message": "Request was successfully completed",
    "timestamp": "2024-03-18T11:51:41.624Z",
    "data": {
        "mono_url": "https://link.mono.co/ALGSTO222222WE",
        "customer": "65f82acd00000003aa9028d",
        "meta": {
            "ref": "99008877TEST"
        },
        "scope": "auth",
        "redirect_url": "https://mono.co",
        "created_at": "2024-03-18T11:51:41.605Z"
    }
}
```

## Step 2: Retrieve Account ID

After a successful account linking process in the previous step, a unique account ID will be sent via webhook in the the following response:

### Request

12345678910111213141516

```js
{
    "event": "mono.events.account_connected",
    "event_id": "jU4ixom09P6eX2arBA3AmeiPyYalMk4WPdCaQ",
    "timestamp": "2026-01-27T21:00:39.588Z",
    "data": {
      "id": "6979274350b9c321c14524b1",
      "customer": "6961439d7716b67eba2d068a",
      "meta": {
        "data_status": "PROCESSING",
        "auth_method": "internet_banking",
        "ref": "4055877-T"
      },
      "app": "68cbf35e9DS6deec038a43d9",
      "business": "68ca76a195f6deec0384d6c0"
    }
  }
```

The account id returned in the mono.events.account\_connected webhook is a unique permanent identifier to the link financial account. With this information at hand, it is important to save this Account ID into your database (which of course will be associated with this user linking) so that you can make future API calls as desired.

## Step 3: Data Status confirmation and Data Access

At this stage, it is important to verify the data availability of your connected account to be ready via the `data_status` field by ensuring that this is **AVAILABLE** or **PARTIAL** (containing the specific data needed in the **retrieved\_data** array e.g transactions or balance), before going ahead to call the desired financial API endpoints for data.

All the possible values of a data status are `available`, `unavailable`, `partial` or `failed`.

![Data Statuses and Definitions](/images/callout/bulb.png)

Data Statuses and Definitions

-   `available` : Both **balance** and **transactions** was returned.
-   `partial` : Either **balance** or **transactions** was returned, but not both.
-   `unavailable` : Balance and transactions were not returned, due to issues from the bank or the user has no data available.
-   `failed` : Balance and transactions were not returned due to an issue from Mono’s system only (e.g. internal service errors, timeouts e.t.c.).

Please note: This endpoint will consistently include a `retrieved_data` array in the `meta` object for **all** statuses. This gives you visibility into what was actually fetched.

![NOTE](/images/callout/bulb.png)

NOTE

Please note that if you proceed to call our Financial APIs (e.g Transactions, Statements etc) without confirming your data status as **AVAILABLE** or **PARTIAL** (containing the specific data needed in the **retrieved\_data** array e.g transactions or balance), you will receive an **empty** payload in your API response.

There are two approaches to getting the data status of a connected account. This can be done,

-   Via the Account Updated Webhook
-   Via the Account Details API

### Via the Account Updated Webhook

Depending on the speed and uptime of the linked bank, it can take roughly 0.1 seconds to a couple of minutes to receive this webhook [event](/docs/financial-data/account-update) on the webhook URL that you have [set up](/docs/webhooks) on your dashboard. Once received, the data status is provided in the meta-object of your JSON response.

Account updated webhook payload:

### Request

12345678910111213141516171819202122232425262728293031323334

```js
{
    "event": "mono.events.account_updated",
    "event_id": "tDZCfxYASzx75YtXe3zbrgNzQtohDd6AE2BwWRvKf4",
    "timestamp": "2026-01-27T21:00:38.856Z",
    "data": {
      "account": {
        "_id": "697926f050B9c321c1451dda",
        "name": "Samuel Olamide",
        "accountNumber": "0131883461",
        "currency": "NGN",
        "balance": 22967,
        "type": "Tier 3 Savings Account",
        "bvn": "9422",
        "authMethod": "internet_banking",
        "institution": {
          "name": "ALAT by WEMA",
          "bankCode": "035",
          "type": "PERSONAL_BANKING"
        },
        "created_at": "2026-01-27T20:58:24.714Z",
        "updated_at": "2026-01-27T21:10:01.511Z"
      },
      "meta": {
        "data_status": "AVAILABLE | PARTIAL | UNAVAILABLE",
        "auth_method": "internet_banking",
        "retrieved_data": [
          "identity",
          "balance",
          "transactions"
        ],
        "ref": "4055877-T"
      }
    }
  }
```

### Via the Account Details API

With the Account ID in hand, you can manually query an account's data status by calling our Account Details [API](/api/bank-data/accounts/details). Upon successful response, the data status gets returned in the meta-object as well, with other bank information relating to the user's bank account.

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

12345678910111213141516171819202122232425262728293031323334

```js
{
    "status": "successful",
    "message": "Request was succesfully completed",
    "timestamp": "2026-01-27T12:30:22.399Z",
    "data": {
        "account": {
            "id": "6972325w62ta67u33f88840a",
            "name": "Samuel Olamide",
            "account_number": "1234567890",
            "currency": "NGN",
            "balance": 73573,
            "type": "SAVINGS",
            "bvn": "6115",
            "institution": {
                "name": "GTBank",
                "bank_code": "058",
                "type": "PERSONAL_BANKING"
            }
        },
        "customer": {
            "id": "682dd53a74682beb490a0ed4"
        },
        "meta": {
            "data_status": "AVAILABLE",
            "auth_method": "internet_banking",
            "retrieved_data": [
                "identity",
                "balance",
                "transactions"
            ],
            "ref": "4055877-T"
        }
    }
}
```

With the above steps out of the way, we can now get the financial data of your user's connected account as data will be readily available.

For instance, you can fetch a user's financial transactions by calling our Transactions API via their Account ID.

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

### Account Institution Redirection

When initiating an Account linking URL through Mono Connect and you have prior knowledge of the user's bank details, you can include an institution object in the Connect Link Initiation API request. This object includes:

-   `id`: This field expects the user's institution ID, obtainable from our bank listing endpoint [here](/api/miscellaneous/bank-coverage).

-   `auth_method`: Here, specify the authentication method of the institution, such as _mobile\_banking_ or _internet\_banking_.


Upon calling the Account Initiation API with the institution object included in the payload, a URL is generated. Users can use this URL to complete the account linkinp process. Opening the URL displays the login page for the preconfigured institution.

#### API request

### Request

12345678910111213141516171819

```js
curl --request POST \
     --url https://api.withmono.com/v2/accounts/initiate \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --header 'mono-sec-key: string' \
     --data '{
    "customer": {
        "name": "Samuel Olamide",
        "email": "samuel@neem.com"
    },
    "meta": { "ref": "99008877TEST"},
    "institution": {
        "id": "5f2d08bf60b92e2888287704",
        "auth_method": "internet_banking"
    },
    "scope": "auth",
    "redirect_url": "https://mono.co"
}
'
```

### Account Match

The Account Match feature allows you to verify that the account number provided by a customer matches the account number returned from their linked bank account. The verification is performed during the linking process, and the result is returned via the account\_updated webhook event.

![Pricing](/images/callout/bulb.png)

Pricing

Account Match is charged at **NGN 5 per match** on PAYG.

#### How it works

1.  Retrieve the list of supported institutions by calling the [Institutions endpoint](/api/miscellaneous/bank-coverage) with the `financial_data` scope. From the response, identify the institution ID and auth method for your customer's bank.

2.  Pass the institution ID, auth method, and the account number you want to verify in the institution object on the [Initiate Account Linking](/api/bank-data/authorisation/initiate-account-linking) request. Set check\_account\_match to true on the payload.

3.  After the customer completes the linking process, the match result is returned in the **mono.events.account\_updated** webhook on the **account\_match** field.


#### API Request

Pass the account number on the institution object and set check\_account\_match to true on the initiate payload as shown below:

### Request

1234567891011121314151617181920212223

```js
curl --request POST \
     --url https://api.withmono.com/v2/accounts/initiate \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --header 'mono-sec-key: string' \
     --data '{
    "customer": {
        "name": "Samuel Olamide",
        "email": "samuel@neem.com"
    },
    "meta": {
        "ref": "99008877TEST"
    },
    "institution": {
        "id": "5f2d08bf60b92e2888287704",
        "auth_method": "internet_banking",
        "account_number": "02605538421"
    },
    "check_account_match": true,
    "scope": "auth",
    "redirect_url": "https://mono.co"
}
'
```

<table class="w-full space-y-2.5 border-separate border-spacing-y-2.5 my-5 first:mt-0"><tbody class="[&amp;:first-child_tr]:bg-gray-100 [&amp;:first-child_tr]:font-medium"><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">Field</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">Description</td></tr></tbody><tbody class="[&amp;:first-child_tr]:bg-gray-100 [&amp;:first-child_tr]:font-medium"><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">institution.id</code> (required)</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">The institution ID. Retrieve this from the <a target="_self" class="inline-block font-medium text-blue-500" href="/api/miscellaneous/bank-coverage">Institutions endpoint</a>.</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">institution.auth_method</code> (required)</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">The authentication method e.g. <code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">internet_banking</code>, <code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">mobile_banking</code>.</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">institution.account_number</code> (required)</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">The account number to verify against the linked account.</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">check_account_match</code> (required)</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">Set to <code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">true</code> to enable account match verification.</td></tr></tbody></table>

#### Webhook Response

The match result is returned in the **mono.events.account\_updated** webhook event on the **account\_match** field:

### Request

123456789101112131415161718192021222324252627282930313233

```js
{
    "event": "mono.events.account_updated",
    "data": {
        "account": {
            "_id": "5f171a530295e231abca1153",
            "name": "Samuel Olamide",
            "accountNumber": "0131883461",
            "currency": "NGN",
            "balance": 22644,
            "type": "Tier 3 Savings Account",
            "bvn": "9422",
            "authMethod": "internet_banking",
            "institution": {
                "name": "ALAT by WEMA",
                "bankCode": "035",
                "type": "PERSONAL_BANKING"
            },
            "account_match": true,
            "created_at": "2024-04-30T17:16:01.171Z",
            "updated_at": "2024-04-30T17:16:05.463Z"
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

The **account\_match** field returns **true** if the account number provided in the initiate payload matches the linked account, or **false** if it does not.

#### On this page

Overview

Integration Steps

Step 1 Initiate account linking

Step 2 Retrieve Account ID

step 3 data status confirmation

Account Institution Redirection

Account Match

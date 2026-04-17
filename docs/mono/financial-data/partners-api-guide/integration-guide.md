---
title: "Integration Guide"
source_url: "https://docs.mono.co/docs/financial-data/partners-api-guide/integration-guide"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Detailed technical steps to implement the Mono Partners API, from session creation to authentication commit."
---# Integration Guide

Last updated July 28th, 2025

Welcome to the Mono Partners API for Connect Integration Guide, designed to assist developers in seamlessly incorporating the Partner APIs into their applications. This comprehensive guide provides step-by-step instructions, enabling you to leverage these resources for account linking purposes.

![Prerequisites](/images/callout/bulb.png)

Prerequisites

To get started, please ensure to:

-   Sign up on the [Mono Dashboard](https://app.mono.co/signup)
-   [Create an app](https://support.mono.co/en/articles/7054553-how-to-create-an-app) with the product specified as `connect` and obtain the associated secret key.
-   [Configure](/docs/webhooks) a webhook URL and add it to your dashboard. (For testing, use [webhook.site](https://webhook.site/) to generate a temporary webhook URL)

## Integration Stages

With the above prerequisite steps already taken, please note that there are several stages for completing the integration process:

#### Step 1: Get Institution Details

This step is needed to get the institution ID for the user's bank account. This institution ID is used to create the Connect session.

#### Step 2: Create a Connect Session

In this step, you create a Connect session for the connection, it returns a session ID and other login steps. This session ID is used to identify the connect session in subsequent requests.

#### Step 3: Login using Connect Session

This step is needed to login to the user's bank account using the Connect session ID. This is the final step if no further action is needed to complete the authentication process.

#### Step 4: Commit Session

This step is used if further actions are needed to be performed for the user authentication (e.g passing OTP, account selection, security answer) to complete the login process.

## Step 1: Get Institutions

This first step is for you to retrieve the list of institutions that you can connect to. This returns a list containing all available institutions for that scope, which in this case is `financial_data`. Here are other query filters available: bank\_code | auth\_method.

It also contains some fields like the institution\_id, icon, primary\_color (in hex format), name of each institution and also expected credentials for respective auth methods.

### Request

12

```js
curl -X GET "https://api.withmono.com/v3/institutions?scope=financial_data" \
  -H "mono-sec-key: <your_secret_key>"
```

**Response**

### Request

123456789101112131415161718192021222324252627282930313233343536373839404142434445

```js
{
  "status": "successful",
  "message": "Request completed successfully",
  "timestamp": "2025-05-13T09:38:07.908Z",
  "data": [
    {
      "_id": "5f2d08bf60b92e2888287703",
      "name": "Bank",
      "type": "PERSONAL_BANKING",
      "icon": "https://connect.withmono.com/build/img/access-bank.png",
      "identifier": "mono.connections.identifier",
      "nip_code": "000000",
      "country": "ng",
      "primary_color": "#004085",
      "scope": [
        {
          "name": "Financial Data",
          "type": "financial_data"
        }
      ],
      "auth_methods": [
        {
          "type": "internet_banking",
          "ui": {
            "title": "Log in to bank",
            "form": [
              {
                "type": "elements.input",
                "name": "username",
                "hint": "Username",
                "contentType": "string"
              },
              {
                "type": "elements.input",
                "name": "password",
                "hint": "Password",
                "contentType": "password"
              }
            ]
          }
        }
      ]
    }
  ]
}
```

## Step 2: Create Connect Session

In order to access the account's financial data, you need to create a Connect session for the connection, this call return the session details and other UI login elements. The session ID is used to identify the connect session in subsequent requests. Ensure to make this call used the live secret keys which is available in `live mode`.

### Request

123456789101112

```js
curl -X POST "https://api.withmono.com/v2/connect/session" \
  -H "mono-sec-key: <your_secret_key>" \
  -H "Content-Type: application/json" \
  -d '{
    "institution": "<institution_id>",
    "auth_method": "internet_banking",
    "scope": "financial_data",
    "customer": {
      "name": "John Doe",
      "email": "john@example.com"
    }
  }'
```

**Response**

### Request

12345678910111213141516171819202122232425262728293031323334

```js
{
    "status": "successful",
    "message": "Request completed successfully",
    "timestamp": "2025-05-13T12:25:49.020Z",
    "data": {
        "session": {
            "id": "session_id",
            "scope": "financial_data",
            "expiresAt": 1605101689897,
            "institution": {
                "id": "institution_id",
                "name": "institution_name",
                "identifier": "institution_identifier"
            }
        },
        "ui": {
            "title": "Log in to GTBank",
            "form": [
                {
                    "type": "elements.input",
                    "name": "username",
                    "hint": "UserID, Account Number, Phone Number",
                    "contentType": "string"
                },
                {
                    "type": "elements.input",
                    "name": "password",
                    "hint": "Password",
                    "contentType": "password"
                }
            ]
        }
    }
}
```

![About the UI object](/images/callout/bulb.png)

About the UI object

The `ui` object in the response provides information on how to render the login form for the selected institution. It contains a `title` for the form and a `form` array describing each input field required for authentication. Each field specifies its `type`, `name` (e.g., username or password), `hint` (placeholder or label), and `contenttype` (e.g., string or password).

![Note](/images/callout/bulb.png)

Note

The `session_id` returned in the response from the Create Session endpoint is used to create a connect session. The session ID is a unique identifier that is used to identify that connect session in subsequent calls.

The `expires_at` field indicates when the session will expire.

## Step 3: Login Using Connect Session

The Login endpoint is used to log in to the user's bank account using the session ID. This requires the `session_id` returned from the **[Create Session](/api/bank-data/partners-api/create-session)** endpoint and also the `username` and `password` fields.

#### **Session-Based Login Flow**

The `session_id` returned from the **[Create Session](/api/bank-data/partners-api/create-session)** endpoint should be used as a request header (i.e with this header key: x-session-id) when calling the [Login](/api/bank-data/partners-api/login) endpoint.

It's important to note that the request body for the Login endpoint is dynamic, as it depends on the `form_input` defined within the `ui` object of the target `institution`.

#### **Post-Login Flow and Response Code Handling**

After a login attempt, the connection may require additional steps such as further input or account selection. To help you manage this flow effectively, a "responseCode" will be returned to indicate the next action required.

#### Response code values and their meaning:

<table class="w-full space-y-2.5 border-separate border-spacing-y-2.5 my-5 first:mt-0"><tbody class="[&amp;:first-child_tr]:bg-gray-100 [&amp;:first-child_tr]:font-medium"><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">Code</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">Meaning</td></tr></tbody><tbody class="[&amp;:first-child_tr]:bg-gray-100 [&amp;:first-child_tr]:font-medium"><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">99</code></td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><strong>Login Complete</strong> – The login process is complete. If the user has only one account, it will be automatically used for subsequent actions (getIdentity, getStatement, getBalance), and the session will be committed.</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">101</code></td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><strong>Multiple Accounts Found</strong> – The user has more than one account. Account selection is required before the session can be committed and further actions can proceed.</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">102</code></td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><strong>Additional Input Required</strong> – Further user input is needed (e.g., OTP, security question). Field names will be cached to validate inputs sent via the Commit Session API.</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350 !text-gray-700" aria-label="tag">400</code></td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><strong>Invalid Input or Connection Error</strong> – The login failed due to incorrect credentials or an error from the connected institution.</td></tr></tbody></table>

### Request

12345678

```js
curl -X POST "https://api.withmono.com/v2/connect/login" \
  -H "mono-sec-key: <your_secret_key>" \
  -H "x-session-id: <session_id>" \
  -H "Content-Type: application/json" \
  -d '{
      "username": "johndoe@gmail.com",
      "password": "123456"
  }'
```

**Response (Single Account)**

### Request

123456789

```js
{
    "status": "successful",
    "message": "Login successful",
    "timestamp": "2025-05-13T12:26:02.404Z",
    "responseCode": 99,
    "data": {
        "code": "code_au5w62egpzggouybo83i5spg"
    }
}
```

**Response (Multiple Accounts)**

### Request

123456789101112131415161718

```js
{
    "status": "successful",
    "message": "Multiple accounts found",
    "timestamp": "2025-05-13T12:26:02.404Z",
    "responseCode": 101,
    "data": {
        "accounts": [
            {
                "accountNumber": "0131883461",
                "name": "Samuel Olamide",
                "type": "SAVINGS_ACCOUNT",
                "currency": "NGN",
                "status": "active",
                "balance": 10000000
            }
        ]
    }
}
```

**Response (Further Input Required)**

### Request

12345678910111213141516171819

```js
{
    "status": "successful",
    "message": "OTP required",
    "timestamp": "2025-05-13T12:26:02.404Z",
    "responseCode": 102,
    "data": {
        "userInput": {
            "title": "Please input OTP sent to you",
            "form": [
                {
                    "type": "elements.input",
                    "name": "otp",
                    "hint": "Please don't share this one time password",
                    "contentType": "string"
                }
            ]
        }
    }
}
```

## Step 4: Commit Session

The additional input fields you submit in the Commit Session step (such as OTP, account selection, or security answers) depend on what was requested in the previous **Login Using Connect Session** response. Always use the field names and structure provided in the "userInput" or "accounts" object from that step.

### Request

12345678

```js
curl -X POST "https://api.withmono.com/v2/connect/commit" \
  -H "mono-sec-key: <your_secret_key>" \
  -H "x-session-id: <session_id>" \
  -H "Content-Type: application/json" \
  -d '{
    "accountNumber": "0131883461",
    "otp": "123456"
  }'
```

**Response (Success)**

### Request

123456789

```js
{
    "status": "successful",
    "message": "Request completed successfully",
    "timestamp": "2025-05-13T10:50:35.426Z",
    "responseCode": 99,
    "data": {
        "code": "code_euTJM7yOuohSpSFVoBtc"
    }
}
```

**Response (Failed)**

### Request

123456

```js
{
    "status": "failed",
    "message": "Invalid OTP Sent",
    "responseCode": 400,
    "data": null
}
```

### Exchange Token for Account ID

After a successful commit, you need to exchange the returned code for an account ID using the [Exchange Token API](/api/bank-data/authorisation/exchange-token). Please note that this account ID is a permanent identifier to this user’s connected bank account. Also note that this account ID doesn’t have an expiry time as the time to live is indefinite.

With this information at hand, it is important to save this account ID into your database (which of course will be associated with this user linking) so that you can make future API calls as desired.

**Sample Request**

### Request

123456789

```js
curl --request POST \
  --url https://api.withmono.com/v2/accounts/auth \
  --header 'Content-Type: application/json' \
  --header 'accept: application/json' \
  --header 'mono-sec-key: test_sk_adasdsadasddasd' \
  --data '
{
    "code":"string"
}'
```

**Sample Response**

### Request

123

```json
{
    "id": "5f171a530295e231abca1153"
}
```

![Exchange token](/images/callout/bulb.png)

Exchange token

Regarding the expiry period

-   The Authorization token (code) expires after 10 minutes.
-   The Account ID doesn't expire except if [unlinked](/api/bank-data/accounts/unlink) via API.

### Confirm the Data Status of the Connected Account

After successfully linking an account, you will receive a webhook event `mono.events.account_updated` with the account's details.

Before attempting to retrieve data (such as identity, statement, or balance etc.), it is important to confirm that the account's data is available. This ensures you do not encounter errors or incomplete data when making subsequent API calls.

**Why this step is necessary:**
Data aggregation may take some time after account linking, especially for new connections. Confirming the data status helps you avoid making requests before the data is fully available, improving reliability and user experience.

![Note](/images/callout/bulb.png)

Note

It may take up to 10 minutes for the webhook notification to be delivered to your configured webhook URL after a successful account link. This delay allows Mono to securely aggregate and process the account data in the background, ensuring that when you receive the `mono.events.account_updated` event, the data is as complete and up-to-date as possible.

#### Account Updated Webhook Response

### Request

123456789101112131415161718192021222324252627

```js
{
    "event": "mono.events.account_updated",
    "data": {
        "account": {
            "_id": "66e2d530c293212b39d34aa8",
            "name": "SAMUEL OLAMIDE NOMO",
            "accountNumber": "0100000062",
            "currency": "NGN",
            "balance": 17542,
            "type": "SAVINGS ACCOUNT - INDIVIDUAL",
            "bvn": "22000000003",
            "authMethod": "mobile_banking",
            "institution": {
                "name": "Union Bank of Nigeria",
                "bankCode": "000018",
                "type": "PERSONAL_BANKING"
            },
            "created_at": "2024-09-12T11:49:04.416Z",
            "updated_at": "2024-09-13T09:58:00.950Z"
        },
        "meta": {
            "data_status": "AVAILABLE | FAILED| PROCESSING",
            "auth_method": "mobile_banking",
            "sync_status": "SUCCESSFUL | FAILED | REAUTHORISATION_REQUIRED"
        }
    }
}
```

Once the status is `available`, you can safely proceed to retrieve financial data for the connected account.

#### Using the Account Details API

Alternatively, you can use the [Get Account Details API](/api/bank-data/accounts/details) to retrieve the account details including the Data Status. This requires the account ID returned from the previous step and returns similar information as the `mono.events.account_updated` webhook.

**Sample Request**

### Request

1234

```js
  curl --request GET \
    --url https://api.withmono.com/v2/accounts/id \
    --header 'mono-sec-key: string' \
    --header 'accept: application/json'
```

**Sample Response**

### Request

1234567891011121314151617181920212223242526272829

```js
{
    "status": "successful",
    "message": "Request was successfully completed",
    "timestamp": "2024-04-12T06:31:02.289Z",
    "data": {
        "account": {
            "id": "64779d900000000000b3de23aeb8",
            "name": "Samuel Olamide Nomo",
            "currency": "NGN",
            "type": "Digital Savings Account",
            "account_number": "1234567890",
            "balance": 333064,
            "bvn": "0065",
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
            "auth_method": "internet_banking"
        }
    }
}

```

#### On this page

introduction

integration stages

get institutions

create session

login using session

commit session

exchange token for account ID

confirm the data status

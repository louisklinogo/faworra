---
title: "Reauthorisation Guide"
source_url: "https://docs.mono.co/docs/financial-data/partners-api-guide/reauth-guide"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Handle account re-authentication programmatically using the Partners API for accounts requiring MFA or periodic refreshes."
---# Reauthorisation Guide

Last updated July 28th, 2025

The Partners API Re-authorisation guide will put you through the necessary steps to take when trying to successfully reauthorise an account that has MFA (Multi-factor Authorisation) enabled or not.

![Prerequisites](/images/callout/bulb.png)

Prerequisites

To get started, please ensure to:

-   Sign up on the [Mono Dashboard](https://app.mono.co/signup)
-   [Create an app](https://support.mono.co/en/articles/7054553-how-to-create-an-app) with the product specified as `connect` and obtain the associated secret key.
-   [Configure](/docs/webhooks) a webhook URL and add it to your dashboard. (For testing, use [webhook.site](https://webhook.site/) to generate a temporary webhook URL)

## Integration Stages

With the above prerequisite steps already taken, please note that there are several stages for completing the integration process:

#### Step 1: Reauth Session

This step is used to reauthorise a previously linked user's account.
**When to use:** If a user's account access has expired or requires re-authentication, initiate a reauth session to start the process.

#### Step 2: Reauth Login

This step is used for some connections that require the user to login again or that require MFA.
**When to use:** If the institution requires the user to re-enter credentials or complete MFA, use this step after starting a reauth session.

## Reauth Session

To create a reauth session, you need to pass the account ID. Once the session is successfully created, we’ll send the `mono.events.account_reauthorized` webhook, followed by the `mono.events.account_updated` webhook to notify you that new data is available.

**Request**

### Request

123456

```js
curl -X POST "https://api.withmono.com/v2/connect/reauth/session" \
  -H "mono-sec-key: <your_secret_key>" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "<account_id>"
  }'
```

**Parameter Description:**

-   `account` (required): The unique identifier of the user's account you wish to reauthorize.

**Response**

### Request

123456789

```json
{
    "status": "successful",
    "message": "Request completed successfully",
    "timestamp": "2025-05-13T12:26:36.853Z",
    "data": {
        "responseCode": 99,
        "code": "code_q90t4ar2uriet5ey4rs22v0x"
    }
}
```

#### **Post-Login Flow and Response Code Handling**

After a login attempt, the connection may require additional steps such as further input or account selection. To help you manage this flow effectively, a "responseCode" will be returned to indicate the next action required.

#### Response code values and their meaning:

<table class="w-full space-y-2.5 border-separate border-spacing-y-2.5 my-5 first:mt-0"><tbody class="[&amp;:first-child_tr]:bg-gray-100 [&amp;:first-child_tr]:font-medium"><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">Code</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">Meaning</td></tr></tbody><tbody class="[&amp;:first-child_tr]:bg-gray-100 [&amp;:first-child_tr]:font-medium"><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">99</code></td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><strong>Login Complete</strong> – The login process is complete. If the user has only one account, it will be automatically used for subsequent actions (getIdentity, getStatement, getBalance), and the session will be committed.</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">101</code></td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><strong>Multiple Accounts Found</strong> – The user has more than one account. Account selection is required before the session can be committed and further actions can proceed.</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">102</code></td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><strong>Additional Input Required</strong> – Further user input is needed (e.g., OTP, security question). Field names will be cached to validate inputs sent via the Commit Session API.</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350 !text-gray-700" aria-label="tag">400</code></td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><strong>Invalid Input or Connection Error</strong> – The login failed due to incorrect credentials or an error from the connected institution.</td></tr></tbody></table>

**See also:**

-   [Webhooks documentation](/docs/webhooks) for handling asynchronous events
-   [Error handling guide](/docs/errors) for troubleshooting response codes

## Reauth Login

Some connections may require re-login or multi-factor authentication (MFA). In such cases, use the endpoint below to initiate re-authentication using the same session ID from the previously created reauth session.

#### Request Body Parameter

-   `username` (required): The user's account identifier (usually their email or account number) that you intend to log-in to.
-   `password` (required): The user's password for the financial institution.

#### Request Headers

Include the following header in your request for authentication:

-   `mono-sec-key` (required): Your Mono secret key.
-   `x-session-id` (required): The session ID returned from the reauth session step.

**Request**

### Request

12345678

```js
curl -X POST "https://api.withmono.com/v2/connect/reauth/login" \
  -H "mono-sec-key: <your_secret_key>" \
  -H "x-session-id: <reauth_session_id>" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "samuel@neem.com",
    "password": "pass1234567890?"
  }'
```

**Parameter Description:**

-   `username`: The user's account identifier (email or account number).
-   `password`: The user's password for the financial institution.

**Response**

### Request

123456789

```json
{
    "status": "successful",
    "message": "Request completed successfully",
    "timestamp": "2025-05-13T12:26:02.404Z",
    "data": {
        "responseCode": 99,
        "code": "code_geiyk72og91xl2rox16b4emc"
    }
}
```

#### On this page

introduction

integration stages

reauth session

reauth login

---
title: "Sandbox Guide"
source_url: "https://docs.mono.co/docs/financial-data/partners-api-guide/sandbox-guide"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Learn how to test your Mono Partners API integration using sandbox credentials and test environments."
---# Sandbox Guide

Last updated July 28th, 2025

Welcome to the Mono Partners API for Connect Integration Guide, designed to assist developers in seamlessly incorporating the Partner APIs into their applications. This guide provides step-by-step instructions, enabling you try out account linking via API in a sandbox environment.

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

#### Step 2: Create Connect Session

In this step, you create a Connect session for the connection, it returns a session ID and other login steps. This session ID is used to identify the connect session in subsequent requests. Ensure to make this call used the sandbox secret keys which is available in `test mode`.

#### Step 3: Login using Connect Session

This step is needed to login to the user's bank account using the Connect session ID. This is the final step if no further action is needed to complete the authentication process.

#### Step 4: Retrieve Sandbox Credentials

This step is used to retrieve sandbox login credentials for testing this integration.

## Step 1: Get Institutions

This first step is for you to retrieve the list of institutions that you can connect to. This returns a list containing all available institutions for that scope, which in this case is `financial_data`. Here are other query filters available: bank\_code | auth\_method.

It also contains some fields like the institution\_id, icon, primary\_color (in hex format), name of each institution and also expected credentials for respective auth methods.

**Request**

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

In order to access the account's financial data, you need to create a Connect session for the connection, this call return the session details and other UI login elements. The session ID is used to identify the connect session in subsequent requests. Ensure to make this call used the sandbox secret keys which is available in `test mode`.

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

The `session_id` returned from the **[Create Session](/api/bank-data/partners-api/create-session)** endpoint should be used as a request header when calling the [Login](/api/bank-data/partners-api/login) endpoint.

It's important to note that the request body for the Login endpoint is dynamic, as it depends on the `form_input` defined within the `ui` object of the target `institution`.

### Request

12345678

```js
curl -X POST "https://api.withmono.com/v2/connect/login" \
  -H "mono-sec-key: <your_secret_key>" \
  -H "x-session-id: <session_id>" \
  -H "Content-Type: application/json" \
  -d '{
       "username": "user_good",
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

## Step 4: Retrieve Sandbox Credentials

Get test credentials for sandbox sessions.

**Request**

### Request

123

```js
curl -X GET "https://api.withmono.com/v2/connect/sandbox" \
  -H "mono-sec-key: <your_test_secret_key>" \
  -H "x-session-id: <session_id>"
```

**Response**

### Request

1234567891011121314151617

```js
{
    "status": "successful",
    "message": "Request completed successfully",
    "timestamp": "2025-05-13T11:13:15.842Z",
    "data": {
        "credentials": [
            {
                "hasMultipleAccounts": false,
                "values": {
                    "username": "test-user@gmail.com",
                    "password": "123456"
                }
            }
        ],
        "inputs": []
    }
}
```

#### On this page

introduction

integration stages

get institutions

create session

login using session

retrieve sandbox credentials

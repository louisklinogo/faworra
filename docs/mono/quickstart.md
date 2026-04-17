---
title: "Quickstart Guides"
source_url: "https://docs.mono.co/docs/quickstart"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Fast-track your integration with step-by-step guides for Mono Connect and Payments. Learn how to initiate linking and automate money movement."
---# Quickstart Guides

Last updated March 11th, 2026

## Mono Connect

# Enhancing Lending Decisions with the Financial Data API endpoints

## Overview

As a credit business, making accurate risk assessment decisions is often challenging. This is because finding reliable ways to retrieve customers’ financial data, determine the maximum amount to lend to them, or assess their capacity to repay loans is hard.

The Mono Connect API product helps you solve these problems by making it easier to access customers’ verified bank statements and better understand their financial behaviour. This empowers you with accurate insights into users’ cash flow and finance patterns, so you can make data-informed lending decisions and lend the right amount of money to the right person.

This quick start guide will show you how to integrate the Mono Connect API into your product, with clear steps and sample requests for the entire process.

![Prerequisites](/images/callout/bulb.png)

Prerequisites

To get started, you need to:

-   Sign up on the [Partner Dashboard](https://app.mono.co/signup) and complete KYB.
-   [Create a `connect` app](/docs/create-app) and retrieve your Public and Secret keys.
-   Configure a [webhook URL](/docs/webhooks) in your dashboard to receive event notifications (you can use [webhook.site](https://webhook.site/) for testing).

### Step-by-step integration guide

#### **Step 1: Call the initiate linking endpoint using this URL:**

To set up recurring payments or subscriptions, the first step is to create a Customer on Mono. This endpoint streamlines onboarding, ensures you are KYC-compliant, and provides a crucial identifier for seamless integration with Mono's endpoints.

##### Sample request:

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

##### Response object:

### Request

12345678910111213141516

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

Use the mono\_url to get redirected to the Mono widget to link an account. After successfully linking your account, you’ll get the webhook response below containing the id of the account that has been linked.

### Request

12345678

```js
{
  "event": "mono.events.account_connected",
  "data": {
    "id": "67c6e1565a6d75703e0a94c9",
    "customer": "67abe55f729135f8af8002cc",
    "meta": {}
  }
}
```

**Data status confirmation through the webhook event**

Shortly after your account has been linked successfully (it usually takes 0.1 seconds to a couple of minutes), you will receive an account-updated webhook event letting you know if data is available for that linked account or not. Getting a data status of available signifies data is available, and you can proceed to call the financial data API endpoints.

### Request

1234567891011121314151617181920212223242526

```js
{
  "event": "mono.events.account_updated",
  "data": {
    "meta": {
      "data_status": "AVAILABLE",
      "auth_method": "internet_banking"
    },
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
      "created_at": "2024-04-30T17:16:01.171Z",
      "updated_at": "2024-04-30T17:16:05.463Z"
    }
  }
}
```

#### Step 2: Finding a reliable way to identify customers who can pay back the loan

Using the **Mono** **Income** endpoint: The [Mono Income endpoint](https://docs.mono.co/docs/financial-data/income) helps you determine a user's income pattern.

To initiate the income endpoint, send a GET request to the following endpoint:

##### Sample request body:

### Request

1234567

```js
{
    curl --request GET \
    --url https://api.withmono.com/v2/accounts/id/income \
    --header 'Content-Type: application/json' \
    --header 'accept: application/json' \
    --header 'mono-sec-key: string' \
}
```

##### Sample endpoint response:

### Request

123456

```js
{
    "status": "successful",
    "message": "The income of ${account.name} is currently being  processed, and the data will be sent to you through your webhook",
    "timestamp": "2024-05-21T10:38:02.376Z",
    "data": null
}
```

This is followed by a webhook that contains the income data needed as shown below.

##### Sample webhook response:

### Request

123456789101112131415161718192021

```js
{
  "data": {
    "income_summary":{
	    "total_income": 500000,
	    "employer": "Nomo Technologies"
    },
    "income_streams": [
      {
        "income_type": "SALARY",
        "frequency": "MONTHLY",
        "monthly_average": 2500,
        "average_income_amount": 2500,
        "last_income_amount": 2500,
        "currency": "NGN",
        "stability": 1
        "last_income_description": "Mono salary GTBPADE2938493",
        "last_income_date": "2023-02-09",
        "periods_with_income": 9, ...
    },
    ]
}
```

#### Step 3: Determining the safest loan amount to extend to the customer, with the highest probability of being paid back

Using the **Mono Creditworthiness** endpoint: The [Mono Creditworthiness endpoint](https://docs.mono.co/docs/financial-data/credit-worthiness#Overview) allows you assess the repayment capacity of a user, by evaluating the debt to income ratio against their transactions, credit history, and the requested loan amount, interest rate, and tenor.

To call the creditworthiness endpoint, see sample request below:

##### Sample request body:

### Request

1234567891011121314151617181920212223242526272829

```js
curl --request POST \
  --url https://api.withmono.com/v2/accounts/id/creditworthiness\
  --header 'accept: application/json'
  --data
{
  "bvn": "12345678901",
  "principal": 30000000,
  "interest_rate": 5,
  "term": 12,
  "run_credit_check": true
  "existing_loans": [ //optional
    {
       "tenor": 10,
       "date_opened": "2023-10-31",
       "closed_date": "2024-09-27",
       "institution": "PROVIDUS BANK PLC",
       "currency": "NGN",
       "repayment_amount": 65408100,
       "opening_balance": 1200000000,
       "repayment_schedule": [
         {
           "10-2023": "paid",
           "11-2023": "paid",
           "12-2023": "failed"
         }
      ]
    }
  ]
}
```

##### Sample response:

### Request

123456

```js
{
    "status": "successful",
    "message": "The creditworthiness of SAMUEL, OLAMIDE NOMO is currently being processed. Once completed, the data will be sent to your webhook.",
    "timestamp": "2024-03-15T15:14:28.679Z",
    "data": null
}
```

This is followed by a webhook event with the information retrieved with the creditworthiness endpoint.

### Request

123456789101112131415161718192021222324252627282930

```js
{
    "event": "mono.events.account_credit_worthiness",
    "data": {
      "account": "68e6d1d8qq6772887192b298",
      "app": "682da7b4b252cbab5dd274c4",
      "business": "60cc1195ba1772015c5c6b1d",
        "months_assessed": {
            "start": "2022-08-19",
            "end": "2023-06-15"
        },
        "summary": {
            "can_afford": true,
            "monthly_payment": 3384762
        },
        "debt": {
            "credit_check": true,
            "total_debt": 110000000,
            "debt_by_institution": [
                {
                    "institution": "ABC Bank Plc",
                    "amount_owed": 35000000
                },
                {
                    "institution": "XYZ COMPANY LIMITED",
                    "amount_owed": 75000000
                }
            ]
        }
    }
}
```

#### Step 4: Confirming the financial health of the customer by viewing their transaction history.

Using the **Mono Transaction** endpoint: The [Mono Transaction endpoint](https://docs.mono.co/docs/financial-data/transactions) helps you securely retrieve verified transaction data from a connected customer account.

To call the transactions endpoint kindly use the URL shown below:

##### Sample request:

### Request

123

```js
curl --request GET \
     --url https://api.withmono.com/v2/accounts/id/transactions \
     --header 'accept: application/json'
```

##### Sample response:

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

### **Common issues & debugging tips**

**Webhook events not being received:**

Webhooks events sometimes may not be received because of network issues with the bank which might prevent account linking from happening successfully. When this happens, you can call the endpoint that returns all linked accounts to confirm if the account was linked successfully or not.

##### Sample request:

### Request

1234

```js
curl --request GET \
     --url https://api.withmono.com/v2/accounts \
     --header 'accept: application/json' \
     --header 'mono-sec-key: string'
```

This is a sample of the response you will receive so you can verify all customers that have actually linked their accounts successfully.

##### Sample response:

### Request

12345678910111213141516

```js
{
    "status": "successful",
    "message": "Data retrieved successfully",
    "timestamp": "2024-04-16T07:23:43.813Z",
    "data": [
        {
            "id": "660e9c267474f97aba212345",
            "name": "OLAMIDE SAMUEL NOMO",
            "account_number": "2002451234",
            "currency": "NGN",
            "balance": 12335,
            "auth_method": "internet_banking",
            "status": "AVAILABLE"...
        }
    ]
}
```

**Unavailable financial data when calling an endpoint**

This may happen if account linking failed or if no data is available.

To debug: After linking an account, the `account-updated` webhook event received contains a `meta` object with a data status of: **available, processing, or failed**.

Calling financial data endpoints while status is **processing** or **failed** won’t return any data. data—status must be **available** to obtain useful results.

### Request

1234567891011121314151617181920212223242526

```js
{
  "event": "mono.events.account_updated",
  "data": {
    "meta": {
      "data_status": "AVAILABLE",
      "auth_method": "internet_banking"
    },
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
      "created_at": "2024-04-30T17:16:01.171Z",
      "updated_at": "2024-04-30T17:16:05.463Z"
    }
  }
}
```

**Insufficient data obtained when the income or creditworthiness endpoint is called**

The creditworthiness endpoint when successfully called returns a webhook event. The response below can be obtained in situations where there aren’t enough transactions in the account that has been linked.

### Request

123456789

```js
{
  "data": {
    "event": "mono.events.account_credit_worthiness",
    "data": {
      "account": "6765adx3232x2323x23e2",
      "message": "Unable to process account credit worthiness"
    }
  }
}
```

The income endpoint when successfully called could return a total income of “0” in situations where there aren't enough transactions or there are not enough repetitive transactions to be recognized as an income.

### Request

123456789101112

```js
{
  "event": "mono.events.account_income",
  "data": {
    "account": "66605869b806c997c5d21234",
    "app": "62da7b4b342c3aab5dd2a2c4",
    "business": "60cc8fa5ba177218c5c6a11d",
    "accountName": "SAMUEL OLAMIDE",
    "accountNumber": "0129141234",
    "income_summary": {
      "total_income": 0,
      "employer": ""
    } ...
```

### **Next steps**

-   **API documentation:**

To get a broader understanding of the Mono Direct Debit API works, we recommend checking the Mono Direct Debit [integration guide](/docs/payments/direct-debit/overview). This guide provides you with information on all available APIs, webhooks, and commonly asked questions.

-   **Webhook security:**

Ensure that you are validating the webhooks that you receive from Mono to prevent malicious actors from sending fake webhooks to your server. Here’s a [guide](/docs/webhooks#security) to handle this.

-   **Testing in sandbox:**

To ensure a smooth production deployment, thoroughly test your integration in the Mono sandbox environment using test data and your test secret key to stimulate various payment scenarios.

-   **Support channels:**

For real-time integration assistance, [join our Slack community](https://join.slack.com/t/devwithmono/shared_invite/zt-296d52n0h-JPVfKGnCDHWB5Mg7BsgfrA), or contact [integrations@mono.co](mailto:integrations@mono.co) to request support for any technical issues you experience.

#### On this page

overview

step by step guide

common issues debugging tips

next steps

---
title: "Split Payments Guide"
source_url: "https://docs.mono.co/docs/payments/split-payments"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Automatically allocate payments between multiple sub-accounts based on fixed amounts or percentages."
---# Split Payments Guide

Last updated December 13th, 2024

### Overview

Mono Split Payments enables businesses with the ability to effortlessly split funds from payments received through Mono DirectPay and Direct Debit. By using this functionality, businesses can define how payouts are allocated to multiple accounts, whether on a fixed amount or percentage basis.

This feature not only streamlines financial operations but also ensures transparency and accuracy in fund distribution, making it ideal for businesses managing partnerships, commissions, or multi-party transactions. With customizable options like specifying fee bearers and setting distribution limits, Mono Split Payments offers flexibility and efficiency in managing complex payout scenarios.

### Key Features

-   Seamless allocation: Split payments to multiple accounts in a single transaction.
-   Flexibility: Supports both percentage-based and fixed-amount splits.
-   Webhook support: Receive real-time updates on settlement statuses.

### Integration Steps

To integrate the Split Payments workflow, follow these steps:

-   Create a Sub-Account: Set up a sub-account using the third-party bank details associated with the payment splits.
-   Configure Split Payments: Include the split configuration and specify the sub-account ID when initiating a One-Time DirectPay transaction and Direct Debit setup.
-   Payment Process and Settlement: Once the payment is processed, settlement webhooks will be sent with the settlement configuration details.

### Step 1: Create a Sub-Account

To create a sub-account for payout allocations, send a POST request to the following endpoint:

### Request

1

```js
POST https://api.withmono.com/v2/payments/payout/sub-account
```

### Request Body Parameters

-   `nip_code` (required): String field for the NIP code of the destination bank. Visit [here](/api/direct-debit/mandate/get-banks) to get the NIP code of the user's financial institution.
-   `account_number` (required): String field for a valid account number to which payments will be split.

### Request Headers

Include the following header in your request:

-   `mono-sec-key` (required): Your Mono secret key for authentication.

### cURL Sample Request

### Request

123456789

```bash
curl --request POST \
     --url https://api.withmono.com/v2/payments/payout/sub-account \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --header 'mono-sec-key: your_mono_secret_key' \
     --data '{
       "nip_code": "000000",
       "account_number": "1234567890"
     }'
```

### cURL Sample Response

### Request

1234567891011

```json
{
  "status": "successful",
  "message": "Request completed successfully",
  "data": {
    "id": "6126aef671612f6126aef671612f",
    "name": "Sub Account Name",
    "account_number": "1234567890",
    "nip_code": "000000",
    "bank_code": "058"
  }
}
```

### Step 2: Configure Split Payments

#### Split Payments in API Requests

The `split` object can now be included in the body parameters of the following APIs for handling split payments:

1.  **[Initiate Payment API](/api/directpay/initiate)**: `https://api.withmono.com/v2/payments/initiate`

2.  **[Direct Debit API](/api/direct-debit/account/debit-account)**: `https://api.withmono.com/v3/payments/mandates/id/debit`


#### **Initiate Payment API** Example with Split

**Endpoint**: `https://api.withmono.com/v2/payments/initiate`

**Request**:

### Request

12345678910111213141516171819202122232425262728293031323334

```json
curl --request POST \
     --url https://api.withmono.com/v2/payments/initiate \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --header 'mono-sec-key: string' \
     --data '{
    "method": "account",
    "type": "onetime-debit",
    "reference": "testsplitiientoi7",
    "description": "testing split payment 7",
    "customer": {
        "name": "Samuel Olamide",
        "email": "samuel@neem.com"
    },
    "amount": 450000,
    "split": {
        "type": "percentage",
        "fee_bearer": "business",
        "distribution": [

            {
                "account": "673e258cbfc6fc07bf0f34b3",
                "value": 50,
                "max": 20000
            },
            {
                "account": "673b40afbfc6fc07bf0e4d07",
                "value": 40
            }
        ]
    }
}
'

```

**Response**:

### Request

1234567891011121314151617181920212223242526272829303132333435

```json
{
    "status": "successful",
    "message": "Payment Initiated Successfully",
    "timestamp": "2024-12-10T18:10:43.887Z",
    "data": {
        "id": "ODDZI5AT7NQW",
        "mono_url": "https://checkout.mono.co/ODDZI5AT7NQW",
        "type": "onetime-debit",
        "method": "account",
        "amount": 450000,
        "description": "testing split payment 7",
        "reference": "testsplitiddientdoi7",
        "customer": "673b783a737146d49343f6ed",
        "created_at": "2024-12-10T18:10:43.882Z",
        "updated_at": "2024-12-10T18:10:43.882Z",
        "meta": null,
        "liveMode": true,
        "split": {
            "type": "percentage",
            "fee_bearer": "business",
            "distribution": [
                {
                    "account": "673e258cbfc6fc07bf0f34b3",
                    "value": 50,
                    "max": 200
                },
                {
                "account": "673b40afbfc6fc07bf0e4d07",
                "value": 40
            }
        ]
            ]
        }
    }
}
```

#### **Direct Debit API** Example with Split

**Endpoint**:
`post https://api.withmono.com/v3/payments/mandates/id/debit`

**Request**:

### Request

123456789101112131415161718192021222324252627

```json
curl --request POST \
     --url https://api.withmono.com/v3/payments/mandates/id/debit \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --header 'mono-sec-key: string' \
     --data '
{
    "amount": 48000,
    "reference": "testingSplitingit1",
    "narration": "testing Split",
    "split": {
        "type": "percentage",
        "fee_bearer": "business",
        "distribution": [
            {
                "account": "673b4668bfc6fc07bf0e4e9e",
                "value": 45
            },
            {
                "account": "673b40afbfc6fc07bf0e4d07",
                "value": 50,
                "max": 20000
            }
        ]
    }
}
'
```

**Response**:

### Request

123456789101112131415161718192021222324252627282930313233343536373839404142

```json
{
  "status": "successful",
  "message": "Account debited successfully.",
  "response_code": "00",
  "data": {
    "success": true,
    "status": "successful",
    "event": "successful",
    "amount": 48000,
    "mandate": "mmc_65785f380155557f95da1547",
    "reference_number": "TPSDD319991D118-02",
    "date": "2023-12-10T14:01:39.619Z",
    "live_mode": true,
    "account_details": {
      "bank_code": "044",
      "account_name": "Samuel Olamide",
      "account_number": "012345679",
      "bank_name": "GUARANTY TRUST BANK PLC"
    },
    "beneficiary": {
      "bank_code": "000",
      "account_name": "SAMUEL",
      "account_number": "123456",
      "bank_name": "MONO SETTLEMENT WALLET"
    },
    "split": {
      "type": "percentage",
      "fee_bearer": "business",
      "distribution": [
        {
          "account": "673b4668bfc6fc07bf0e4e9e",
          "value": 45
        },
        {
          "account": "673b40afbfc6fc07bf0e4d07",
          "value": 50,
          "max": 20000
        }
      ]
    }
  }
}
```

#### Notes on Split Types

-   **Percentage**: Provide values as percentages (e.g., 1 to 99). Ensure the total distribution does not exceed 100%, as some allocation is reserved for fee offsetting.

-   **Fixed**: Provide values in the smallest currency unit (e.g., `5000000` for NGN 50,000).


![Optional max field](/images/callout/bulb.png)

Optional max field

Use the `max` parameter to cap the amount distributed for each transaction.
Example: If `value` is `10` i.e 10% and `max` is `300000` (NGN 3,000), a NGN 50,000 payment will allocate NGN 3,000 (capped).

#### Notes on Fee Bearer

1.  **`sub_accounts`**: Fees are deducted from sub-accounts (e.g., NGN 10 per split).
2.  **`business`**: Fees are deducted from the business account.

### Step 3: Payment Process and Settlement

Once a payment is processed, the remaining amount is distributed as specified in the split configuration. Settlement details are sent via webhooks (i.e direct\_debit.split\_settlement\_successful).

### Settlement Webhook Example

### Request

12345678910111213141516171819202122232425

```json
{
  event: "direct_debit.split_settlement_successful",
  data: {
    reference: "po_tr65CqSSomGEv785xQYvJ3P5",
    business: "60cc8f95ba1772018c5c6b1d",
    app: "61e270e2bbe2010771c0dec7",
    status: "settled",
    message: "Successfully settled",
    date: "2024-12-08T23:00:00.000Z",
    currency: "NGN",
    split_fee: 10
    amount_settled: 200,
    fee_bearer: "sub_accounts",
    account: {
      account_name: "Samuel Olamide",
      account_number: "0123456789",
      account_type: "sub_account",
      institution: {
        name: "Access bank",
        code: "044",
        nibss_code: "000014"
      }
    },
  }
}
```

#### On this page

overview

Step 1 Create a sub account

Step 2 Configure Split Payments

Step 3 track payment status

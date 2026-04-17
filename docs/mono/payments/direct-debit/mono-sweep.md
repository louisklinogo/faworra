---
title: "Mono Sweep (formerly GSM)"
source_url: "https://docs.mono.co/docs/payments/direct-debit/mono-sweep"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Automate funds collection across all bank accounts linked to a customer's BVN via a single mandate setup"
---# Mono Sweep (formerly GSM)

Last updated March 31st, 2026

### Overview

Mono Sweep is an intelligent money-sweeping API that enables lenders and financial institutions to debit customer funds across all their bank accounts through a single setup.

![Prerequisites](/images/callout/bulb.png)

Prerequisites

To get started, you need to:

-   Sign up on the [Partner Dashboard](https://app.mono.co/signup) and complete KYB.
-   [Create a `payments` app](/docs/create-app) and retrieve your Secret key.
-   Configure a [webhook URL](/docs/webhooks) in your dashboard to receive event notifications (you can use [webhook.site](https://webhook.site/) for testing).

### How it works

Setting up Mono Sweep involves four key stages:

1.  **Mandate initiation**: Specify the mandate type when you launch the Direct Debit widget by setting `mandate_type` to `sweep`.

2.  **Customer setup and confirmation**: The customer confirms their bank account and verifies their BVN with date of birth. The customer sends NGN 50 to a NIBSS-designated account to complete the mandate setup.

3.  **Monitor mandate status**: Check when linked accounts are approved and ready to debit.

4.  **Funds collection**: Debit funds from the primary account or linked accounts based on your mandate type (fixed or variable).


![Mono Sweep setup and transaction costs](/images/callout/success.png)

Mono Sweep setup and transaction costs

-   **Setup fee**: NGN 500 per Mono Sweep setup.
-   **Activation fee**: NGN 100 per account linked to BVN
-   **Debit fee**: 1% per successful debit, capped at NGN 1,000.

**Wallet funding:** Ensure your wallet can cover setup fees. See [how to fund your wallet](https://support.mono.co/en/articles/7108842-how-do-i-fund-my-wallet).

### Step 1: Mandate initiation

Initiate Mono Sweep via the [Initiate a Mandate API](/api/direct-debit/mandate/initiate-mandate-authorisation). Ensure the `mandate_type` is set to `sweep`.

Mono Sweep supports both fixed and variable debit types:

1.  **Fixed Mono Sweep**: This is best when you want Mono to automatically debit the primary account and linked accounts with sufficient balances on a consistent schedule. Learn how to initiate a fixed Mono Sweep [here](/docs/payments/direct-debit/mandate-setup-fixed).

2.  **Variable Mono Sweep**: This is used when you want to trigger debits on your schedule via the Debit Account [API](/api/direct-debit/account/debit-account). Learn how to initiate a variable Mono Sweep [here](/docs/payments/direct-debit/mandate-setup-variable).


Use the Initiate a Mandate API

To set up Mono sweep, you must use the [Initiate a Mandate API](/api/direct-debit/mandate/initiate-mandate-authorisation). The Create a Mandate API does not support Mono Sweep and will fail for Mono Sweep setups.

The API response includes a `mono_url` which you will use to redirect the user to the Mono mandate widget, where they can add additional details to complete the process.

### Request

123456789101112131415161718192021222324

```js
{
    "status": "successful",
    "message": "Payment Initiated Successfully",
    "timestamp": "2026-03-28T14:44:02.084Z",
    "data": {
        "mandate_id": "mmc_69c7e9760dbd802f35843aee",
        "type": "recurring-debit",
        "method": "mandate",
        "amount": 20000,
        "mandate_type": "sweep",
        "mono_url": "https://authorise.mono.co/RD0024260424",
        "description": "test",
        "reference": "livetesting1O9O9EF90300",
        "customer": "692da79111e73c006ec580a4",
        "redirect_url": "https://mono.co",
        "created_at": "2026-03-26T14:44:02.084Z",
        "updated_at": "2026-03-26T14:44:02.084Z",
        "start_date": "2026-11-30",
        "end_date": "2026-12-04",
        "meta": {
            "loan_id": "a12bjce"
        }
    }
}
```

### Step 2: Customer setup and confirmation

After initiating the Mono sweep, a `mono_url` is returned in the response. Your customer uses this URL to confirm and authorize the mandate. Here's the flow the customer would take to complete the process:

-   **Account linking**: Select account type (Personal or Business), Choose bank, and enter account number.

-   **Identity verification**: Enter BVN, then input the OTP sent to their phone to verify it. The Date of birth associated with the BVN is required to complete verification.

-   **Ownership validation**: Send NGN 50 to the NIBSS-designated account displayed on screen. A webhook event is sent to your URL after confirmation, after authorizing the mandates on all the accounts in 3 - 7 minutes.


Mono Sweep Setup Charges and Service Downtimes

The NGN 500 setup fee covers multiple operations during the Mono Sweep setup process, including BVN verification and fetching all bank accounts linked to the customer's BVN.

**Important**: Because fees are incurred at several stages of the setup process, if you attempt a Mono Sweep setup during a service downtime and the setup fails to complete, you may still be charged the setup fee without a refund. We recommend monitoring service status announcements before initiating Mono Sweep setup.

![Mandate approval timeline](/images/callout/success.png)

Mandate approval timeline

Following a successful NGN 50.00 authorization payment, the activation of the primary and linked accounts is generally finalized within 3 to 7 minutes.

### Step 3: Monitor mandate status

Before you can collect funds, Mono Sweep must be ready to debit. This is indicated by the `events.mandates.ready` webhook [event](/docs/payments/direct-debit/webhook-events), which is sent after a 24-hour waiting period.

**Sample response**

### Request

12345678910111213141516171819202122232425262728293031

```js
{
  "data": {
    "event": "events.mandates.ready",
    "data": {
      "id": "mmc_69a72021334450c8f673be95",
      "status": "approved",
      "mandate_type": "sweep",
      "debit_type": "variable",
      "ready_to_debit": true,
      "nibss_code": "RC227914/1580/0020510612",
      "approved": true,
      "reference": "YL0Uxrsp2mXcrpo0iRCe",
      "account_name": "JANE DOE",
      "account_number": "12345678910",
      "bank": "United Bank For Africa",
      "bank_code": "033",
      "customer": "697c923c41a19158bd01d790",
      "description": "Mono Test",
      "live_mode": true,
      "message": "Mandate is now ready for debiting",
      "start_date": "2026-03-03T00:00:00.000Z",
      "end_date": "2027-12-31T22:59:59.999Z",
      "date": "2026-03-03T17:52:18.705Z",
      "amount": 10000000,
      "fee_bearer": "business",
      "verification_method": "transfer_verification",
      "app": "67adadced23314578c206100",
      "business": "67adaad3d210314578c205d10"
    }
  }
}
```

### Step 4: Funds collection

Once the mandate is ready to debit (confirmed via the `events.mandates.ready` webhook), you can begin collecting funds. Mono debits the agreed amount from the primary account first. If the account doesn't have sufficient balance, the system automatically attempts the debit on an approved linked account.

#### Debit actions

-   **Fixed Mono Sweep**: Mono automatically runs debits on the primary and linked accounts based on the schedule you provided when you [initiated the mandate](/docs/payments/direct-debit/mandate-setup-fixed). Track processed debits via the Retrieve all Debits [API](/api/direct-debit/account/retrieve-all-debits) or on the Mandates History tab in the dashboard [here](https://app.mono.co/mandates/).

-   **Variable Mono Sweep**: You trigger debits on your schedule by calling the Debit Account API as described [here](/docs/payments/direct-debit/debit-an-account) under Debiting the account.


![Debiting linked accounts](/images/callout/bulb.png)

Debiting linked accounts

Mono Sweep attempts the debit on the primary account first. If the balance is insufficient, it checks for an approved linked account with adequate balance and debits it.

#### Webhook confirmation

On each successful debit, you will receive the `events.mandates.debit.successful` webhook.

### Request

12345678910111213141516171819202122232425262728

```js
{
  "event": "events.mandates.debit.successful",
  "data": {
    "status": "successful",
    "message": "Account debited successfully.",
    "response_code": "00",
    "amount": 50000,
    "customer": "6570ee1115ddbc5528fea1c8",
    "mandate": "mmc_6571f4e55c7d1843d7d162e9",
    "reference_number": "Ah20141329b841234",
    "account_details": {
      "bank_code": "058",
      "account_name": "SAMUEL OLAMIDE",
      "account_number": "0123456789",
      "bank_name": "GUARANTY TRUST BANK PLC"
    },
    "beneficiary": {
      "bank_code": "000",
      "account_name": "Mono",
      "account_number": "P000001",
      "bank_name": "MONO SETTLEMENT WALLET"
    },
    "date": "2023-12-14T10:41:42.016Z",
    "app": "60cc8f95ba1772018c123456",
    "fee_bearer": "business",
    "business": "60cc8f95ba1772018c123456"
  }
}
```

#### On this page

Overview

How it works

step 1 mandate initiation

step 2 customer setup and confirmation

step 3 monitor mandate status

step 4 funds collection

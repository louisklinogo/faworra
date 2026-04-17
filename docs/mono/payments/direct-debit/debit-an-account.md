---
title: "Direct Debit Integration Guide- Debit Account"
source_url: "https://docs.mono.co/docs/payments/direct-debit/debit-an-account"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Learn how to perform balance inquiries and trigger debits for approved variable mandates."
---# Direct Debit Integration Guide- Debit Account

Last updated January 22nd, 2026

## Step 3: Debit bank account

In this step, it is advisable to first confirm if the desired balance on the account is available before proceeding to debit an account.

![Re: Debits by Variable Mandate](/images/callout/permissions.png)

Re: Debits by Variable Mandate

-   After the mandate is created and approved, a "ready-to-debit" webhook event will be sent approximately 24 hours later to notify you that the account is ready for debiting. For more details about webhook events, see [here](/docs/payments/direct-debit/webhook-events).
-   Please note that the Debit Account Step is only required for Variable Mandates. Since Variable Mandates don't have a preset debit timeline, each debit and amount must be triggered manually via the API.

![Balance Threshold Limits](/images/callout/bulb.png)

Balance Threshold Limits

**Please note:**

-   NIBSS enforces a minimum threshold of NGN 1,000 for balance checks. If an account's balance is below NGN 1,000, the balance inquiry will return zero (NGN 0) by default, even if the account holds an amount above zero (NGN 0). This means you may receive a zero balance in response, despite the account having funds.

-   You may get an **insufficient balance** error while attempting to debit the full available balance from some banks. Certain banks require a minimum amount to remain in the account to cover charges or maintain the account. As a result, even if the balance inquiry endpoint returns the full balance, debiting the entire amount may fail. It is recommended to leave a small buffer when debiting from such banks.


<table class="w-full space-y-2.5 border-separate border-spacing-y-2.5 my-5 first:mt-0"><tbody class="[&amp;:first-child_tr]:bg-gray-100 [&amp;:first-child_tr]:font-medium"><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><strong>Supported Banks</strong></td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700"><strong>Can Debit Full Available Balance?</strong></td></tr></tbody><tbody class="[&amp;:first-child_tr]:bg-gray-100 [&amp;:first-child_tr]:font-medium"><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">First Bank of Nigeria Plc</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">No</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">Guaranty Trust Bank Plc</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">Yes</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">Access Bank Plc</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">Yes</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">Zenith International Bank Plc</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">Yes</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">Ecobank Plc</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">Yes</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">First City Monument Bank Plc</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">Yes</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">Keystone Bank Plc</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">No</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">Providus Bank</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">Yes</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">Stanbic IBTC</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">Yes</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">Titan Trust Bank</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">Yes</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">United Bank for Africa Plc</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">Yes</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">Wema Bank</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">No</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">Kuda MFB</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">Yes</td></tr></tbody></table>

### A. Confirming the Balance:

There are two ways to achieve this:

i. Checking if the user has sufficient funds for debit. This service costs NGN 10. To confirm if an account has the desired amount, send a GET request to the following endpoint:

### Request

1

```js
  GET https://api.withmono.com/v3/payments/mandates/{mandate_id}/balance-inquiry?amount={amount}
```

#### Request Path Parameters

-   mandate\_id (required): The field expects the mandate ID returned in the created mandate response above. It typically begins with a mmc.

##### Request Query Parameters

-   amount (required): The field expects the kobo amount that you need to check.

### cURL Sample Request

### Request

12345

```js
curl --request GET \
     --url 'https://api.withmono.com/v3/payments/mandates/id/balance-inquiry?amount=200000' \
     --header 'accept: application/json' \
     --header 'mono-sec-key: string'
'
```

### Success response

If the request is successful, you will receive the following response:

### Request

1234567891011121314

```js
{
  "status": "successful",
  "message": "Successfully enquired balance.",
  "data": {
      "id": "mmc_6578609e0000057f95da1588",
      "has_sufficient_balance": false,
      "account_details": {
          "bank_code": "044",
          "account_name": "SAMUEL OLAMIDE",
          "account_number": "0123456789",
          "bank_name": "ACCESS BANK PLC"
      }
  }
}
```

ii. Balance inquiry that provides the user's current balance i.e. checked the amount in the users account. (This service incurs a fee of NGN 50). Here you don't need to pass amount as parameter.

### Request

1

```js
  GET https://api.withmono.com/v3/payments/mandates/{mandate_id}/balance-inquiry
```

#### Request Path Parameters

-   mandate\_id (required): The field expects the mandate ID returned in the created mandate response above. It typically begins with a mmc.

### cURL Sample Request

### Request

12345

```js
curl --request GET \
     --url 'https://api.withmono.com/v3/payments/mandates/id/balance-inquiry' \
     --header 'accept: application/json' \
     --header 'mono-sec-key: string'
'
```

### Success response

If the request is successful, you will receive the following response:

### Request

1234567891011121314

```js
{
    "status": "successful",
    "message": "Sufficient balance available",
    "data": {
        "id": "mmc_65888b0000000043533aadd14",
        "account_balance": 506000551.04,
        "account_details": {
            "bank_code": "101",
            "account_name": "SAMUEL OLAMIDE",
            "account_number": "6500746916",
            "bank_name": "PROVIDUS"
        }
    }
}
```

![Sandbox Balance Inquiry](/images/callout/bulb.png)

Sandbox Balance Inquiry

Please note that in the sandbox environment, the account balance is fixed at NGN 10,000. Balance inquiry requests will always return this amount, and sufficiency checks will be evaluated against this fixed balance.

### B. Debiting the account

Subsequently, initiate a debit on the user's account by supplying required fields such as the amount (in Kobo), a unique reference, and the narration. It's important to be aware of the two direct debit structures available:

1.  Direct to Payout: This debit type deducts the user's account and settles into your designated settlement account on your Mono dashboard on a T+1 basis.

2.  Direct to Beneficiary: In this case, the user's account is debited, and the deducted amount is processed into the beneficiary details provided in the payload (i.e., the user's NUBAN/bank account and [NIP code](/api/direct-debit/mandate/get-banks)). (Note: To utilize this feature, please contact us, as access is granted on a case-by-case basis.)


N.B Direct Debit

-   Debits are automatically added to payouts and settled on a T+1 basis by default.
-   If the debit account request includes the beneficiary, the amount will be promptly processed to the beneficiary account. Please note that the beneficiary settings for debits are available only upon request.

![Debit Limits](/images/callout/bulb.png)

Debit Limits

When interacting with our APIs to debit transactions, please be aware of the following limits:

-   **Minimum Amount:** NGN 200
-   **Maximum Amount for Personal Accounts:** NGN 25 million
-   **Maximum Amount for Corporate Accounts:** NGN 250 million

These limits ensure a secure and reliable processing of debit transactions and mandates through our platform. Make sure to adhere to these constraints when initiating transactions via the APIs. This may vary based on business model.

To debit the bank account that already has a mandate set, send a POST request to the following endpoint:

### Request

1

```js
  POST https://api.withmono.com/v3/payments/mandates/{mandate_id}/debit
```

#### Request Path Parameters

-   mandate\_id (required): The field expects the mandate ID returned in the created mandate response above. It typically begins with a mmc.

#### Request Body Parameters

<table class="w-full space-y-2.5 border-separate border-spacing-y-2.5 my-5 first:mt-0"><tbody class="[&amp;:first-child_tr]:bg-gray-100 [&amp;:first-child_tr]:font-medium"><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">Field</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">Description</td></tr></tbody><tbody class="[&amp;:first-child_tr]:bg-gray-100 [&amp;:first-child_tr]:font-medium"><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">amount (required)</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">The field expects the amount you want to debit the user in Kobo</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">reference (required)</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">The field expects a unique reference for each direct debit.</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">narration (required)</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">This expects the narration indicating the purpose/description for this said account.</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">fee_bearer (optional)</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">Designate the party responsible for bearing the transaction fee. Options include Customer (the transacting account) or Business (the business's designated wallet)</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">beneficiary</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">In this object field, there is both a NUBAN field and a NIP code field. The debited amount will be promptly settled into this account in real time.</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">beneficiary.nuban</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">This string field expects the nuban/bank account number.</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">beneficiary.nip_code</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">This string field expects the nip code of the destination bank account. You can visit <a target="_self" class="inline-block font-medium text-blue-500" href="/api/direct-debit/mandate/get-banks">here</a> to get the nip code of the user's financial institution.</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">meta</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">This object field is used to include additional information (useful for tracking purposes).</td></tr></tbody></table>

### cURL Sample Request

##### Direct to Payout

### Request

12345678910111213

```js
  curl --request POST \
     --url https://api.withmono.com/v3/payments/mandates/mmc_657880a9928a8446a5212345/debit \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --header 'mono-sec-key: live_sk_qwertyuiop' \
     --data '
{
  "amount": 150000,
  "reference": "btD0319991D118",
  "narration": "Netflix dec Debit",
  "fee_bearer": "business", // or "customer", this field is optional, defaults to business
}
'
```

##### Direct to beneficiary

### Request

1234567891011121314151617181920

```js
  curl --request POST \
     --url https://api.withmono.com/v3/payments/mandates/mmc_657880a9928a8446a5212345/debit \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --header 'mono-sec-key: live_sk_qwertyuiop' \
     --data '
{
  "amount": 150000,
  "reference": "btD0319991D118",
  "narration": "Netflix dec Debit",
  "fee_bearer": "customer", // or "business", this field is optional, defaults to business
  "beneficiary": {
  "nuban": "0123456789",
	  "nip_code": "000013",
	},
  "meta": {
      "internal_note": "Payment for SAMUEL OLAMIDE"
  }
}
'
```

### Success Response

If the request is successful, you will receive the following response:

### Request

12345678910111213141516171819202122232425262728293031323334

```js
{
    "status": "successful",
    "message": "Account debited successfully.",
    "response_code": "00",
    "data": {
        "success": true,
        "status": "successful",
        "event": "successful",
        "amount": 20000,
        "mandate": "mmc_6836182ac511bb531611daf9",
        "reference_number": "refbtD03191D118",
        "date": "2025-05-29T22:16:25.547Z",
        "live_mode": true,
        "fee": 5500,
        "fee_bearer": "business",
        "narration": "Subscription",
        "session_id": "999999250919103136775149584552",
        "account_details": {
            "bank_code": "035",
            "account_name": "Samuel Olamide",
            "account_number": "0252276460",
            "bank_name": "Wema Bank"
        },
        "beneficiary": {
            "bank_code": "000",
            "account_name": "Mono",
            "account_number": "P000001",
            "bank_name": "MONO SETTLEMENT WALLET"
        },
        "meta": {
            "internal_note": "Payment for SAMUEL OLAMIDE"
        }
    }
}
```

DNH Error Codes 05 and 25

If you receive a DNH (Do Not Honour) response with error code 05 or 25 when calling the debit endpoint for a mandate whose `ready_to_debit` status is set to `true`, we recommend waiting 3–5 days before retrying the debit.

Please note that this 3–5 day waiting period is not a guarantee of a successful retry.

This issue typically occurs because the customer's bank has not yet permitted or approved debit transactions on the account.

![Rate Limiting Partners for Failed Payment Attempts](/images/callout/bulb.png)

Rate Limiting Partners for Failed Payment Attempts

#### Rules for Blocking New Debit Attempts on the Same Day

We employ the following rules to determine if a new debit attempt can be processed for a specific mandate on any given day. Please note that this applies exclusively to mandates with variable debit types:

-   Insufficient Funds Lockout: If the last five (5) debit attempts on an account within the same calendar day have resulted in an "insufficient funds" error, no further debit attempts will be permitted on that account for the remainder of that calendar day.
-   General Error Lockout: If the last ten (10) debit attempts on an account within the same calendar day have resulted in any other type of error (including, but not limited to, bank and nibss errors etc.), no further debit attempts will be permitted on that account for the remainder of that calendar day.

#### Error Returned

When the debit endpoint is called and the rate limit has been triggered, the result will be a HTTP 429 error with the message as shown below:

### Request

12345678

```json
{
    "status": "failed",
    "response_code": "429",
    "message": "You have been rate-limited for this mandate. You cannot attempt any more payments on this account until 2026-01-29",
    "timestamp": "2026-01-28T13:47:11.712Z",
    "documentation": "https://mono.co/docs/error-codes/429",
    "data": null
}
```

#### **Reset Condition**

Both of the above rate limiting conditions are **immediately reset** upon a successful payment being processed for the account in question. This means that as soon as a payment clears successfully, the count of failed attempts for both insufficient funds and general errors is reset to zero, and new debit attempts can be made subject to the rules above.

Here are additional API actions available for managing debit information:

-   Retrieve a Debit [🔗](/api/direct-debit/account/retrieve-a-debit)
-   Retrieve all Debits [🔗](/api/direct-debit/account/retrieve-all-debits)

![Mandate Webhooks](/images/callout/bulb.png)

Mandate Webhooks

This processing webhook (events.mandates.debit.processing) is sent to indicate a debit transaction is pending confirmation. When the transaction is finally confirmed as successful or failed, a webhook is sent and the status will be updated.

When direct debits are either successful or unsuccessful, distinct webhooks are activated depending on the specific outcome. For additional information on the varied payment webhook workflows, please refer to [this](/docs/payments/direct-debit/webhook-events) resource.

#### On this page

Banks and balance thresholds

Confirming the balance

Debiting the account

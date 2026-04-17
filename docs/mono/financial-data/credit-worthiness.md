---
title: "Credit Worthiness Guide"
source_url: "https://docs.mono.co/docs/financial-data/credit-worthiness"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Evaluate borrower risk using Mono's credit worthiness API, which analyzes historical transaction data and account behavior."
---# Credit Worthiness Guide

Last updated October 17th, 2025

## Overview

The Credit Worthiness resource evaluates a user's ability to repay a specific loan amount by analyzing their financial behavior. The API considers multiple factors including transaction patterns, debt-to-income ratio, loan specifications (principal, tenor, interest rate), and existing credit history. This comprehensive assessment helps determine the repayment capacity of potential borrowers who have connected their accounts to your business using Mono.

With this endpoint, you can assess a user’s financial profile and their potential to afford a specific loan amount using certain data points, minimizing the risk of default and ensuring responsible lending practices.

## Integration Steps

To retrieve credit worthiness data on a linked financial account, you will need to pass specific loan application information from the borrower such as a custom principal amount, loan interest rate, and tenor.

Kindly note that there are two steps to getting Credit worthiness data on this API, these are:

1.  Initiate Credit-Worthiness Request: Starts the process of analysing existing transactions in a connected bank account and credit history data from the credit bureau, in the background to generate credit worthiness report.
2.  Retrieve Credit-Worthiness Report: Retrieves the generated income records linked to a particular account via webhook.

1

Initiate Credit-Worthiness Request

This endpoint initiates the process of analysing all transactions in a connected bank account in the background to generate credit worthiness report.

To utilize this endpoint, a POST request needs to be sent, containing the specific account ID of your user from Mono Connect as the path parameter. Upon receipt, an API response will be sent indicating that the creditworthiness process has begun and the creditworthiness report will be sent to your configured webhook.

### Request

1

```js
POST https://api.withmono.com/v2/accounts/:id/creditworthiness
```

#### Request Path Parameter

-   id (required): This field expects the id of a connected bank account linked from mono connect [sdk](/docs/financial-data/integration-guide) or [account linking url](/docs/financial-data/connect-link).

#### Request Body Parameters

-   **bvn** **`required`**: This field expects the user's bank verification number (BVN)

-   **principal** **`required`**: This field expects the principal amount being given to the user (in Kobo)

-   **interest\_rate** **`required`**: This field expects the interest rate e.g. 5

-   **term**  **`required`**: This field expects the term/number of months e.g. 12

-   **run\_credit\_check** **`required`:** This field expects a true/false value. When true, the user's credit history (i.e. the outstanding debt records) from the credit bureau, will be factored into the API decision engine. If false, the user’s credit history will not be factored in the computation.

-   **existing\_loans** **`optional`:** This field allows you to pass your custom credit history records of existing loans accrued to a user from your end.

-   **existing\_loans.tenor:** This number field expects the total number of months for a particular loan schedule.

-   **existing\_loans.date\_opened:** This date field expects the date a loan schedule was opened.

-   **existing\_loans.closed\_date:** This date field expects the date a loan schedule is meant to end.

-   **existing\_loans.institution:** This string field expects the name of the institution that offered a loan to a user

-   **existing\_loans.institution:** This string field expects the currency tied to a loan amount.

-   **existing\_loans.repayment\_amount:** This number field expects the total repayment amount to be made by a user.

-   **existing\_loans.opening\_balance:** This number field expects the opening balance of that scheduled loan.

-   **existing\_loans.repayment\_schedule:** This array of object field expects each object to contain a date schedule and the corresponding payment status if it was **_failed_** or **_paid_**.


#### cURL Sample Request

### Request

123456789101112131415161718192021222324252627282930

```curl
curl --request POST \
  --url https://api.withmono.com/v2/accounts/id/creditworthiness\
  --header 'mono-sec-key: live_sk_your_app_key' \
  --header 'accept: application/json'
  --data
{
  "bvn": "12345678901",
  "principal": 30000000,
  "interest_rate": 5,
  "term": 12,
  "run_credit_check": true,
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

#### Request Headers

Include the following header in your request for authentication:

-   `mono-sec-key` (required): Your Mono secret key.

#### Success Response

If the initiation request is successful, you will receive the following API response:

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

Please note that the Credit-worthiness endpoint takes a bit of time to run computations in the background. Once the analysis is done, the credit-worthiness report is sent to you via a webhook.

### How Affordability is Determined

Affordability is determined using the Debt Service Coverage Ratio (DSCR), a key financial metric that evaluates a borrower's ability to repay their debts. The DSCR compares net disposable income against total debt obligations to provide a standardized measure of loan affordability.

The DSCR is calculated using the following formula: **DSCR = Net Disposable Income / Total Debt Service**

Where:

-   **Net Disposable Income:** Derived from the customer's transaction history, reflecting available income after essential expenses
-   **Total Debt Service:** The sum of existing debt payments and new debt obligations

The new loan obligation is calculated using the standard loan amortization formula:

### Request

1

```js
(P x i) / (1 - (1 + i)^(-n))
```

Where:

-   P = Principal loan amount
-   i = Monthly interest rate
-   n = Total number of months

#### DSCR Range Risk Level & Affordability Assessment

<table class="w-full space-y-2.5 border-separate border-spacing-y-2.5 my-5 first:mt-0"><tbody class="[&amp;:first-child_tr]:bg-gray-100 [&amp;:first-child_tr]:font-medium"><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">DSCR Range</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">Loan Affordability</td></tr></tbody><tbody class="[&amp;:first-child_tr]:bg-gray-100 [&amp;:first-child_tr]:font-medium"><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">1.00 - 1.10</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">Critical risk - no affordability</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">1.11 - 1.20</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">High risk - very low affordability</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">1.21 - 1.30</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">Moderate risk - low affordability</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">1.31 - 1.50</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">Low risk - moderate affordability</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">1.51 - 2.00</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">Very low risk - good affordability</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">Above 2.00</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">Minimal risk - high affordability</td></tr></tbody></table>

![callout-icon](/images/callout/bulb.png)

**Important Notes:**

-   Transaction history length affects the net disposable income calculation
-   Transaction length varies by bank (6 months for some, 1 year for others)
-   Current account balance is not factored into the DSCR calculation

### Use Cases

1.  **Lending and Buy Now Pay Later (BNPL):** To personalize loans to borrowers’ needs and repayment capacity, and minimize overall lending risk. This applies to all kinds of financing, micro loans, peer-to-peer loans, and more.

2.  **Mortgage Approval:** To assess a borrower’s ability to manage mortgage payments in conjunction with existing debt, ensuring they can handle both current and future financial obligations.

3.  **Credit Card Issuance:** To determine appropriate credit limits for new or existing credit cardholders based on their financial capacity and existing debt, reducing the risk of default.

4.  **Rental Agreements:** To evaluate potential tenants’ ability to meet rental payments by reviewing their disposable income and existing financial commitments, minimizing the risk of missed payments.


#### On this page

Overview

Integration Steps

how affordability is determined

use cases

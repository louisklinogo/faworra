---
title: "Direct Debit Integration Guide- Mandate Setup (Variable)"
source_url: "https://docs.mono.co/docs/payments/direct-debit/mandate-setup-variable"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Create mandates that allow for flexible withdrawal amounts and schedules up to a predefined limit."
---# Direct Debit Integration Guide- Mandate Setup (Variable)

Last updated June 11th, 2025

## Step 2 (Option A): Variable bank mandate

Variable recurring mandate is an ideal option for businesses looking to collect a varied amount from their customers based on a set total debit for a period of time. For example, you authorise a mandate `amount` of NGN 200,000 for 6 months which can debited in varied amounts and time.

### Request Body Parameters

Using the customer ID (which is returned in the previous step) the next step is to create a mandate on an account belonging to this customer. To do this, a partner will need to provide the following information:

<table class="w-full space-y-2.5 border-separate border-spacing-y-2.5 my-5 first:mt-0"><tbody class="[&amp;:first-child_tr]:bg-gray-100 [&amp;:first-child_tr]:font-medium"><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">Field</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">Description</td></tr></tbody><tbody class="[&amp;:first-child_tr]:bg-gray-100 [&amp;:first-child_tr]:font-medium"><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">amount (required)</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">This is the maximum amount to be debited from the user’s account throughout the mandate (i.e from start to end date). NGN 200 (20000 kobo)</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">type (required)</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">This expects a string value i.e recurring-debit</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">method (required)</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">This field expects a string value i.e mandate.</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">mandate_type (required)</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">This can either be signed or emandate or sweep.</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">debit_type (required)</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">This field expects the type of debit i.e variable</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">description (required)</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">This field expects a description of the set mandate.</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">reference (required)</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">This expects a unique reference ID for this particular reference.</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">start_date (required)</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">This expects the start date for this mandate to begin. e.g. 2024-12-15</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">end_date (required)</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">This expects the end date for this mandate to end. e.g. 2024-05-25</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">customer</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">This expects the the customer id as seen in the response <a target="_self" class="inline-block font-medium text-blue-500" href="/api/customer/create-a-customer">here</a></td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">meta (object)</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">This object used to include additional payment information. e.g meta</td></tr></tbody></table>

### cURL Sample Request: For Variable E-Mandate/Signed Mandate

### Request

123456789101112131415161718192021

```js
curl --request POST \
     --url https://api.withmono.com/v2/payments/initiate \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --header 'mono-sec-key: string' \
     --data {
    "amount": 9190030,
    "type": "recurring-debit",
    "method": "mandate",
    "mandate_type": "emandate", // or "signed" or "sweep"
    "debit_type": "variable",
    "description": "Repayment for samuel@neem.com",
    "reference": "test-O2b9O9EF903-949493432",
    "redirect_url": "https://mono.co",
    "customer": {
        "id":"65eb623b0000900009e5c1f21cd"
    },
    "start_date": "2024-03-29",
    "end_date": "2024-08-04",
    "meta": {}
}
```

### Success Response

If the emandate, signed or sweep request has been initiated successfully, you will receive the following response:

### Request

1234567891011121314151617181920

```js
{
    "status": "successful",
    "message": "Payment Initiated Successfully",
    "data": {
        "mono_url": "https://authorise.mono.co/RD3044259",
        "mandate_id": "mmc_682b977203c0b7360787b46g",
        "type": "recurring-debit",
        "method": "mandate",
        "mandate_type": "emandate", // or "signed" or "sweep"
        "amount": 9190030,
        "description": "Repayment for samuel@neem.com",
        "reference": "test-O2b9O9EF903-949493432",
        "customer": "65eb623b0000900009e5c1f21cd",
        "redirect_url": "https://mono.co",
        "created_at": "2024-03-12T14:17:31.548Z",
        "updated_at": "2024-03-12T14:17:31.548Z",
        "start_date": "2024-03-19",
        "end_date": "2024-08-04"
    }
}
```

![Mandate Webhooks](/images/callout/bulb.png)

Mandate Webhooks

Upon successful creation, rejection, or approval of a mandate, different webhooks are triggered based on the specific scenario. Explore [this](/docs/payments/direct-debit/webhook-events) resource for more details on the diverse webhook workflows.

N.B On Mandate Creation

Please take note that for the successful creation of a direct debit mandate, it is essential that the Customer Name and Account Name match accurately.

Additional operations that can be performed on a direct debit mandate are:

-   Cancelling a direct debit mandate [🔗](/api/direct-debit/mandate/cancel-mandate)
-   Pausing a direct debit mandate [🔗](/api/direct-debit/mandate/pause-mandate)
-   Reinstating a direct debit mandate [🔗](/api/direct-debit/mandate/reinstate-mandate)
-   Retrieve a direct debit mandate [🔗](/api/direct-debit/mandate/retrieve-a-mandate)
-   Get all direct debit mandates [🔗](/api/direct-debit/mandate/get-all-mandates)

![Re: Debits by Variable Mandate](/images/callout/permissions.png)

Re: Debits by Variable Mandate

Please note that since there is no fixed schedule for debiting an account for **Variable Mandates**, each debit must be triggered via the API, following the instructions in **Step 3: Debit an Account**.

#### On this page

Variable bank mandate

Request parameters

Sample request

Success response

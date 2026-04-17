---
title: "Direct Debit Integration Guide: Mandate Setup(Fixed)"
source_url: "https://docs.mono.co/docs/payments/direct-debit/mandate-setup-fixed"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Configure consistent, scheduled debits for subscriptions, loans, and other fixed-amount payments."
---# Direct Debit Integration Guide: Mandate Setup(Fixed)

Last updated June 11th, 2024

## Step 2 (Option B): Fixed bank mandate

The fixed recurring mandate is an ideal option for businesses looking to collect a consistent amount from their customers for a set period. The fixed debit type handles recurring debits using our internal schedulers. For example, you authorise a mandate `amount` of NGN 10,000 to debited monthly for twelve months which will automatically totalled and calculated by our systems as NGN 120,000.

![Re: Debits by Fixed Mandate](/images/callout/permissions.png)

Re: Debits by Fixed Mandate

Please take note that the debits for **fixed mandates** are scheduled when creating the mandate and automatically debited from the customer's account on the set date. The "Debit Account API endpoint" is not supported for a fixed mandate type.

### Request Body Parameters

Using the customer ID (which is returned in the previous step) the next step is to create a mandate on an account belonging to this customer. To do this, a partner will need to provide the following information:

<table class="w-full space-y-2.5 border-separate border-spacing-y-2.5 my-5 first:mt-0"><tbody class="[&amp;:first-child_tr]:bg-gray-100 [&amp;:first-child_tr]:font-medium"><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">Field</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">Description</td></tr></tbody><tbody class="[&amp;:first-child_tr]:bg-gray-100 [&amp;:first-child_tr]:font-medium"><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">amount (required)</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">This is the fixed amount to be debited from the user’s account throughout the mandate (i.e from start to end date). NGN 200 (20000 kobo)</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">type (required)</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">This expects a string value i.e recurring-debit</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">method (required)</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">This field expects a string value i.e mandate.</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">mandate_type (required)</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">This can either be signed or emandate or sweep.</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">debit_type (required)</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">This field expects the type of debit i.e fixed</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">description (required)</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">This field expects a description of the set mandate.</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">reference (required)</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">This expects a unique reference ID for this particular reference.</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">start_date (required)</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">This expects the start date for this mandate to begin. e.g. 2024-12-15</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">end_date (required)</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">This expects the end date for this mandate to end. e.g. 2024-05-25</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">frequency (required)</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">This expects the frequency of the debit <code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">daily</code> , <code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">weekly</code> , <code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">monthly</code> and <code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">yearly</code>. For custom -frequencies use <code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">days</code>, <code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">weeks</code>, <code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">months</code> and provide an whole number value in the interval field</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">interval</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">This expects any whole number (e.g. 1, 5) as it's only required when <code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">days</code>, <code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">weeks</code>, <code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">months</code> are set as the frequency</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">retrial_frequency (required)</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">This expects the number of retries on a particular debit date [ Minimum is 1 &amp; Maximum is 6 ]. For example, a customer’s debit date is 2023-03-04, but the initial debit failed, the <code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">retrial_frequency</code> keeps retrying the transaction for the number of times specified at mandate creation.</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">initial_debit_date (required)</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">This expects the first day/date to debit the mandate account. Must be greater than <code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">start_date</code></td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">initial_debit_amount</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">This expects the initial amount to debit on the <code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">initial_debit_date</code></td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">grace_period (required)</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">This expects the number of days to continue debiting an account before setting the next debit date to next frequency date</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">minimum_due (required)</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">This expects an amount in a case of failed debits due to insufficient funds, the minimum_due is attempted i.e anything you can find, give debit</td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">customer</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">This expects the customer id as seen in the response <a target="_self" class="inline-block font-medium text-blue-500" href="/api/customer/create-a-customer">here</a></td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">meta (object)</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">This object used to include additional payment information. e.g meta</td></tr></tbody></table>

### cURL Sample Request: For Fixed E-Mandate or Signed Mandate

### Request

1234567891011121314151617181920212223242526

```js
curl --request POST \
     --url https://api.withmono.com/v2/payments/initiate \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --header 'mono-sec-key: string' \
     --data {
      "type": "recurring-debit",
      "debit_type": "fixed",
      "customer": {
        "id": "6629259fe903b1"
      },
      "mandate_type": "emandate", // or "signed" or "sweep"
      "amount": 200000,
      "reference": "nomo-test-24-04-24-02",
      "description": "nomo Mandate Test",
      "start_date": "2024-04-29",
      "end_date": "2024-05-30",
      "redirect_url": "https://mono.co",
      "retrial_frequency": 1,
      "frequency": "weekly", // monthly, weekly, daily
      "initial_debit_date": "2024-04-30",
      "grace_period": 6,
      "minimum_due": 20000, // if we are unable to debit the main amount, this minimum due is what we can collect from the account
      "initial_debit_amount": 30000 // After the approval of the mandate, this is the first debit (OPTIONAL)
      "meta": {}
}
```

### Success Response

If the emandate or signed or gsm request has been initiated successfully, you will receive the following response:

### Request

12345678910111213141516171819

```js
{
    "status": "successful",
    "message": "Payment Initiated Successfully",
    "data": {
        "mono_url": "https://authorise.mono.co/RD9152019674",
        "mandate_id": "mmc_682b9a48868508ef6f37a880",
        "type": "recurring-debit",
        "mandate_type": "emandate", // or "signed" or "sweep"
        "amount": 200000,
        "description": "nomo Mandate Test",
        "reference": "nomo-test-24-04-24-02",
        "customer": "6629259fe903b1",
        "redirect_url": "https://mono.co",
        "created_at": "2024-04-24T17:44:17.833Z",
        "updated_at": "2024-04-24T17:44:17.833Z",
        "start_date": "2024-04-29",
        "end_date": "2024-05-30"
    }
}
```

![Mandate Webhooks](/images/callout/bulb.png)

Mandate Webhooks

Upon successful creation, rejection, or approval of a mandate, different webhooks are triggered based on the specific scenario. Explore [this](/docs/payments/direct-debit/webhook-events) resource for more details on the diverse webhook workflows.

![Custom Frequencies](/images/callout/bulb.png)

Custom Frequencies

If you need to configure custom frequencies for a fixed mandate beyond the standard daily, weekly, bi-weekly, monthly, and yearly options, you can use `days`, `weeks`, or `months` as the frequency.

You can then set any whole number (e.g., 1, 5) in the interval field to specify the frequency.

N.B On Mandate Creation

Please take note that for the successful creation of a direct debit mandate, it is essential that the Customer Name and Account Name match accurately.

Additional operations that can be performed on a direct debit mandate are:

-   Cancelling a direct debit mandate [🔗](/api/direct-debit/mandate/cancel-mandate)
-   Pausing a direct debit mandate [🔗](/api/direct-debit/mandate/pause-mandate)
-   Reinstating a direct debit mandate [🔗](/api/direct-debit/mandate/reinstate-mandate)
-   Retrieve a direct debit mandate [🔗](/api/direct-debit/mandate/retrieve-a-mandate)
-   Get all direct debit mandates [🔗](/api/direct-debit/mandate/get-all-mandates)

#### On this page

Fixed bank mandate

Request parameters

Sample request

Success response

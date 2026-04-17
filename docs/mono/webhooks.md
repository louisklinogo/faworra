---
title: "Webhooks"
source_url: "https://docs.mono.co/docs/webhooks"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Configure and secure webhooks to receive real-time updates for account connections, payments, and data syncs."
---# Webhooks

Last updated May 19th, 2022

### Overview

Mono uses Webhooks to communicate updates on transaction objects initiated with our API for you to kick off additional workflows based on these events. Each time an event that you listen to occurs, Mono submits a POST request to the designated Webhook URL with information about the event transactions.

### Configure Webhook

Your endpoint should respond to webhooks as quickly as possible. To acknowledge receipt of a webhook, your endpoint must return a 2xx HTTP status code. This status code should only indicate receipt of the message, not an acknowledgement that it was successfully processed by your system. Any other information returned in the response headers or response body is ignored.

### Security

All Webhook requests are sent with a mono-webhook-secret header for verification. It should match the secret you passed when creating the webhook.

### Request

123456789101112131415161718192021

```js
// example js implementation
const secret = process.env.MONO_WEBHOOK_SEC;

function verifyWebhook(req, res, next) {
  if (req.headers['mono-webhook-secret'] !== secret) {
    return res.status(401).json({
      message: "Unauthorized request."
    });
  }
  next();
}

router.post('/webhook', verifyWebhook, (req, res) => {
  const webhook = req.body;
  switch(webhook.event) {
    case "mono.events.account_updated":
    // do something with webhook.data.account;
    break;
  }
  return res.sendStatus(200);
});
```

### Retries and Failure

In a case where Mono was unable to reach the URL, all the webhooks will be retried. Webhook URLs must respond with a status 200 OK or the request will be considered unsuccessful and retired.

### Sample webhook format

The JSON payload below is a sample response of a webhook event that gets sent to your webhook URL. You should know that all webhook events across Mono Connect, Directpay and Issuing all follow the same payload format as shown below.

<table class="w-full space-y-2.5 border-separate border-spacing-y-2.5 my-5 first:mt-0"><tbody class="[&amp;:first-child_tr]:bg-gray-100 [&amp;:first-child_tr]:font-medium"><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">Fields</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">Descriptions</td></tr></tbody><tbody class="[&amp;:first-child_tr]:bg-gray-100 [&amp;:first-child_tr]:font-medium"><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">event</td><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">The name or type of webhook event that gets sent. Please note that each event type is prefixed with <code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">mono.events</code> e.g <code class="!font-body w-fit bg-gray-100 px-2 py-0.25 leading-3.75 rounded-full uppercase font-semibold text-xxs inline-flex text-green-350" aria-label="tag">mono.events.account_updated</code></td></tr><tr class="bg-gray-50 align-top"><td style="min-width:unset;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700 last:max-w-[240px]">data</td><td style="min-width:240px;word-wrap:break-word;white-space:normal" class="min-w-[100px] max-w-[unset] px-7.5 border-gray-100 border-t border-b first-of-type:border-l last-of-type:border-r py-3.75 text-left first-of-type:rounded-l-lg last-of-type:rounded-r-lg text-sm leading-5 text-gray-700">The payload of the webhook event object that gets sent.</td></tr></tbody></table>

### Request

1234567891011121314151617181920

```js
// Webhook payload
{
  event: 'mono.events.account_updated',
  data: {
    meta: { data_status: 'AVAILABLE' },
    account: {
      _id: '5fbcde8f8699984153e65537',
      institution: [Object],
      accountNumber: '0018709596',
      name: 'OGUNGBEFUN OLADUNNI KHADIJAH',
      type: 'SAVINGS_ACCOUNT',
      currency: 'Naira',
      bvn: '9422',
      balance: 3033984,
      created_at: '2020-11-24T10:21:03.936Z',
      updated_at: '2020-11-24T10:21:13.050Z',
      __v: 0
    }
  }
}
```

### Webhook URL Setup

To easily add a Webhook URL for service monitoring, the following steps below will walk you through how to do so.

**Step 1:** Ensure you have an already created application on your dashboard and navigate to the desired app page.

**Step 2:** Locate the **Add webhook** button at the bottom of your screen to display the webhook modal.

**Step 3:** At this point you can add your web URL that will be stationed to receive live webhook events from Mono.

#### On this page

overview

configure webhook

security

retries and failure

sample webhook format

webhook uRL setup

[Financial Data Webhook Events](/docs/financial-data/webhook-introduction)

[Payment Initiation Webhook Events](/docs/payments/webhook)

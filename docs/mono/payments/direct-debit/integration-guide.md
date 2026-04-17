---
title: "Direct Debit Integration Guide"
source_url: "https://docs.mono.co/docs/payments/direct-debit/integration-guide"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Technical walkthrough for creating customer profiles, setting up bank mandates, and initiating debits."
---# Direct Debit Integration Guide

Last updated March 31st, 2026

GSM has been upgraded to Sweep (Effective March 26th, 2026)

We’ve rolled out an update to the **Direct Debit API** regarding the `mandate_type` field for Mono Sweep.

#### What’s changing

The mandate type has been updated from **`gsm`** to **`sweep`** across the Direct Debit APIs and webhook events.

#### Backward compatibility

To prevent disruption to existing integrations, this change is **mapped internally**. This means:

-   If your integration currently sends "gsm", the request will still be accepted.
-   However, responses and webhook payloads will now return "sweep" as the mandate type.

#### What you should do

Kindly update your integration to use **`sweep`** going forward when creating mandates.

#### Where this applies

The updated value will appear in:

-   Mandate Initiate API response
-   Webhook events including:

`events.mandates.created`, `events.mandates.approved`, `events.mandates.ready`, `events.mandates.expired`

No other changes have been made to the request or response structure.

If you have any questions or need assistance updating your integration, please reach out to our support team.

### Introduction

Welcome to the Mono Direct Debit Integration Guide, designed to assist developers in seamlessly incorporating the Mono Direct Debit (MDD) APIs into their applications. This comprehensive guide provides step-by-step instructions, enabling you to leverage these resources for direct debit purposes.

![Prerequisites](/images/callout/bulb.png)

Prerequisites

To get started, you need to:

-   Sign up on the [Partner Dashboard](https://app.mono.co/signup) and complete KYB.
-   [Create a `payments` app](/docs/create-app) and retrieve your Secret key.
-   Configure a [webhook URL](/docs/webhooks) in your dashboard to receive event notifications (you can use [webhook.site](https://webhook.site/) for testing).

![Sandbox Environment](/images/callout/bulb.png)

Sandbox Environment

-   To test Direct Debit in sandbox you simply need to pass your test keys in the headers of your request. You can find the test keys on your dashboard as shown by [this guide](https://support.mono.co/en/articles/7066615-what-are-public-and-secret-keys).
-   Webhooks are also triggered in the sandbox environment to help you simulate and verify the integration flow (you can use [webhook.site](https://webhook.site/) for easy testing).
-   The credentials passed for testing Direct debit are random credentials.
-   When the create a mandate endpoint is used to setup a mandate in sandbox, the mandate is automatically approved. No transfer is needed.

![ Mandate Endpoints](/images/callout/bulb.png)

Mandate Endpoints

We currently support two endpoints for setting up a mandate. You can choose either of them depending on your integration preferences

-   [Create-mandate endpoint](https://docs.mono.co/api/direct-debit/mandate/create-a-mandate): This allows you to customise the initial mandate setup experience for your users.
-   [Initiate-mandate-link endpoint](https://docs.mono.co/api/direct-debit/mandate/initiate-mandate-authorisation): This generates a link to widget for your users to complete the mandate setup process.

### Integration Guide

After satisfying the prerequisites outlined above, you'll navigate through three key stages to successfully integrate the Mono Direct Debit functionality into your application:

1.  Customer Profile Creation:
    In this initial stage, you will establish a customer profile by providing basic KYC (Know Your Customer) information. This includes details such as the customer's first name, last name, phone number, and BVN (Bank Verification Number).

2.  Bank Mandate Setup:
    In this step, you'll configure a mandate with a fixed or variable debit type on the customer's bank account. This mandate can be authorized as either a signed mandate, e-mandate, or Global Standing Mandate (GSM). Each mandate setup is a one-time authorization process, simplifying subsequent debit transactions.

3.  Debiting Bank Accounts:
    With everything in place, you can initiate direct debit transactions from a customer's account at your convenience. Simply provision the necessary details, including the amount, reference, and narration.


![Re: Debiting an Account](/images/callout/permissions.png)

Re: Debiting an Account

Please take note that the third step - **Debit an Account** is only necessary for Variable Mandates. The debits for fixed mandates are scheduled when creating the mandate and automatically debited from the customer's account on the set date.

By following these stages, you'll seamlessly integrate Mono Direct Debit capabilities into your application, providing efficient direct debit services to your users.

#### On this page

Introduction

Prerequisites

Integration Guide

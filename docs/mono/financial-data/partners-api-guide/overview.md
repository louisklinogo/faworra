---
title: "Overview"
source_url: "https://docs.mono.co/docs/financial-data/partners-api-guide/overview"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Integrate Mono Connect directly without the widget for full control over the user experience and branding."
---# Overview

Last updated July 18th, 2025

The Partners API empowers businesses to integrate directly with the Mono Connect API, offering a fully customised, end-to-end user experience without relying on the Connect widget. This provides developers with greater flexibility and control over their integration.

### Some benefits of using the Partners API

-   Full control over the user experience (custom UI/UX).

-   Programmatic control of account linking without relying on the Mono Connect widget.

-   A backend-only implementation (e.g., triggered via SMS, email, or server-side)

-   Multi-tenant white-labelling for different brands or client accounts.

-   Support for regulated environments that require strict brand or data flow control.

-   Support for channels beyond browser/mobile (e.g., WhatsApp, USSD, kiosks).

-   Granular consent flows, custom token management, or scheduled data pulls.


### Example Use Cases

Here are some examples of how you might use the Partners API:

-   **Custom UI & Native UX**

You want full control over the user experience — no modals, no Mono branding, no widget dependencies.

> Example: A fintech wants users to link their bank accounts from within their own app screens, styled and structured their way.

-   **Multi-brand or White-labeled Platforms**

You serve multiple clients or brands and need a bank-linking experience that adapts per tenant — not a one-size-fits-all widget.

> Example: A SaaS product for loan companies gives each client a white-labeled portal, where end-users link their bank accounts.

-   **Backend-First or Triggered Flows**

You need to initiate or manage account linking from your backend — maybe through email, SMS, or a custom bot.

> Example: A credit scoring engine sends users a link via SMS to start linking; the actual flow is managed entirely via API.

#### Pricing

Pricing remains the same as the Connect API via widget (per connected account). Please refer to the [Mono pricing page](https://mono.co/pricing) for more details.

#### FAQs

##### How can I access the Partners API?

Access to the Partners API is available exclusively to partners with the Mono Partner API add-on.

##### Can I test on sandbox?

Yes, all endpoints in this API are available in **sandbox mode**, allowing partners to perform quality testing and streamline integration before going live.

##### Do we send webhooks for partners API?

Yes we send all webhooks

#### On this page

introduction

when to use the partners api

example use cases

pricing

FAQs

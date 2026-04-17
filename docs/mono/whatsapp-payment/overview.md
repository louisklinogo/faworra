---
title: "WhatsApp Payment Overview"
source_url: "https://docs.mono.co/docs/whatsapp-payment/overview"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Introduction to Owo, a seamless payment channel that enables bank transfers and collections directly on WhatsApp."
---# WhatsApp Payment Overview

Last updated August 15th, 2025

## What is Owo?

Owo is a payment channel on WhatsApp that allows over 60 million Nigerians who use WhatsApp daily to perform financial transactions—such as bank transfers, bill payments, and merchant payments—directly through WhatsApp using text, images or voice. Each Owo user links one or more bank accounts to enable seamless transactions. Explore Owo here → [https://owo.app](https://owo.app)

## What is Direct Charge?

The Owo Direct Charge is a WhatsApp payment API that enables fintechs and developers to programmatically initiate one-time or recurring debit requests from a customer’s linked bank account via WhatsApp. Once authorized by the customer, funds are instantly settled into a virtual account on your platform. The API supports idempotency keys, recurring fund requests, and webhook notifications for transaction status, ensuring reliable integration into your applications.

### Use Cases

Imagine you run a lending platform. Instead of asking customers to open their bank app to make repayments, you can use Owo Direct Charge to request funds directly on WhatsApp, where they already spend most of their time.

-   A customer receives a repayment request via WhatsApp.
-   They approve the payment with a simple reply, voice confirmation, or biometric authentication on WhatsApp.
-   Owo debits the linked bank account instantly.
-   Funds are settled into your platform’s virtual account in real time.

This same flow works for:

-   **Subscriptions & Recurring Payments** (e.g. savings plans, insurance premiums)
-   **One-Time Payments** (e.g. flight tickets, utility bills, e-commerce orders)
-   **Collections** (e.g. school fees, donations, cooperative contributions).

With Owo, payments happen where your customers already chat, making the process seamless, fast, and conversion-friendly.

## Authentication

All API requests require a secret key included in the `mono-sec-key` header:

-   **Header**: `mono-sec-key`
-   **Description**: Your unique, secret API key, available in your [Partner Dashboard](https://app.mono.co/signup).

**Note**: Keep your API key confidential and never expose it in client-side code.

## Base URL

All API endpoints are relative to: `https://api.withmono.com/owo/v1`

#### On this page

Overview

Authentication

Base URL

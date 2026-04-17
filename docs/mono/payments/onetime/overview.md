---
title: "One-time payments"
source_url: "https://docs.mono.co/docs/payments/onetime/overview"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Introduction to Mono DirectPay for processing secure, cardless one-time bank transfers from customers."
---# One-time payments

Last updated December 18th, 2023

## Overview

Our One-time directPay product, empowers you as a business to effortlessly process one-time debit transactions, pulling payments directly from your customers' bank accounts. Leveraging the latest bank transfer technology, our One-time DirectPay API ensures a secure and streamlined payment experience for your customers, eliminating the need for card details entry.

## Payment Type

#### One-time Debit (Naira)

With the One-time Debit feature, your product gains the ability to charge a customer's bank account for a singular transaction. Upon a successful payment, DirectPay automatically triggers a webhook, providing instant confirmation of the completed transaction.

#### API Integration

Integrating DirectPay's One-time Debit into your system is a seamless process, requiring specific parameters for a successful transaction. Here's a breakdown of the essential fields:

-   Amount: Specify the monetary value of the transaction.
-   Description: Provide a brief, informative description or note associated with the payment.
-   Reference: Utilize this field to link the payment to a specific transaction or customer.
-   Payment Type: Indicate "one-time-payment" to specify the one-time debit nature of the transaction.

### Verification API and Webhook

To ensure the success of a payment, employ the Verification API. Simultaneously, a webhook is dispatched immediately post a successful payment, delivering real-time confirmation of the transaction.

#### Potential Use Cases

1.  E-commerce Payments Enable customers to make quick and secure one-time payments for products or services purchased through your online store.

2.  Bill Payments Facilitate convenient one-time payments for utility bills, subscriptions, or any other recurring expenses.

3.  Service Fees Collect one-time fees for services rendered, such as consultancy, membership, or event registration.


<!--

![Prerequisites](/images/callout/bulb.png)

Prerequisites

![callout-icon](/images/callout/bulb.png)

#### On this page

#### On this page

Overview

Payment type

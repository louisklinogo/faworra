---
title: "Direct Debit Integration Guide: Mandate Setup"
source_url: "https://docs.mono.co/docs/payments/direct-debit/mandate-setup-explained"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Deep dive into E-mandates, Signed mandates, and the various authorization flows for Direct Debit."
---# Direct Debit Integration Guide: Mandate Setup

Last updated March 27th, 2026

Deprecation Notice: Signed Mandates

To standardise and optimise direct debit mandate creation, approval, and debits, support for Signed Mandates (physical and digital) will be deprecated **effective 4th May 2026**.

**What's changing:**

-   All **new** Signed Mandate creation will no longer be supported

-   All **new** mandate setups will be restricted to **e-mandate** and **sweep** flows

-   Existing active mandates created via signed mandates will remain valid until cancelled or expired


**Action Required:** Partners are advised to transition to e-mandates to improve approval rates and reduce turnaround times. Contact your account manager or reach out to [support@mono.co](mailto:support@mono.co) for guidance on migrating to e-mandates.

## Step 2: Setup bank mandate

As a partner, you can set up a mandate on either personal accounts or business accounts using the two authorisation types: E-mandate and Signed mandate. Select your preferred method for initiating mandates from the available endpoints.

![ Mandate Initiation Endpoints](/images/callout/bulb.png)

Mandate Initiation Endpoints

-   [Create mandate endpoint](https://docs.mono.co/api/direct-debit/mandate/create-a-mandate): This allows you to customise the initial mandate setup experience for your users.
-   [Initiate mandate link endpoint](https://docs.mono.co/api/direct-debit/mandate/initiate-mandate-authorisation): This generates a link to widget for your users to complete the mandate setup process.

More information on mandate authorization types:

i. **E-mandate**: This mandate type utilizes designated authorization transfer accounts (including Fidelity, Paystack-Titan, and Parallex accounts) to facilitate the Direct Debit e-mandate creation process. The NGN 50 charged for this process can't be **modified**, this fee goes to NIBSS.

![Banks charging minimum of NGN 100 for mandate approval](/images/callout/bulb.png)

Banks charging minimum of NGN 100 for mandate approval

Certain bank apps have a minimum transfer amount of NGN 100, hence, users will not be able to transfer NGN 50 for authorization for the following banks:

-   Unity Bank
-   Union Bank
-   Standard Chartered Bank
-   Ecobank

### **E-Mandate Flow**

1.  Mandate is created → **Awaiting Authorization**
2.  User opens the link and starts the authorization process → **Initiated**
3.  Mandate authorization transfer has been successfully completed → **Approved**
4.  Mandate authorization transfer failed or there was a downtime affecting approvals → **Cancelled**

ii. **Signed mandate**: On the other hand, for a signature mandate, the user must provide a signature for approval, and the payer's bank typically contacts the payer to confirm the mandate's approval.

#### **Physical Signed Mandate Flow**

1.  Mandate form is uploaded → **Initiated**
2.  Mandate has been sent to the bank for processing → **Authorized**
3.  Mandate has been approved by the bank → **Approved**
4.  Mandate has been rejected by the bank → **Rejected**

#### **Digital Signed Mandate Flow**

1.  Mandate is created → **Awaiting Authorization**
2.  User opens the link and starts the authorization process → **Initiated**
3.  Mandate has been sent to the bank for processing → **Authorized**
4.  Mandate has been approved by the bank → **Approved**
5.  Mandate has been rejected by the bank → **Rejected**

![Re: E-mandates](/images/callout/bulb.png)

Re: E-mandates

-   It's important to note that the account the E-mandate is being set up on MUST be used for the NGN 50 funding. This funding acts as the customer's approval of the mandate. If the user fails to send the NGN 50 the mandate will be inactive and unapproved.

-   Your customer can choose either Fidelity, Parallex or Paystack-Titan accounts as the authorization transfer accounts when creating Direct Debit e-mandates. This bank accounts are returned in the transfer\_destinations field under the data objects.

-   Note that the NGN 50 transfer must come from the bank account that requires mandate setup.

-   The user must send the NGN 50 money within 1 hour, else the mandate will be cancelled and they have to create another mandate again.

-   When such mandate is cancelled, the mandate cancelled event ([events.mandate.action.cancelled](/docs/payments/direct-debit/webhook-events)) is sent with the reason for cancellation included in the response.


![Ready to Debit Status](/images/callout/bulb.png)

Ready to Debit Status

After sending NGN 50 to the NIBSS-designated account, the mandated account enters the "ready-to-debit" status within approximately 24 hours. This reduces debit failures.

A [ready-to-debit webhook event](/docs/payments/direct-debit/webhook-events) confirms when the account is ready for debiting.

**Example**: A mandate approved at 4:00 PM will be ready for debiting by 4:00 PM the next day. Mandates approved on Friday will be ready for debiting on the following Monday.

![Debit Types & Amount](/images/callout/bulb.png)

Debit Types & Amount

**Variable**: The `amount` represents the total funds a business plans to collect from a customer over the mandate period. Individual debit amounts can vary within this total limit.

**Fixed**: The `amount` specifies the exact amount to be debited per transaction. The total debit is automatically calculated based on this fixed amount. Once set during mandate authorization, this amount cannot be modified.

NIBSS Code

Every mandate returns a NIBSS code is generated by NIBSS. This can be used to track mandates in cases that require further investigation

To set up a mandate on the customer's bank account, send a POST request to the following endpoint:

### Request

1

```js
  POST https://api.withmono.com/v2/payments/initiate
```

#### On this page

Setup bank mandate

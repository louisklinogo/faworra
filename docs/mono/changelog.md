---
title: "Changelog"
source_url: "https://docs.mono.co/docs/changelog"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Stay up to date with the latest features, API improvements, and technical updates across the Mono product ecosystem."
---# Changelog

Last updated March 27th, 2026

## March 2026

Posted 27 March, 2026

![Identity Verification](/icons/product/lookup.svg)

### Identity Verification

**Watchlist Screening**

We're excited to announce the launch of Watchlist Screening, a new feature within Mono Lookup that enables you to screen individuals and entities against sanctions lists, politically exposed persons (PEPs), and other risk datasets.

#### What's available

-   **Individual & Entity Screening:** Screen using name, date of birth, BVN, gender, and country for individuals, or name, address, and country for entities.

-   **Batch Screening:** Submit multiple screening requests in a single API call.

-   **Risk Scoring:** Get match scores, risk levels (low, medium, high), and detailed match explanations.

-   **Continuous Monitoring:** Enable ongoing monitoring to track future changes in risk status for previously screened subjects.

-   **Audit Logging:** Access comprehensive records of all screening activities for compliance reviews.

-   **PDF Reports:** Generate downloadable compliance-ready reports for regulatory submissions.


#### Get started

-   See the [Watchlist Screening overview](/docs/lookup/watchlist-screening/overview) for feature details.
-   Follow the [Integration Guide](/docs/lookup/watchlist-screening/integration-guide) to add Watchlist Screening to your workflow.

27 March

![Payments](/icons/product/payments.svg)

### Payments

⚠️ **Deprecation Notice: Signed Mandates**

To standardise and optimise direct debit mandate creation, approval, and debits, we will be sunsetting support for Signed Mandates (physical and digital) **effective 4th May 2026**.

**Key Changes:**

-   All **new** Signed Mandate creation will no longer be supported

-   All **new** mandate setups will be restricted to **e-mandate** and **sweep** flows

-   Existing active mandates created via signed mandates will remain valid until cancelled or expired.


**Action Required:** Partners are advised to transition to e-mandates to improve approval rates and reduce turnaround times. Contact your account manager or reach out to [support@mono.co](mailto:support@mono.co) for guidance on migrating to e-mandates.

27 March

We’re excited to launch Mono Sweep, an upgraded money-sweeping API that replaces the previous GSM mandate type. This update introduces key enhancements to improve your collection efficiency:

-   **Unified Consent**: Customers now provide authorization for mandate setup across all linked accounts through a single, streamlined consent flow.

-   **Multi-Bank Recovery**: Organizations can ensure higher collection rates by automatically attempting debits across all BVN-linked accounts if the primary account has insufficient funds.

-   **API Update**: The mandate\_type field value has been updated from gsm to sweep across all Direct Debit APIs and webhooks.


Kindly refer to the integration [guide](/docs/payments/direct-debit/mono-sweep) for more details.

26 March

We’re rolling out an update to the **Direct Debit API** regarding the `mandate_type` field for Mono Sweep (FKA Global Standing Mandate) on March 25th, 2026.

#### What’s changing

The mandate type is being updated from **`gsm`** to **`sweep`** across the Direct Debit APIs and webhook events.

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

`events.mandates.created`, `events.mandates.approved`, `events.mandates.ready`

No other changes have been made to the request or response structure.

If you have any questions or need assistance updating your integration, please reach out to our support team.

11 March

## February 2026

Posted 20 February, 2026

![Identity Verification](/icons/product/lookup.svg)

### Identity Verification

**BVN Bank Account Lookup: Added `nip_code`**

We've added the `nip_code` field to the `institution` object returned by the [Fetch BVN Details](/api/bvn/fetch-bvn) endpoint when the scope is `bank_accounts`.

This improves bank mapping by clearly separating:

-   `bank_code`: CBN bank code used for clearing and settlement.
-   `nip_code`: NIBSS Instant Payment code used for instant transfers.

If a bank is not yet mapped in our registry, `nip_code` may return as `null`. In this case, fall back to `bank_code` or `institution.name` in your internal logic.

20 February

![Financial Data](/icons/product/connect.svg)

### Financial Data

**Account Match**

We've introduced the Account Match feature on Connect, which allows you to verify that the account number provided by a customer matches the account number returned from their linked bank account.

To use this feature, pass the customer's account number in the institution object and set check\_account\_match to true when calling the [Initiate Account Linking](/api/bank-data/authorisation/initiate-account-linking) endpoint. The verification result is returned via the **mono.events.account\_updated** webhook on the **account\_match** field.

For more details, see the [integration guide](/docs/financial-data/connect-link#Account-Match).

12 February

## January 2026

Posted 31 January, 2026

![Identity Verification](/icons/product/lookup.svg)

### Identity Verification

**TIN Lookup: CAC channel**

The `cac` channel for TIN Lookup is now back up and running, making it the most reliable method to verify TIN via NRS. We've also introduced two new fields to the TIN Lookup response when using the `cac` channel:

-   `nrs_tin`: The NRS Tax Identification Number.
-   `address`: The registered address of the taxpayer.

For more details, please refer to the TIN Lookup integration guide [here](/docs/lookup/tin-lookup) and the API reference [here](/api/lookup/tin).

31 January

**CAC Lookup: New Status Report Endpoint**

We've added a new [CAC Status Report](/api/cac/status-report) endpoint that allows you to retrieve a company's CAC status report as a PDF document. Unlike other CAC endpoints, this returns the actual PDF file directly.

**CAC Lookup: Exact Search Parameter**

We've added a new optional `exact` parameter to the [CAC Business Lookup](/api/cac/business) endpoint. When set to `true`, only businesses whose names start with the exact search term are returned. This enables more precise business searches. The parameter defaults to `false` to maintain backward compatibility.

22 January

⚠️ **Billing Notice: BVN Lookup**

All [BVN Lookup API](/docs/lookup/bvn-igree) requests are billable, including failed lookups (e.g. BVN not found or invalid).

To avoid unnecessary charges:

-   Validate BVNs before calling the API (BVNs must be 11-digit numeric values).

-   Avoid bulk or blind verification of unverified BVNs.

-   Implement throttling and monitor failed request rates.


If you need BVN Lookup temporarily disabled to prevent charges, contact your account manager or email [support@mono.co](mailto:support@mono.co).

22 January

![Financial Data](/icons/product/connect.svg)

### Financial Data

We've introduced new fields across several core webhook events and the Account Details endpoint to improve how you track applications, manage custom metadata, and audit events.

A) Improved Context for Account Events: To provide better visibility into which business or application triggered an event, the `app` and `business` fields have been added to the following webhooks:

-   mono.events.account\_connected

-   mono.events.account\_updated

-   mono.events.account\_reauthorized


B) Custom Metadata in Account Connections: We have added support for the `meta.ref` field (which captures any dynamic parameters passed via the metadata object) to the following areas:

-   Webhook: `mono.events.account_connected`

-   API: Account Details endpoint response.


C) Event Tracking with `event_id`: To assist with event auditing, a unique `event_id` field is now included in the payload for:

-   mono.events.account\_connected

-   mono.events.account\_reauthorized

-   mono.events.account\_updated


28 January

## December 2025

Posted 18 December, 2025

![Identity Verification](/icons/product/lookup.svg)

### Identity Verification

We’ve added a new required parameter, `disco_code`, to the Address Verification endpoint. Please refer to the API [reference](/api/lookup/address) for more details.

18 December

![Identity Verification](/icons/product/lookup.svg)

### Identity Verification

We've made updates to the NIN Lookup API, to supports PDF generation. This can be achieved by including the `output=pdf` query parameter when calling the [NIN Lookup API](/api/lookup/nin).

When you include `output=pdf`, the response will contain a `pdf` object with a `jobid` and `status`. If the status is "completed", a `url` field will be included with the PDF download link. If the status is "processing", you can use the new [Poll NIN Job API](/api/lookup/nin/job) to check the status and retrieve the PDF URL when it's ready.

For more details, please refer to the NIN Lookup integration guide [here](/docs/lookup/nin-lookup) and the Poll NIN Job API reference [here](/api/lookup/nin/job).

10 December

![Identity Verification](/icons/product/lookup.svg)

### Identity Verification

We’re excited to announce that you can now manually validate users who encounter issues with the Prove Face-ID verification step (e.g., due to poor lighting or low-quality images). After three failures, the system automatically escalates the session for your review via the Mono Dashboard. Kindly refer to the integration [guide](/docs/lookup/prove/integration-guide) for more details.

3 December

## November 2025

Posted 26 November, 2025

![Payments](/icons/product/payments.svg)

### Payments

We’re excited to introduce [Mandate Biometrics verification](/docs/payments/direct-debit/mandate-biometric-verification), a feature that allows users authorize Direct Debit mandates via facial recognition, eliminating the need for micro-transfer. Customers simply verify their identity with a selfie and liveness check, and their mandate is approved instantly.

The Create a Mandate [API](/api/direct-debit/mandate/create-a-mandate) accepts the optional `verification_method` field (defaulting to `transfer_verification`) and returns the verification link, `verification_method`, when you set `selfie_verification`.

26 November

![Identity Verification](/icons/product/lookup.svg)

### Identity Verification

We've enhanced the data available via the iGree BVN endpoint when the **identity** scope is used. Fetching a user's identity now includes their `nationality` and `address`. Kindly refer to the API [reference](/api/bvn/fetch-bvn) to view the updated response.

26 November

## October 2025

Posted 17 October, 2025

![Financial Data](/icons/product/connect.svg)

### Financial Data

A) We've made updates to the credit worthiness and income api webhook events to include the following new fields:

1 `app`: The application ID from which the webhook event originated.

2 `business`: The business ID associated with the webhook event.

The inclusion of these fields will significantly simplify your integration, providing better context for each event.

For better consistency, we are removing the `sandbox_` prefix from the Account Income and Credit Worthiness webhook events.

B) Effective immediately, the following Live mode event names will be used in Sandbox mode as well:

-   `mono.events.account_income`

-   `mono.events.account_credit_worthiness`


Refer to the [Credit worthiness webhook event](/docs/financial-data/credit-worthiness) and the [Income api webhook event](/docs/financial-data/income) the documentation for more details.

17 October

![Payments](/icons/product/payments.svg)

### Payments

We've made updates to the Direct Debit and Directpay webhook events to include the following new fields:

1.  `event_id`: Unique identifier for tracking and deduplication of webhook events

2.  `timestamp`: ISO 8601 timestamp indicating when the webhook event was triggered


These new fields are included in all Direct Debit (mandates and debits) and Directpay webhook events .

Refer to the [Direct Debit](/docs/payments/direct-debit/webhook-events) and [Directpay](/docs/payments/onetime/webhook-events) webhook events documentation for more details.

7 October

## September 2025

Posted 16 September, 2025

![Financial Data](/icons/product/connect.svg)

### Financial Data

We're excited to announce that the updated data\_status logic and webhook metadata for Mono Connect is now live as of September 15, 2025. This update is made to provide clearer insights into the outcomes of your data syncs.

#### 1.) Data Status ('data\_status') Updates

-   **PARTIAL** _(New)_ : Only one of 'balance' or 'transactions' was successfully retrieved.

-   **UNAVAILABLE** _(New)_ : Neither 'balance' nor 'transactions' were retrieved due to **bank-related issues** or **absence of data** from the user’s bank account.

-   **FAILED** _(Updated)_ : Neither 'balance' nor 'transactions' were retrieved due to **Mono-side issues only** (e.g., a system error on our end). Previously, 'FAILED' could also include issues from the bank.


#### 2.) Webhook & API Metadata

a) **New field**: 'retrieved\_data' — shows what was successfully fetched: **\["balance"\]**, **\["transactions"\]**, or both, in the Account Details [endpoint](/api/bank-data/accounts/details) and Account Updated event (**mono.events.account\_updated**) responses.

b) **New field**: 'has\_new\_data' — a boolean indicating if new data was found during sync, in the account updated webhook event (**mono.events.account\_updated**).

c) **Updated behavior**: 'X-HAS-NEW-DATA' The header is now only sent when new data is available.

**Action Required**

-   Update your logic to account for 'PARTIAL' and 'UNAVAILABLE' statuses.
-   Leverage 'retrieved\_data' and 'has\_new\_data' to enhance how you process sync results.
-   Adjust webhook processing to align with the updated payload and headers.

You can visit the links below for more information about these updates.

-   [Mono Connect New Data Statuses](/docs/financial-data/integration-guide)
-   [Real-time Sync Updates](/docs/financial-data/realtime-data)

16 September

![Payments](/icons/product/payments.svg)

### Payments

The [Account Debit API](/api/direct-debit/account/debit-account) has been updated with two new fields to provide more flexibility and improved tracking:

-   meta: This new object field allows you to include and store additional, custom information related to a payment. It is also returned in the API response payload.

-   session\_id: This new field has been added to both the API and the corresponding webhook response payloads. It's designed to help you track the payment transaction.


22 September

**Introducing the Mono Disburse API.**

We're excited to announce the release of Mono Disburse, a product designed to simplify the processing of payouts in Nigeria, enabling businesses to send money to multiple recipients through instant or scheduled transfers. Transfers can be initiated directly from your linked mandate accounts. This is ideal for use cases like salary payments, loan disbursements, vendor settlements, cashback distribution et.c.

You can find the full documentation for the Disburse API [here](/docs/disburse/overview).

12 September

Added Pay With WhatsApp (PWW) as a new supported feature on the DirectPay One-time Payment product, allowing customers to complete their payment authorization directly through WhatsApp via the Directpay widget.

This provides an additional, seamless payment option alongside existing methods, without requiring any changes to your current integration flow for [Mono Directpay](/api/directpay/initiate).

9 September

## August 2025

Posted 29 August, 2025

![Identity Verification](/icons/product/lookup.svg)

### Identity Verification

We introduced the following new CAC Lookup API endpoints:

-   [Persons with Significant Control](/api/cac/psc): This returns the list of persons with significant control (PSC) of a business.
-   [Company Profile](/api/cac/profile): This returns a comprehensive company profile, which combines the details from the search, shareholders, and directors endpoints.

We also introduced new fields to the Shareholders and Directors endpoints:

-   `business_email` : This represents the official email address of the business.

-   `business_address`: This represents the address/location of the business.


And deprecated the following CAC Lookup API endpoints:

-   Change of Name: This previously returned the former and new name of a business and other information.
-   Previous Address: This returned the former address of a business and other information.

For more details, please refer to the CAC Lookup API Documentation [here](/docs/lookup/cac-lookup).

29 August

We've introduced a new required field called `phone` within the customer object for initiating the prove widget. This takes in the phone number of the user. You'll need to include it when initiating the Prove widget via the API or on the dashboard.

For more details, please refer to the Prove API Documentation [here](/docs/lookup/prove/integration-guide).

25 August

![WhatsApp Payment](/icons/integrate.svg)

### WhatsApp Payment

We're excited to announce Owo Direct Charge, a WhatsApp payment API that enables fintechs and developers to programmatically initiate one-time or recurring debit requests from a customer’s linked bank account via WhatsApp. Once authorized by the customer, funds are instantly settled into a virtual account on your platform. The API supports idempotency keys, recurring fund requests, and webhook notifications for transaction status, ensuring reliable integration into your applications.

For more details, please refer to the WhatsApp Payment API Documentation [here](/docs/whatsapp-payment/overview).

15 August

![Financial Data](/icons/product/connect.svg)

### Financial Data

#### **Upcoming Changelog: Goes Live September 15, 2025**

We’re updating our 'data\_status' logic and webhook metadata to provide clearer insights into sync outcomes, under Mono connect. These changes will take effect on September 15, 2025.

#### 1.) Data Status ('data\_status') Updates

-   **PARTIAL** _(New)_ : Only one of 'balance' or 'transactions' was successfully retrieved.

-   **UNAVAILABLE** _(New)_ : Neither 'balance' nor 'transactions' were retrieved due to **bank-related issues** or **absence of data** from the user’s bank account.

-   **FAILED** _(Updated)_ : Neither 'balance' nor 'transactions' were retrieved due to **Mono-side issues only** (e.g., a system error on our end). Previously, 'FAILED' could also include issues from the bank.


#### 2.) Webhook & API Metadata

a) **New field**: 'retrieved\_data' — shows what was successfully fetched: **\["balance"\]**, **\["transactions"\]**, or both, in the Account Details [endpoint](/api/bank-data/accounts/details) and Account Updated event (**mono.events.account\_updated**) responses.

b) **New field**: 'has\_new\_data' — a boolean indicating if new data was found during sync, in the account updated webhook event (**mono.events.account\_updated**).

c) **Updated behavior**: 'X-HAS-NEW-DATA' The header is now only sent when new data is available.

**Action Required**

-   Update your logic to account for 'PARTIAL' and 'UNAVAILABLE' statuses.
-   Leverage 'retrieved\_data' and 'has\_new\_data' to enhance how you process sync results.
-   Adjust webhook processing to align with the updated payload and headers.

You can visit the links below for more information about these updates.

-   [Mono Connect New Data Statuses](/docs/financial-data/integration-guide)
-   [Real-time Sync Updates](/docs/financial-data/realtime-data)

15 August

## July 2025

Posted 23 July, 2025

![Financial Data](/icons/product/connect.svg)

### Financial Data

We've made updates to the inflow/outflow connect endpoints. The endpoint url was upgraded to v2, and the response of the endpoint has been updated as well.

a. **Updated API Route for the the Credit endpoint:**

-   **From:** [/accounts/{id}/credits](/api/bank-data/credits)
-   **To:** [/v2/accounts/{id}/credits](/api/bank-data/debits)

b. **Updated API Route for the the Credit endpoint:**

-   **From:** [/accounts/{id}/debits](/api/bank-data/debits)
-   **To:** [/v2/accounts/{id}/debits](/api/bank-data/debits)

23 July

![Payments](/icons/product/payments.svg)

### Payments

We've introduced a new optional field, `fee_bearer`, on the [Direct Debit](/docs/payments/direct-debit/overview) API to the following endpoints that allows partners using Direct Debit (e-mandate) to pass transaction charges to their customers:

-   `create a mandate` [API](/api/direct-debit/mandate/create-a-mandate)
-   `debit account` [API](/api/direct-debit/account/debit-account)

This field allows you to specify who bears the transaction fee:

-   `business` (default, if not provided)
-   `customer`

In addition:

-   The `fee_bearer` field is now also included in the **API responses** for both endpoints.

-   All **Direct Debit webhook events** will now contain the `fee_bearer` field as well.


**N.B:** This is not applicable to signed mandates (These mandates are not tokenised as they are sent to the bank directly for processing).

**Please note:**

This feature is currently available only upon approval. Please reach out to the Sales team at [sales@mono.co](mailto:sales@mono.co) for access.

7 July

## June 2025

Posted 30 June, 2025

![Identity Verification](/icons/product/lookup.svg)

### Identity Verification

We've made updates to the Prove product to provide sandbox support to improve the testing experience while integrating the product.

30 June

## May 2025

Posted 23 May, 2025

![Identity Verification](/icons/product/lookup.svg)

### Identity Verification

We've made updates to the [Initiate Prove API](/api/prove/initiate). This change makes the `email`, `address`, and `identity` fields optional, allowing you to generate a unique link for the user to complete the Prove process without having to provide these fields.

23 May

## April 2025

Posted 30 April, 2025

![Payments](/icons/product/payments.svg)

### Payments

We've made updates to our [Direct Debit](/docs/payments/direct-debit/overview) service pricing.

-   All Transactions between NGN 200 and NGN 20,000 will be charged a minimum fee of NGN 55 per transaction. While transactions above NGN 20,000 will be charged at 1% capped at NGN 1000. Please note that this minimum transaction fee will impact both new and existing mandates from the 1st of May, 2025.
-   The [Balance Inquiry](/api/direct-debit/account/balance-inquiry) API (without balance) will now cost NGN 10 per call.

30 April

![Payments](/icons/product/payments.svg)

### Payments

In our [Direct Debit product](/docs/payments/direct-debit/overview), the `events.mandates.debit.success` webhook event has now been deprecated following the notice sent out earlier to maintain consistency in our event structure. Going forward, the `events.mandates.debit.successful` event should be used to track successful mandate debits.

25 April

## March 2025

Posted 24 March, 2025

![Identity Verification](/icons/product/lookup.svg)

### Identity Verification

We're excited to announce the release of [Mono Prove](/docs/lookup/prove/overview), a customer onboarding solution designed to help businesses verify users efficiently while preventing fraudulent sign-ups. Powered by MDN and facial recognition technology, Prove enables seamless identity verification, reducing friction in the onboarding process while maintaining high security standards.

With Prove, businesses can streamline KYC compliance, ensuring that user verification is both reliable and scalable. By leveraging advanced fraud detection and biometric authentication, Prove helps mitigate risks associated with identity fraud, making it easier for businesses to onboard legitimate users with confidence.

For more details, please refer to this API documentation [here.](/docs/lookup/prove/integration-guide)

24 March

![Payments](/icons/product/payments.svg)

### Payments

In our [Direct Debit product](/docs/payments/direct-debit/overview), we are deprecating the `events.mandates.debit.success` webhook to maintain consistency in our event structure. Going forward, partners should use `events.mandates.debit.successful` to track successful mandate debits.

The `events.mandates.debit.success` event will remain functional until **April 21st, 2025**, after which it will no longer be supported.

#### **Action Required**

Partners must update their integrations to listen for `events.mandates.debit.successful` before **April 21st, 2025** to avoid disruptions. For any questions, please contact our integrations team at **integrations@mono.co**.

21 March

![All Products](/icons/product/connect.svg)

### All Products

We're excited to introduce new Python, C#, Java, and Go code samples across all our API products, Connect, Payment, and Lookup to our [API References](/api). These samples have been integrated into our existing language templates (e.g., cURL, Node.js, PHP etc), allowing developers to test APIs instantly in their favourite languages and environments.

With this update, integrating with our APIs is now more efficient and frictionless, empowering developers to test and build faster with minimal overhead.

10 March

## January 2025

Posted 31st January, 2025

![Financial Data](/icons/product/connect.svg)

### Financial Data

We've optimized our Data enrichment [APIs](/docs/financial-data/enrichment/overview) to deliver improved performance and efficiency, providing a seamless experience for you as business.

#### Key Features and Changes

##### **New Endpoints**

#### Job Tracker

We introduced a new job tracker API that helps you to monitor the status of a [Transaction Categorisation](/docs/financial-data/enrichment/transaction-categorisation), [Transaction Metadata](/docs/financial-data/enrichment/transaction-metadata) and [Statement Insights](/docs/financial-data/enrichment/statement-insights) request in real time. The initial response from the API includes the job ID and the current status, such as `processing`. As the job progresses, the status is updated, and users can check its current state using the job ID through the Job Tracker endpoint [here](/api/bank-data/enrichment/job-tracker).

Partners can track the status of the job in real-time by querying the job ID through the API until the status updates to `finished`, signaling completion.

#### Enrichment Record

We also introduced a new endpoint for retrieving Enrichment data for a specific job. Partners can now retrieve the enriched data for transaction categorisation, transaction metadata, and statement insights records for a specific account using the [/v2/enrichments/record/{jobId}](/api/bank-data/enrichment/enrichment-records) endpoint.

##### **Deprecated Endpoints**

We have deprecated the following endpoints:

-   Transaction Categorisation Records
-   Transaction Metadata Records
-   Statement Insights Records

#### Transaction Categorization

a. **Request Method:** Changed from `get` to `post`.

b. **Updated API Route:**

-   **From:** [/v1/enrichments/{id}/transaction-categorisation](/api/bank-data/enrichment/transaction-categorisation)
-   **To:** [/v2/accounts/{id}/transactions/categorise](/api/bank-data/enrichment/transaction-categorisation)

c. **Updated Response Body:** The API response now includes the jobID along with the current status (jobStatus), such as "processing." As the job progresses, its status is updated accordingly. Users can retrieve the latest status at any time by querying the dedicated tracking endpoint [here](/api/bank-data/enrichment/job-tracker) with the job ID.

#### CSV Transaction Categorization

a. **Updated API Response Body:** The CSV Transaction Categorization API response now includes the jobID along with the current status (jobStatus), such as "processing." As the job progresses, its status is updated accordingly. Users can retrieve the latest status at any time by querying the dedicated tracking endpoint [here](/api/bank-data/enrichment/job-tracker) with the job ID.

b. **Updated Webhook Response:** The webhook event for transaction metadata ("mono.events.transaction\_categorisation") updates will now indicate when categorised data is available. It will include details such as the file name and a message confirming that transactions have been updated with metadata.

**Note:** We no longer include categorisation data in the webhook payload. You are to to now call the Enrichment Records [endpoint](/api/bank-data/enrichment/enrichment-records) for the categorised uploaded data.

c. **Data Retention:** The categorised transactions will be available for 1hour. If the endpoint is called again with the same file after this period, the full categorisation process will be re-initiated.

d. **Updated API Route:**

-   **From:** [/v1/enrichments/transaction-categorisation](/api/bank-data/enrichment/transaction-categorisation-upload)
-   **To:** [/v2/enrichments/transaction-categorisation](/api/bank-data/enrichment/transaction-categorisation-upload)

#### Transaction Metadata

a. **Request Method:** Changed from `get` to `post`.

b. **Updated API Route:**

-   **From:** [/v1/enrichments/{id}/transaction-metadata](/api/bank-data/enrichment/transaction-metadata)
-   **To:** [/v2/accounts/{id}/transactions/metadata](/api/bank-data/enrichment/transaction-metadata)

c. **Updated API Response Body:** The response now includes the jobID along with the current status (jobStatus), such as "processing." As the job progresses, its status is updated accordingly. Users can retrieve the latest status at any time by querying the dedicated tracking endpoint [here](/api/bank-data/enrichment/job-tracker) with the job ID.

#### CSV Transaction Metadata

a. **Updated API Response Body:** The CSV Transaction Metadata API response now includes the jobID along with the current status (jobStatus), such as "processing." As the job progresses, its status is updated accordingly. Users can retrieve the latest status at any time by querying the dedicated tracking endpoint [here](/api/bank-data/enrichment/job-tracker) with the job ID.

b. **Updated Webhook Response:** The webhook event for transaction metadata ("mono.events.transaction\_categotransaction\_metadatarisation") updates will now indicate when metadata is available. It will include details such as the file name and a message confirming that transactions have been updated with metadata.

c. **Data Retention:** The metadata data on the uploaded transactions will be available for 1hour. If the endpoint is called again with the same file after this period, the full metadata initiation process will be re-initiated.

d. **Updated API Route:**

-   **From:** [/v1/enrichments/transaction-metadata](/api/bank-data/enrichment/transaction-metadata-upload)
-   **To:** [/v2/enrichments/transaction-metadata](/api/bank-data/enrichment/transaction-metadata-upload)

#### Statement Insights

a. **Updated API Response Message:** The Statement Insights API response now includes the jobID along with the current status (jobStatus), such as "processing." As the job progresses, its status is updated accordingly. Users can retrieve the latest status at any time by querying the dedicated tracking endpoint [here](/api/bank-data/enrichment/job-tracker) with the job ID.

b. **Updated Webhook Response:** The webhook event for statement insights ("mono.events.statement\_insights") updates will now indicate when metadata is available. It will include details such as the account id and a message confirming that statement insights have been updated with information.

c. **Updated API Route:**

-   **From:** [/v1/enrichments/{id}/statement-insights](/api/bank-data/enrichment/statement-insights)
-   **To:** [/v2/accounts/{id}/statement/insights](/api/bank-data/enrichment/statement-insights)

**Note:** We no longer include statement insights data in the webhook payload. You are to now call the Enrichments Record [endpoint](/api/bank-data/enrichment/enrichment-records) for the updated information.

**Data Retention:** The processed statement records will be available for 1hour. If the endpoint is called again, after this period, the full statement insights process will be re-initiated.

**Note:** These updates maintain backward compatibility with existing API versions.

For full documentation, please visit [here](/docs/financial-data/enrichment/overview).

31 January

![Payments](/icons/product/payments.svg)

### Payments

We've made updates to our [Direct Debit](/docs/payments/direct-debit/overview) service to provide sandbox support to improve the testing experience while integrating the product. We've also made updates to our [Create a mandate API endpoint](/api/direct-debit/mandate/create-a-mandate) service enhancing sandbox support.

22 January

## December 2024

Posted 10th December, 2024

![Payments](/icons/product/payments.svg)

### Payments

We're excited to announce the release of **Split Payments**, a feature that allows businesses to seamlessly allocate transaction amounts across multiple accounts during payment processing.

With this update, the `split` object has been introduced as an **optional** body parameter for both the [Initiate Payment API](/api/directpay/initiate) and the [Direct Debit API](/api/direct-debit/account/debit-account). This ensures a **uniform** implementation for handling split payments across one-time and recurring transactions.

##### Key Features of Split Payments

-   Distribute payments based on **percentage** or **fixed values**.
-   Support for multiple recipients via a `distribution` array.
-   Define the fee bearer as either the business or the sub-accounts, enabling control over payout-related fees.
-   A standardized split object structure is now supported across both one-time payments and direct debit transactions, making it easier to integrate and manage.

##### How to Use

Firstly, create one or multiple sub-account via [here](/api/money-operations/create-a-subaccount) for which payouts'splits will be made into.

Next, proceed to simply include the `split` object in your API request body with the desired distribution details. This feature is entirely **optional**; if omitted, transactions proceed as usual without splits. When processed, a settlement webhook (direct\_debit.split\_settlement\_successful) will be sent.

For more details, please refer to this updated API documentation [here](/docs/payments/split-payments)

10th December

![Financial Data](/icons/product/connect.svg)

### Financial Data

We updated the Income webhook (mono.events.account\_income) with 3 new fields in the summary response payload.

-   Total Income (total\_income): The total monthly average from all streams

-   Annual Income (annual\_income): The total monthly average from all streams from the last 12 months.

-   Monthly Income (monthly\_income): The total monthly average from all streams from the last 12 months/ total number of streams.


For more details, please refer [here](/docs/financial-data/income)

6th December

## November 2024

Posted 26 November, 2024

![Payments](/icons/product/payments.svg)

### Payments

We've made updates to our [Direct Debit](/docs/payments/direct-debit/overview) service to reflect the new time interval for the "ready-to-debit" webhook. The webhook will now be sent 3 hours after a mandate is approved, instead of the previous 1-hour timeframe.

26 November

## September 2024

Posted 18th September, 2024

![Financial Data](/icons/product/connect.svg)

### Financial Data

Enhanced the [Real-Time Data](https://docs.mono.co/docs/financial-data/realtime-data) feature for better performance and efficiency

**Key Features:** Response headers now include:

-   `x-job-id` : Unique job identifier.
-   `x-job-status`: Provide job progress (FINISHED, PROCESSING, FAILED).

Webhooks:

-   `mono.accounts.jobs.update`: Sends job status i.e. SUCCESSFUL, FAILED, REAUTHORISATION\_REQUIRED.

**New Endpoint:**
You can now check job status using the [real-time job status](https://api.withmono.com/v2/accounts/:id/jobs/:job-id) endpoint

18th September

## August 2024

Posted 19 August, 2024

![Payments](/icons/product/payments.svg)

### Payments

We’ve added extra fields for DirectPay [successful webhook transactions](/docs/payments/onetime/webhook-events), to indicate suspicious transactions and held settlements.

-   flagged: indicates if a transaction has been flagged as suspicious

-   flag\_reasons: displays the reason why this transaction is considered suspicious

-   held\_settlement: indicates if the settlement for this transaction has been withheld pending review. This is explained below


16th August

1.  We’ve added custom debit frequency on our mandate creation endpoint to allow partners to customize how far apart debits can happen on a fixed mandate. Beyond the standard daily, weekly, bi-weekly, monthly, and yearly options, we have introduced custom-frequency types such as **'days'**, **'weeks'**, **'months'**. This update comes with a newly introduced request field **'interval'** which expects any whole number (e.g., 1, 5) that accompanies custom-frequecies above. You can read [here](/docs/payments/direct-debit/mandate-setup-fixed) for details on this update.

2.  We have also added a new '**_processing_**' status for Direct Debit transactions. The processing status is to allow for confirmation of pending transactions with NIBSS after the [Debit Account API](/docs/payments/direct-debit/debit-an-account) has been called.


The [processing webhook](/docs/payments/direct-debit/webhook-events) (events.mandates.debit.processing) is now sent to indicate a debit transaction is in a pending state. When the transaction is finally confirmed as successful or failed, the respective webhook is sent and the status will be updated.

9th August

![Financial Data](/icons/product/connect.svg)

### Financial Data

The Creditworthiness API \[[/credit-worthiness](/docs/financial-data/credit-worthiness)\] provides summary information about the affordability status calculated against the loan amount requested by a borrower. This is based on preset variables, such as the principal amount, interest rate, tenor and existing credit history, included in the API request and compared against the user's financial transactions.

This enables your lending or financing business to tailor loans or credit to the repayment capability of your customers and minimize the risk of non-repayment.

The response received includes the account ID of the user's linked financial account, months assessed, summary information confirming the affordability status and expected monthly payment and also the user's total outstanding debt retrieved from the credit bureau.

7th August

## July 2024

Posted 24 July, 2024

![Payments](/icons/product/payments.svg)

### Payments

A new field called `balance` has been added to the [Retrieve a Mandate API](/api/direct-debit/mandate/retrieve-a-mandate) response. This connotes the outstanding amount that can be debited from the user's account for that mandate.

24th July

We are pleased to announce an update to our Direct Debit API that improves the mandate authorization process for users with an existing approved mandate in the Mono Network. This update introduces the following enhancements:

-   **Mandate OTP Verification:** For users who already have an approved mandate in the Mono Network, the process for authorizing new mandates now includes OTP verification. After initiating a mandate, the `otp_destinations` field will be included in the response, indicating the available methods (e.g., phone or email) for receiving the OTP.

-   **Consistent Request Body:** The request body for creating mandates remains the same. The new addition is the `otp_destinations` field in the response to allow users to choose their OTP delivery method.

-   **New OTP Verification Endpoint:** A new endpoint, [Verify Mandate OTP API](/api/direct-debit/mandate/mandate-otp-verification), has been introduced. This endpoint manages the OTP verification process. Users must verify the OTP received through their chosen method to finalize and approve the mandate setup.


16th July

![Identity Verification](/icons/product/lookup.svg)

### Identity Verification

Updated the [/NIN-Lookup](/docs/lookup/nin-lookup) endpoint to perform validation on individual using Registered Phone Number.

16th July

We have implemented an additional international passport layer that requires a date of birth field and provides validation information exclusively on the [Int'l Passport API](/api/lookup/intl-passport). Partners can utilize this feature if they encounter an error during the initial passport verification attempt.

9th July

![Financial Data](/icons/product/connect.svg)

### Financial Data

Added the customer creation endpoint for creating a [business customer](/api/customer/create-a-business-customer). You can now pass `business_name` and `type` amongst other details in the customer endpoint when creating a customer that is a business.

9th July

![Payments](/icons/product/payments.svg)

### Payments

We've made a significant improvement to our [Direct Debit API](/docs/payments/direct-debit/overview) product, specifically targeting the e-mandate processing time. The ready-to-debit time for e-mandates has been reduced from the previous 8-10 hours to less than 1 hour. This enhancement means that once a mandate is created and approved, it will be ready for debiting much more quickly, ensuring faster processing times for your transactions. A [ready-to-debit](/docs/payments/direct-debit/webhook-events) webhook event is sent to confirm account debit readiness.

For example, if a mandate is created and approved at 4:00 PM, it will now be ready for debiting by 5:00 PM. This improvement is designed to streamline your operations and enhance the efficiency of the mandate process.

5th July

## June 2024

Posted 7 June, 2024

![Financial Data](/icons/product/connect.svg)

### Financial Data

### A) Data Enrichment APIs

**New Releases**

We're excited to announce the release of our [Data Enrichment APIs](/docs/financial-data/enrichment/overview), designed to provide deeper financial insights into your customers' financial accounts. Through functionalities such as transaction categorization, metadata addition, and statement insights generation, these APIs offer valuable tools to improve financial decision-making and streamline transaction analysisprocesses.The Data Enrichment APIs include:

**Transaction Categorisation**

This API helps categorize user transactions into predefined categories, making it easier to analyze and understand spending habits. It allows you to categorize transactions linked to an already connected bank account marked as `null` or upload your transactions for categorization. The endpoints released in this category are:

-   **Initiate Transactions Categorising Endpoint** [🔗](/api/bank-data/enrichment/transaction-categorisation): Starts the process of categorizing transactions for a connected account.
-   **Categorisation Upload Batch Endpoint** [🔗](/api/bank-data/enrichment/transaction-categorisation-upload): Allows uploading a file of transactions to be categorized.
-   **Retrieve Categorised Transactions Endpoint** [🔗](/api/bank-data/enrichment/transaction-categorisation-records): Fetches the categorized transaction records for a specified account.

**Transaction Metadata**

The Transaction Metadata API allows you to enrich transaction data with additional metadata, providing more context and details about each transaction. This can help in more accurate analysis and reporting. The key endpoints in this API are:

-   **Initiate Transactions Metadata Endpoint** [🔗](/api/bank-data/enrichment/transaction-metadata): Begins the metadata enrichment process for transactions of a connected account.
-   **Metadata Upload Batch Endpoint** [🔗](/api/bank-data/enrichment/transaction-metadata-upload): Allows uploading a file for batch updating transaction metadata.
-   **Retrieve Metadata Records Endpoint** [🔗](/api/bank-data/enrichment/transaction-metadata-records): Retrieves metadata-enriched transaction records for a specified account.

**Statement Insights**

The Statement Insights API analyzes all transactions linked to a provided account ID, returning detailed insights based on the transaction data. This helps in understanding spending patterns, financial health, and unusual activities. The endpoints released in this category are:

-   **Initiate Statement Insights Endpoint** [🔗](/api/bank-data/enrichment/statement-insights): Initiates the process of generating statement insights for a connected account.
-   **Retrieve Statement Insights Records Endpoint** [🔗](/api/bank-data/enrichment/statement-insights-records): Retrieves all statement insights records linked to a particular account.

### B) Income API

**New Releases**

In addition to our Data Enrichment APIs, we have also launched our [Income API](/docs/financial-data/income). This API provides a comprehensive view of income streams and patterns for users, enabling better financial management and insights. The endpoints released under this API are:

-   **Initiate Income Request Endpoint** [🔗](/api/bank-data/accounts/income): Fetches detailed income information for a user, including income summary, income streams, and historical income data.
-   **Retrieve Income Details Endpoint** [🔗](/api/bank-data/accounts/income-records): Retrieves a list of all income streams associated with a user's account.

7th June

## May 2024

Posted 16 May, 2024

![Identity Verification](/icons/product/lookup.svg)

### Identity Verification

Updated the [/TIN-Lookup](/api/lookup/tin) endpoint to perform verification for both individuals and businesses.

16th May

![Payments](/icons/product/payments.svg)

### Payments

Released [Business Accounts E-mandates](/api/direct-debit/mandate/initiate-mandate-authorisation) which allows you to authorise mandates on business accounts using the e-mandate authorisation type when creating or initiating mandate authorisation.

13th May

## April 2024

Posted 24 April, 2024

![Payments](/icons/product/payments.svg)

### Payments

Released [Fixed Recurring Mandate](/api/direct-debit/mandate/initiate-mandate-authorisation) which allows you to set a fixed amount for both signed and e-mandates when creating or initiating mandate authorisation.

24th April

![Identity Verification](/icons/product/lookup.svg)

### Identity Verification

Updated all the response data field for [/BVN-Lookup](/api/bvn/fetch-bvn) from `camelcase` to `snake_case` to maintain consistency and data integrity across our APIs. Also released sandbox environment for when scope is `bank_accounts`.

24 April

## April 2024

Posted 20 April, 2024

![Payments](/icons/product/payments.svg)

### Payments

We've made updates to our [Create a mandate API endpoint](/api/direct-debit/mandate/create-a-mandate) service to provide sandbox support to improve the testing experience while integrating the product.

20 April

![Financial Data](/icons/product/connect.svg)

### Financial Data

Added an optional institution object to the body request of our [/Initiate-Account-Linking](/api/bank-data/authorisation/initiate-account-linking) and [/Payment-Initiation](/api/directpay/initiate) APIs. This enhancement enables you to direct your users to the login page of any financial institution upon opening the generated URL. The institution object contains the `id`, `auth_method`, and `account_number` fields.

For implementation details with Mono Connect, refer to [this link](/docs/financial-data/connect-link) and for DirectPay, visit [here](/docs/payments/onetime/integration-guide).

15 April

![Identity Verification](/icons/product/lookup.svg)

### Identity Verification

Released [/Mashup-Lookup-API](/api/lookup/mashup) API which enables you to verify both the NIN, BVN and date of birth of the user in one single API call for seamless KYC verification, for mono lookup.

The request requires `bvn`, `nin`, and `date_of_birth` fields, all mandatory for successful lookup

4 April

## March 2024

Posted March 28th, 2024

![Payments](/icons/product/payments.svg)

### Payments

Released [Retrieve mandate via Reference](/retrieve-a-mandate-via-reference) API, which allows you to retrieve details of both signed and e-mandates using the unique reference that you passed on mandate creation.

28th March

![Financial Data](/icons/product/connect.svg)

### Financial Data

We have upgraded our Mono Connect and DirectPay APIs to a new version and introduced new endpoints that complement version 2 (/v2) of the Mono Connect and DirectPay widgets. This update also includes the addition of the Customers APIs, expanding the [customer management capabilities](https://docs.mono.co/docs/customers) within Mono's ecosystem.

**N.B**: Please be informed that the version 1 (/v1) APIs will remain accessible until the end of May 2024.

#### A) Customer Resource

**New Releases**

We've launched our Customers’ endpoints, enabling businesses and developers to create and manage customer entities within the Mono ecosystem efficiently.

These Customer Resource endpoints support smooth onboarding procedures and optimize Know Your Customer (KYC) verifications. At the heart of the Customer resource lies our Create a Customer Endpoint, which requires user details including name, email, residential address, phone number, and BVN number.

Upon successful creation of the customer entity on your platform, Mono can aggregate accounts associated with the same customer based on the account name and BVN or email, as well as payments processed by them.

The customer resource also enables you to fetch all Customer's Endpoint, Get Customer Transactions Endpoint etc. The endpoints released in this resource are:

-   **Create a Customer Endpoint** [\[🔗\]](/api/customer/create-a-customer)**:** This endpoint allows businesses to create a customer profile, providing a customer object/ID essential for Connect and DirectPay v2 endpoints, ensuring seamless integration in the Mono-product ecosystem.

-   **Retrieve a Customer Endpoint** [\[🔗\]](/api/customer/retrieve-a-customer)**:** Fetch details of a specific customer using their ID, including personal details, and transaction history.

-   **List all Customers Endpoint** [\[🔗\]](/api/customer/list-all-customers)**:** Retrieve a comprehensive list of all registered customers, facilitating efficient management and analysis of your customer base.

-   **Get Customer Transactions Endpoint** [\[🔗\]](/api/customer/get-all-customer-transactions)**:** Access transaction details of a specific customer by specifying their ID, including amounts, dates, and descriptions.

-   **Fetch all Linked Accounts Endpoint** [\[🔗\]](/api/customer/fetch-all-linked-accounts)**:** Retrieve a list of all linked accounts associated with a customer, offering visibility into their financial profile for enhanced management and analysis.

-   **Update a Customer Endpoint** [\[🔗\]](/api/customer/update-a-customer)**:** This endpoint is to update the profile of your customer via the Customer ID. It's particularly useful when you need to update the address, phone or BVN information.

-   **Delete a Customer Endpoint** [\[🔗\]](/api/customer/delete-a-customer)**:** This endpoint deletes a custoemr entity that has been created by your business. Once deleted, such customer entity cannot be recovered.


#### B) General Changes on Upgraded APIs

-   **URL Endpoint Version Update**: Mono Connect and DirectPay URLs have been upgraded to /v2/ for improved performance, including faster responses and reduced latency, and to accommodate new features and enhancements; https://api.withmono.com/v2.

-   **Data Format Changes**: The new upgrades introduce changes in data formats and structures to enhance compatibility, better organize information, and present data in a more developer-friendly manner. In addition, each response now includes a `timestamp` field, which is beneficial for debugging and troubleshooting. Developers can associate data with specific timestamps, thereby improving their ability to pinpoint root causes. This precise error timing also facilitates effective resolution when issues arise.

-   **Endpoints Impacted by Recent Updates**

-   The following endpoints under Mono Connect have been impacted by the recent upgrades (i.e URL Endpoint Version Update and Data Format Changes) shared above:

-   [Exchange Token endpoint](/api/bank-data/authorisation/exchange-token), [Account Information endpoint](/api/bank-data/accounts/details),[Transactions endpoint](/api/bank-data/transactions), [Identity endpoint](/api/bank-data/accounts/identity), [Unlink endpoint](/api/bank-data/accounts/unlink), [Statements endpoint](/api/bank-data/bank-statement), [Poll PDF Status endpoint](/api/bank-data/poll-pdf-status), [Assets endpoint](https://docs.mono.co/api/bank-data/investment/assets) and [Earnings endpoint](/api/bank-data/investment/earnings)

-   Mono Directpay endpoints have been impacted by the recent upgrades:

-   [Initiate Payments Link endpoint](/api/directpay/initiate), [Verify Payment API](/api/directpay/verify) and [Fetch all Payments API](/api/directpay/fetch-payments)


#### C) Mono Connect API

**New Releases**

-   **Initiate Account Linking/Reauth Endpoint:** This generates a URL that enables your users to complete the account linking or reauthorization process without having to set up an SDK. Key advantages of this service is that the generated URL can be opened either in a browser or via a webview for mobile, regardless of the platform. Also, it eliminates the need for the Mono Connect SDK setup and simplifies the integration process for you. [\[🔗\]](/api/bank-data/authorisation/initiate-account-linking)

-   **Account Balance Endpoint**: This endpoint provides only the account balance of a user’s connected account for Mono Connect. [\[🔗\]](/api/bank-data/authorisation/initiate-account-reauth)


#### D) Mono DirectPay API

**New Releases**

-   Payout Endpoint: Retrieve all payout details based on the status that could be either `pending`, `under_limit`, `processing`, `settled`, or `failed`. [\[🔗\]](/api/money-operations/payout)

-   Payout Transactions Endpoint: This service allows you to use the accountId and PayoutId to retrieve the status of all payout transactions. [\[🔗\]](/api/money-operations/payout-transactions)

-   Refund Payment Endpoint: This endpoint allows you to initiate refunds for payments to customers. [\[🔗\]](/api/money-operations/refund)


**New updates**

Initiate a Payment Endpoint: The "Initiate a Payment" endpoint now necessitates a customer object (`customer`) in the payload request. This object either requires the Customer ID id field or the customer's name (`name`) and email address (`email`) fields. [\[🔗\]](/api/directpay/initiate)

15th March

## February 2024

Posted 28th February, 2024

![Financial Data](/icons/product/connect.svg)

### Financial Data

Updated the endpoint URL for our [Account number Lookup](/docs/lookup/account-number). It was changed from `/v3/lookup/account_number` to the new `/v3/lookup/account-number`.

28th February

![Financial Data](/icons/product/lookup.svg)

### Financial Data

We released a new patch version for our [Mono Connect.js SDK](https://github.com/withmono/connect.js). This update introduces fixes for OPay Facial Recognition and copying virtual account numbers from the widget. The patch is also backwards compatible with our v1 widget.

N.B: This is a minor change and doesn't require updates to the core integration code.

This patch is released in two versions:

-   SDK Version [0.2.5](https://www.npmjs.com/package/@mono.co/connect.js/v/0.2.5) \[backward compatibility with v1\]
-   SDK Version [2.0.2](https://www.npmjs.com/package/@mono.co/connect.js/v/2.0.2)

#### Changes in This Release

**General Changes**

-   Browser not triggering Camera for Opay Facial recognition **\[RESOLVED\]**: We have significantly improved how the SDK handles triggering camera access. This ensures a smoother experience for end-users during the facial recognition process.

-   Copy account number icon wasn’t working **\[RESOLVED\]**: We also pushed a fix which addresses the copy icon not copying the generated account number for payments via transfer.


**SDK Version [0.2.5](https://www.npmjs.com/package/@mono.co/connect.js/v/0.2.5)**

-   Widget Version Switching: Developers who wish to retain the ability to switch between the v1 and v2 widgets must update to SDK version 0.2.5. This version maintains compatibility with both widget versions, allowing you to choose the most suitable option for their needs.

**SDK Version [2.0.2](https://www.npmjs.com/package/@mono.co/connect.js/v/2.0.2)**

-   Permanent v2 Widget Loading: For developers looking to fully transition to the newer version of the widget, updating to SDK version 2.0.2 is recommended. This update permanently loads the v2 widget, leveraging its enhanced features and improved performance.

##### Updating Your SDK

-   If you are currently using older versions of the SDK, you are encouraged to update to either version [0.2.5](https://www.npmjs.com/package/@mono.co/connect.js/v/0.2.5) or [2.0.2](https://www.npmjs.com/package/@mono.co/connect.js/v/2.0.2) based on your requirements. To update, follow the commands below:

-   SDK Version [0.2.5](https://www.npmjs.com/package/@mono.co/connect.js/v/0.2.5)
    **npm install @mono.co/connect.js@0.2.5**

-   SDK Version [2.0.2](https://www.npmjs.com/package/@mono.co/connect.js/v/2.0.2)
    **npm install @mono.co/connect.js@2.0.2**


23rd February

![Financial Data](/icons/product/connect.svg)

### Financial Data

Major upgrade to the Mono widget; version 2 of the Mono Connect and DirectPay widget are now live. New features include:

-   Key consent updates for end-users
-   Faster account linking and payment experience
-   Widget testing in sandbox for various flows, without sandbox login details
-   Improved institution search and new institution request Read the [announcement](https://mono.co/blog/the-mono-connect-widget-2-is-live) for more details.

Upgrading to the new widget:

-   Introducing 'customer object' field: This introduces identification capabilities and is required to be passed with each connection request. Details such as user's name and email should be passed in the customer object field.
-   This applies to both API and SDK integrations.

Please read the Financial data integration [guide](/docs/financial-data/integration-guide) and the SDK integration [guide](/docs/financial-data/sdk) for more details. The Mono widget v1 will remain available for use until May 2024

21 February

![Financial Data](/icons/product/connect.svg)

### Financial Data

Deprecated our Partners API, which previously facilitated the creation of custom or white-labeled solutions using our Mono Connect and Directpay APIs.

16 February

![Identity Verification](/icons/product/lookup.svg)

### Identity Verification

Updated our [CAC Lookup](/docs/lookup/cac-lookup) API, enhancing it to provide additional information such as [Previous Address](/api/cac/previous-address), [Change of Name](/api/cac/change-of-name), [Lookup a Secretary](/api/cac/secretary), and [Lookup a Director](/api/cac/directors). The [Lookup a business](/api/cac/business) and [Shareholder details](/api/cac/shareholder) endpoints have also been upgraded to version V3, enriching the returned CAC details with more robust data.

15 February

## January 2024

Posted 26 January, 2024

![Identity Verification](/icons/product/lookup.svg)

### Identity Verification

-   Deprecated our 360 API, which previously previously returned all the bank accounts linked to the BVN or phone number been specified.

-   Updated our [BVN Lookup](/docs/lookup/bvn-igree) API to now return all available bank accounts connected to a valid Bank Verification Number (BVN) with user's consent.


26 January

![Identity Verification](/icons/product/lookup.svg)

### Identity Verification

Released our [Credit History Lookup](/api/lookup/credit-history) API for retrieving credit history information of users with Mono Lookup.

23 January

![Identity Verification](/icons/product/lookup.svg)

### Identity Verification

1.) Upgraded our [Account Number Lookup](/api/lookup/account-number) API for account number verification, for Mono Lookup.

2.) Released the [NIP Bank Listing](/api/lookup/bank-listing-nip) API to provide NIP bank coverage which contains the bank name, bank code and nip code for each individual bank object, for Mono lookup.

10 January

![Payments](/icons/product/payments.svg)

### Payments

Released the [Delete a Customer](https://docs.mono.co/api/customer/delete-a-customer) API for recurring payments, which allows you to delete a single customer, for Mono Directpay.

9 January

## December 2023

Posted 15 December, 2023

![Payments](/icons/product/payments.svg)

### Payments

Released [Mono Direct Debit (MDD)](/docs/payments/direct-debit/overview) APIs, which empowers you as a business to seamlessly collect variable payments from your customers, on an ongoing basis from all major Nigerian banks through a unified API integration, for Mono Directpay.

15 December

## October 2023

Posted 19 October, 2023

![Financial Data](/icons/product/connect.svg)

### Financial Data

Upgraded the [/bank-account-details](/docs/financial-data/account-information), [/transactions](/docs/financial-data/transactions) and [/statements](/docs/financial-data/statements) API in Mono Connect to a new version (/v1), which allows businesses and developers to retrieve real-time financial data from your customer's linked account. This upgrade introduces a new truthy parameter in the request headers as x-realtimeas well as x-reauth-required (indicates if reauthorization by the end-user is required) and x-has-new-data (indicates if new data was fetched) in the response headers. You can learn more on this real-time data feature [here](/docs/financial-data/integration-guide). Note that the API previous versions are still backward compatible.

19 October

![Identity Verification](/icons/product/lookup.svg)

### Identity Verification

Released [/lookup-drivers\_license](/docs/lookup/overview) API, which enables you to look up and verify the driver's license information and identity of your users.

19 October

## August 2023

Posted 29 August, 2023

![Identity Verification](/icons/product/lookup.svg)

### Identity Verification

Released [/lookup-passport](/api/lookup/intl-passport), [/lookup-house-address](/api/lookup/address), [/lookup-nin](/api/lookup/nin) and the [/lookup-tin](/api/lookup/tin) APIs which enable you to verify international passports, perform house address verification checks and verify NIN identification and also verify tax identification number of your users and business, for mono lookup.

29 August

## July 2023

Posted 14 July, 2023

![Identity Verification](/icons/product/lookup.svg)

### Identity Verification

Added a new feature to the "Verify BVN OTP" API [endpoint](/api/bvn/verify-otp), enabling users to provide an alternative phone number that is not on their BVN record. To utilize this feature, you can include the **alternate\_phone** parameter in the **method** field, along with the new **phone\_number** field we've introduced, for mono lookup.

14 July

## June 2023

Posted 19 June, 2023

![Financial Data](/icons/product/connect.svg)

### Financial Data

Released Transaction [Metadata](/api/bank-data/transaction-metadata) V2, introducing an expanded range of categories for transaction classification and improved accuracy and precision of the Transaction Classifier model. This enhancement empowers developers to build powerful financial applications with reliable transaction classification results.

19 June

![Lookup](/icons/product/lookup.svg)

### Lookup

Upgraded the 360view [endpoint](/api/lookup/360view) in our Lookup product suite for businesses in Nigeria. This upgrade allows businesses and developers to access a comprehensive view of all the bank accounts registered with their customers using their phone number or Bank Verification Number (BVN). The endpoint now returns all the users' bank accounts, supports multiple modes (phone or BVN), and provides bank meta information such as logos.

2 June

## February 2023

Posted 6 February, 2022

![Identity Verification](/icons/product/lookup.svg)

### Identity Verification

Deprecated the BVN lookup API (Legacy) which allows for the verification and access of your customer's BVN identity information, for mono lookup.

6 February

![Identity Verification](/icons/product/lookup.svg)

### Identity Verification

Released [/initiate-bvn-consent](/api/bvn/initiate), [/verify-bvn-otp](/api/bvn/verify-otp) and the [/fetch-bvn-details](/api/bvn/fetch-bvn) API for our BVN Lookup (**Consent**) which provides access to an individual's Bank Verification Number (BVN) information, with their explicit consent, for mono lookup.

6 February

## November 2022

Posted 9 November, 2022

![Issuing](/icons/product/filled/issuing.svg)

### Issuing

Added an optional meta object field on the request body of the [/create a virtual card](/docs) API to include additional card creation information, for mono issuing.

9 November

![Issuing](/icons/product/filled/issuing.svg)

### Issuing

Added the virtual account liquidation successful webhook event (issuing.virtual\_account\_liquidated) which gets sent a virtual account has been liquidated successfully, the virtual account liquidation failed webhook event (issuing.virtual\_account\_liquidation\_failed) which gets sent when a virtual account fails to get liquidated and the card liquidation failed webhook event (issuing.virtual\_card\_liquidation\_failed) which is sent when a virtual card fails to get liquidated, for issuing.

3 November

## October 2022

Posted 22 October, 2022

![Issuing](/icons/product/filled/issuing.svg)

### Issuing

Updated the status of the [liquidate card balance](/docs) API response to **processing** pending a successful liquidation. To check if the status is successful, you can set up webhooks to monitor this. Alternatively, you can use the **transaction\_id** from the API response to a query the transaction status via the [/fetch a transaction](/docs) API for mono issuing.

22 October

![Issuing](/icons/product/filled/issuing.svg)

### Issuing

Deprecated the /credit a virtual account API which transfers from your issuing wallet to a virtual account, for mono issuing. Wednesday, 19th

19 October

![Issuing](/icons/product/filled/issuing.svg)

### Issuing

Added the **transaction\_id** field to the [/transfer to issuing wallet](/docs), [/fund a virtual card](/docs) and the [/liquidate card balance](/docs) API responses, to later query the transaction status via the [/fetch a transaction](/docs) API for mono issuing.

18 October

![Issuing](/icons/product/filled/issuing.svg)

### Issuing

Added the **transaction** field to the card liquidation webhook event payload (issuing.virtual\_card\_liquidated) for mono issuing, so as to retrieve the transaction id when a virtual card gets liquidated.

7 October

![Issuing](/icons/product/filled/issuing.svg)

### Issuing

Released the [/fetch interchange payouts](/docs) API to fetch interchange revenue that is either pending or settled to your business, for mono issuing. It is only available for USD cards.

7 October

![Issuing](/icons/product/filled/issuing.svg)

### Issuing

Added the **interchange\_revenue** field to the [/fetch a transaction](/docs), [/fetch all transactions](/docs) and the [/fetch card transactions](/docs) API responses, to fetch interchange revenue amount on a USD card transaction for mono issuing.

4 October

## September 2022

Posted 27 September, 2022

![Issuing](/icons/product/filled/issuing.svg)

### Issuing

Added the card transaction failed webhook event (issuing.card\_transaction\_failed) for issuing, which gets sent when a USD or NGN card could not be charged or card funding fails.

27 September

![Issuing](/icons/product/filled/issuing.svg)

### Issuing

Added the **fee** field to the [/fetch all transactions](/docs) API, [/fetch a transaction](/docs) API and [/fetch card transactions](/docs) API for issuing.

23 September

![Issuing](/icons/product/filled/issuing.svg)

### Issuing

Added the **country** field to the [/create account holder](/docs) API to support the creation of international account holders in Ghana, Kenya, South Africa, Uganda, and Rwanda for issuing.

16 September

![Issuing](/icons/product/filled/issuing.svg)

### Issuing

Released the /transfer to issuing wallet API on our virtual accounts to move the balance entirely or partially to Issuing wallet, for mono issuing.

2 September

![Issuing](/icons/product/filled/issuing.svg)

### Issuing

Updated the response field in the [/fetch USD exchange](/docs) rate API to return the liquidation rate, for mono issuing.

2 September

## August 2022

Posted 30 August, 2022

![Financial data](/icons/product/connect.svg)

### Financial data

You can now retrieve telco data from your customers via the newly released Telco Data API. The **Telco data API** is the easiest way to retrieve data from any active phone number in Nigeria. Click [here](/api/telco-data/login) to learn more.

30 August

![Issuing](/icons/product/filled/issuing.svg)

### Issuing

Released the /freeze, /unfreeze, /delete, and /liquidate card balance API functionalities on our NGN virtual cards, for mono issuing.

30 August

![Issuing](/icons/product/filled/issuing.svg)

### Issuing

Updated the **narration** response field in the issuing.card\_transaction webhook event to include the merchant name, when a card transaction is made for a NGN virtual card, for mono issuing.

30 August

![Issuing](/icons/product/filled/issuing.svg)

### Issuing

Updated the **billing address** object in the response field of the [Fetch card details](/docs) API event to include the city field, for mono issuing.

30 August

![Issuing](/icons/product/filled/issuing.svg)

### Issuing

Released the [/liquidate card balance](/docs) API on our USD virtual cards to move balance completely or partially, for mono issuing.

26 August

![Issuing](/icons/product/filled/issuing.svg)

### Issuing

Released the [/set wallet threshold](/docs) API functionality to set wallet thresholds for issuing wallets (USD and NGN) so as to get email notifications when your wallet is running low (below-set thresholds) and deficient (zero balance) and \[/fetch wallet transactions\](Get Wallet Transactions) to get wallet related transactions, for mono issuing.

22 August

![Issuing](/icons/product/filled/issuing.svg)

### Issuing

Updated the body params on the [Create](/docs) and [Update](/docs) Account Holder APIs, for the business details object to include three optional fields which are **director\_first\_name, director\_last\_name, rc\_number**. Also, **cac\_id** is now optional as we are using both **rc\_number** and **cac\_id** for backward compatibility depending on which is available from a business, for mono issuing.

13 August

![Issuing](/icons/product/filled/issuing.svg)

### Issuing

Released new issuing bank account endpoints to issue bank accounts to your customers. The API endpoints released are /Create a Bank account, /Fetch a Bank Account, /Fetch a Account Balance, /Fetch Transactions, /Fetch Bank Accounts, /Transfer between Accounts, /Transfer to other Accounts and /Mock Transaction, for mono issuing.

8 August

![Issuing](/icons/product/filled/issuing.svg)

### Issuing

Released the /Sub Account API functionality to for the deposit virtual accounts, for mono issuing.

4 August

## July 2022

Posted 18 July, 2022

![Financial Data](/icons/product/connect.svg)

### Financial Data

Updated the [/credits](https://docs.mono.co/api/bank-data/credits) and [/debits](https://docs.mono.co/api/bank-data/debits) API to return a transaction count for each returned month to enable lenders and partners to filter the average amount per transaction easily and also a simpler alternative to the inflow endpoint for mono connect.

18 July

## May 2022

Posted 17 May, 2022

![Financial Data](/icons/product/connect.svg)

### Financial Data

Updated the [/sync](/docs/financial-data/manual-data-sync) API to return a new **INCOMPLETE\_STATEMENT\_ERROR error**, whenever a financial institution inefficiently returns transaction data that is less than the usually recorded transactions, when Data sync is initiated manually.

17 May

## April 2022

Posted 26 April, 2022

![Financial Data](/icons/product/connect.svg)

### Financial Data

Updated the [/statement](/docs/financial-data/statements) API to return a meta object which contains both a requested\_length (in days) and available\_length (in days) for mono connect.

26 April

![Payments](/icons/product/payments.svg)

### Payments

Updated payment initiation method [via the widget](/docs/definitions#E) to receive a payment id from the payment initiation API in the data object callback for mono directpay.

5 April

## March 2022

Posted 16 March, 2022

![Payments](/icons/product/payments.svg)

### Payments

Released [/v1/payments/transactions](/api/directpay/fetch-payments) API to fetch all payments that have been initiated, with query lookup params such as page, start, end, status, account and customer.

16 March

![Payments](/icons/product/payments.svg)

### Payments

Added the [payment authorised webhook event](/docs/payments/webhook) **(direct\_debit.payment\_authorised)** for directpay, which gets sent as soon as payment is completed or a standing order has been set up.

8 March

#### On this page

march 2026

february 2026

january 2026

december 2025

november 2025

october 2025

september 2025

august 2025

july 2025

june 2025

may 2025

april 2025

march 2025

january 2025

December 2024

november 2024

september 2024

august 2024

july 2024

june 2024

may 2024

april 2024

march 2024

february 2024

january 2024

december 2023

october 2023

august 2023

july 2023

june 2023

february 2023

november 2022

October 2022

September 2022

August 2022

july 2022

may 2022

april 2022

march 2022

---
title: "Mandate Biometrics Verification"
source_url: "https://docs.mono.co/docs/payments/direct-debit/mandate-biometric-verification"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Secure mandate authorization using real-time BVN validation and facial recognition checks."
---# Mandate Biometrics Verification

Last updated December 3rd, 2025

## Overview

Mandate Biometrics Verification is an alternative authorization method for Direct Debit mandates that uses real-time BVN validation + Face Match checks. When the feature is enabled for your business, customers verify their identity with a selfie and liveness check inside your product, and mandates are approved once the match succeeds.

![Feature access](/images/callout/bulb.png)

Feature access

This flow is available on request. Please reach out to support team via support@mono.co for access, before calling the `create a mandate` API with `verification_method: "selfie_verification"`.

Key benefits:

-   **Instant Approval:** Mandates auto-transition to `approved` once the face match succeeds.

-   **In-platform experience:** Customers complete the selfie/liveness journey without leaving your mobile or web experience.

-   **Secure & compliant:** BVN validation + Face Match runs against the BVN photo, reducing fraud and supporting faster onboarding.


## API Flow

1.  **Customer creation with BVN:** Before creating a mandate, call the [Create Customer](/api/customer/create-a-customer) endpoint to capture the customer BVN so Mono can look up the associated image.

2.  **Mandate creation with `verification_method`:** Use the [Create a Mandate API](/api/direct-debit/mandate/create-a-mandate) and send `verification_method: "selfie_verification"` to trigger Biometric Verification instead of the default transfer flow.

3.  **Face Match & liveness:** The customer follows the `mono_url` returned in the response, completes the selfie/liveness journey, and Mono compares the selfie against the BVN photo.

4.  **Mandate activation:** Once the match succeeds, the mandate status flips to `approved` and a `mandate approved` webhook fires. The mandate becomes available for debits after the `ready to debit` event is sent.


![Configure \`verification\_method\`](/images/callout/bulb.png)

Configure \`verification\_method\`

If you omit `verification_method`, the API falls back to `transfer_verification` and the NGN 50 transfer path. The Biometric path requires `verification_method: "selfie_verification"` so you can include the returned `mono_url` in your UI and keep track of the chosen method via the `verification_method` field in the response data.

Track this entire verification flow inside your platform, handle `approved` statuses, and make sure your webhook consumers listen for both the `mandate approved` event and the `mandate ready` event before debiting.

## API flow breakdown

1.  **Create the customer record with BVN details.** Include the BVN when calling the [Create Customer](/api/customer/create-a-customer) endpoint so Mono can fetch the BVN photo used in face matching.

2.  **Call the Create a Mandate API with biometric verification.** Send `verification_method: "selfie_verification"` and the standard mandate payload—Mono validates the BVN, ties the mandate to the customer, and returns the `mono_url` for the customer to complete the selfie + liveness experience.


### Request

1234567891011121314151617181920

```bash
curl --request POST \
  --url https://api.withmono.com/v3/payments/mandates \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --header 'mono-sec-key: live_sk_your_secret_key' \
  --data '{
    "debit_type": "variable",
    "customer": "string",
    "mandate_type": "emandate",
    "amount": 1000000,
    "reference": "mandatevrif7l9d4",
    "account_number": "2012345678",
    "bank_code": "044",
    "fee_bearer": "business",
    "description": "Mono Test",
    "start_date": "2025-11-27T00:00:00.000Z",
    "end_date": "2026-12-31T22:59:59.999Z",
    "verification_method": "selfie_verification",
    "meta": {}
  }'
```

1.  **Customer completes the selfie + liveness journey.** Use the `mono_url` to render the verification experience, then wait for the callback/webhook indicating the mandate status changed to `approved`.

2.  **Mandate activated.** Upon success the mandate is approved automatically; the `mandate approved` webhook fires. The mandate only becomes eligible for debits after the `ready to debit` event is sent.


### Request

12345678910111213141516171819202122232425262728

```json
{
  "status": "successful",
  "message": "Mandate created successfully",
  "data": {
    "id": "mmc_691d957a87120578aeb864af",
    "status": "initiated",
    "mandate_type": "emandate",
    "debit_type": "variable",
    "ready_to_debit": false,
    "mono_url": "https://develop.d25lmvlzvrkhwa.amplifyapp.com/RC227914%2F1580%2F0015154303",
    "nibss_code": "RC227914/1580/0015154303",
    "approved": false,
    "reference": "mandatevrif7l9d4",
    "account_name": "Samuel Olamide",
    "account_number": "2012345678",
    "bank": "Access Bank",
    "bank_code": "044",
    "customer": "691af11398baaa44e1567bde",
    "description": "Mono Test",
    "live_mode": true,
    "start_date": "2025-11-27T00:00:00.000Z",
    "end_date": "2026-12-31T22:59:59.999Z",
    "date": "2025-11-19T10:01:30.471Z",
    "amount": 1000000,
    "fee_bearer": "business",
    "verification_method": "selfie_verification"
  }
}
```

The response always includes the `verification_method` field so you can verify whether the biometric path or transfer path executed.

## Pricing

-   **NGN 100** for Biometric Verification (charged to the business wallet).
-   **NGN 50** for NIBSS mandate activation.

![Charges](/images/callout/bulb.png)

Charges

We charge both together when selfie verification path is used and they are both charged to the wallet when the mandate is approved.

#### On this page

overview

flow

api flow breakdown

pricing

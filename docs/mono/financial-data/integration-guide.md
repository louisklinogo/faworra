---
title: "SDK Integration Guide"
source_url: "https://docs.mono.co/docs/financial-data/integration-guide"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "A comprehensive walkthrough for implementing Mono Connect across frontend SDKs and backend APIs."
---# SDK Integration Guide

Last updated September 16th, 2025

## Overview

This guide will put you through the necessary steps to take when trying to Integrate Mono Connect into your software solution. Please check out our populated list of SDKs in our documentation [here](/docs/sdks) for whichever platform you will want to integrate with, be it Android, Flutter, IOS or the Web.

For the sake of this guide, we will be integrating with our Inline [Connect SDK](/docs/financial-data/sdk).

![Prerequisites](/images/callout/bulb.png)

Prerequisites

To get started, you need to:

-   Sign up on the [Partner Dashboard](https://app.mono.co/signup) and complete KYB.
-   [Create a `connect` app](/docs/create-app) and retrieve your Public and Secret keys.
-   Configure a [webhook URL](/docs/webhooks) in your dashboard to receive event notifications (you can use [webhook.site](https://webhook.site/) for testing).

## Integration Guide

With the above prerequisite steps already taken, please note that there are two stages for completing the integration process:

#### 1\. SDK Implementation (Front-end) Stage:

In this stage, you will be implementing a Mono SDK which allows your user or customer to log in to their selected or desired financial institution using the Mono widget on your mobile platform.

#### 2\. API Implementation (Back-end) Stage:

This is where you can start calling Mono's API for the user's bank account details, transactions, identity etc after a successful account authentication process.

We will be breaking down both stages in further detail below. For the sake of this guide, we will be integrating with our Inline [Connect SDK](/docs/financial-data/sdk).

## SDK Implementation (Front-end) Stage

This stage aims to ensure that you have set up your desired Mono SDK in your mobile or web platform, so your users can successfully link their accounts on your platform. This can be achieved in two simple steps shared below:

1

Mono Connect Widget setup

Depending on the Mono SDK that you want to implement from our SDK directory [here](/docs/sdks), be sure to go through the GitHub read-me doc for the installation and set up on your web or mobile platform as applied. Once done, update the `key` parameter to have your Mono application public key which you can retrieve from your dashboard.

It is this public key that identifies your mono dashboard app, to the front-end widget. Also, the SDK expects a **required** "data" callback which should contain the customer object

![Note on Customer object](/images/callout/bulb.png)

Note on Customer object

The structure of the expected fields on the customer object are:

-   **name** (required): This field expects the name of the customer
-   **email** (required): This field expects the email of the customer
-   **identity**: This object field expects both the identity type (i.e bvn) and the identity number
-   **id**: This field expects the customer id.

**N.B**: When an account has been linked successfully, an ID is generated for this customer, which can be accessible on the Mono dashboard.

With this newly generated customer id, it can be passed to the customer object directly, for subsequent account linking.

### Request

12345678910111213141516171819

```js
<script type="application/javascript">
  const customer = {
    id: "65c31fa54e0e963044f014bb", // When provided, the name, email and identity are not required.
    name: "Samuel Olamide", // required
    email: "samuel@neem.com", // required
    identity: {
      type: "bvn",
      number: "2323233239",
    },
  };

  var connect;
  var config = {
    key: "YOUR_APPS_PUBLIC_KEY_HERE"
    data: { customer },
  };
  connect = new Connect(config);
  connect.setup();
</script>
```

## API Implementation (Back-end) Stage

At this point, the objective is to receive the temporary token from the front end, get your permanent Account ID and fetch the financial data APIs. All of these are explained in the steps below:

1

Fetch the Customer's Account ID

With our authorization token received from your front end, the next step to take here will be to call our Exchange Token [API](https://docs.mono.co/api/bank-data/authorisation/exchange-token) to fetch an Account ID for this user.

Please note that this Account ID is a permanent identifier to this user’s connected bank account. Also note that this Account ID doesn’t have an expiry time as the time to live is indefinite.

With this information at hand, it is important to save this Account ID into your database (which of course will be associated with this user linking) so that you can make future API calls as desired.

[API Reference](https://docs.mono.co/api/bank-data/authorisation/exchange-token)

### Request

12345678910

```bash
curl --request POST \
  --url https://api.withmono.com/v2/accounts/auth \
  --header 'Content-Type: application/json' \
  --header 'accept: application/json' \
  --header 'mono-sec-key: test_sk_adasdsadasddasd' \
  --data '
{
    "code":"string"
}'

```

### Request

123

```json
{
    "id": "5f171a530295e231abca1153"
}
```

**N.B:** Kindly also note that once an account has been linked successfully on the Mono connect widget, an account connected (mono.events.account\_connected) event is fired to your webhook URL, which you have [setup](/docs/webhooks) on your dashboard, which informs you in real-time the account that has been linked.

You can visit [here](/docs/financial-data/auth-connection) for more details about this webhook.

### Request

12345678

```js
{
    "event": "mono.events.account_connected",
    "data": {
      "id": "67a49601085b003211ef0d05",
      "customer": "67fvb112fa592540c27e538",
      "meta": {}
    }
}
```

![NOTE 1](/images/callout/bulb.png)

NOTE 1

Regarding the expiry period

-   The Authorization token expires after 10 minutes.
-   The Account ID doesn't expire except if [unlinked](https://docs.mono.co/api/bank-data/accounts/unlink) via API.

![NOTE 2](/images/callout/bulb.png)

NOTE 2

If you are integrating on the Web, please endeavor not to make this API request to Mono directly on your front end as you will be at risk of exposing your **App Secret Key**.

Instead, make an API request to your back-end with your payload and from there, you can now make an API call to Mono with your request.

## Resources

[Mono Connect SDKs](/docs/sdks)

[Mono Connect Libraries](/docs/libraries)

[Mono Connect Callbacks](/docs/financial-data/sdk)

[Mono Connect Callbacks Events Tracking](/docs/financial-data/sdk)

[Mono Connect APIs](/docs/financial-data/account-information)

#### On this page

Overview

integration guide

sDK Implementation Frontend Stage

aPI Implementation Backend Stage

resources

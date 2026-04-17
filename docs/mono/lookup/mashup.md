---
title: "Lookup Mashup API Integration Guide"
source_url: "https://docs.mono.co/docs/lookup/mashup"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Verify NIN, BVN, and Date of Birth in a single, efficient API call for faster customer onboarding."
---# Lookup Mashup API Integration Guide

Last updated November 6th, 2024

## Overview

Our Lookup Mashup API allows you to verify both the NIN, BVN and date of birth of the user in one single API call. This guide will walk you through the process of integrating this service into your application, allowing you to retrieve relevant KYC details seamlessly.

![Prerequisites](/images/callout/bulb.png)

Prerequisites

To get started, you need to:

-   Sign up on the [Partner Dashboard](https://app.mono.co/signup) and complete KYB.
-   [Create a `lookup` app](/docs/create-app) and retrieve your Secret key.
-   Retrieve your Sandbox test credentials from the [Sandbox page](/docs/sandbox#lookup).

## Integration Steps

## Step 1: Make a Mashup Lookup Request

To verify and retrieve KYC information about a user, send a POST request to the following endpoint:

### Request

1

```js
POST https://api.withmono.com/v3/lookup/mashup
```

### Request Body Parameters

-   `nin` (required): The field expects the NIN of the user.
-   `bvn` (required): The field expects the BVN of the user.
-   `date_of_birth` (required): The date of birth of the user in this format YYYY-MM-DD eg. 1960-10-01

Include these three parameters in the request body to specify the nin, bvn, number and date of birth for the lookup.

### Request Headers

Include the following header in your request for authentication:

-   `mono-sec-key` (required): Your Mono secret key.

### cURL Sample Request

### Request

12345

```js
curl --request POST \
  --url https://api.withmono.com/v3/lookup/mashup \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --data '{"nin":"string", "bvn": "string", "date_of_birth": "string"}'
```

## Step 2: Process the Response

If the mashup lookup request is successful, you will receive the following response:

### Request

12345678910111213141516171819202122232425262728293031323334353637383940

```js
{
    "status": "successful",
    "message": "Lookup Successful",
    "timestamp": "2024-05-10T12:26:18.235Z",
    "data": {
        "personal_information": {
            "title": null,
            "first_name": "SAMUEL",
            "middle_name": "NOMO",
            "surname": "OLAMIDE",
            "gender": "MALE",
            "dob": "01-09-1991",
            "birth_country": "nigeria",
            "birth_state": null,
            "birth_lga": "Kosofe Lagos",
            "marital_status": "SINGLE",
            "email": "samuel@nomo.co",
            "telephone_no": "07012345678",
            "occupation": "STUDENT",
            "lga_of_origin": "YABA",
            "state_of_origin": "LAGOS",
            "watch_listed": null
        },
        "identification_numbers": {
            "nin": "12345678901",
            "bvn": "22227777222"
        },
        "residence_information": {
            "address": "LEKKI PHASE 1",
            "town": "Ikeja",
            "lga": "Ikeja",
            "state": "Lagos",
            "residence_status": null
        },
        "biometrics": {
            "photo": "/9j/4AAQSkZJRgABAgAAAQABAAD/"
        }
    }
}

```

The response contains detailed information about the information of your user including residence information, picture and also personal information that are relevant for KYC.

#### On this page

Overview

Integration Steps

Step 1 Make a Mashup Lookup Request

Step 2 Process the Response

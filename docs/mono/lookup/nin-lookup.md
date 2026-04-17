---
title: "NIN Lookup Integration Guide"
source_url: "https://docs.mono.co/docs/lookup/nin-lookup"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Retrieve comprehensive National Identification Number (NIN) details with optional PDF data exports."
---# NIN Lookup Integration Guide

Last updated December 10th, 2025

## Overview

This lookup service allows you to verify comprehensive information associated with a National Identification Number (**NIN**). This guide will walk you through integrating this service into your application, giving you the ability to access and verify important NIN-related details seamlessly.

![Prerequisites](/images/callout/bulb.png)

Prerequisites

To get started, you need to:

-   Sign up on the [Partner Dashboard](https://app.mono.co/signup) and complete KYB.
-   [Create a `lookup` app](/docs/create-app) and retrieve your Secret key.
-   Retrieve your Sandbox test credentials from the [Sandbox page](/docs/sandbox#lookup).

## Integration Steps

## Step 1: Make a NIN Lookup Request

To retrieve NIN-related information, send a POST request to the following endpoint:

### Request

1

```js
POST https://api.withmono.com/v3/lookup/nin
```

### Request Body Parameters

-   `nin` (required): Provide the National Identification Number (NIN) for the lookup.

Include this parameter in the request body to specify the NIN number for the lookup.

### Query Parameters

-   `output` (optional): Set to **'pdf** to request PDF generation.

### Request Headers

Include the following header in your request for authentication:

-   `mono-sec-key` (required): Your Mono secret key.

### cURL Sample Request

### Request

1234567

```js
curl -X POST \
  -H "Content-Type: application/json" \
  -H "mono-sec-key: YOUR_MONO_SECRET_KEY" \
  -d '{
    "nin": "NIN_NUMBER"
  }' \
  https://api.withmono.com/v3/lookup/nin
```

### cURL Sample Request with PDF Output

### Request

1234567

```js
curl -X POST \
  -H "Content-Type: application/json" \
  -H "mono-sec-key: YOUR_MONO_SECRET_KEY" \
  -d '{
    "nin": "NIN_NUMBER"
  }' \
  "https://api.withmono.com/v3/lookup/nin?output=pdf"
```

## Step 2: Process the Response

Upon successful NIN lookup, you will receive detailed information about the individual associated with the provided NIN, including birth details, contact information, marital status, religion, and more.

### Standard Response (without PDF)

### Request

12345678910111213141516171819202122232425262728293031323334353637383940414243444546474849505152

```js
{
  "status": "successful",
  "message": "NIN Lookup Successfull",
  "timestamp": "2024-02-28T15:00:20.917Z",
  "data": {
    "birthcountry": "nigeria",
    "birthdate": "01-01-1990",
    "birthlga": "Lagos Mainland",
    "birthstate": "Lagos",
    "educationallevel": "tertiary",
    "email": "",
    "employmentstatus": "employed",
    "firstname": "WIGO",
    "gender": "m",
    "heigth": "150",
    "maritalstatus": "single",
    "middlename": "SAMUEL",
    "nin": "09876543212",
    "nok_address1": "3B MICHAEL WISDOM STREET",
    "nok_address2": "",
    "nok_firstname": "AISHA",
    "nok_lga": "Lagos Island",
    "nok_middlename": "",
    "nok_postalcode": "",
    "nok_state": "Lagos",
    "nok_surname": "AGBA",
    "nok_town": "FESTAC",
    "ospokenlang": "",
    "pfirstname": "",
    "photo": "/9j/4AAQSkZJRgABAgAAAQABAAD/pYH//Z",
    "pmiddlename": "",
    "profession": "ENGINEER",
    "psurname": "",
    "religion": "islam",
    "residence_address": "2A MUSA ADE STREET",
    "residence_lga": "Ogba",
    "residence_state": "Lagos",
    "residence_town": "OGBA",
    "residencestatus": "birth",
    "self_origin_lga": "",
    "self_origin_place": "",
    "self_origin_state": "",
    "spoken_language": "YORUBA",
    "surname": "MUSA",
    "telephoneno": "08012345678",
    "title": "mr",
    "userid": "",
    "vnin": "",
    "central_iD": "123456",
    "tracking_id": "ABC0DEFG5000XYZ"
  }
}
```

### Response with PDF (Processing Status)

When you include `output=pdf` in the query parameters, the response will include a `pdf` object. If the PDF is still being generated, the status will be "processing" and the `url` field will not be present:

### Request

12345678910111213141516171819202122232425262728293031323334

```js
{
  "status": "successful",
  "message": "Lookup Successful",
  "timestamp": "2025-12-10T15:52:04.212Z",
  "data": {
    "pdf": {
      "jobId": "5",
      "status": "processing"
    },
    "title": "MR",
    "firstname": "JOSHUA",
    "surname": "MUSA",
    "nin": "09876543212",
    "birthdate": "01-01-1990",
    "birthstate": "Lagos",
    "birthlga": "Lagos Mainland",
    "birthcountry": "nigeria",
    "gender": "m",
    "telephoneno": "08012345678",
    "email": "",
    "residence_address": "2A MUSA ADE STREET",
    "residence_lga": "Ogba",
    "residence_state": "Lagos",
    "residence_town": "OGBA",
    "maritalstatus": "single",
    "religion": "islam",
    "profession": "ENGINEER",
    "educationallevel": "tertiary",
    "employmentstatus": "employed",
    "spoken_language": "YORUBA",
    "central_iD": "123456",
    "tracking_id": "ABC0DEFG5000XYZ"
  }
}
```

### Response with PDF (Completed Status)

When the PDF generation is complete, the `pdf` object will include the `url` field:

### Request

1234567891011121314151617181920212223242526272829303132333435

```js
{
  "status": "successful",
  "message": "Lookup Successful",
  "timestamp": "2025-12-10T15:52:04.212Z",
  "data": {
    "pdf": {
      "jobId": "4",
      "status": "completed",
      "url": "https://api.withmono.com/v3/lookup/nin/f614d3f2.pdf"
    },
    "title": "MR",
    "firstname": "JOSHUA",
    "surname": "MUSA",
    "nin": "09876543212",
    "birthdate": "01-01-1990",
    "birthstate": "Lagos",
    "birthlga": "Lagos Mainland",
    "birthcountry": "nigeria",
    "gender": "m",
    "telephoneno": "08012345678",
    "email": "",
    "residence_address": "2A MUSA ADE STREET",
    "residence_lga": "Ogba",
    "residence_state": "Lagos",
    "residence_town": "OGBA",
    "maritalstatus": "single",
    "religion": "islam",
    "profession": "ENGINEER",
    "educationallevel": "tertiary",
    "employmentstatus": "employed",
    "spoken_language": "YORUBA",
    "central_iD": "123456",
    "tracking_id": "ABC0DEFG5000XYZ"
  }
}
```

## Step 3: Poll NIN Job Status (For PDF Generation)

If you requested PDF generation and the initial response shows `"status": "processing"` in the `pdf` object, you'll need to poll the job status using the [Poll NIN Job API](/api/lookup/nin/job) to retrieve the final PDF URL.

### Polling the Job Status

Use the `jobid` from the `pdf` object in your initial response to poll for the job status:

### Request

1

```js
GET https://api.withmono.com/v3/lookup/nin/{jobId}/job
```

### Request Headers

-   `mono-sec-key` (required): Your Mono secret key.

### cURL Sample Request

### Request

123

```js
curl -X GET \
  -H "mono-sec-key: YOUR_MONO_SECRET_KEY" \
  https://api.withmono.com/v3/lookup/nin/5/job
```

### Response Example

When the job is completed, the response will include the PDF URL:

### Request

12345678910

```js
{
  "status": "successful",
  "message": "Job status fetched successfully",
  "timestamp": "2025-12-10T12:42:44.264Z",
  "data": {
    "id": "4",
    "status": "completed",
    "url": "https://api.withmono.com/v3/lookup/nin/f614.pdf"
  }
}
```

If the job is still processing, the response will not include the `url` field:

### Request

123456789

```js
{
  "status": "successful",
  "message": "Job status fetched successfully",
  "timestamp": "2025-12-10T12:42:44.264Z",
  "data": {
    "id": "5",
    "status": "processing"
  }
}
```

![Polling Best Practices](/images/callout/bulb.png)

Polling Best Practices

-   Poll the job status at regular intervals (e.g., every 5-10 seconds) until the status is "completed"
-   The `jobid` in the `pdf` object corresponds to the `id` field in the Poll NIN Job API response
-   Once the status is "completed", the `url` field will be available in the response

PDF Expiry

Please note that the PDF URL expires after 7 days. Ensure you download or process the PDF within this timeframe.

![Validation vs. Verification](/images/callout/permissions.png)

Validation vs. Verification

Please note that this feature is solely for NIN **Validation**, not **Verification**. This means that the response simply returnes the user's name and date of birth. Other fields like address and Photo ID are null in the response.

#### On this page

Overview

Integration Steps

Step 1 Make a NIN Lookup Request

Step 2 Process the Response

Step 3 Poll NIN Job Status

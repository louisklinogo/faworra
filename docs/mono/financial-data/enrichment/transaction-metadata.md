---
title: "Transaction Metadata Guide"
source_url: "https://docs.mono.co/docs/financial-data/enrichment/transaction-metadata"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Retrieve clean merchant names, logos, and categories for bank transactions to provide a premium user experience."
---# Transaction Metadata Guide

Last updated September 16th, 2025

## Overview

The Transaction Metadata API enriches transactions with additional details, providing a more comprehensive view of each financial activity. This can include merchant information, geographical data, and transaction types.

## Integration Endpoints

Kindly note that there are three endpoints under under the Transaction metadata API, these are:

1.  Initiate Transactions Metadata: Starts the process of updating existing transactions in a connected bank account with meta information Initiate Transaction Metadata Upload
2.  Metadata Upload Batch: Allows you to upload a batch of transactions that you want to receive updated transaction metadata for.
3.  Retrieve Metadata Records: Fetches the list of transactions that have been updated with transaction metadata, from the uploaded transaction batch.

1

Initiate Transactions Metadata

This endpoint updates all the transactions linked to the provided account id with the transaction metadata

To initiate the endpoint, send a POST request to the following endpoint:

### Request

1

```js
POST https://api.withmono.com/v2/accounts/:id/transactions/metadata
```

#### Request Path Parameter

-   id (required): This field expects the id of a connected bank account linked from mono connect

#### cURL Sample Request

### Request

1234

```curl
curl --request POST \
  --url https://api.withmono.com/v2/accounts/:id/transactions/metadata \
  --header 'mono-sec-key: string' \
  --header 'accept: application/json'
```

#### Request Headers

Include the following header in your request for authentication:

-   `mono-sec-key` (required): Your Mono secret key.

#### Success Response

If the initiation request is successful, you will receive the following API response:

### Request

123456789

```js
{
    "status": "processing",
    "message": "Transaction metadata is currently being processed, you will receive a webhook when all transactions are ready",
    "timestamp": "2025-01-09T13:38:36.992Z",
    "data": {
        "jobId": "677fd15ce89fc83a12f85dc0",
        "jobStatus": "processing"
    }
}
```

Please note that once the API request above is successful, our system updates each transaction with the relevant metadata information in the background. Once this process is done, you will receive a webhook notification confirming the update.

![Tracking Job Progress with the Job ID](/images/callout/bulb.png)

Tracking Job Progress with the Job ID

A unique job ID is generated to track the progress of each job through the system. This job ID, returned in the API response, serves as an identifier for the specific data processing task, enabling real-time monitoring of its status.

The initial API response includes the job ID along with the current status, such as "processing." As the job progresses, its status is updated accordingly. Users can retrieve the latest status at any time by querying the dedicated tracking endpoint [here](/api/bank-data/enrichment/job-tracker) with the job ID.

#### Sample Webhook Response

### Request

1234567891011

```js
{
  "data": {
    "event": "mono.events.transaction_metadata",
    "data": {
      "account": "673c4115a31bfc41da06c17d",
      "status": "available",
      "message": "Account transactions have been updated with their metadata.",
      "action": "Make a call to the transactions endpoint for updated account transactions"
    }
  }
}
```

With the above webhook `mono.events.transaction_metadata` received, you can then proceed to call the [transactions endpoint](/api/bank-data/transactions) to confirm the updated metadata for each transaction record. Shared below is a sample of a transaction record with no metadata **before** initiating, and a sample of a transaction record with updated metadata **after** initiating

#### Sample Transaction Response Before Metadata is added

### Request

123456789101112131415161718192021

```js
{
    "status": "successful",
    "message": "Transaction retrieved successfully",
    "timestamp": "2024-04-12T06:18:17.117Z",
    "data": [
        {
            "id": "66141bbff58d2687e7d91234",
            "narration": "PG00001",
            "amount": 500,
            "type": "debit",
            "balance": 1500,
            "date": "2023-12-14T00:02:00.500Z"
        },
    ],
    "meta": {
        "total": 307,
        "page": 1,
        "previous": null,
        "next": "https://api.withmono.com/v2/66141b98aaa34e17e8cfdb76/transactions?page=2"
    }
}
```

#### Sample Transaction Response After Metadata is completed

### Request

12345678910111213141516171819202122232425262728293031

```js
{
    "status": "successful",
    "message": "Transaction retrieved successfully",
    "timestamp": "2024-04-12T06:18:17.117Z",
    "data": [
        {
            "id": "66141bbff58d2687e7d91234",
            "narration": "PG00001",
            "amount": 500,
            "type": "debit",
            "balance": 1500,
            "date": "2023-12-14T00:02:00.500Z",
            "metadata": {
                "category": "bank_charge",
                "channel": "N/A",
                "payee": "N/A",
                "payment_method": "N/A",
                "ref_num": "N/A",
                "payment_processor": "N/A",
                "location": "N/A",
                "reason": "Stamp Duty"
            }
        },
    ],
    "meta": {
        "total": 307,
        "page": 1,
        "previous": null,
        "next": "https://api.withmono.com/v2/66141b98aaa34e17e8cfdb76/transactions?page=2"
    }
}
```

### Note Regarding Metadata Object

For the metadata field to return all details, the following conditions must be met:

-   **category**: This will always be present for every transaction.

-   **channel**: For this field to be returned, the transaction narration must include NIP, NEFT, POS/WEB, POS, or WEB.

-   **payee**: There must be an individual or organization receiving the funds for this field to be returned.

-   **payment\_method**: The transaction narration must contain pstk/paystack, flutterwave/flw/rave, or interswitch/isw for this field to be returned.

-   **ref\_num**: A properly structured reference number must be present in the transaction for it to be captured.

-   **location**: Any known or popular location mentioned in the transaction narration, such as where an ATM withdrawal was made, will be captured and returned.

-   **reason**: This could be VAT, transfer commission, or any other capturable reason documented in the transaction narration. If no such information is present, this field will be empty.


#### On this page

Overview

Integration Steps

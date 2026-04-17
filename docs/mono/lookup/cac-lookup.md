---
title: "CAC Lookup Integration Guide"
source_url: "https://docs.mono.co/docs/lookup/cac-lookup"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Access real-time Corporate Affairs Commission data for company profiles, shareholders, directors, and status reports."
---# CAC Lookup Integration Guide

Last updated January 22nd, 2026

## Overview

This page documents the Corporate Affairs Commission (CAC) lookup APIs. These are separate, independent endpoints you can call to retrieve various types of company data:

1.  Business / Company Lookup: This is the first endpoint you'll use. It retrieves a company's basic CAC information and returns the company's CAC ID, which is required for other endpoints.

2.  Shareholders: This endpoint returns the company's shareholder details.

3.  Persons with Significant Control (PSC): This endpoint returns the details of persons with significant control over the company.

4.  Secretary: This endpoint returns the company's secretary details.

5.  Directors: This endpoint returns the company's directors.

6.  Profile: This endpoint returns a comprehensive company profile, which combines the details from the search, shareholders, and directors endpoints.

7.  Status Report: This endpoint returns the company's CAC status report as a PDF document.


![Prerequisites](/images/callout/bulb.png)

Prerequisites

To get started, you need to:

-   Sign up on the [Partner Dashboard](https://app.mono.co/signup) and complete KYB.
-   [Create a `lookup` app](/docs/create-app) and retrieve your Secret key.
-   Retrieve your Sandbox test credentials from the [Sandbox page](/docs/sandbox#lookup).

![Request Headers](/images/callout/bulb.png)

Request Headers

Include the following header in your request for authentication, this is important for all endpoints:

-   `mono-sec-key` (required): test\_sk\_xxxxxxxxxxxxxxxxxxxx

This also determines the environment you're using. For example, if you're using the sandbox environment, your key will be prefixed with `test_sk` and `live_sk` for the live (production) environment.

## Lookup a Business

To retrieve CAC information pertaining to a business or company, send a GET request to the following endpoint:

### Request

1

```js
GET https://api.withmono.com/v3/lookup/cac?search={company_name_or_rc_number}
```

### Request Query Parameters

-   `search` (required): Specify the name or RC number of the company you want to look up.

-   `exact` (optional): Set to `true` to enable exact name matching. When `true`, only businesses whose names start with the exact search term are returned. When `false` (default), any business containing the search term in its name is returned. This parameter is set to `false` by default to avoid breaking changes.


Include these parameters in the query string to indicate the name or RC number of the company you wish to retrieve information about.

### cURL Sample Request

### Request

123

```js
curl -X GET \
  -H "mono-sec-key: YOUR_MONO_SECRET_KEY" \
  "https://api.withmono.com/v3/lookup/cac?search=company_name_or_rc_number"
```

#### With Exact Search

### Request

123

```js
curl -X GET \
  -H "mono-sec-key: YOUR_MONO_SECRET_KEY" \
  "https://api.withmono.com/v3/lookup/cac?search=Nomo&exact=true"
```

#### Successful Response

If the lookup request is successful, you will receive the following response:

### Request

1234567891011121314151617181920212223242526272829

```js
{
    "status": "successful",
    "message": "CAC lookup successful",
    "timestamp": "2024-05-07T05:38:14.059Z",
    "data": [
        {
            "classification_id": 2,
            "delisting_status": null,
            "company_type_name": null,
            "nature_of_business_name": null,
            "id": 300075,
            "active": true,
            "business_commencement_date": null,
            "registration_approved": true,
            "approved_name": "NOMO MICROFINANCE BANK LIMITED",
            "head_office_address": ", ",
            "objectives": "",
            "registration_date": "1993-08-10T00:00:00.000+00:00",
            "classification": "company",
            "branch_address": "",
            "email": "",
            "rc_number": "200004",
            "city": "IKEJA LGA",
            "lga": "",
            "address": "LEKKI PHASE 1",
            "state": "LAGOS"
        }
    ]
}
```

![Company ID](/images/callout/bulb.png)

Company ID

The response contains the message "CAC lookup successful" along with an array of objects representing the CAC information for the company. The "id" returned in the response is the ID of the company in the CAC database and will be used in other endpoints like the Shareholder Details [endpoint](/api/cac/shareholder) and the Persons with Significant Control [endpoint](/api/cac/psc) etc.

![Classification](/images/callout/bulb.png)

Classification

The "classification" field in the response indicates the type of business entity.

-   **company**: This indicates that the entity is registered as a company. This is commonly associated with corporations.

-   **business**: This indicates that the entity is registered as a business name. This is commonly associated with sole proprietorships e.g market traders, artisans.

-   **IT**: This indicates that the entity is registered as an Incorporated Trustee. This is commonly associated with NGOs and other non-profit organizations.


## Shareholder Details

To retrieve shareholder information associated with a business or company, send a GET request to the following endpoint:

### Request

1

```js
GET https://api.withmono.com/v3/lookup/cac/company/{id}
```

### Request Path Parameter

-   `id` (required): Provide the ID returned from the business lookup response.

Include this parameter in the URL path to specify the ID of the business or company for which you want to retrieve shareholder details.

### cURL Sample Request

### Request

123

```js
curl -X GET \
  -H "mono-sec-key: YOUR_MONO_SECRET_KEY" \
  "https://api.withmono.com/v3/lookup/cac/company/{id}"
```

#### Successful Response

If the shareholder details request is successful, you will receive the following response:

### Request

123456789101112131415161718192021222324252627282930313233343536373839404142434445464748495051525354555657585960616263646566676869707172737475767778798081828384858687888990919293949596979899100101102103

```js
{
    "status": "successful",
    "message": "CAC lookup successful",
    "timestamp": "2024-02-16T07:45:34.130Z",
    "data": [
        {
            "id": 19667380,
            "surname": "SAMUEL",
            "firstname": "OLAMIDE",
            "other_name": "NOMO",
            "email": "NOMO@devrel.co",
            "business_email": "samuel@neem.com",
            "phone_number": "09042658500",
            "gender": "FEMALE",
            "former_nationality": "",
            "age": 0,
            "city": "LAGOS",
            "occupation": "",
            "former_name": "",
            "corporation_name": "NOMO TECHNOLOGIES",
            "rc_number": "1343485",
            "corporation_company": null,
            "state": "LAGOS",
            "pobox": null,
            "accreditationnumber": "",
            "is_lawyer": null,
            "last_visit": 0,
            "form_type": "International Passport",
            "is_presenter": null,
            "is_chairman": false,
            "num_shares_alloted": null,
            "type_of_shares": "",
            "date_of_birth": null,
            "status": "ACTIVE",
            "date_of_termination": "2021-04-21T23:00:00.000+00:00",
            "date_of_appointment": "2021-04-21T23:00:00.000+00:00",
            "date_of_change_of_address": null,
            "former_address": null,
            "former_postal": null,
            "former_surname": "",
            "former_first_name": "",
            "former_other_name": "",
            "date_of_status_change": null,
            "identity_number": "C08923468",
            "identity_issue_state": null,
            "other_directorship_details": null,
            "portal_user_fk": null,
            "affiliates_fk": null,
            "process_type_fk": {
                "id": 6564,
                "name": "COMPANY_REGISTRATION",
                "description": "Company Registration",
                "amount": 1,
                "type": null,
                "product_id": "5252348309",
                "bank_code": "29230"
            },
            "company": null,
            "same_person_as_fk": null,
            "nature_of_app_or_discharge": null,
            "is_designated": null,
            "end_of_appointment": null,
            "appointed_by": null,
            "date_of_deed_of_discharge": null,
            "date_of_resolution": null,
            "country_fk": {
                "id": 1,
                "name": "NIGERIA",
                "code": "NIGERIA"
            },
            "country_of_residence": null,
            "is_carried_over_from_name_avai": null,
            "lga": null,
            "corporation_registration_date": null,
            "is_company_deleted": null,
            "government_organisation_name": null,
            "foreign_organisation_name": null,
            "company_street_address": null,
            "company_state": null,
            "company_city": null,
            "is_corporate": null,
            "county_of_incorporation_fk": null,
            "nationality": "NIGERIA",
            "address": " NUMBER 13, VICTORIA ESTATES, LEKKI ",
            "business_address": "25, ADEMOLA BUHARI CRESCENT, WUSE 2, ABUJA, FCT, NIGERIA",
            "postcode": "",
            "street_number": "",
            "affiliates_residential_address": 345689,
            "affiliates_psc_information": 12347380,
            "legal_owners_of_interests": [],
            "legal_owners_of_voting_rights": [],
            "stock_exchange_soes": [],
            "approved_for_notice_of_psc": null,
            "company_address2": "",
            "full_address2": "NUMBER 13, VICTORIA ESTATES, LEKKI ",
            "affiliate_type_fk": {
                "id": 5678,
                "name": "SECRETARY_COMPANY",
                "description": "SECRETARY_COMPANY"
            }
        }
    ]
}
```

The response contains an array of objects representing the shareholder details associated with the business or company.

## Persons with Significant Control

To retrieve the Persons with Significant Control details a business or company, send a GET request to the following endpoint:

### Request

1

```js
GET https://api.withmono.com/v3/lookup/cac/company/{id}/psc
```

### Request Path Parameter

-   `id` (required): Provide the ID returned from the business lookup response.

Include this parameter in the URL path to specify the ID of the business or company for which you want to check persons with significant control details

### cURL Sample Request

### Request

123

```js
curl -X GET \
  -H "mono-sec-key: YOUR_MONO_SECRET_KEY" \
  "https://api.withmono.com/v3/lookup/cac/company/{id}/psc"
```

#### Successful Response

If the request is successful, you will receive a response with the following data:

### Request

12345678910111213141516171819202122232425262728293031323334353637383940414243444546474849

```js
{
    "status": "successful",
    "message": "CAC lookup successful",
    "timestamp": "2025-08-29T12:34:56.789Z",
    "data": [
        {
            "id": 58392011,
            "surname": "OLAMIDE",
            "firstname": "CHIBUZOR",
            "other_name": "CIROMA",
            "email": "chibuzor.olamide@example.com",
            "business_email": "samuel@neem.com",
            "gender": "MALE",
            "former_name": null,
            "city": "VICTORIA ISLAND",
            "occupation": "Investor",
            "corporation_name": null,
            "rc_number": null,
            "state": "LAGOS",
            "lga": "Eti-Osa",
            "form_type": "National ID",
            "identity_number": "NIN123456789",
            "num_shares_alloted": 250000,
            "type_of_shares": "PREFERENCE",
            "date_of_birth": "1988-11-02T00:00:00.000+00:00",
            "status": "ACTIVE",
            "date_of_appointment": "2023-07-15T09:20:30.000+00:00",
            "nationality": "NIGERIA",
            "address": "24 Adeola Odeku Street, Victoria Island, Lagos",
            "business_address": "25, ADEMOLA BUHARI CRESCENT, WUSE 2, ABUJA, FCT, NIGERIA",
            "postcode": "101241",
            "street_number": "24",
            "affiliates_residential_address": "24 Adeola Odeku Street, Victoria Island, Lagos",
            "affiliates_psc_information": 91234,
            "affiliate_type_fk": {
                "id": 7543,
                "name": "PSC",
                "description": "PERSONS WITH SIGNIFICANT CONTROL"
            },
            "country_fk": {
                "id": 1,
                "name": "NIGERIA",
                "code": "NGA"
            },
            "is_chairman": false
        }
    ]
}

```

The response contains an array of objects containing all persons with significant control details associated with the business or company.

## Lookup a Secretary

To lookup the company secretary, send a GET request to the following endpoint:

### Request

1

```js
GET https://api.withmono.com/v3/lookup/cac/company/{id}/secretary
```

### Request Path Parameter

-   `id` (required): Provide the ID returned from the business lookup response.

Include this parameter in the URL path to specify the ID of the business or company for which you want to lookup the secretary details

### cURL Sample Request

### Request

123

```js
curl -X GET \
  -H "mono-sec-key: YOUR_MONO_SECRET_KEY" \
  "https://api.withmono.com/v3/lookup/cac/company/{id}/secretary"
```

#### Successful Response

If the secretary lookup request is successful, you will receive the following response:

### Request

123456789101112131415161718192021222324252627282930313233343536373839404142434445464748495051525354555657585960616263646566676869707172737475767778798081828384858687888990919293949596979899100101102103

```js
{
    "status": "successful",
    "message": "CAC lookup successful",
    "timestamp": "2024-02-16T07:45:34.130Z",
    "data": [
        {
            "id": 19667380,
            "surname": "NOMO",
            "firstname": "SAMUEL",
            "other_name": "OLAMIDE",
            "email": "samuel@neem.com",
            "business_email": "samuel@neem.com",
            "phone_number": "09042658500",
            "gender": "FEMALE",
            "former_nationality": "",
            "age": 0,
            "city": "LAGOS",
            "occupation": "",
            "former_name": "",
            "corporation_name": "NOMO TECHNOLOGIES TECHNOLOGIES",
            "rc_number": "1343485",
            "corporation_company": null,
            "state": "LAGOS",
            "pobox": null,
            "accreditationnumber": "",
            "is_lawyer": null,
            "last_visit": 0,
            "form_type": "International Passport",
            "is_presenter": null,
            "is_chairman": false,
            "num_shares_alloted": null,
            "type_of_shares": "",
            "date_of_birth": null,
            "status": "ACTIVE",
            "date_of_termination": "2021-04-21T23:00:00.000+00:00",
            "date_of_appointment": "2021-04-21T23:00:00.000+00:00",
            "date_of_change_of_address": null,
            "former_address": null,
            "former_postal": null,
            "former_surname": "",
            "former_first_name": "",
            "former_other_name": "",
            "date_of_status_change": null,
            "identity_number": "C08923468",
            "identity_issue_state": null,
            "other_directorship_details": null,
            "portal_user_fk": null,
            "affiliates_fk": null,
            "process_type_fk": {
                "id": 6564,
                "name": "COMPANY_REGISTRATION",
                "description": "Company Registration",
                "amount": 1,
                "type": null,
                "product_id": "5252348309",
                "bank_code": "29230"
            },
            "company": null,
            "same_person_as_fk": null,
            "nature_of_app_or_discharge": null,
            "is_designated": null,
            "end_of_appointment": null,
            "appointed_by": null,
            "date_of_deed_of_discharge": null,
            "date_of_resolution": null,
            "country_fk": {
                "id": 1,
                "name": "NIGERIA",
                "code": "NIGERIA"
            },
            "country_of_residence": null,
            "is_carried_over_from_name_avai": null,
            "lga": null,
            "corporation_registration_date": null,
            "is_company_deleted": null,
            "government_organisation_name": null,
            "foreign_organisation_name": null,
            "company_street_address": null,
            "company_state": null,
            "company_city": null,
            "is_corporate": null,
            "county_of_incorporation_fk": null,
            "nationality": "NIGERIA",
            "address": " NUMBER 13, VICTORIA ESTATES, LEKKI ",
            "business_address": "25, ADEMOLA BUHARI CRESCENT, WUSE 2, ABUJA, FCT, NIGERIA",
            "postcode": "",
            "street_number": "",
            "affiliates_residential_address": 345689,
            "affiliates_psc_information": 12347380,
            "legal_owners_of_interests": [],
            "legal_owners_of_voting_rights": [],
            "stock_exchange_soes": [],
            "approved_for_notice_of_psc": null,
            "company_address2": "",
            "full_address2": "NUMBER 13, VICTORIA ESTATES, LEKKI ",
            "affiliate_type_fk": {
                "id": 5678,
                "name": "SECRETARY_COMPANY",
                "description": "SECRETARY_COMPANY"
            }
        }
    ]
}
```

The response contains details about the secretary(s) associated with the business or company.

## Lookup the Directors

To lookup the directors of a business or company, send a GET request to the following endpoint:

### Request

1

```js
GET https://api.withmono.com/v3/lookup/cac/company/{id}/directors
```

### Request Path Parameter

-   `id` (required): Provide the ID returned from the business lookup response.

Include this parameter in the URL path to specify the ID of the business or company for which you want to lookup the directors

### cURL Sample Request

### Request

123

```js
curl -X GET \
  -H "mono-sec-key: YOUR_MONO_SECRET_KEY" \
  "https://api.withmono.com/v3/lookup/cac/company/{id}/directors"
```

#### Successful Response

If the directors lookup request is successful, you will receive the following response:

### Request

123456789101112131415161718192021222324252627282930313233343536373839404142434445464748495051525354555657585960616263646566676869707172737475767778798081828384858687888990919293949596979899100101102103104105

```js
{
    "status": "successful",
    "message": "CAC lookup successful",
    "timestamp": "2024-02-14T13:42:07.629Z",
    "data": [
        {
            "id": 6706910,
            "surname": "SAMUEL",
            "firstname": "OLAMIDE",
            "other_name": "NOMO",
            "email": "",
            "business_email": "samuel@neem.com",
            "phone_number": "",
            "gender": "MALE",
            "former_nationality": "",
            "age": 56,
            "city": "",
            "occupation": "",
            "former_name": "",
            "corporation_name": "",
            "rc_number": "",
            "corporation_company": null,
            "state": "LAGOS",
            "pobox": null,
            "accreditationnumber": "",
            "is_lawyer": null,
            "last_visit": 0,
            "form_type": "International Passport",
            "is_presenter": null,
            "is_chairman": null,
            "num_shares_alloted": 1,
            "type_of_shares": "ORDINARY",
            "date_of_birth": "1995-05-05T23:00:00.000+00:00",
            "status": "ACTIVE",
            "date_of_termination": null,
            "date_of_appointment": null,
            "date_of_change_of_address": null,
            "former_address": null,
            "former_postal": null,
            "former_surname": "",
            "former_first_name": "",
            "former_other_name": "",
            "date_of_status_change": null,
            "identity_number": "A0345456618",
            "identity_issue_state": null,
            "other_directorship_details": "",
            "portal_user_fk": null,
            "affiliates_fk": null,
            "process_type_fk": {
                "id": 6564,
                "name": "COMPANY_REGISTRATION",
                "description": "Company Registration",
                "amount": 1,
                "type": null,
                "product_id": "511111119",
                "bank_code": "25670"
            },
            "company": null,
            "same_person_as_fk": null,
            "nature_of_app_or_discharge": null,
            "is_designated": null,
            "end_of_appointment": null,
            "appointed_by": null,
            "date_of_deed_of_discharge": null,
            "date_of_resolution": null,
            "country_fk": {
                "id": 1,
                "name": "NIGERIA",
                "code": "NIGERIA"
            },
            "country_of_residence": null,
            "is_carried_over_from_name_avai": null,
            "lga": null,
            "corporation_registration_date": null,
            "is_company_deleted": null,
            "government_organisation_name": null,
            "foreign_organisation_name": null,
            "company_street_address": null,
            "company_state": null,
            "company_city": null,
            "is_corporate": null,
            "county_of_incorporation_fk": null,
            "nationality": null,
            "address": "40, BUHARI CRESCENT GRA",
            "business_address": "25, ADEMOLA BUHARI CRESCENT, WUSE 2, ABUJA, FCT, NIGERIA",
            "postcode": "",
            "street_number": "",
            "affiliates_residential_address": null,
            "affiliates_psc_information": 67364910,
            "legal_owners_of_interests": [],
            "legal_owners_of_voting_rights": [],
            "stock_exchange_soes": [],
            "approved_for_notice_of_psc": null,
            "company_address2": "",
            "full_address2": "39, KOLA AMODU CRESCENT MAGODA GRA, LAGOS",
            "affiliate_type_fk": {
                "id": 7516,
                "name": "SHAREHOLDER",
                "description": "SHAREHOLDER"
            }
        }
    ]

}

```

The response contains an array of objects detailing all directors associated with the business or company.

## Lookup the full company profile

The company's profile combines information from a company search, shareholder details, and director information. You can access it by sending a GET request to the following endpoint

### Request

1

```js
GET https://api.withmono.com/v3/lookup/cac/profile/{rcnumber}
```

### Request Path Parameter

-   `rcnumber` (required): Specify the RC number of the company you want to look up.

Include this parameter in the path string to indicate the RC number of the company you wish to retrieve information about.

### cURL Sample Request

### Request

123

```js
curl -X GET \
  -H "mono-sec-key: YOUR_MONO_SECRET_KEY" \
  "https://api.withmono.com/v3/lookup/cac/profile/{rcnumber}"
```

#### Successful Response

If the profile lookup request is successful, you will receive the following response:

### Request

123456789101112131415161718192021222324252627282930313233343536373839404142434445464748495051525354555657585960616263646566676869707172737475767778798081828384858687888990919293

```js
{
    "status": "successful",
    "message": "CAC lookup successful",
    "timestamp": "2025-09-18T08:49:00.542Z",
    "data": {
        "approved_name": "ELITE SYNERGY VENTURES",
        "nature_of_business_name": null,
        "registration_date": "2021-10-26T07:13:37.772Z",
        "rc_number": "3333333",
        "id": 7648693,
        "classification": "BUSINESS_NAME",
        "classification_id": 1,
        "active": true,
        "registration_approved": null,
        "delisting_status": null,
        "company_type_name": null,
        "branch_address": null,
        "business_commencement_date": null,
        "head_office_address": null,
        "objectives": null,
        "city": null,
        "lga": null,
        "email": null,
        "address": null,
        "state": null,
        "business_email": "samuel@neem.com",
        "business_address": "25, ADEMOLA BUHARI CRESCENT, WUSE 2, ABUJA, FCT, NIGERIA",
        "directors": [
            {
                "id": null,
                "surname": "ADEKUNLE",
                "firstname": "MUSA",
                "other_name": "EBUKA",
                "email": "info.eliteventures@gmail.com",
                "gender": "MALE",
                "former_name": null,
                "city": null,
                "occupation": null,
                "rc_number": null,
                "state": null,
                "lga": null,
                "form_type": null,
                "identity_number": null,
                "num_shares_alloted": null,
                "type_of_shares": null,
                "date_of_birth": "1985-05-15T00:00:00.000Z",
                "status": "ACTIVE",
                "date_of_appointment": "2021-10-26T00:00:00.000Z",
                "nationality": "NIGERIA",
                "address": "25, ADEMOLA BUHARI CRESCENT, WUSE 2, ABUJA, FCT, NIGERIA",
                "postcode": null,
                "street_number": null,
                "affiliates_residential_address": "25, ADEMOLA AJAIYE CRESCENT, WUSE 2, ABUJA, FCT, NIGERIA",
                "affiliates_psc_information": null,
                "affiliate_type_fk": null,
                "country_fk": null,
                "is_chairman": null
            }
        ],
        "shareholders": [
            {
                "id": null,
                "surname": "ADEKUNLE",
                "firstname": "MUSA",
                "other_name": "EBUKA",
                "email": "info.eliteventures@gmail.com",
                "gender": "MALE",
                "former_name": null,
                "city": null,
                "occupation": null,
                "rc_number": null,
                "state": null,
                "lga": null,
                "form_type": null,
                "identity_number": null,
                "num_shares_alloted": null,
                "type_of_shares": null,
                "date_of_birth": "1985-05-15T00:00:00.000Z",
                "status": "ACTIVE",
                "date_of_appointment": "2021-10-26T00:00:00.000Z",
                "nationality": "NIGERIA",
                "address": "25, ADEMOLA BUHARI CRESCENT, WUSE 2, ABUJA, FCT, NIGERIA",
                "postcode": null,
                "street_number": null,
                "affiliates_residential_address": "25, ADEMOLA BUHARI CRESCENT, WUSE 2, ABUJA, FCT, NIGERIA",
                "affiliates_psc_information": null,
                "affiliate_type_fk": null,
                "country_fk": null,
                "is_chairman": null
            }
        ]
    }
}
```

The response contains a comprehensive company profile, which combines the details from the shareholders, PSC, secretary, and directors endpoints.

## Status Report (PDF)

To retrieve a company's CAC status report as a PDF document, send a GET request to the following endpoint:

### Request

1

```js
GET https://api.withmono.com/v3/lookup/cac/company/{id}/status-report
```

### Request Path Parameter

-   `id` (required): Provide the ID returned from the business lookup response.

Include this parameter in the URL path to specify the ID of the business or company for which you want to retrieve the status report.

### cURL Sample Request

### Request

1234

```js
curl -X GET \
  -H "mono-sec-key: YOUR_MONO_SECRET_KEY" \
  "https://api.withmono.com/v3/lookup/cac/company/{id}/status-report" \
  --output status-report.pdf
```

![PDF Response](/images/callout/bulb.png)

PDF Response

Unlike other CAC endpoints, this endpoint returns the actual PDF file as the response body, not a JSON response. You should save the response directly to a `.pdf` file to view the status report.

#### Successful Response

If the status report request is successful, the response will be a binary PDF file containing the company's CAC status report. The `content-type` header will be `application/pdf`.

Save the response body to a file with the `.pdf` extension to view the report.

#### On this page

Overview

Lookup a Business

Shareholder Details

Persons with Significant Control

Lookup a Secretary

Lookup the Directors

Lookup full company profile

Status Report

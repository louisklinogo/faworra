---
title: "Overview"
source_url: "https://docs.mono.co/docs/financial-data/overview"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Introduction to Mono Connect's suite of APIs for secure financial account linking and data retrieval."
---# Overview

Last updated July 11th, 2025

### Introduction to Mono Connect

Welcome to the Mono Connect API documentation! This suite of APIs lets your users securely connect their financial accounts, enabling you to retrieve accurate and reliable financial data. With Connect APIs, you can seamlessly access the financial information you need.

### Getting Started

To get started using Mono Connect, you must be a registered business. You also need to [sign up](https://app.mono.co/signup) and complete our compliance processes. After your business has been approved you then create apps on the dashboard to retrieve your public and secret keys to start integrating with the APIs.

![featured-link](/icons/quicklink/partners.svg)

##### API References

Detailed steps for interacting with and implementing the Mono Connect.

[View References](/api/bank-data/authorisation/initiate-account-linking)

![featured-link](/icons/quicklink/answer.svg)

##### Mono Connect

General information and questions about integrating Mono Connect. [Read Articles](https://support.mono.co/en/collections/2631861-mono-businesses-faq)

### Mono Connect Features

Mono Connect offers the following features:

#### Initialization

The Initialization endpoint is used to initiate account connection. This endpoint returns a link in the response that instantiates the Mono Connect Widget.

##### Authorization

The authorization endpoint is used for requesting the Account ID (that identifies the authenticated account) after successful enrolment on the Mono Connect widget.

##### Account Information

This API offers details and a comprehensive view of an account such as the account type- savings, current, domiciliary, and business accounts, currency and account balance. It also furnishes crucial information such as the account holder's name, account number, auth method, and the current data availability status.

##### Transactions

The Transactions API helps your retrieve instance of money movement in or out of an account. You can filter by a date range, transaction type i.e. credit or debit and customers narration .

##### Statements

The Statements API facilitates the retrieval of a user's financial statement, offering a comprehensive overview of their transaction history.

##### Identity

Businesses can verify the user’s identity aiding KYC (Know Your Customer) process. The Identity API can also be used for auto-completing account data and helps in reducing fraud.

##### Income

With this product, businesses can retrieve the average monthly income value, the estimated salary received, the yearly salary, and the income sources of a user.

##### Assets

The Assets API helps to provide details of all assets that a connected customer account i.e. assets they currently holds in their various investment accounts.

##### Earnings

This API helps to retrieve information regarding earnings on assets held by individual in the various investment portfolio.

##### Real-Time Data

This enables businesses retrieve updated information from any previously linked financial account i.e. balance and transactions data. It allows you to manually refresh and receive current financial data of an account.

#### On this page

overview

Getting Started

mono connect features

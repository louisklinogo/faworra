---
title: "Financial Data SDK Guide"
source_url: "https://docs.mono.co/docs/financial-data/sdk"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Implementation guide for Mono Connect.js, covering widget initialization, event callbacks, and custom configurations."
---# Financial Data SDK Guide

Last updated May 19th, 2022

### Mono Connect Widget

The Mono Connect widget is a secure interface for connecting a financial institution or account to your app. This involves steps like credential validation, multi-factor authentication, error handling, etc, and works with all major javascript frameworks.

Check out the Github SDK documentation, [here](/docs/sdks).

![callout-icon](/images/callout/success.png)

To access customer accounts and interact with Mono APIs (Identity, Transactions, Income, DirectPay, etc) please use the server-side Mono API.

### Getting Started

![Prerequisites](/images/callout/bulb.png)

Prerequisites

To get started, please ensure to:

-   Sign up on [Mono](https://app.mono.co/signup) to get a free account
-   [Create an App](/docs/create-app) on your dashboard to generate your public and secret keys
-   Update your Connect widget to get your public key

1

Installation

You can install the package using NPM or Yarn;

### Request

1

```js
npm install @mono.co/connect.js
```

or

### Request

1

```js
yarn add @mono.co/connect.js
```

Then import it into your project;

### Request

12

```js
import Connect from '@mono.co/connect.js'

```

#### On this page

mono connect widget

getting started

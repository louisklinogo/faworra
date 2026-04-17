---
title: "Creating an App"
source_url: "https://docs.mono.co/docs/create-app"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Learn how to set up your first Mono dashboard app, configure its scope (Connect, Lookup, or Payments), and retrieve your sandbox keys."
---# Creating an App

Last updated May 19th, 2022

![Before you begin, keep in mind that:](/images/callout/bulb.png)

Before you begin, keep in mind that:

You will not be charged to make API calls in sandbox mode. [See sandbox credentials](/docs/sandbox)

-   A Mono dashboard App serves as the foundational block for running Mono APIs and products.
-   There’s no fixed limit for creating Apps on your Mono dashboard.
-   To display Personal or Business banks on the Mono widget, simply set your Account Type.
-   To make use of the DirectPay APIs, remember to add Payments to your app scope.
-   If you delete an App, all data associated with the App will be permanently deleted as well.

## Before You Create Your App

Choose a Mono product that this specific App will serve, for example, Connect or Lookup.

At the point of creation you need to:

-   Set an App name and Display name.
-   Add a branded business logo. This image would be shown to your users on the first page of the Mono Connect widget when they are linking their bank account to your business.
-   Choose a Mono product that this specific App will serve, for example, Connect or Lookup.
-   Select multiple scopes that your App should have access to, for example, Transactions, Statements, Identity, Accounts, Payments, etc.
-   For a Mono Connect product, you can select which bank account type (Personal, Business, or both) you would like to display to your users on the Connect widget.
-   Select an Industry type that your dashboard App will be scoped to.

## Creating Your App

To create an app on your Mono dashboard:

-   Log in to your Mono dashboard. Don't have an account? Create one [here](https://app.mono.co).
-   Click on the Apps tab on the side menu, then click the Create an app button on the top right of the screen.
-   At this point, a modal screen will pop up. Enter the necessary details required for your app. Once you are done, you can click the Create app button.
-   After your App is created, it will be set to sandbox mode by default with test public and secret keys automatically generated.

## Managing Your App

After creating your app, you can choose to:

-   Add your business logo.
-   Add a webhook URL.
-   Switch your app from sandbox mode to live.

![callout-icon](/images/callout/success.png)

To update your App, click on the Edit button, then click the Update app button when done.

#### On this page

Before You Create Your App

Creating Your App

Managing Your App

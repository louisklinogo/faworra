---
title: "Webhook Events"
source_url: "https://docs.mono.co/docs/financial-data/webhook-introduction"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Detailed reference for webhook events related to account connections, data syncs, and re-authorization updates."
---# Webhook Events

Last updated November 10th, 2025

### Introduction

Mono uses webhooks to send real-time updates to your application when events occur (for example, when an account is connected), and kicks off additional workflows based on these events. Each time an event that you listen to, occurs, Mono submits a **POST** request to the designated webhook URL with information about the event transactions.

Your endpoint should respond to webhooks as quickly as possible. To acknowledge receipt of a webhook, your endpoint must return a **`2xx`** HTTP status code. This status code should only indicate receipt of the message, not acknowledgement that it was successfully processed by your system. Any other information returned in the response headers or response body is ignored.

### Why We Use Webhooks

-   To send real-time updates to your application when important events happen on Mono

-   To help you simplify your workflows, so you can initiate processes based on triggered events

-   To keep your system in sync with Mono events without constant API requests or polling


### How to set up a Webhook URL

-   Log in to your [Mono dashboard](https://app.mono.co) and go to the Apps page

-   Click on the app you have created, navigate to the Webhooks section and click the Add webhook button. Then enter the URL from your server’s backend

-   Once your app gets updated with the webhook URL, a webhook secret key will also be generated


### Authentication

All Webhook requests are sent with a `mono-webhook-secret` header for verification. It should match the secret you passed when creating the webhook.

### Failure

If Mono could not reach the URL, all the webhooks will be retried. Also, all Webhook URLs must respond with a status `200 ok` or the request will be considered unsuccessful and retried.

#### On this page

introduction

Why we use webhooks

How to set up a webhook URL

authentication

failure

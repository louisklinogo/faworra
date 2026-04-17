---
title: "Overview"
source_url: "https://docs.mono.co/docs/lookup/prove/overview"
scraped_at: "2026-04-09T21:54:59.748Z"
description: "Seamlessly verify and validate user identities across Africa with Mono Prove."
---# Overview

Last updated December 4th, 2025

### Introduction

Welcome to the Prove Integration Guide. Prove is an all-in-one credibility product designed to streamline customer onboarding by combining robust identity verification, tokenization, and fraud prevention. With Mono Prove, businesses and developers can confidently verify user identities through our versatile web and mobile SDKs.

### Getting Started

To integrate Prove into your application, you must have a registered business account with Mono. Please contact your account manager to enable Prove for your business. Alternatively, you can reach our sales team at [sales@mono.co](mailto:sales@mono.co) for assistance.

![featured-link](/icons/quicklink/partners.svg)

##### API References

Detailed steps for interacting with the Mono Prove APIs.

[View References](/api/prove/initiate)

![featured-link](/icons/quicklink/answer.svg)

##### Mono Prove FAQs

General information and questions about integrating Mono Prove. [Read Articles](https://support.mono.co/en/collections/2631861-mono-businesses-faq)

### Why use Prove?

1.  **Trust and Safety:** Verifying the identity of suspect users to reduce bad actors, scammers, or spam on your platform.

2.  **Fraud Prevention:** Adding ID verification to critical flow where fraudulent behaviour has been observed.

3.  **Regulatory Compliance:** Confirming the identity of users as a part of meeting KYC requirements.

4.  **Save Time**: Prove tokenises user identity documents for safe reuse. This cuts the time to onboard a new customer significantly.


### Mono Prove Features

**1\. ID Document Verification**

This feature enables businesses to verify users using government-issued identification documents. The process includes document capture, validation, and facial comparison.

-   **Document Validation:** Verify the authenticity and readability of uploaded documents.
-   **Selfie Verification:** Compare the user's selfie with the document photo and check for liveness.
-   **Fraud Database Check:** Screen user data against known fraud databases.

**2\. One-Click KYC (Tokenization)**

Tokenization allows users to securely store their verified identity and reuse it across multiple businesses using Mono Prove.

-   **Secure Identity Storage:** Encrypted storage of verified user data.
-   **Seamless Re-verification:** Fast and convenient re-verification for returning users.

**3\. Biometric Analysis & Liveness Checks**

This feature enhances security by verifying a user's identity through advanced facial recognition and liveness detection. It ensures that the person undergoing verification is physically present, preventing spoofing attempts.

-   **Facial Recognition:** Captures and analyzes facial features to match against submitted ID documents.

-   **Liveness Detection:** Prevents fraud by distinguishing real users from static images, videos, or deepfake attempts.

-   **Anti-Spoofing Measures:** Uses AI-driven technology to detect and block fraudulent identity spoofing tactics.


**4\. Manual Face-ID Verification**

The Prove Face-ID Manual Review feature allows you to manually verify the identities of users when automated facial recognition fails. This fallback is necessary for common issues such as poor lighting conditions, low-quality images, visual impairments, or instances where potential fraud is suspected.

After three unsuccessful automated attempts, the system automatically transitions the session into a manual review state and notifies the partner to review the submitted images via the Partner Dashboard.

**5\. Fraud Screening (Watchlist)**

This feature helps businesses identify high-risk users by conducting real-time checks against fraud databases and watchlists, mitigating security threats.

-   **Watchlist Verification:** Screens users against global and local fraud databases, sanction lists, and law enforcement watchlists.

-   **Suspicious Activity Detection:** Flags users with a history of fraudulent behavior or inconsistencies in their verification data.

-   **Regulatory Compliance:** Helps businesses adhere to compliance requirements by preventing engagement with blacklisted individuals.


**6\. Instant Webhooks**

Mono Prove sends webhooks to your server to notify you of verification results.

-   **Real-time Notifications:** Receive instant updates on verification status.
-   **Detailed Verification Data:** Access comprehensive verification data through webhooks.

### Prove Tiers

Mono Prove offers a tiered KYC verification system to ensure businesses can authenticate users with the appropriate level of identity validation. Each tier provides an increasing degree of verification, combining biometric checks, document validation, and address confirmation to enhance security and compliance. Businesses can select the tier that best aligns with their risk requirements and regulatory obligations.

The level of KYC verification required:

1.  **tier\_1**: Validating only the BVN and NIN numbers and verifying ownership of the submitted identity numbers with facial recognition.

2.  **tier\_2**: Validating BVN, NIN, a government-issued identification document, and verifying ownership of the submitted document with facial recognition.

3.  **tier\_3**: Validating BVN, NIN, government ID, and address, verifying ownership of the submitted documents with facial recognition, and confirming the user resides at the provided address.


#### On this page

overview

Getting Started

why use prove

mono prove features

prove tiers

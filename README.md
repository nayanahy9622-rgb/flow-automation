# TenTran AI — E-commerce Automation SaaS

TenTran AI is a Next.js e-commerce automation workspace with real server-side connector authentication and provider data retrieval.

## Real connector model

OAuth-capable integrations send the merchant to the provider's own authorization page, receive a server-side authorization code, exchange it for provider tokens, and store the resulting credentials encrypted on the server. OAuth state is protected with a random, HttpOnly cookie and is required on callback.

Live data can be requested after a successful connection through:

`GET /api/connector-data?id=<connector-id>`

The endpoint never returns the stored access token. It calls the provider API from the server and returns the provider response/data needed by the application.

## Connector coverage

OAuth flows are implemented for Shopify, Google Workspace (Sheets/Drive/Gmail), Google Ads authentication, Meta, TikTok, Klaviyo, Stripe Connect, BigCommerce, Wix, Amazon SP-API/LWA, and Razorpay Technology Partner OAuth.

API-key connectors are implemented for WooCommerce, WhatsApp Cloud API, Shiprocket, and Delhivery. These providers issue merchant/account credentials rather than a universal third-party OAuth flow in the current integration model.

Magento, Flipkart, and Myntra are kept as partner/merchant credential integrations because access depends on the provider's approved seller/partner program. The app does not fake an OAuth flow for these providers.

## Live data examples

Shopify pulls store, product, and recent-order data through the Admin API.

Google pulls the authorized user profile, recent Drive files, and Gmail profile information.

Meta pulls the authorized account and ad accounts.

TikTok pulls the authorized user profile.

Klaviyo pulls account information.

Stripe pulls connected-account, balance, and recent charge data.

BigCommerce pulls store, products, orders, and customers when the OAuth response provides the store context.

WooCommerce pulls system status, products, orders, and customers using the merchant's REST API keys.

WhatsApp validates and reads the configured phone-number resource.

Shiprocket calls the authenticated orders endpoint.

## Security

Provider access tokens and API credentials are encrypted at rest with AES-256-GCM in `.flowos/connectors.json`, with restrictive file permissions. Production requires `ENCRYPTION_KEY`.

Webhook requests are rejected unless they carry a valid Shopify HMAC or a valid generic HMAC signed with `WEBHOOK_SIGNING_SECRET`.

Never commit `.env`, provider secrets, access tokens, or `.flowos` to source control.

## Provider setup

Create the provider application in each provider's developer/partner console and register the exact callback URL:

`https://<your-domain>/api/connectors/<connector-id>/callback`

Set the matching values from `.env.example` in the deployment environment. Provider-side app review, scope approval, partner enrollment, and account permissions still apply; code cannot bypass those provider requirements.

## Development

```bash
npm install
npm run build
npm run start
```

The application is intentionally server-first for provider secrets: browser code starts the connection, while token exchange and provider API calls happen on the server.

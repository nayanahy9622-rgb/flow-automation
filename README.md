# TenTran AI — E-commerce Automation SaaS

TenTran AI is a Next.js e-commerce automation workspace designed to connect merchant systems and automate commerce operations.

## Product direction

The customer-facing product is focused on e-commerce and commerce operations. Development-only integrations are not included in the product connector catalog.

## Connector roadmap

The first connector set is:

- Shopify
- WooCommerce
- Amazon
- Flipkart
- Meesho
- WhatsApp
- Razorpay
- Shiprocket
- Quick Commerce

These connectors are shown as coming soon until their provider-specific authentication, data retrieval, and production validation are complete. The application does not claim a connector is connected until a real provider flow succeeds.

## Connector architecture

OAuth-capable integrations send the merchant to the provider's own authorization page, receive a server-side authorization code, exchange it for provider credentials, and store credentials through the server-side connector layer. API-key integrations use provider-issued merchant credentials. Provider access requirements, app review, scope approval, seller enrollment, and account permissions still apply.

Live provider data will be requested through:

`GET /api/connector-data?id=<connector-id>`

The endpoint is designed to keep provider credentials server-side and return only application data needed by the dashboard.

## Security

Provider credentials are intended to be encrypted at rest with AES-256-GCM. Production requires a persistent database-backed credential store and a stable authenticated user/workspace identity before real merchant connections are enabled.

Webhook requests must carry a valid provider signature where the provider supports signed webhooks. Never commit `.env`, provider secrets, access tokens, or `.flowos` to source control.

## Provider setup

For each provider, create the required application or merchant credentials in the provider's developer/partner console and register the exact production callback URL where applicable:

`https://<your-domain>/api/connectors/<connector-id>/callback`

Set only the matching values from `.env.example` in the deployment environment. Provider-side requirements cannot be bypassed by application code.

## Development

```bash
npm install
npm run build
npm run start
```

The application is server-first for provider secrets: browser code starts a connection, while token exchange and provider API calls happen on the server.

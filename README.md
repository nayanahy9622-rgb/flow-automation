# FlowOS — E-commerce Automation SaaS

A production-oriented Next.js foundation for a multi-tenant e-commerce automation operating system.

## Product surface
- Dashboard
- Sales
- Customers
- Inventory
- Finance
- Marketing
- Data
- Automations
- AI Agent
- Activity
- Connectors
- API & Webhooks
- Settings

## Architecture
The UI is separated from automation and integration concerns. Connector adapters can be added without changing workflow definitions. `/api/events` accepts webhook-shaped events and `/api/automations` exposes automation CRUD entry points.

## Production hardening still required before accepting live merchant traffic
This repository intentionally does **not** pretend that OAuth credentials, a database, payment provider accounts, or third-party production secrets exist. To launch, wire:
- PostgreSQL + migrations
- tenant-scoped auth/RBAC
- encrypted OAuth token storage
- durable queue/workers and idempotency
- real OAuth callbacks and provider SDKs
- webhook signature verification per provider
- secrets management
- observability/audit logging
- billing provider
- privacy/retention controls
- rate limits and abuse protection
- deployment secrets/environment configuration

Never put provider secrets in the browser or source tree.

# App Layer

This folder contains both the frontend screens and the server routes.

## Frontend Pages

- `page.tsx` - landing page
- `create/` - capsule creation flow
- `dashboard/` - public and owner dashboard
- `capsules/` - capsule list and detail pages

## Backend Routes

- `api/injective/auto-execute` - targeted Injective execution helper
- `api/cron/execute-intent` - scheduled execution route
- `api/intent-delivery/*` - CRE registration, status, dispatch
- `api/cre/*` - CRE callback and dispatch endpoints
- `api/mock/cre` - mock CRE path used before live CRE deployment

The App Router is the frontend shell. The API routes are the backend entry points.

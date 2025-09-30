# AI-Judge

A lightweight React + TypeScript app for managing judges, questions, submissions, and evaluations, powered by Supabase.

## Tech stack

- React 19 + Vite
- TypeScript
- Supabase (Auth, DB)
- TanStack Query for data fetching/caching
- React Router for routing

## Getting started

1. Prerequisites
    - Node 18+
    - npm
    - Supabase project (URL and anon/service keys)

2. Install
    - npm install

3. Environment
    - Copy .env.example to .env and set:
        - VITE_SUPABASE_URL=
        - VITE_SUPABASE_ANON_KEY=
        - Optional: service role or function URLs if used

4. Run
    - npm run dev

5. Build
    - npm run build
    - npm run preview

## Development notes

- API access and auth are centralized around Supabase; avoid duplicating client setup.
- Serverless/edge functions (e.g., evaluation runners) are isolated under supabase/functions.
- Data fetching is wrapped in React Query hooks; prefer using existing hooks over ad-hoc fetches.
- Routing is defined in the app shell; pages live in src/pages, shared UI in src/components.

## Scope decisions and reasoning

- Kept stack minimal (React, Query, Router, Supabase) to reduce operational overhead and speed delivery.
- Chose Supabase for auth + DB to avoid standing up custom backend; trade-off: vendor coupling accepted for faster
  iteration.
- Client-side rendering via Vite for simplicity; no SSR/SSG to keep deploy/runtime low-friction.
- Query hooks abstract access patterns to promote consistency and cache correctness; avoids scattering fetch logic.
- Styling kept simple with CSS modules/files instead of a heavy UI framework to retain control and keep bundle small.
- Background evaluation handled via function boundaries to separate concerns and keep UI responsive.

## Scripts

- dev: start local dev server
- build: production build
- preview: serve built assets

## Project structure

- src/
    - pages/: route-level views
    - components/: reusable UI
    - hooks/: custom React hooks
    - lib/: clients, helpers, types
    - queries/: React Query hooks
- supabase/functions/: serverless logic

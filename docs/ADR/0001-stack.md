# ADR 0001 — Technology stack

**Status:** Accepted (Phase 0)
**Date:** 2026-05-04

## Context

Crystal Events needs an integrated app combining a planner workspace,
a multi-front Master AI agent, file storage for sensitive PII, and
GDPR-compliant EU hosting. The team has no in-house engineering — the
stack must be operable by one or two contractors with strong AI/web
skills. The user asked for **Next.js + Supabase + Anthropic API +
Vercel** based on prior conversation.

## Decision

- **Frontend / server:** Next.js 15 App Router + TypeScript strict,
  React Server Components for the workspace, server actions for
  feature agents, route handlers for webhooks.
- **Database / auth / storage:** Supabase (Postgres 15+, Auth, Storage,
  Realtime). Hosted EU (Frankfurt or Dublin).
- **LLM:** Anthropic API. Default Sonnet 4.6; Opus 4.7 for heavy ops;
  Haiku 4.5 for quick lookups. Prompt caching mandatory.
- **Voice transcription:** Whisper-class API (OpenAI Whisper or EU
  alternative if available).
- **Hosting:** Vercel for the web app; serverless functions in
  `fra1` region. Static assets at the edge.
- **Workspace tooling:** pnpm + Turborepo monorepo.
- **Auth:** Supabase Auth with Google SSO and email magic-link
  fallback; allow-list of planner emails enforced via DB trigger.
- **Styling:** Tailwind v3 + brand tokens in `packages/ui`.
- **Forms / validation:** zod for runtime; react-hook-form for UI.

## Alternatives considered

- **T3 Stack (Next.js + Prisma + tRPC + Postgres direct)** — rejected
  because Supabase gives us Auth + Storage + RLS + Realtime in one
  service, reducing operational surface for a small team. Prisma's
  RLS support is weak vs writing policies directly in Postgres.
- **Remix instead of Next.js** — comparable; Next.js has better
  Vercel integration and a deeper ecosystem for the AI features we
  need.
- **Self-hosted Postgres on Hetzner / Scaleway** — cheaper at scale
  but operationally heavier; revisit at v2 if Supabase pricing bites.
- **OpenAI / Gemini for the LLM** — Anthropic chosen for prompt
  caching, tool-use ergonomics, and Claude's track record on
  document extraction. A model abstraction in `packages/ai` keeps
  the door open for multi-vendor.

## Consequences

- We're betting on Supabase for the long term. RLS policies are our
  primary authorisation surface; we must invest in testing them
  rigorously.
- Prompt caching ties us to Anthropic's specific cache semantics.
  Migrating providers would require re-engineering caching logic.
- Vercel functions have cold-start cost; long AI ops (>30s) must use
  the background queue (Supabase functions or external queue) rather
  than blocking serverless functions.
- Monorepo overhead is small for our scale; Turborepo gives us
  per-package incremental builds.

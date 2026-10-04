# MemoCore Frontend

Next.js app for chatting with your knowledge base. The Next.js server runs the chat with the Vercel AI SDK: it calls LM Studio for generation and the FastAPI backend for retrieval. The browser never talks to either directly.

## Stack

- Next.js 16 (App Router), React 19, TypeScript
- Vercel AI SDK (`ai`, `@ai-sdk/react`) with `@ai-sdk/openai-compatible` for LM Studio
- AI Elements and shadcn/ui (Radix) on Tailwind CSS v4, with Streamdown for streamed Markdown
- TanStack Query for backend data
- `openapi-fetch` with types generated from the backend's OpenAPI schema
- Supabase (Auth and data) through `@supabase/ssr` and `@supabase/supabase-js`, server-side only
- ESLint, Prettier, Vitest

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

The app runs on http://localhost:3000.

Server variables are validated with zod in `lib/env.ts` when the server starts (`instrumentation.ts`). A missing or invalid variable stops startup with a list of what's wrong. `next build` doesn't need them.

| Variable              | Purpose                                                               |
| --------------------- | --------------------------------------------------------------------- |
| `API_URL`             | FastAPI backend                                                       |
| `LMSTUDIO_HOST`       | LM Studio server                                                      |
| `LLM_MODEL`           | LM Studio model identifier                                            |
| `SUPABASE_URL`        | Supabase API gateway (the same one the backend uses)                  |
| `SUPABASE_SECRET_KEY` | Supabase secret key (`sb_secret_...`). Admin access, server-side only |

## Scripts

| Script                    | Purpose                                                                                        |
| ------------------------- | ---------------------------------------------------------------------------------------------- |
| `dev` / `build` / `start` | Next.js                                                                                        |
| `lint`                    | ESLint                                                                                         |
| `typecheck`               | TypeScript without emitting                                                                    |
| `test` / `test:watch`     | Vitest with Testing Library and jsdom, once or in watch mode                                   |
| `format` / `format:check` | Prettier                                                                                       |
| `api:types`               | Generate `lib/api/schema.d.ts` from the backend code (no running server needed; requires `uv`) |

## Backend API

`lib/api/client.ts` exports `api`, an `openapi-fetch` client typed from `lib/api/schema.d.ts`. It's server-only, so the browser never calls the backend directly. Wrap calls in `unwrap()` to get the data or an `ApiError` carrying the backend's message:

```ts
const repositories = await unwrap(api.GET("/repositories"))
```

Run `npm run api:types` after changing backend routes or models and commit the regenerated schema.

## Auth

MemoCore has exactly one account, stored in Supabase Auth and tagged with `app_metadata.memocore_owner`. Users can't edit `app_metadata`, so other accounts on the same Supabase can't sign in.

On first run, with no owner account, every page leads to `/setup`. It creates the account with the admin API (email confirmed, no SMTP needed) and signs you in. After that `/setup` redirects to sign in.

The browser never talks to Supabase. Sessions are cookies managed by `@supabase/ssr`:

- `proxy.ts` refreshes the session on every request and sends signed-out visitors to `/sign-in?next=<page>` (API routes get a 401).
- `requireUser()` in `lib/session.ts` verifies the user in pages and layouts. Server Actions that change data should call it too.
- `supabaseAdmin` in `lib/supabase/server.ts` uses the secret key and bypasses row level security. Only use it after `requireUser()`.

## Components

`components/ui` holds shadcn components and `components/ai-elements` holds AI Elements. Add more with `npx shadcn@latest add <name>` or `npx ai-elements@latest add <name>`.

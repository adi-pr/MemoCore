# MemoCore Frontend

Next.js app for chatting with your knowledge base. The Next.js server runs the chat with the Vercel AI SDK: it calls LM Studio for generation and the FastAPI backend for retrieval. The browser never talks to either directly.

## Stack

- Next.js 16 (App Router), React 19, TypeScript
- Vercel AI SDK (`ai`, `@ai-sdk/react`) with `@ai-sdk/openai-compatible` for LM Studio
- AI Elements and shadcn/ui (Radix) on Tailwind CSS v4, with Streamdown for streamed Markdown
- TanStack Query for backend data
- `openapi-fetch` with types generated from the backend's OpenAPI schema
- Better Auth, Drizzle ORM on Postgres
- ESLint, Prettier, Vitest

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

The app runs on http://localhost:3000.

Server variables are validated with zod in `lib/env.ts` when the server starts (`instrumentation.ts`). A missing or invalid variable stops startup with a list of what's wrong. `next build` doesn't need them.

| Variable             | Purpose                                            |
| -------------------- | -------------------------------------------------- |
| `API_URL`            | FastAPI backend                                    |
| `LMSTUDIO_HOST`      | LM Studio server                                   |
| `LLM_MODEL`          | LM Studio model identifier                         |
| `DATABASE_URL`       | Postgres for auth and chat history                 |
| `BETTER_AUTH_SECRET` | Session signing secret (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL`    | Public URL of this app                             |

## Scripts

| Script                                     | Purpose                                                                                        |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `dev` / `build` / `start`                  | Next.js                                                                                        |
| `lint`                                     | ESLint                                                                                         |
| `typecheck`                                | TypeScript without emitting                                                                    |
| `test` / `test:watch`                      | Vitest with Testing Library and jsdom, once or in watch mode                                   |
| `format` / `format:check`                  | Prettier                                                                                       |
| `api:types`                                | Generate `lib/api/schema.d.ts` from the backend code (no running server needed; requires `uv`) |
| `db:generate` / `db:migrate` / `db:studio` | Drizzle Kit, using the schema in `db/schema.ts`                                                |

## Backend API

`lib/api/client.ts` exports `api`, an `openapi-fetch` client typed from `lib/api/schema.d.ts`. It's server-only, so the browser never calls the backend directly. Wrap calls in `unwrap()` to get the data or an `ApiError` carrying the backend's message:

```ts
const repositories = await unwrap(api.GET("/repositories"))
```

Run `npm run api:types` after changing backend routes or models and commit the regenerated schema.

## Database

Drizzle manages the frontend's tables in their own Postgres schema, `app`, so they never touch the backend's tables in `public`. The schema is in `db/`, and migrations in `drizzle/` are committed.

```bash
npm run db:generate -- --name <change>   # after editing db/*.ts
npm run db:migrate                        # apply pending migrations
```

## Auth

MemoCore has exactly one account. Better Auth handles email and password sign-in, and a database hook rejects creating a user once one exists. Sessions last 30 days and refresh daily while you use the app.

## Components

`components/ui` holds shadcn components and `components/ai-elements` holds AI Elements. Add more with `npx shadcn@latest add <name>` or `npx ai-elements@latest add <name>`.

# Harrsoft Kanban — SPEC.md

## Overview

A project management / time-tracking app for Harrsoft workers' cooperative. Users can create projects, track time against them, manage members with role-based access, and log work.

## Tech Stack

| Concern         | Choice                                    | Rationale                                      |
| --------------- | ----------------------------------------- | ---------------------------------------------- |
| Package manager | Bun                                       | Selected by Lavra; faster than npm, native TS  |
| Framework       | SvelteKit 2                               | Full-stack, server-rendered, Svelte 5 runes    |
| Validation      | Valibot                                   | Type-safe schema parsing, smaller than Zod     |
| Database        | PostgreSQL                                | Relational, well-supported, Drizzle ORM        |
| ORM             | Drizzle + Drizzle Kit                     | Schema-as-types, no code gen step              |
| Auth            | Lucia patterns (manual)                   | Custom JWT + session model; no Auth.js library |
| CSS             | Tailwind CSS 4 + forms/typography plugins | Utility-first, tree-shakable                   |
| Testing         | Vitest (unit) + Playwright (E2E)          | Unified with Vite config                       |
| Linting         | ESLint + Prettier + Svelte plugin         | Standard Svelte ecosystem                      |
| Adapter         | svelte-adapter-bun                        | Bun-native deployment                          |

## Architecture

### Route structure

Current routes under `src/routes/`:

- `/` — main dashboard/project list
- `/login` — email + password auth
- `/invite/[code]` — invite-based registration
- `/project/[projectId]` — individual project view
- `/admin/` — admin panel (users, invites, projects)
- `/settings/` — user settings
- `/time/`, `/time/[clockId]` — time clocks
- `/logger/v1/push` — API endpoint for external log push

Note: There's also a `project/` directory at repo root containing `+page.svelte`, `[projectId]/+page.ts`, and `create/+page.svelte`. These follow SvelteKit route file naming but are not wired up — likely intended to replace/merge into `src/routes/project/`.

### Data model

**Core entities:**

- `users` — email, name, avatar, bio, platform_role (user|admin)
- `passwords` — argon2-hashed passwords, separate table
- `sessions` — session tokens linked to users, 30-day expiry
- `invites` — invite codes for registration, 30-day expiry
- `projects` — name, optional image URL
- `project_members` — user-project join table with role (admin|contributor|viewer)
- `project_keys` — API key hashes for programmatic project access
- `timeclocks` — time tracking entries
- `logging` — structured log entries

**Auth flow:**

1. Server: HMAC SHA256 JWT (HS256) with `AUTH_SECRET`, 24-hour token expiry
2. Session cookie stores JWT; session row in DB has 30-day expiry
3. On login: argon2 verify → create session → create JWT → set cookie
4. On request: `hooks.server.ts` → `auth/handle` validates JWT → sets `locals.session`
5. Server init: auto-creates `admin@example.com` invite if no users exist

### Branded types pattern

All IDs use Valibot brand types (e.g. `ProjectId`, `UserId`, `SessionId`) wrapping cuid2 strings. This provides type-level discrimination without runtime overhead.

### Path aliases

| Alias                   | Maps to                |
| ----------------------- | ---------------------- |
| `$`                     | `./src`                |
| `$com`                  | `./src/lib/components` |
| `$db` & `$db/*`         | `./src/lib/server/db`  |
| `$server` & `$server/*` | `./src/lib/server`     |
| `$types` & `$types/*`   | `./src/lib/types`      |

## Conventions

### File placement

- Route pages: `src/routes/[route]/(page|+page.svelte)`
- Server-only code: `src/lib/server/`
- Shared components: `src/lib/components/`
- Shared types: `src/lib/types/` — types mirror DB schema, validated by Valibot
- Remote functions: `src/lib/remote/` — server-side forms/queries callable from client

### Component style

- Svelte 5 runes (`$state`, `$derived`, `$effect`, `$props`)
- TypeScript for all `.svelte` files (`<script lang="ts">`)
- Tailwind for all styling; no separate CSS files

### Server functions

- Use `$app/server`'s `form()` and `query()` for server-client communication
- Forms return SvelteKit `invalid()` on validation failure, `redirect()` on success
- Database access via Drizzle transactions where atomicity matters

### Naming

- Tables: snake_case plural (e.g. `project_members`)
- TS types: PascalCase (e.g. `ProjectInfo`, `UserProfile`)
- Variables/functions: camelCase
- Files: kebab-case (e.g. `hooks.server.ts`, `auth.remote.ts`)
- DB columns: snake_case (e.g. `user_id`, `platform_role`)

## Testing

- Unit tests: `src/**/*.spec.ts` (server) and `src/**/*.svelte.spec.ts` (client/browser)
- E2E tests: `e2e/` directory via Playwright
- Vitest config supports separate `client` (browser enviroment via Playwright) and `server` (node environment) projects
- Test assertions required (`expect.requireAssertions: true`)

## Development environment

### Local setup (this VM)

| Component     | Detail                                                    |
| ------------- | --------------------------------------------------------- |
| PostgreSQL 16 | Local, systemd-managed, user `harrsoft`                   |
| Database      | `kanban_dev` owned by `harrsoft`                          |
| Auth secret   | `alpha-dev-secret-local` (dev only, not in production)    |
| Dev server    | `bun run dev` → `localhost:5173`, verified HTTP 200       |
| Migrations    | Applied via `bun run db:migrate` — 3 migrations, 9 tables |

`.env` file:

```
ORIGIN="http://localhost:5173"
AUTH_SECRET="alpha-dev-secret-local"
DATABASE_URL="postgres://harrsoft:harrsoft-dev@localhost:5432/kanban_dev"
```

### Branch strategy

**Goal:** Integrate Jade's kanban board (`feature/kanban`) with quill's auth/admin/time structure (`main`).

1. `git checkout -b alpha/kanban-merge main` — start from quill's latest structure
2. `git merge feature/kanban` — bring in Jade's boards, columns, cards
3. Resolve conflicts: schema index, types, svelte config, layout
4. Add auth guards to kanban routes
5. Write tests for kanban CRUD server actions
6. Push to GitHub (pending credentials)
7. PR `alpha/kanban-merge` → `main`

## Next priorities

1. [ ] Execute merge strategy (step 1 above)
2. [ ] Add auth guards to kanban routes
3. [ ] Wire up navigation (main nav → kanban link)
4. [ ] Write unit tests for kanban server actions
5. [ ] Wire up timeclock features to projects
6. [ ] Add project settings page (rename, change image, manage members)
7. [ ] Migrate `project/` root dir into `src/routes/project/`

## Agent-friendly API design

The kanban app is designed to be consumed by both human users and autonomous agents (e.g., Harrsoft Alpha). Agents interact with the app programmatically through lightweight endpoints that return structured data with minimal rendering overhead.

### Agent API conventions

- **Prefix:** All agent-facing endpoints live under `/api/agent/`
- **Auth:** Agents authenticate via API keys (`project_keys` table), passed as `Authorization: Bearer <key>`
- **Response format:** All agent endpoints return JSON; no HTML fragments, no redirects
- **Error format:** Always `{ error: string, code: string }` with appropriate HTTP status

### Endpoint design principles

1. **Ask what's due:** `GET /api/agent/pulse` — returns the current priority item for the agent (most urgent task across projects the agent has access to). Response: `{ taskId, title, project, dueAt, priority, type: "timeclock"|"review"|"kanban" }`
2. **Structured inputs/outputs:** Mutation endpoints accept and return the same Valibot-validated types used server-side — no extra marshaling
3. **Context window efficiency:** List endpoints support `fields` query param to select only needed columns, reducing response size for agents with limited context
4. **Bulk operations:** Where possible, accept arrays of IDs/resources to batch work in fewer API calls
5. **Idempotency key:** `Idempotency-Key` header honored on mutation endpoints to allow safe retries

### Planned endpoints

| Endpoint                 | Method | Purpose                         |
| ------------------------ | ------ | ------------------------------- |
| `/api/agent/pulse`       | GET    | Get current priority item       |
| `/api/agent/tasks`       | GET    | List tasks with filters         |
| `/api/agent/time/log`    | POST   | Log time against a task         |
| `/api/agent/time/status` | GET    | Current active timeclock status |
| `/api/agent/projects`    | GET    | List accessible projects        |

> **Note for render targets without table support (Discord/WhatsApp):**
>
> - `/api/agent/pulse` (GET) — current priority
> - `/api/agent/tasks` (GET) — list tasks
> - `/api/agent/time/log` (POST) — log time
> - `/api/agent/time/status` (GET) — active clock
> - `/api/agent/projects` (GET) — accessible projects

### Agent API key model

- Separate `agent_keys` table (distinct from `project_keys` which is for external/3rd-party access)
- Scoped to specific projects and action types (read-only, time-logging, task-management)
- Key rotation supported via `POST /api/agent/keys/rotate`

### Priority for agent-friendly features

These are **phase 2** (post-merge, post-tests) — they won't block the current merge PR. The endpoints become meaningful once the kanban and timeclock models are stable.

## Known issues

- `project/[projectId]/+page.ts` has an empty `load` function — page data not loaded
- `project/` dir at root is not a valid SvelteKit route location; needs migration to `src/routes/`
- `src/routes/api/users/get/index.ts` and `src/routes/api/users/delete/index.ts` use zod (need valibot conversion)
- `src/routes/api/users/` route files imported from `feature/kanban` but not wired into the app — need integration with main's remote function pattern
- Layout components from Jade (`layout/Header.svelte`, `layout/Nav.svelte`, `layout/Themer.svelte`) may conflict with main's `+layout.svelte`

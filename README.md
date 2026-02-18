# harrsoft-kanban

A work planner.

## Licensing

This software is licensed under the terms of the AGPL 3.0 license. If you find
that doesn't serve your needs, please contact us at <sales@harrsoft.studio> to
negotiate an exception.

## Stack

| Concern             | Library                                                   |
| ------------------- | --------------------------------------------------------- |
| Package Manager     | [Bun](https://bun.com/)                                   |
| Framework           | [SvelteKit](https://svelte.dev/docs/kit/introduction)     |
| Type validation     | [Valibot](https://valibot.dev/)                           |
| Database            | [PostgreSQL](https://www.postgresql.org/)                 |
| Database ORM        | [Drizzle](https://orm.drizzle.team/)                      |
| Database Migrations | [Drizzle Kit](https://orm.drizzle.team/docs/kit-overview) |

## Package Scripts

This package was developed primarily with bun as its runtime and package manager. Install bun on your computer and restart your terminal/IDE. Then you can run package scripts like so:

```
$ bun run <script>
```

### The -b flag

The `-b` AKA `--bun` flag for the `bun` or `bunx` command instructs scripts to use bun as the JS runtime rather than Node. It is required when running scripts that call code with imports from bun. The flag allows bun to correctly resolve certain aliases. For example, if you installed bun globally on your pc, wrote the package script

`"dev": "vite dev"`

and wrote the code

`import { SQL } from "bun"`

without installing bun as a module, then ran

`$ bun run dev` (no -b flag)

it would fail with the error

`Error: Cannot find module 'bun' imported from [...src/lib/server/db/index.ts](./src/lib/server/db/index.ts)`

because `"bun"` is not an installed module (nor is it recognized by Vite as a global), but rather an alias that your global buntime can parse. There are two ways to fix this:

1. Every time you want to run the script, use the `-b` flag: `$ bun -b run dev`

2. Add `bunx --bun` to the package script : `"dev": "bunx -b vite dev"`

## Setup

### Database Creation

This project depends on a connection to a PostgreSQL database. Set one up (such as with [pgAdmin](https://www.pgadmin.org/)) and formulate the [connection string](https://orm.drizzle.team/docs/connect-overview#database-connection-url) to use as an [environment variable](#env-variables).

### Env Variables

Make sure to have a file named `.env` in the top-level directory (where `env.example` is) with the following variables set:

    ORIGIN="http://localhost:5173" # optional in dev mode, required in builds
    AUTH_SECRET="this can be anything"
    DATABASE_URL="postgres://user:password@host:port/db-name"

### Database Initialization

Run the following command to apply existing drizzle SQL migrations to your newly provisioned and connected database:

`$ bunx drizzle-kit migrate`

### Create admin user

This app is invite-only; there is no signup link. To create the first admin account:

1. Create a row in the invite table with your email, an arbitrary code (keep it on hand), and the 'admin' platform_role. Various options exist:

- Use a SQL command:

```sql
INSERT INTO invites (email, code, platform_role) VALUES ('my@e.mail', 'asdf', 'admin');
```

- Run `$ bun run db:studio` to edit your data with Drizzle Studio.

- Use whatever other database explorer you're using, such as [Railway](https://railway.app) or pgAdmin.

- Or maybe you don't have to do any of this because the [hooks.server.ts](./src/hooks.server.ts) file counts all the user and admin invites on every request made to the server and conditionally creates an admin invite for `admin@example.com` with invite code `admin` if both counts are zero.

2. Go to `/invite/asdf`, replacing `asdf` with whatever invite code you used.

### Run locally

In the terminal, run

`$ bun run dev`

## Changing data models

The shape of the database is defined in the `.ts` files within [src/lib/server/db/schema](./src/lib/server/db/schema). If you intend to change the shape of data, you must reflect those changes with a SQL migration.

1. Change the source of truth: objects exported from files in the [schema folder](./src/lib/server/db/schema). _(Because we're using Drizzle, updates here will immediately affect your code, unlike in Prisma, where the TypeScript client must be generated deliberately from a separate schema file.)_

2. Generate the SQL migration file by running the command
   `$ bun run db:generate`

3. Apply the SQL migration to your connected database:
   `$ bun run db:migrate`

4. Save the migration in source control.

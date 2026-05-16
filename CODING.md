# Harrsoft Coding Protocol

## Alpha's contribution conventions

### Git authorship

- All commits authored by me should use: `Co-authored-by: Alpha <alpha@harrsoft.coop>`
- Commits go through either quill's or Harrsoft's GitHub account credentials
- PR descriptions should note AI-assisted authorship

### Commit message format

```
type(scope): brief description

- Bullet points for details if needed
- Reference issues with #1234
```

Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`, `db`
Scope: `auth`, `board`, `project`, `time`, `admin`, `db`, `config`, etc.

### Branch naming

- `feat/<short-description>` — new features
- `fix/<short-description>` — bug fixes
- `refactor/<short-description>` — code restructuring
- `docs/<short-description>` — documentation
- `chore/<short-description>` — maintenance

### PR workflow

1. Branch from `main`
2. Implement changes with tests
3. Run `bun run lint` and `bun run test:unit`
4. Create PR with description of changes
5. Request review from quill or lavra
6. Merge after approval

## Before touching code

1. Read `SPEC.md` if present in repo
2. Check existing tests pass (if test infrastructure exists)
3. Understand the data model before writing DB queries
4. Use Valibot for all input validation — never trust raw input

## Testing expectations

- Every new feature gets a unit test
- Every new route gets a smoke test
- Every DB schema change gets a migration test
- Prefer Vitest for unit tests, Playwright for E2E
- If a test environment isn't available (no PostgreSQL), note this in the PR

## Code review checklist (for myself)

- [ ] Types are correct (Valibot parsed)
- [ ] No plain SQL injections (use Drizzle param binding)
- [ ] Auth checks on all server endpoints
- [ ] Error states handled in UI
- [ ] Tailwind classes are valid Tailwind 4 syntax
- [ ] No secrets leaked to client (server-only imports in `$lib/server/`)

# Deployment

| Branch | Vercel target | Database |
| --- | --- | --- |
| `main` | Production | Neon production branch |
| `staging` | Preview | Neon `staging` branch |

GitHub Actions drives the deploy through the Vercel CLI rather than Vercel's
Git integration, so lint and typecheck genuinely gate a release: nothing ships
if they fail. `vercel.json` sets `git.deploymentEnabled: false` to stop Vercel
also deploying on push, which would otherwise double-deploy every commit.

## Pipeline

`.github/workflows/checks.yml` — lint and typecheck. Runs on every pull request
into `main` or `staging`, and is called by the deploy workflow. It needs **no
secrets**: the Prisma client is generated with a placeholder URL (generation
reads the schema and never connects), so the job also works on pull requests
from forks.

`.github/workflows/deploy.yml` — runs on push to `main` or `staging`:

1. Run the checks workflow; stop if it fails.
2. `vercel pull` the matching environment (production, or preview scoped to the
   pushed branch).
3. `prisma migrate deploy` against that environment's database.
4. `vercel build` (`--prod` on `main`).
5. `vercel deploy --prebuilt`.
6. Smoke-test `/` and `/shop` on the returned URL, retrying while the
   deployment warms up.

### Why migrations run before the build

`app/sitemap.ts` is prerendered at build time from live product rows, so the
build opens a real database connection. If the schema were migrated after the
build, a deploy that adds a table would fail while generating the sitemap. The
build therefore needs a **reachable** database, not just a `DATABASE_URL`.

### Why the migration URL differs from the runtime one

Prisma takes a session-level advisory lock while migrating, which is unreliable
through PgBouncer. Migrations use Neon's **direct (unpooled)** endpoint; the
application uses the **pooled** one. Neon's direct host is the pooled host with
`-pooler` removed:

```
pooled  ep-xxxx-pooler.c-4.ap-southeast-1.aws.neon.tech   <- Vercel DATABASE_URL
direct  ep-xxxx.c-4.ap-southeast-1.aws.neon.tech          <- GitHub secret
```

## One-time setup

### 1. Link the Vercel project

```bash
npx vercel link          # creates .vercel/ locally (gitignored)
cat .vercel/project.json # -> orgId and projectId
```

### 2. GitHub repository secrets

`Settings -> Secrets and variables -> Actions -> New repository secret`

| Secret | Value |
| --- | --- |
| `VERCEL_TOKEN` | Vercel account token (`vercel.com/account/tokens`) |
| `VERCEL_ORG_ID` | `orgId` from `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | `projectId` from `.vercel/project.json` |
| `PRODUCTION_DIRECT_DATABASE_URL` | Neon **production** branch, **unpooled** |
| `STAGING_DIRECT_DATABASE_URL` | Neon **staging** branch, **unpooled** |

### 3. Vercel environment variables

`Vercel project -> Settings -> Environment Variables`. These are what the built
application and the build itself use, so they are the **pooled** URLs.

| Name | Environment | Value |
| --- | --- | --- |
| `DATABASE_URL` | Production | Neon production branch, pooled |
| `DATABASE_URL` | Preview | Neon `staging` branch, pooled |
| `NEXT_PUBLIC_SITE_URL` | Production | `https://your-domain.com` |
| `NEXT_PUBLIC_SITE_URL` | Preview | preview domain, or leave unset |

`NEXT_PUBLIC_SITE_URL` is optional; it sets `metadataBase` and the absolute URLs
in `sitemap.xml` and `robots.txt`. Without it those fall back to
`http://localhost:3000`, which is wrong in a deployed sitemap — set it for
production at least.

Scope the Preview `DATABASE_URL` to the `staging` branch if you later add other
preview branches that should not share the staging database.

### 4. Region

`vercel.json` pins functions to `sin1` (Singapore) because the Neon database is
in `ap-southeast-1`. Every route in this app is dynamic and queries Postgres, so
running functions in Vercel's default US region would add a cross-Pacific round
trip to each request. **If you move the database, change this region to match.**

## Seeding

Seeding is deliberately not part of the pipeline — it rewrites reviews and
testimonials, which must not happen on every deploy. Run it manually against a
branch you have checked:

```bash
DATABASE_URL='<direct url for that branch>' npm run db:seed
```

## Rollback

Vercel keeps every deployment. Promote a previous one from the dashboard
(`Deployments -> ... -> Promote to Production`), or:

```bash
npx vercel rollback <deployment-url> --token=$VERCEL_TOKEN
```

Code rolls back instantly; **migrations do not**. `prisma migrate deploy` is
forward-only, so an already-applied migration stays applied. Keep migrations
backward-compatible with the previous release (add columns before writing to
them, drop them a release later) so a rollback is always safe.

## Adding a migration

```bash
npm run db:migrate -- --name describe_the_change   # local, writes prisma/migrations/
git add prisma/migrations && git commit
```

Push to `staging` first: the pipeline applies it to the Neon staging branch and
deploys a preview. Merge to `main` to apply it to production.

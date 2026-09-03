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

### 1. Find the project and org IDs

`vercel link` writes one of two files, depending on which mode you picked:

| File | Created by | Where the IDs are |
| --- | --- | --- |
| `.vercel/project.json` | `vercel link` (project-level) | `projectId`, `orgId` at the top level |
| `.vercel/repo.json` | `vercel link --repo` (repository-level) | `projects[0].id`, `projects[0].orgId` |

Repository-level linking is the newer mode and has **no `project.json`** — if you
followed a guide that says to `cat .vercel/project.json` and got "No such file",
that is why. This command prints the right values from whichever file exists:

```bash
node -e '
  const fs = require("node:fs");
  const f = fs.existsSync(".vercel/project.json") ? "project.json" : "repo.json";
  const d = JSON.parse(fs.readFileSync(".vercel/" + f, "utf8"));
  const p = d.projects ? d.projects[0] : d;
  console.log("VERCEL_PROJECT_ID", p.id ?? p.projectId);
  console.log("VERCEL_ORG_ID    ", p.orgId);
'
```

If `.vercel/` does not exist at all, run `npx vercel link` first. The Vercel
project must already exist — the pipeline deploys to it, it does not create it.

### 2. GitHub repository secrets

`Settings -> Secrets and variables -> Actions -> New repository secret`

| Secret | Value |
| --- | --- |
| `VERCEL_TOKEN` | Vercel token (`vercel.com/account/tokens`) — **see the scope note below** |
| `VERCEL_ORG_ID` | `orgId` from step 1 (starts `team_` or `user_`) |
| `VERCEL_PROJECT_ID` | project id from step 1 (starts `prj_`) |
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

**Token scope.** When you create a token, Vercel asks which scope it applies to.
If your `VERCEL_ORG_ID` starts with `team_`, the project belongs to a team, and a
token scoped to your *personal account* cannot see it — `vercel pull` then fails
with `Could not retrieve Project Settings`, which does not mention scope at all.
Pick the team that owns the project in the token's scope selector.

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

## Troubleshooting

### `Could not retrieve Project Settings` on `vercel pull`

The CLI could not resolve the project. In order of likelihood:

1. **`VERCEL_ORG_ID` or `VERCEL_PROJECT_ID` is unset.** An unset GitHub secret
   interpolates to an empty string, so the CLI sees no project at all. The
   `Check required secrets` step now catches this before Vercel runs.
2. **The IDs came from the wrong place.** With repository-level linking the ids
   live in `.vercel/repo.json` under `projects[0]`, not in `project.json`. See
   step 1.
3. **The token is scoped to the wrong account.** A `team_…` orgId with a
   personal-account token fails exactly this way. Recreate the token with the
   owning team selected.
4. **The project was deleted or renamed in Vercel.** Re-run `npx vercel link`
   and read the ids again.

The advice in Vercel's error to "remove the `.vercel` directory" applies to
local runs. CI checks out fresh, so there is never a stale `.vercel` there.

### The deploy succeeded but pages 500

Check the Vercel function logs. The usual cause is a missing or unreachable
`DATABASE_URL` in that Vercel environment — every route in this app queries
Postgres. Confirm the variable is set for the right environment (Production vs
Preview) and that it is the **pooled** Neon URL.

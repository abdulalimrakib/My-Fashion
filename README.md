This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Database (Prisma + PostgreSQL)

1. Copy `.env.example` to `.env.local` and put your PostgreSQL connection string in `DATABASE_URL`.
2. Create the starter `User` table: `npm run db:migrate -- --name init`.
3. Whenever you change `prisma/schema.prisma`, run the migration command again.
4. Open the database viewer with `npm run db:studio`.

Use the shared client only in server-side code:

```ts
import { prisma } from "@/lib/prisma";

const users = await prisma.user.findMany();
```

`app/generated/prisma` is created automatically by Prisma and is intentionally not committed.

### What each database file does

- `.env.example` is a safe template for the private database URL. Copy it to `.env.local`; never commit the real credentials.
- `prisma.config.ts` tells Prisma where the schema and migration files are, and loads `DATABASE_URL` for Prisma commands.
- `prisma/schema.prisma` describes the database tables and fields. It currently contains a starter `User` table.
- `prisma/migrations/` will be created by `db:migrate`. It keeps the history of changes to your database structure.
- `lib/prisma.ts` creates the shared Prisma client used by server-side Next.js code. Import this file when querying the database.
- `app/generated/prisma/` is type-safe Prisma code generated from the schema. Do not edit it by hand.
- The `db:generate`, `db:migrate`, and `db:studio` scripts in `package.json` generate that code, change the database structure, and open Prisma's database viewer.

## Catalogue administration

Products are added by hand at `/admin/products`, which is only reachable by an
administrator.

### Getting in

Set `ROOT_ADMIN_EMAIL` in `.env.local` (and in the deployment's environment) to
the address that should always have access:

```bash
ROOT_ADMIN_EMAIL="you@example.com"
```

Register that email in the app as a normal account and sign in — it is an
administrator immediately, with nothing to run and nothing to remember. The
answer is derived from the variable on every request rather than stored, so a
bad database write, a restored backup, or another admin cannot lock you out.

> Register it **before** deploying anywhere public. Sign-up is open and email
> addresses are not verified, so whoever registers an address first owns it.

### Adding other administrators

Signed in as a root administrator, `/admin/users` lists every account and grants
or revokes catalogue access with one button. Ordinary administrators can edit
the catalogue but not this list — they get the same 404 a shopper does. A root
administrator cannot be demoted from the UI, because their access comes from the
environment; change `ROOT_ADMIN_EMAIL` instead.

There is a CLI fallback for when `ROOT_ADMIN_EMAIL` is unset or its account has
not been registered yet:

```bash
npm run admin:grant -- someone@example.com
# and to take it away again
npm run admin:grant -- someone@example.com --revoke
```

A product is created in three steps: the shared information (name, description,
category, price, sizes), then one colour variant per colourway, each with its
own photograph, then a review screen. The shared copy is stored once on
`Product`; each colour is a `ProductVariant` row that owns its `ProductImage`
rows, so nothing is duplicated per colour and the storefront can swap the
photograph when a shopper picks a swatch.

### Uploaded images

Admin uploads are stored as rows in `ImageAsset` and served by
`app/api/images/[id]`. They are not written to `public/`, because the
application runs on Vercel, where the filesystem is read-only at runtime and no
object store is provisioned. `lib/images.ts` holds the limits (type, size and
minimum dimensions) and reads the real format out of the file's own bytes rather
than trusting the browser's reported type.

## Tests

```bash
npm test
```

Node's built-in test runner, run through `tsx`. The tests in `tests/` that touch
the database use the `DATABASE_URL` from `.env.local` and skip themselves when
it is unset; they create and remove their own rows.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

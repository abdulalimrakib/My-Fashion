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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

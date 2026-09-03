import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Next.js keeps local secrets in .env.local, so make Prisma CLI commands use
// the same file. Existing shell environment variables still take precedence.
config({ path: ".env.local", quiet: true });
config({ quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});

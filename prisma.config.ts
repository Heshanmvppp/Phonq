import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // prisma generate (run in CI/builds) never connects to the database, so a
    // placeholder is enough when DATABASE_URL isn't present in the environment.
    url: process.env.DATABASE_URL ?? "postgresql://placeholder:placeholder@localhost:5432/phonq",
  },
});

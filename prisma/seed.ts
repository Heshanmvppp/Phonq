import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL ?? "" }),
});

async function main() {
  console.log("Phonq seed: nothing to seed — the catalog streams live from the Jamendo API.");
  console.log("The schema is ready for users, playlists, favorites and listens.");
  console.log("Create the tables with `npx prisma migrate dev` (or `migrate deploy` in production).");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { ok, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  await prisma.$transaction([
    prisma.favorite.deleteMany({ where: { userId: session.user.id } }),
    prisma.listen.deleteMany({ where: { userId: session.user.id } }),
    prisma.playlist.deleteMany({ where: { userId: session.user.id } }),
  ]);

  return ok({ deleted: true });
}

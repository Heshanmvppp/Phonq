import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { badRequest, created, ok, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const playlists = await prisma.playlist.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { tracks: true } },
    },
  });

  return ok({ playlists });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    description?: string;
    isPublic?: boolean;
  };
  const name = body.name?.trim();
  if (!name) return badRequest("name is required");
  if (name.length > 60) return badRequest("name must be 60 characters or fewer");

  const playlist = await prisma.playlist.create({
    data: {
      userId: session.user.id,
      name,
      description: body.description?.trim().slice(0, 300) ?? null,
      isPublic: body.isPublic ?? true,
    },
  });

  return created({ playlist });
}

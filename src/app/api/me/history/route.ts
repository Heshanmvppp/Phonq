import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { badRequest, ok, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * Reports that the signed-in user listened to a track.
 * The player calls this once per track (deduped client-side by track id).
 * We store one row per (user, track), updating progress and timestamps.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const body = (await request.json().catch(() => ({}))) as {
    trackId?: string;
    progress?: number;
    completed?: boolean;
  };
  if (!body.trackId) return badRequest("trackId is required");

  const progress = Math.max(0, Math.min(1, Number(body.progress) || 0));
  const completed = Boolean(body.completed);

  const existing = await prisma.listen.findFirst({
    where: { userId: session.user.id, trackId: body.trackId },
  });

  if (existing) {
    await prisma.listen.update({
      where: { id: existing.id },
      data: {
        progress: Math.max(existing.progress, progress),
        completed: existing.completed || completed,
        listenedAt: new Date(),
      },
    });
  } else {
    await prisma.listen.create({
      data: { userId: session.user.id, trackId: body.trackId, progress, completed },
    });
  }

  return ok({ recorded: true });
}

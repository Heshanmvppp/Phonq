import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { fetchTracksByIds } from "@/lib/jamendo";

import { badRequest, notFound, ok, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";

async function getOwnedPlaylist(id: string, userId: string) {
  return prisma.playlist.findFirst({ where: { id, userId } });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const { id } = await params;
  const playlist = await getOwnedPlaylist(id, session.user.id);
  if (!playlist) return notFound("Playlist not found");

  const entries = await prisma.playlistTrack.findMany({
    where: { playlistId: id },
    orderBy: { position: "asc" },
    select: { trackId: true, position: true, addedAt: true },
  });

  const tracks = await fetchTracksByIds(entries.map((e) => e.trackId));

  const rows = entries.map((e) => ({
    position: e.position,
    addedAt: e.addedAt,
    track: tracks.find((t) => t.id === e.trackId) ?? null,
  }));

  return ok({ playlist: { ...playlist, tracks: rows } });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const { id } = await params;
  const playlist = await getOwnedPlaylist(id, session.user.id);
  if (!playlist) return notFound("Playlist not found");

  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    description?: string;
    isPublic?: boolean;
  };

  const name = body.name?.trim();
  if (name && name.length > 60) return badRequest("name must be 60 characters or fewer");

  const updated = await prisma.playlist.update({
    where: { id },
    data: {
      name: name ?? playlist.name,
      description: body.description !== undefined ? (body.description?.trim().slice(0, 300) ?? null) : playlist.description,
      isPublic: body.isPublic ?? playlist.isPublic,
    },
  });

  return ok({ playlist: updated });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const { id } = await params;
  const playlist = await getOwnedPlaylist(id, session.user.id);
  if (!playlist) return notFound("Playlist not found");

  await prisma.playlist.delete({ where: { id } });
  return ok({ deleted: true });
}

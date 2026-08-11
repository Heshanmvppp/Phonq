import type { Metadata } from "next";
import { Suspense } from "react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initials } from "@/lib/utils";

import { DangerZone } from "./danger-zone";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Settings",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const name = session.user.name ?? "Listener";
  const email = session.user.email ?? "No email on file";

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <SectionHeading align="left" eyebrow="Account" title="Settings" />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="transition-all hover:shadow-md p-6">
          <div className="flex items-center gap-4">
            <Avatar src={session.user.image ?? undefined} fallback={initials(name)} />
            <div>
              <p className="font-display text-lg font-semibold">{name}</p>
              <p className="text-sm text-muted-foreground">{email}</p>
              <Badge variant="outline" className="mt-1">
                Signed in with Google
              </Badge>
            </div>
          </div>
        </Card>

        <Suspense fallback={<StatsSkeleton />}>
          <StatsCard userId={session.user.id} />
        </Suspense>
      </div>

      <div className="mt-8 max-w-2xl">
        <DangerZone />
      </div>
    </div>
  );
}

async function StatsCard({ userId }: { userId: string }) {
  const [favorites, playlists, listens] = await Promise.all([
    prisma.favorite.count({ where: { userId } }),
    prisma.playlist.count({ where: { userId } }),
    prisma.listen.count({ where: { userId } }),
  ]);

  return (
    <Card className="p-6">
      <h2 className="font-display text-base font-semibold">Your data</h2>
      <dl className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div className="rounded-lg bg-muted/50 p-4">
          <dt className="text-xs text-muted-foreground">Favorites</dt>
          <dd className="mt-1 font-display text-xl font-bold text-primary">{favorites}</dd>
        </div>
        <div className="rounded-lg bg-muted/50 p-4">
          <dt className="text-xs text-muted-foreground">Playlists</dt>
          <dd className="mt-1 font-display text-xl font-bold text-primary">{playlists}</dd>
        </div>
        <div className="rounded-lg bg-muted/50 p-4">
          <dt className="text-xs text-muted-foreground">Listens</dt>
          <dd className="mt-1 font-display text-xl font-bold text-primary">{listens}</dd>
        </div>
      </dl>
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        Your data is stored in a Neon PostgreSQL database. It is never sold, shared or used for ads.
      </p>
    </Card>
  );
}

function StatsSkeleton() {
  return (
    <Card className="p-6">
      <Skeleton className="h-5 w-24" />
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg bg-muted/50 p-4">
            <Skeleton className="mx-auto h-3 w-12" />
            <Skeleton className="mx-auto mt-2 h-6 w-8" />
          </div>
        ))}
      </div>
    </Card>
  );
}
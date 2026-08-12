import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { PlayerBar } from "@/components/player/player-bar";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen">
      <AppSidebar />
      <div className="flex min-h-screen flex-col pl-16 md:pl-60">
        <AppHeader name={session.user.name} email={session.user.email} image={session.user.image} />
        <main className="flex-1 pb-40 md:pb-32">{children}</main>
      </div>
      <PlayerBar />
    </div>
  );
}

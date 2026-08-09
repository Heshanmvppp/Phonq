"use client";

import * as React from "react";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { LogOut, Settings, User } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

interface UserMenuProps {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export function UserMenu({ name, email, image }: UserMenuProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const displayName = name ?? session?.user?.name ?? "Account";
  const displayEmail = email ?? session?.user?.email ?? "";
  const displayImage = image ?? session?.user?.image ?? null;

  async function handleSignOut() {
    const { signOut } = await import("next-auth/react");
    await signOut({ callbackUrl: "/" });
  }

  return (
    <DropdownMenu
      trigger={
        <span className="flex cursor-pointer items-center gap-2 rounded-full p-1 transition-colors hover:bg-muted">
          <Avatar src={displayImage} alt={displayName} fallback={displayName.slice(0, 2).toUpperCase()} />
        </span>
      }
    >
      <DropdownMenuLabel>
        <p className="text-sm font-semibold normal-case tracking-normal text-foreground">{displayName}</p>
        <p className="mt-0.5 text-xs font-normal normal-case tracking-normal text-muted-foreground">{displayEmail}</p>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem icon={<Settings />} onClick={() => router.push("/app/settings")}>
        Settings
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem icon={<LogOut />} destructive onClick={() => void handleSignOut()}>
        Sign out
      </DropdownMenuItem>
    </DropdownMenu>
  );
}

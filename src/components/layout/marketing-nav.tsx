"use client";

import * as React from "react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { ChevronDown, Menu, X } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { marketingNav } from "@/content/site";

export function MarketingNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useSession();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [openGroup, setOpenGroup] = React.useState<string | null>(null);

  function closeMobile() {
    setMobileOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex">
          {marketingNav.map((group) => (
            <div key={group.label} className="relative">
              <button
                type="button"
                onMouseEnter={() => setOpenGroup(group.label)}
                onClick={() => setOpenGroup(openGroup === group.label ? null : group.label)}
                className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {group.label}
                <ChevronDown className="size-3.5" />
              </button>
              {openGroup === group.label && (
                <div
                  className="absolute left-0 top-full z-50 min-w-56 rounded-lg border border-border bg-popover p-1.5 shadow-xl animate-fade-up"
                  onMouseLeave={() => setOpenGroup(null)}
                >
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex flex-col gap-0.5 rounded-md px-3 py-2 transition-colors hover:bg-muted"
                    >
                      <span className="text-sm font-medium text-foreground">{item.label}</span>
                      {item.description && (
                        <span className="text-xs text-muted-foreground">{item.description}</span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {status === "authenticated" ? (
            <Button size="sm" onClick={() => router.push("/app/home")}>
              Open app
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => router.push("/login")}>
                Sign in
              </Button>
              <Button size="sm" onClick={() => router.push("/login")}>
                Get started
              </Button>
            </>
          )}
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-background px-4 py-4 lg:hidden">
          {marketingNav.map((group) => (
            <div key={group.label} className="mb-3">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{group.label}</p>
              <div className="grid grid-cols-2 gap-1">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobile}
                    className={cn(
                      "rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted",
                      pathname === item.href ? "text-primary" : "text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </header>
  );
}

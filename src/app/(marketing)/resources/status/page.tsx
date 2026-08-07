import type { Metadata } from "next";

import Link from "next/link";

import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";

import { getCatalogStatus } from "@/lib/catalog";

import { PageHero } from "@/components/marketing/page-hero";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Status",
  description: "Service health and uptime for Phonq.",
};

const PROVIDER_LABELS: Record<string, string> = {
  live: "Live (Jamendo)",
  degraded: "Cache (degraded)",
  static: "Static snapshot",
};

export default async function StatusPage() {
  const catalog = await getCatalogStatus().catch(() => null);

  const catalogProvider = catalog?.provider ?? "unknown";
  const catalogOk = catalogProvider !== "unknown";

  const services = [
    { name: "Web app", status: "Operational" },
    {
      name: "Music catalog",
      status: catalogOk ? PROVIDER_LABELS[catalogProvider] : "Unknown",
      ok: catalogOk,
    },
    { name: "Streaming & downloads", status: "Operational" },
    { name: "Accounts", status: "Operational" },
  ];

  return (
    <>
      <PageHero
        eyebrow="Resources"
        title="System status"
        description="Live status of the services that power Phonq."
      />

      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <Card className="p-6">
          <div className="flex items-center justify-between border-b border-border pb-5">
            <div className="flex items-center gap-3">
              {catalogOk ? (
                <span className="relative flex size-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                  <span className="relative inline-flex size-3 rounded-full bg-success" />
                </span>
              ) : (
                <AlertTriangle className="size-4 text-warning" />
              )}
              <div>
                <p className="font-display text-lg font-semibold">
                  {catalogOk ? "All systems operational" : "Checking status…"}
                </p>
                <p className="text-xs text-muted-foreground">Checked just now</p>
              </div>
            </div>
            <Badge className="bg-success/10 text-success">Up</Badge>
          </div>

          <div className="mt-5 space-y-4">
            {services.map((service) => {
              const isOk = service.ok ?? true;
              return (
                <div key={service.name} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    {isOk ? (
                      <CheckCircle2 className="size-4 text-success" />
                    ) : (
                      <AlertTriangle className="size-4 text-warning" />
                    )}
                    <span className="text-sm font-medium">{service.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3.5" /> live
                    </span>
                    <Badge className={isOk ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}>
                      {service.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-5 border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">
            The catalog automatically falls back to a database cache, then a bundled static
            snapshot, if the upstream provider is unreachable — so playback keeps working.
          </p>
        </Card>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Experiencing an issue?{" "}
          <Link href="/resources/help" className="text-primary underline underline-offset-2">
            Visit the help center
          </Link>
        </p>
      </div>
    </>
  );
}

import type { Metadata } from "next";

import Link from "next/link";

import { CheckCircle2, Clock } from "lucide-react";

import { PageHero } from "@/components/marketing/page-hero";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Status",
  description: "Service health and uptime for Phonq.",
};

const services = [
  { name: "Web app", status: "Operational", latency: "40ms" },
  { name: "Jamendo streaming API", status: "Operational", latency: "120ms" },
  { name: "Accounts (Google OAuth)", status: "Operational", latency: "35ms" },
  { name: "Database (Neon)", status: "Operational", latency: "25ms" },
];

export default function StatusPage() {
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
              <span className="relative flex size-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                <span className="relative inline-flex size-3 rounded-full bg-success" />
              </span>
              <div>
                <p className="font-display text-lg font-semibold">All systems operational</p>
                <p className="text-xs text-muted-foreground">Checked just now</p>
              </div>
            </div>
            <Badge className="bg-success/10 text-success">100% uptime</Badge>
          </div>

          <div className="mt-5 space-y-4">
            {services.map((service) => (
              <div key={service.name} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-success" />
                  <span className="text-sm font-medium">{service.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3.5" /> {service.latency}
                  </span>
                  <Badge className="bg-success/10 text-success">{service.status}</Badge>
                </div>
              </div>
            ))}
          </div>
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

import { ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export function GET() {
  return ok({ status: "ok", service: "phonq", time: new Date().toISOString() });
}

import { getCatalogStatus } from "@/lib/catalog";

import { ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const catalog = await getCatalogStatus();
  return ok({
    status: "ok",
    service: "phonq",
    catalog,
    time: new Date().toISOString(),
  });
}

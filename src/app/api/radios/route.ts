import { fetchRadios } from "@/lib/jamendo";

import { ok, serverError } from "@/lib/api";
import { checkRateLimit, ipKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!checkRateLimit(ipKey(request), 60, 60_000)) {
    return Response.json({ error: "Too many requests, slow down" }, { status: 429 });
  }

  try {
    const radios = await fetchRadios();
    return ok({ radios });
  } catch {
    return serverError("Failed to load radios from Jamendo.");
  }
}

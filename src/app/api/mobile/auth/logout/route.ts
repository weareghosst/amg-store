import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { destroyMobileSession, getMobileRequestIp } from "@/lib/auth/mobile-session";
import { mobileAuthHeaders, mobileAuthOptionsResponse } from "@/lib/mobile-api";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return mobileAuthOptionsResponse();
}

export async function POST(request: Request) {
  const user = await destroyMobileSession(request);
  if (user) {
    await audit({
      userId: user.id,
      action: "user.logout",
      detail: { source: "aplicativo" },
      ip: getMobileRequestIp(request),
    });
  }
  return NextResponse.json({ ok: true }, { headers: mobileAuthHeaders });
}

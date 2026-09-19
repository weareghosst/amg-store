import { NextResponse } from "next/server";
import { getMobileUser, toMobileUser } from "@/lib/auth/mobile-session";
import { mobileAuthHeaders, mobileAuthOptionsResponse } from "@/lib/mobile-api";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return mobileAuthOptionsResponse();
}

export async function GET(request: Request) {
  const user = await getMobileUser(request);
  if (!user) {
    return NextResponse.json(
      { error: "Sua sessão expirou. Entre novamente." },
      { status: 401, headers: mobileAuthHeaders },
    );
  }
  return NextResponse.json({ user: toMobileUser(user) }, { headers: mobileAuthHeaders });
}

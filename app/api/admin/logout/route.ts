import { NextResponse } from "next/server";

export async function GET() {
  const res = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  res.cookies.set("adm", "", { path: "/", maxAge: 0 });
  res.cookies.set("admin_auth", "", { path: "/", maxAge: 0 });
  return res;
}

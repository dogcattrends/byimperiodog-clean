import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  cookies().set("admin_auth", "", { httpOnly: true, expires: new Date(0), path: "/" });
  cookies().set("adm", "", { httpOnly: true, expires: new Date(0), path: "/" });
  cookies().set("admin_role", "", { httpOnly: true, expires: new Date(0), path: "/" });
  return NextResponse.json({ ok: true });
}

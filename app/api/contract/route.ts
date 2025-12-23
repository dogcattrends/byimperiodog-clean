import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const code = form.get("code");
  const payload = form.get("payload");

  /* eslint-disable @typescript-eslint/no-unused-vars, no-console, no-empty */
    console.log("[contract] code:", code, "payload:", payload ? JSON.parse(String(payload)) : null);
  // TODO: upload files to Supabase storage, persist record, trigger signature workflow

  return NextResponse.json({ ok: true });
}

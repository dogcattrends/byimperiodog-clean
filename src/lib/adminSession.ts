import { cookies } from "next/headers";

export function isJwtExpiredError(err: unknown): boolean {
 const message =
 err && typeof err === "object" && "message" in err
 ? String((err as any).message)
 : String(err ?? "");
 const low = message.toLowerCase();
 return (
 low.includes("jwt expired") ||
 low.includes("token is expired") ||
 low.includes("expired jwt") ||
 low.includes("invalid jwt")
 );
}

export function clearAdminSupabaseCookies() {
 const clear = (name: string) => cookies().set(name, "", { httpOnly: true, expires: new Date(0), path: "/" });
 clear("admin_sb_at");
 clear("admin_sb_rt");
}

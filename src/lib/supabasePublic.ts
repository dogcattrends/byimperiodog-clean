import { createSupabasePublicClient } from "./supabaseClient";

export function supabasePublic() {
 return createSupabasePublicClient();
}

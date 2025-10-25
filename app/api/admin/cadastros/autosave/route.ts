import { NextResponse } from "next/server";

import { respondWithError } from "@/lib/errors";
import { rateLimit } from "@/lib/limiter";
import { createLogger } from "@/lib/logger";
import { adminCadastroAutosaveSchema } from "@/lib/schemas/adminCadastros";
import { safeAction } from "@/lib/safeAction";

const logger = createLogger("api:admin:cadastros-autosave");

const execute = safeAction({
  schema: adminCadastroAutosaveSchema,
  handler: async (payload, { req }) => {
    await rateLimit(req, { identifier: "admin-cadastros-autosave", limit: 12, windowMs: 60_000 });
    return {
      received: payload,
      savedAt: new Date().toISOString(),
    };
  },
  logger,
});

export async function POST(req: Request) {
  try {
    const result = await execute(req);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    logger.warn("Falha no autosave de cadastro", { error: String(error) });
    return respondWithError(error);
  }
}

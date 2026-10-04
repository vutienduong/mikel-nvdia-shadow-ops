import { z } from "zod";
import { INPUT_SCHEMAS, OUTPUT_SCHEMAS, SKILL_IDS } from "../domain/contracts";
import type { SkillDefinition } from "../types";

// Metadata shares the executor's runtime contracts; server prompts use the same schemas.
export const SKILL_REGISTRY: Record<string, SkillDefinition> =
  Object.fromEntries(
    SKILL_IDS.map((id) => [
      id,
      {
        id,
        name: id.replaceAll("_", " "),
        description: `Controlled mock operation: ${id.replaceAll("_", " ")}`,
        riskLevel: ["refund_payment", "request_manager_approval"].includes(id)
          ? "medium"
          : "low",
        inputSchema: z.toJSONSchema(INPUT_SCHEMAS[id]),
        outputSchema: z.toJSONSchema(OUTPUT_SCHEMAS[id]),
      } satisfies SkillDefinition,
    ]),
  );

import { completion } from "@qvac/sdk";
import { z } from "zod";
import { requestApproval, type ProposedAction } from "../lib/approval.js";
import { errorMessage, recordEvidence } from "../lib/evidence.js";
import { loadCourseModel, shutdownModel } from "../lib/llm.js";
import { executeAction } from "../lib/tools.js";

const actionSchema = z.object({
  tool: z.literal("save_note"),
  risk: z.literal("write"),
  arguments: z.object({ title: z.string().min(1).max(80), body: z.string().min(1).max(4_000) }),
});
let modelId: string | undefined;

try {
  modelId = await loadCourseModel();
  const run = completion({
    modelId,
    stream: true,
    history: [
      { role: "system", content: "Plan exactly one save_note action. Never execute it. Return only JSON matching the schema." },
      { role: "user", content: "Save a note titled Launch decision saying the mobile privacy audit must finish before launch." },
    ],
    responseFormat: {
      type: "json_schema",
      json_schema: {
        name: "proposed_action",
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["tool", "risk", "arguments"],
          properties: {
            tool: { const: "save_note" },
            risk: { const: "write" },
            arguments: {
              type: "object",
              additionalProperties: false,
              required: ["title", "body"],
              properties: { title: { type: "string" }, body: { type: "string" } },
            },
          },
        },
      },
    },
  });
  for await (const event of run.events) if (event.type === "contentDelta") process.stdout.write(event.text);
  const final = await run.final;
  console.log("\n");
  const action: ProposedAction = actionSchema.parse(JSON.parse(final.contentText));
  await recordEvidence(6, "action-proposed", "verified", { action });
  if (!(await requestApproval(action))) {
    await recordEvidence(6, "action-denied", "verified", { action });
    console.log("DENIED: no file was written. Interactive approval is required.");
  } else {
    const path = await executeAction(action);
    await recordEvidence(6, "action-executed", "verified", { action, path });
    console.log(`EXECUTED: ${path}`);
  }
} catch (error) {
  await recordEvidence(6, "run-failed", "verified", { error: errorMessage(error) });
  throw error;
} finally {
  await shutdownModel(modelId);
}

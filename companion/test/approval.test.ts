import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { requiresApproval, type ProposedAction } from "../src/lib/approval.js";
import { executeAction, safeFilename, saveNoteArguments } from "../src/lib/tools.js";

const action: ProposedAction = {
  tool: "save_note",
  risk: "write",
  arguments: { title: "Launch notes", body: "Private draft" },
};

test("writes require approval", () => assert.equal(requiresApproval(action), true));
test("read-only work does not require approval", () =>
  assert.equal(requiresApproval({ ...action, risk: "read" }), false));
test("unsafe-looking titles become inert filenames", () =>
  assert.equal(safeFilename("../../Launch Notes"), "launch-notes.md"));
test("empty tool bodies fail validation", () =>
  assert.equal(saveNoteArguments.safeParse({ title: "x", body: "" }).success, false));

test("an approved action writes once and cannot overwrite", async () => {
  const directory = await mkdtemp(join(tmpdir(), "bring-ai-home-tool-"));
  try {
    const path = await executeAction(action, directory);
    assert.match(await readFile(path, "utf8"), /Private draft/);
    await assert.rejects(() => executeAction(action, directory), /EEXIST/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

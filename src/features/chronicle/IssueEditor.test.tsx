import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { sampleArchive } from "./archive";
import type { RequestDraft } from "./caption-client";
import { parseDraftResponse } from "./caption-client";
import { IssueEditor } from "./IssueEditor";

afterEach(cleanup);

// Fixture drafter. The text is written by hand, not produced by a model.
const fixtureDraft: RequestDraft = async (memory) => ({
  ok: true,
  memoryId: memory.id,
  draft: "Fixture draft about the beach.",
  model: "fixture",
});

describe("issue editor", () => {
  it("blocks publishing until the draft is resolved, then saves the edited text", async () => {
    const user = userEvent.setup();
    render(<IssueEditor initialMemories={sampleArchive} requestDraft={fixtureDraft} now={() => "t"} />);

    await user.click(screen.getAllByRole("checkbox")[1]); // Picnic at Gull Point (1998)
    await user.click(screen.getByRole("button", { name: "Draft caption for Picnic at Gull Point" }));
    await user.click(screen.getByRole("button", { name: "Publish issue" }));
    expect(screen.getByRole("status")).toHaveTextContent("Accept or reject every caption draft");

    const box = screen.getByRole("textbox", { name: "Edit draft for Picnic at Gull Point" });
    await user.clear(box);
    await user.type(box, "Oranges and a stubborn kite.");
    await user.click(screen.getByRole("button", { name: "Accept caption" }));
    await user.click(screen.getByRole("button", { name: "Publish issue" }));

    const issue = screen.getByRole("article", { name: "Published issue" });
    expect(issue).toHaveTextContent("Picnic at Gull Point: Oranges and a stubborn kite.");
    expect(screen.getByRole("list", { name: "Caption history" })).toHaveTextContent(
      "Red blanket, oranges, and a kite that never flew.",
    );
  });

  it("keeps manual work possible when the service is down", async () => {
    const user = userEvent.setup();
    const down: RequestDraft = async () => ({ ok: false, error: "The local QVAC service is not running" });
    render(<IssueEditor initialMemories={sampleArchive} requestDraft={down} />);

    await user.click(screen.getByRole("button", { name: "Draft caption for Nine candles" }));
    expect(screen.getByRole("status")).toHaveTextContent("You can still edit captions by hand");
    await user.click(screen.getAllByRole("checkbox")[0]);
    await user.click(screen.getByRole("button", { name: "Publish issue" }));
    expect(screen.getByRole("article", { name: "Published issue" })).toHaveTextContent("First tomatoes");
  });

  it("rejects a response for a different memory", () => {
    expect(parseDraftResponse("a", 200, { memoryId: "b", draft: "x", model: "m" }).ok).toBe(false);
  });
});

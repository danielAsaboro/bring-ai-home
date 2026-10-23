import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import type { AssistClient } from "./assist-client";
import { DeckApp } from "./DeckApp";
import { createMemoryStore } from "./storage";

// FIXTURE embedder: the claim and "Price point" share a direction. Not model output.
const client = {
  embed: async (texts: string[]) => ({ model: "fixture", vectors: texts.map((t) => (/cost|Price point/.test(t) ? [1, 0] : [0, 1])) }),
} as unknown as AssistClient;

describe("EvidencePanel", () => {
  it("reuses a matching evidence card from another deck only on request", async () => {
    const user = userEvent.setup();
    const store = createMemoryStore();
    render(<DeckApp store={store} client={client} />);
    await user.click(screen.getByRole("button", { name: "Riverside library hours" }));
    await user.click(screen.getByRole("button", { name: /^claim.*Two late nights cost little$/ }));
    await user.click(screen.getByRole("button", { name: "Find evidence cards" }));
    expect(screen.getByText("from Lumen Kettle launch · similarity 1.00")).toBeInTheDocument();
    expect(store.load().decks[1].cards).toHaveLength(3);

    await user.click(screen.getByRole("button", { name: "Reuse Price point" }));
    const reused = store.load().decks[1].cards.at(-1);
    expect(reused).toMatchObject({ kind: "evidence", title: "Price point", roundId: "r-cost" });
    expect(reused?.id).not.toBe("c-6");
  });
});

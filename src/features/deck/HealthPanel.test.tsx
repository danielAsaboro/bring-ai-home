import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import type { AssistClient } from "./assist-client";
import { DeckApp } from "./DeckApp";
import { createMemoryStore } from "./storage";

// FIXTURE embedder: the two cards about rushed mornings share one direction and
// every other card gets its own axis. Not model output.
const client = {
  embed: async (texts: string[]) => ({
    model: "fixture",
    vectors: texts.map((t, i) => Array.from({ length: texts.length + 1 }, (_, axis) => (axis === (/rush/i.test(t) ? 0 : i + 1) ? 1 : 0))),
  }),
} as unknown as AssistClient;

describe("HealthPanel", () => {
  it("flags a duplicate beat and discards only when asked", async () => {
    const user = userEvent.setup();
    const store = createMemoryStore();
    render(<DeckApp store={store} client={client} />);
    const problem = screen.getByRole("region", { name: "Round: The problem" });
    await user.type(problem.querySelector("input")!, "Rushed mornings again");
    await user.click(screen.getAllByRole("button", { name: "Add" })[0]);
    await user.click(screen.getByRole("button", { name: "Check for duplicate beats" }));
    expect(screen.getByText(/“Mornings are rushed” and “Rushed mornings again” make the same point/)).toBeInTheDocument();
    expect(store.load().decks[0].cards).toHaveLength(9);
    await user.click(screen.getByRole("button", { name: "Discard the later card" }));
    expect(store.load().decks[0].cards.map((c) => c.title)).not.toContain("Rushed mornings again");
    expect(screen.getByText("No flags.")).toBeInTheDocument();
  });
});

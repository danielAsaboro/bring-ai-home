import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import type { AssistClient } from "./assist-client";
import { DeckApp } from "./DeckApp";
import { createMemoryStore } from "./storage";

// FIXTURE critique, already validated. Not live output.
const client = {
  critique: async () => ({
    model: "fixture",
    adapter: true,
    dropped: 1,
    findings: [{ rubricId: "specific-ask", cardId: "c-8", note: "Name the week and the store count." }],
  }),
} as unknown as AssistClient;

describe("CritiquePanel", () => {
  it("shows labelled findings and never edits the deck", async () => {
    const user = userEvent.setup();
    const store = createMemoryStore();
    const before = JSON.stringify(store.load());
    render(<DeckApp store={store} client={client} />);
    await user.click(screen.getByRole("button", { name: "Critique this deck" }));
    expect(screen.getByText("The ask names who does what by when · What we need from you")).toBeInTheDocument();
    expect(screen.getByText(/house-rubric adapter applied · 1 finding\(s\) removed/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByText("Name the week and the store count.")).not.toBeInTheDocument();
    expect(JSON.stringify(store.load())).toBe(before);
  });
});

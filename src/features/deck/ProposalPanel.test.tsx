import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import type { AssistClient } from "./assist-client";
import { DeckApp } from "./DeckApp";
import { createMemoryStore } from "./storage";

// FIXTURE client: returns a hand-written, already-validated result. Not live output.
const client = {
  retrieve: async () => ({ query: "", model: "fixture", passages: [] }),
  propose: async () => ({
    model: "fixture",
    passages: [],
    proposals: [
      {
        id: "proposal-0",
        title: "Kettles boil alone",
        body: "In 9 of 12 homes nobody watched the kettle.",
        citations: [{ id: "diary-study-notes#unattended-boiling", noteTitle: "Kitchen diary study notes", section: "Unattended boiling", text: "In 9 of 12 homes the kettle boiled while nobody was in the kitchen." }],
      },
    ],
    dropped: [{ title: "Customers love it", reason: "cites no retrieved note section" }],
  }),
} as unknown as AssistClient;

describe("ProposalPanel", () => {
  it("adds a proposed card only after Accept, with its source", async () => {
    const user = userEvent.setup();
    const store = createMemoryStore();
    render(<DeckApp store={store} client={client} />);
    await user.type(screen.getByLabelText("Card topic"), "why now");
    await user.click(screen.getByRole("button", { name: "Propose cards" }));
    expect(screen.getByText("1 proposal(s) removed by the app")).toBeInTheDocument();
    expect(store.load().decks[0].cards).toHaveLength(8);

    await user.click(screen.getByRole("button", { name: "Accept Kettles boil alone" }));
    const added = store.load().decks[0].cards.at(-1);
    expect(added).toMatchObject({ kind: "claim", title: "Kettles boil alone", source: "Kitchen diary study notes · Unattended boiling", roundId: "r-problem" });
    expect(screen.queryByRole("button", { name: "Accept Kettles boil alone" })).not.toBeInTheDocument();
  });
});

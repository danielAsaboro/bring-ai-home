import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { DeckApp } from "./DeckApp";
import { createLocalStore, createMemoryStore } from "./storage";

describe("DeckApp", () => {
  it("builds, reorders, and plays a deck by hand", async () => {
    const user = userEvent.setup();
    const store = createMemoryStore();
    render(<DeckApp store={store} />);

    expect(screen.getByRole("heading", { name: "Lumen Kettle launch" })).toBeInTheDocument();
    const ask = screen.getByRole("region", { name: "Round: The ask" });
    await user.type(within(ask).getByPlaceholderText("New card"), "Pilot results date");
    await user.click(within(ask).getByRole("button", { name: "Add" }));
    expect(store.load().decks[0].cards.at(-1)?.title).toBe("Pilot results date");

    await user.click(screen.getByRole("button", { name: "Move The ask earlier" }));
    expect(store.load().decks[0].rounds.map((r) => r.id)).toEqual(["r-problem", "r-ask", "r-product"]);

    await user.click(screen.getByRole("button", { name: "Play the match" }));
    const match = screen.getByRole("region", { name: "Presentation" });
    expect(within(match).getByText("card 1 of 9", { exact: false })).toBeInTheDocument();
    await user.click(within(match).getByRole("button", { name: "Next" }));
    await user.click(within(match).getByRole("button", { name: "Next" }));
    expect(within(match).getByRole("heading", { name: "Launch in 40 stores" })).toBeInTheDocument();
    await user.click(within(match).getByRole("button", { name: "Leave the match" }));
    expect(screen.getByRole("region", { name: "Pacing" })).toBeInTheDocument();
  });

  it("edits a card and resets demo data", async () => {
    const user = userEvent.setup();
    const store = createMemoryStore();
    render(<DeckApp store={store} />);
    await user.click(screen.getByRole("button", { name: /^claim.*Mornings are rushed$/ }));
    const editor = screen.getByRole("form", { name: "Edit card" });
    const title = within(editor).getByLabelText("Title");
    await user.clear(title);
    await user.type(title, "Mornings are chaos");
    await user.click(within(editor).getByRole("button", { name: "Save card" }));
    expect(store.load().decks[0].cards[0].title).toBe("Mornings are chaos");
    await user.click(screen.getByRole("button", { name: "Reset demo data" }));
    expect(store.load().decks[0].cards[0].title).toBe("Mornings are rushed");
  });

  it("falls back to the sample library when storage is corrupt", () => {
    const broken = { getItem: () => "{not json", setItem: () => undefined, removeItem: () => undefined } as unknown as Storage;
    expect(createLocalStore(broken).load().decks).toHaveLength(2);
  });
});

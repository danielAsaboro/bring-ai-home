import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ClosetApp } from "./ClosetApp";

beforeEach(() => window.localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe("outfit proposals", () => {
  it("packs only what the person keeps from a validated proposal", async () => {
    let sent: { maxItems: number; candidates: { id: string }[] } | undefined;
    // Fixture reply, hand-written: includes a worn garment the app must refuse.
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        sent = JSON.parse(String(init.body));
        const raw = JSON.stringify({ garmentIds: ["navy-blazer", "grey-tee", "brown-boots"], reason: "Evening layers." });
        return new Response(JSON.stringify({ raw, model: "LLAMA_3_2_1B_INST_Q4_0" }));
      }),
    );
    const user = userEvent.setup();
    render(<ClosetApp />);
    await user.click(screen.getByRole("tab", { name: "Packing" }));
    await user.type(screen.getByLabelText("Occasion to pack for"), "dinner in Lisbon");
    await user.click(screen.getByRole("button", { name: "Propose outfit" }));

    expect(sent?.maxItems).toBe(4);
    expect(sent?.candidates.map((c) => c.id)).not.toContain("grey-tee");
    const card = await screen.findByRole("group", { name: "Proposed outfit" });
    expect(card).toHaveTextContent("Left out Grey tee: not a clean, unpacked garment you own.");
    await user.click(within(card).getByLabelText("Brown boots"));
    await user.click(within(card).getByRole("button", { name: "Pack selected" }));

    const carousel = screen.getByRole("list", { name: "Packing carousel" });
    expect(within(carousel).getByRole("button", { name: "Unpack Navy blazer" })).toBeInTheDocument();
    expect(within(carousel).queryByRole("button", { name: "Unpack Brown boots" })).not.toBeInTheDocument();
  });

  it("leaves manual packing open when the service is down", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("fetch failed"))));
    const user = userEvent.setup();
    render(<ClosetApp />);
    await user.click(screen.getByRole("tab", { name: "Packing" }));
    await user.type(screen.getByLabelText("Occasion to pack for"), "beach");
    await user.click(screen.getByRole("button", { name: "Propose outfit" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Pack by hand below.");
    expect(screen.getByRole("button", { name: "Pack Red scarf" })).toBeEnabled();
  });
});

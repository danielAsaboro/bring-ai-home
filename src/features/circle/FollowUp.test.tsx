import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { createDemoState } from "./fixtures";
import { FollowUp } from "./FollowUp";

describe("FollowUp", () => {
  it("shows an editable draft and offers no send button", async () => {
    const user = userEvent.setup();
    const state = createDemoState();
    const dev = state.people.find((p) => p.id === "dev-raman")!;
    // FIXTURE draft, not live model output.
    const draftFollowUp = vi.fn(async () => ({ status: "draft" as const, model: "FIXTURE", text: "Good luck, Dev!", basedOn: ["t5", "r1"] }));
    render(<FollowUp person={dev} state={state} client={{ draftFollowUp }} />);
    await user.click(screen.getByText("Draft a follow-up (optional)"));
    await user.type(screen.getByLabelText("What do you want to say?"), "good luck");
    await user.click(screen.getByRole("button", { name: "Draft" }));
    const box = await screen.findByLabelText(/Draft, not sent \(FIXTURE, from 2 saved notes\)/);
    expect(box).toHaveValue("Good luck, Dev!");
    expect(screen.queryByRole("button", { name: /send/i })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Discard" }));
    expect(screen.queryByLabelText(/Draft, not sent/)).toBeNull();
  });
});

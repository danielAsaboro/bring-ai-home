import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { createDemoState } from "./fixtures";
import { RecapPanel } from "./RecapPanel";
import type { CircleState } from "./types";

// FIXTURE client: returns hand-written proposals. No model runs in this test.
const fixtureClient = {
  transcribe: vi.fn(),
  extract: vi.fn(async () => ({
    status: "proposed" as const,
    model: "FIXTURE",
    proposals: [
      { id: "p0", type: "promise" as const, personId: "dev-raman", personName: "Dev Raman", text: "Send slide template", evidence: "send him my slide template", date: "2026-10-24" },
      { id: "p1", type: "memory" as const, personId: "dev-raman", personName: "Dev Raman", text: "Nervous about the meetup", evidence: "nervous about the meetup" },
    ],
    rejected: [{ item: {}, reason: "unknown person" }],
  })),
};

describe("RecapPanel", () => {
  it("saves nothing until a person ticks and confirms", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<(s: CircleState) => void>();
    render(<RecapPanel state={createDemoState()} onChange={onChange} client={fixtureClient} today="2026-10-23" />);
    await user.type(screen.getByLabelText("Recap transcript"), "Coffee with Dev");
    await user.click(screen.getByRole("button", { name: "Find proposals" }));
    expect(await screen.findByText("Proposals from FIXTURE")).toBeInTheDocument();
    expect(screen.getByText("1 set aside by the app")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save 0 confirmed" })).toBeDisabled();
    expect(onChange).not.toHaveBeenCalled();

    await user.click(screen.getByLabelText("Keep promise for Dev Raman"));
    const edit = screen.getByLabelText("Edit promise for Dev Raman");
    await user.clear(edit);
    await user.type(edit, "Send the slide template");
    await user.click(screen.getByRole("button", { name: "Save 1 confirmed" }));

    const saved = onChange.mock.calls[0][0];
    const dev = saved.people.find((p) => p.id === "dev-raman")!;
    expect(saved.reminders.map((r) => r.text)).toContain("Promised: Send the slide template");
    expect(dev.timeline.some((t) => t.text.includes("Nervous"))).toBe(false);
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { BeforeWeMeet } from "./BeforeWeMeet";
import { createDemoState } from "./fixtures";
import { ServiceError } from "./service-client";

describe("BeforeWeMeet", () => {
  const state = createDemoState();
  const dev = state.people.find((p) => p.id === "dev-raman")!;

  it("shows open promises and fixture-ranked context", async () => {
    const user = userEvent.setup();
    // FIXTURE retrieval result, not GTE output.
    const retrieve = vi.fn(async () => ({
      model: "FIXTURE",
      matches: [{ id: "t5", text: "2026-10-10 interaction: Coffee.", score: 0.71 }],
    }));
    render(<BeforeWeMeet person={dev} state={state} client={{ retrieve }} />);
    expect(screen.getByText(/Still open: Ask how the meetup talk went/)).toBeInTheDocument();
    await user.type(screen.getByLabelText("What is the meeting about?"), "his talk");
    await user.click(screen.getByRole("button", { name: "Gather context" }));
    expect(await screen.findByText(/0.71 · FIXTURE/)).toBeInTheDocument();
    expect(retrieve).toHaveBeenCalledWith("his talk", expect.arrayContaining([expect.objectContaining({ id: "r1" })]));
  });

  it("says so when the local service is off", async () => {
    const user = userEvent.setup();
    const retrieve = vi.fn(async () => {
      throw new ServiceError("The local AI service is not running", "unreachable");
    });
    render(<BeforeWeMeet person={dev} state={state} client={{ retrieve }} />);
    await user.type(screen.getByLabelText("What is the meeting about?"), "talk");
    await user.click(screen.getByRole("button", { name: "Gather context" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("not running");
  });
});

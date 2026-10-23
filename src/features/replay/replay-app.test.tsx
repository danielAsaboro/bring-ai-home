import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { sampleState, type LibraryStore } from "./library-store";
import { ReplayApp } from "./replay-app";

function memoryStore(): LibraryStore {
  let state = sampleState();
  return {
    load: () => state,
    save: (s) => {
      state = s;
    },
    reset: () => (state = sampleState()),
  };
}

describe("ReplayApp", () => {
  it("authors a frame, plays a guided run, and records it in history", async () => {
    const user = userEvent.setup();
    render(<ReplayApp store={memoryStore()} />);

    await user.click(screen.getByRole("button", { name: /Onboard a new contractor/ }));
    await user.type(screen.getByLabelText("New frame title"), "Book the intro call");
    await user.click(screen.getByRole("button", { name: "Add frame" }));
    expect(screen.getByDisplayValue("Book the intro call")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "play" }));
    const frames = screen.getByRole("list", { name: "Tape frames" });
    expect(within(frames).getAllByRole("listitem")).toHaveLength(4);
    expect(within(frames).getByText("01")).toHaveAttribute("aria-current", "step");

    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(within(frames).getByText("02")).toHaveAttribute("aria-current", "step");
    await user.click(screen.getByRole("button", { name: "Mark failed" }));
    await user.type(screen.getByLabelText("Frame note"), "Channel was archived");
    await user.click(screen.getByRole("button", { name: "Save note" }));
    await user.click(screen.getByRole("button", { name: "Retry" }));
    await user.click(screen.getByRole("button", { name: "Done" }));
    await user.click(screen.getByRole("button", { name: "Skip" }));
    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.getByRole("status")).toHaveTextContent("Run finished. 3 done, 1 skipped, 0 failed.");

    await user.click(screen.getByRole("tab", { name: "history" }));
    const history = screen.getByRole("list", { name: "Run history" });
    expect(history).toHaveTextContent("Channel was archived");
  });
});

import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

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

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

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

  it("finds a tape by meaning, and falls back to words when the service is down", async () => {
    const user = userEvent.setup();
    // FIXTURE service answer, not live embeddings.
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ model: "GTE_LARGE_FP16", matches: [{ tapeId: "tape-checkout-bug", score: 0.81 }] })));
    render(<ReplayApp store={memoryStore()} />);
    const shelf = screen.getByRole("navigation", { name: "Tape shelf" });
    await user.type(screen.getByLabelText("Describe the job"), "cart total is a cent off");
    await user.click(screen.getByRole("button", { name: "Find tape" }));
    expect(await within(shelf).findByText(/Closest tapes by meaning/)).toBeInTheDocument();
    expect(within(shelf).getAllByRole("button", { pressed: false }).map((b) => b.textContent)).toEqual([
      expect.stringContaining("Reproduce the checkout rounding bug"),
    ]);

    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("fetch failed"))));
    await user.clear(screen.getByLabelText("Describe the job"));
    await user.type(screen.getByLabelText("Describe the job"), "weekly");
    await user.click(screen.getByRole("button", { name: "Find tape" }));
    expect(await within(shelf).findByText(/Showing word matches instead/)).toBeInTheDocument();
  });

  it("exports the selected tape as SKILL.md without calling any service", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    URL.createObjectURL = vi.fn(() => "blob:skill");
    URL.revokeObjectURL = vi.fn();
    const user = userEvent.setup();
    render(<ReplayApp store={memoryStore()} />);
    await user.click(screen.getByRole("button", { name: "Export as agent skill" }));
    expect(screen.getByLabelText("Skill preview")).toHaveTextContent("name: publish-the-weekly-report");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Home from "./page";

describe("Lookout control room", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  it("introduces Lookout and starts disarmed", async () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1, name: "Lookout" })).toBeInTheDocument();
    expect(await screen.findByText(/No events/)).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Armed state" })).toHaveTextContent("DISARMED");
  });

  it("arms a source, replays frames onto the tape, and acknowledges an event", async () => {
    const user = userEvent.setup();
    render(<Home />);
    await screen.findByText(/No events/);

    await user.click(screen.getByRole("button", { name: "Arm Front gate" }));
    expect(screen.getByRole("status", { name: "Armed state" })).toHaveTextContent("ARMED · 1 of 3");

    await user.click(screen.getByRole("button", { name: "Replay stored frames" }));
    const tape = screen.getByRole("list", { name: "Events" });
    expect(within(tape).getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByText("3 to review")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Acknowledge Front gate 10:44" }));
    expect(screen.getByText("2 to review")).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem("lookout:v1")!).tape[1].acknowledged).toBe(true);
  });

  it("shows a proposed watcher and activates it only after a person accepts", async () => {
    // Fixture service reply, not live model output.
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          proposal: { sourceId: "front-gate", condition: "a parcel left by the gate", fromHour: 0, toHour: 0, minMotion: 0 },
          raw: "{}",
          model: "fixture-proposer",
        }),
      ),
    );
    const user = userEvent.setup();
    render(<Home />);
    await screen.findByText(/No events/);
    await user.type(screen.getByLabelText("Describe a watcher"), "tell me when a parcel is left by the gate");
    await user.click(screen.getByRole("button", { name: "Propose watcher" }));

    const proposed = await screen.findByRole("group", { name: "Proposed watcher" });
    expect(within(proposed).getByText("a parcel left by the gate")).toBeInTheDocument();
    expect(within(screen.getByRole("list", { name: "Active watchers" })).queryAllByRole("listitem")).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: "Accept watcher" }));
    expect(within(screen.getByRole("list", { name: "Active watchers" })).getAllByRole("listitem")).toHaveLength(1);
  });

  it("explains when the service is not running", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("fetch failed"); }));
    const user = userEvent.setup();
    render(<Home />);
    await screen.findByText(/No events/);
    await user.type(screen.getByLabelText("Describe a watcher"), "parcel at the gate");
    await user.click(screen.getByRole("button", { name: "Propose watcher" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("The local QVAC service is not running");
  });
});

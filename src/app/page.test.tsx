import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import Home from "./page";

describe("Lookout control room", () => {
  beforeEach(() => window.localStorage.clear());

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
});

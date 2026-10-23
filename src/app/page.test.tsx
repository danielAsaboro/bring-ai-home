import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Homebook } from "@/features/homebook/Homebook";
import { memoryStore } from "@/features/homebook/test-store";

describe("Homebook binder", () => {
  it("opens on the asset register with the water heater plate", () => {
    render(<Homebook store={memoryStore()} today="2026-10-23" />);
    expect(screen.getByRole("heading", { level: 1, name: "Homebook" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Water heater" })).toBeInTheDocument();
    expect(screen.getByText("AT50-2291-0457")).toBeInTheDocument();
  });

  it("registers a new asset in a room and saves it", async () => {
    const store = memoryStore();
    render(<Homebook store={store} today="2026-10-23" />);
    const form = screen.getByRole("form", { name: "Register an asset" });
    await userEvent.type(within(form).getByLabelText("Asset name"), "Extractor fan");
    await userEvent.selectOptions(within(form).getByLabelText("Room"), "kitchen");
    await userEvent.click(within(form).getByRole("button", { name: "Register" }));
    expect(screen.getByRole("heading", { name: "Extractor fan" })).toBeInTheDocument();
    expect(store.saved.at(-1)?.assets.some((a) => a.name === "Extractor fan")).toBe(true);
  });

  it("stamps a maintenance task into the service history", async () => {
    render(<Homebook store={memoryStore()} today="2026-10-23" />);
    await userEvent.click(screen.getByRole("button", { name: "Stamp done: Flush sediment from the tank" }));
    const history = screen.getByRole("list", { name: "Service history" });
    expect(within(history).getByText("2026-10-23")).toBeInTheDocument();
    expect(screen.getByText(/due 2027-10-23/)).toBeInTheDocument();
  });

  it("filters the register by room tab", async () => {
    render(<Homebook store={memoryStore()} today="2026-10-23" />);
    await userEvent.click(screen.getByRole("button", { name: "Kitchen" }));
    const register = screen.getByRole("region", { name: "Asset register" });
    expect(within(register).queryByText("Water heater")).not.toBeInTheDocument();
    expect(within(register).getByText("Dishwasher")).toBeInTheDocument();
  });
});

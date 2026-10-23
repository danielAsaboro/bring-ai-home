import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { STORAGE_KEY } from "@/features/circle/storage";

import Home from "./page";

describe("Circle home", () => {
  beforeEach(() => window.localStorage.clear());

  it("introduces Circle and opens the A tab", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1, name: "Circle" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "A" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("heading", { level: 2, name: "Amara Okafor" })).toBeInTheDocument();
  });

  it("logs a memory and keeps it in localStorage", async () => {
    const user = userEvent.setup();
    render(<Home />);
    await user.click(screen.getByRole("tab", { name: "D" }));
    const card = screen.getByRole("article", { name: "Dev Raman card" });
    await user.selectOptions(within(card).getByLabelText("Entry kind"), "memory");
    await user.type(within(card).getByLabelText("What happened"), "Prefers tea after six.");
    await user.click(within(card).getByRole("button", { name: "Save to timeline" }));
    expect(within(card).getByText("Prefers tea after six.")).toBeInTheDocument();
    expect(window.localStorage.getItem(STORAGE_KEY)).toContain("Prefers tea after six.");
  });

  it("completes a gentle reminder", async () => {
    const user = userEvent.setup();
    render(<Home />);
    await user.click(screen.getByRole("button", { name: "Done: Ask how the meetup talk went" }));
    expect(screen.getByText("Nothing waiting.")).toBeInTheDocument();
  });
});

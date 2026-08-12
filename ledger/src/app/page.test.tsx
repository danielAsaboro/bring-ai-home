import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("Ledger home", () => {
  it("introduces Ledger by name", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Ledger" }),
    ).toBeInTheDocument();
  });
});

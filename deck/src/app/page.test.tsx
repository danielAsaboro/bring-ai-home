import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("Deck home", () => {
  it("introduces Deck by name", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Deck" }),
    ).toBeInTheDocument();
  });
});


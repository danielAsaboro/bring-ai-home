import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import Home from "./page";

describe("Deck home", () => {
  beforeEach(() => localStorage.clear());

  it("opens the sample deck", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1, name: "Deck" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Lumen Kettle launch" })).toBeInTheDocument();
  });
});

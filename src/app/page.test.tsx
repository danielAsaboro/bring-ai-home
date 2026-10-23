import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("Replay home", () => {
  it("introduces Replay by name and shows the shelf", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { level: 1, name: "Replay" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Tape shelf" })).toBeInTheDocument();
  });
});

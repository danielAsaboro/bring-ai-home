import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("Closet home", () => {
  it("introduces Closet by name", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Closet" }),
    ).toBeInTheDocument();
  });
});

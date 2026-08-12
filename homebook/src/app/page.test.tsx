import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("Homebook home", () => {
  it("introduces Homebook by name", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Homebook" }),
    ).toBeInTheDocument();
  });
});


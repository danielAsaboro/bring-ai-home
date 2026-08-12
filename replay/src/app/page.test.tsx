import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("Replay home", () => {
  it("introduces Replay by name", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Replay" }),
    ).toBeInTheDocument();
  });
});

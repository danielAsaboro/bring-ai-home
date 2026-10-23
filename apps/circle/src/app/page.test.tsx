import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("Circle home", () => {
  it("introduces Circle by name", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Circle" }),
    ).toBeInTheDocument();
  });
});

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import Home from "./page";

afterEach(cleanup);

describe("Chronicle home", () => {
  it("introduces Chronicle by name", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Chronicle" }),
    ).toBeInTheDocument();
  });

  it("lists the six sample memories", () => {
    render(<Home />);

    const archive = screen.getByRole("list", { name: "Archive" });
    expect(archive.querySelectorAll("li")).toHaveLength(6);
  });
});

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import Home from "./page";

describe("Closet home", () => {
  beforeEach(() => window.localStorage.clear());

  it("opens on the outfit feed", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1, name: "Closet" })).toBeInTheDocument();
    const posts = screen.getByRole("list", { name: "Outfit posts" });
    expect(within(posts).getByText("Gallery opening")).toBeInTheDocument();
  });

  it("moves a garment to the wash and remembers it", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Home />);
    await user.click(screen.getByRole("tab", { name: "Garments" }));
    await user.click(screen.getByRole("button", { name: "Mark Grey tee washing" }));
    unmount();
    render(<Home />);
    await user.click(screen.getByRole("tab", { name: "Garments" }));
    expect(screen.getByRole("button", { name: "Mark Grey tee clean" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mark Grey tee washing" })).not.toBeInTheDocument();
  });

  it("assembles a look and posts it to the feed", async () => {
    const user = userEvent.setup();
    render(<Home />);
    await user.click(screen.getByRole("tab", { name: "Assemble" }));
    await user.type(screen.getByLabelText("Look title"), "Studio day");
    await user.click(screen.getByLabelText("Grey tee"));
    await user.click(screen.getByLabelText("Olive chinos"));
    await user.click(screen.getByRole("button", { name: "Post look" }));
    expect(within(screen.getByRole("list", { name: "Outfit posts" })).getByText("Studio day")).toBeInTheDocument();
  });

  it("shows why a garment cannot be packed", async () => {
    const user = userEvent.setup();
    render(<Home />);
    await user.click(screen.getByRole("tab", { name: "Packing" }));
    await user.click(screen.getByRole("button", { name: "Pack Red scarf" }));
    expect(screen.getByRole("button", { name: "Unpack Red scarf" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Pack Grey tee" })).not.toBeInTheDocument();
  });
});

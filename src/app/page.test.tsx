import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Workbench } from "@/features/pattern/Workbench";
import { createMemoryStore } from "@/features/pattern/store";

import Home from "./page";

describe("Pattern home", () => {
  it("introduces Pattern by name", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1, name: "Pattern" })).toBeInTheDocument();
  });

  it("completes the invoice weave by hand and replays a sample", async () => {
    const user = userEvent.setup();
    render(<Workbench store={createMemoryStore()} />);
    await user.click(screen.getByRole("button", { name: "Invoice codes" }));
    expect(screen.getByRole("heading", { name: /0 of 3 match/ })).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("New rule kind"), "replace");
    await user.click(screen.getByRole("button", { name: "Add rule" }));
    const weave = screen.getByRole("region", { name: "Weave" });
    await user.type(within(weave).getByLabelText("find"), " ");
    await user.type(within(weave).getByLabelText("with"), "-");
    expect(screen.getByRole("heading", { name: /3 of 3 match/ })).toBeInTheDocument();

    await user.type(screen.getByLabelText("Sample input"), "inv 7");
    expect(screen.getByLabelText("Sample output")).toHaveTextContent("INV-7");
  });
});

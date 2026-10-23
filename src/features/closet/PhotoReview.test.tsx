import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ClosetApp } from "./ClosetApp";

// Fixture service replies, written by hand. They stand in for the local
// service so the review flow is testable; they are not model output.
const FIXTURE_DESCRIPTION = "A yellow raincoat with a front seam.";
const FIXTURE_DETAILS = JSON.stringify({ name: "Yellow rain jacket", category: "outerwear", colour: "yellow", material: "rubber" });

function mockService(routes: Record<string, () => Response>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const route = routes[new URL(url).pathname];
      if (!route) throw new TypeError("fetch failed");
      return route();
    }),
  );
}
const json = (status: number, body: unknown) => () => new Response(JSON.stringify(body), { status });
const photo = () => new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], "coat.png", { type: "image/png" });

beforeEach(() => window.localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe("reviewed garment details", () => {
  it("offers a confident wardrobe label as a choice, not a decision", async () => {
    mockService({
      "/describe": json(200, { description: FIXTURE_DESCRIPTION, model: "SMOLVLM2_500M_MULTIMODAL_Q8_0" }),
      "/details": json(200, { raw: JSON.stringify({ name: "Coat", category: "jacket", colour: "yellow", material: "" }), model: "LLAMA_3_2_1B_INST_Q4_0" }),
      "/classify": json(200, { results: [{ label: "outerwear", confidence: 0.84 }], model: "custom:fixture.gguf" }),
    });
    const user = userEvent.setup();
    render(<ClosetApp />);
    await user.click(screen.getByRole("tab", { name: "Garments" }));
    await user.upload(screen.getByLabelText("Add from photo"), photo());
    const card = await screen.findByRole("group", { name: "Proposed details" });
    expect(within(card).getByLabelText("Proposed category")).toHaveValue("");
    await user.click(within(card).getByRole("button", { name: "Use outerwear" }));
    expect(within(card).getByLabelText("Proposed category")).toHaveValue("outerwear");
  });

  it("shows a proposal, drops ungrounded fields, and saves only after the person adds it", async () => {
    mockService({
      "/describe": json(200, { description: FIXTURE_DESCRIPTION, model: "SMOLVLM2_500M_MULTIMODAL_Q8_0" }),
      "/details": json(200, { raw: FIXTURE_DETAILS, model: "LLAMA_3_2_1B_INST_Q4_0" }),
      "/classify": json(200, { results: [{ label: "other", confidence: 0.91 }], model: "bundled-mobilenetv3-small" }),
    });
    const user = userEvent.setup();
    render(<ClosetApp />);
    await user.click(screen.getByRole("tab", { name: "Garments" }));
    await user.upload(screen.getByLabelText("Add from photo"), photo());

    const card = await screen.findByRole("group", { name: "Proposed details" });
    expect(within(card).getByLabelText("Proposed colour")).toHaveValue("yellow");
    expect(within(card).getByLabelText("Proposed material")).toHaveValue("");
    expect(within(card).getByText(/Material "rubber" is not in the description/)).toBeInTheDocument();
    expect(within(card).getByLabelText("Classifier verdict")).toHaveTextContent('no wardrobe label (the model said "other")');
    expect(within(card).queryByRole("button", { name: /^Use / })).not.toBeInTheDocument();

    const catalogue = screen.getByRole("list", { name: "Catalogue" });
    await user.clear(within(card).getByLabelText("Proposed name"));
    await user.type(within(card).getByLabelText("Proposed name"), "Festival raincoat");
    await user.click(within(card).getByRole("button", { name: "Copy into form" }));
    expect(within(catalogue).queryByText("Festival raincoat")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add garment with photo" }));
    expect(within(catalogue).getByText("Festival raincoat")).toBeInTheDocument();
  });

  it("keeps the manual form usable when the service is not running", async () => {
    mockService({});
    const user = userEvent.setup();
    render(<ClosetApp />);
    await user.click(screen.getByRole("tab", { name: "Garments" }));
    await user.upload(screen.getByLabelText("Add from photo"), photo());
    expect(await screen.findByRole("status")).toHaveTextContent("not running. You can still add the garment by hand");
    expect(screen.getByRole("button", { name: "Add garment" })).toBeEnabled();
  });
});

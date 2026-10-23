import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { AssistError, type AssistClient } from "./assist-client";
import { cloneBinder, sampleBinder } from "./binder";
import { Homebook } from "./Homebook";
import { memoryStore } from "./test-store";

// A blank water heater, registered by hand, waiting for its plate details.
const blank = cloneBinder(sampleBinder);
blank.assets[0] = { ...blank.assets[0], brand: "", model: "", serial: "" };

// Fixture client. Its facts are hand-written, not model output.
function fixtureClient(overrides: Partial<AssistClient> = {}): AssistClient {
  return {
    readLabel: async () => ({
      model: "fixture-ocr",
      facts: [
        { field: "model", value: "AT-50G", sourceText: "MODEL NO. AT-50G", confidence: 0.93 },
        { field: "serial", value: "AT50-2291-0457", sourceText: "SERIAL NO. AT50-2291-0457", confidence: 0.88 },
      ],
    }),
    ...overrides,
  } as AssistClient;
}

const plate = new File(["png"], "water-heater-label.png", { type: "image/png" });

describe("label review", () => {
  it("shows proposals and changes the plate only when a person accepts one", async () => {
    const store = memoryStore(blank);
    render(<Homebook store={store} today="2026-10-23" client={fixtureClient()} />);
    await userEvent.upload(screen.getByLabelText("Rating plate photo"), plate);
    const proposals = await screen.findByRole("list", { name: "Proposed label facts" });
    expect(within(proposals).getByText("AT50-2291-0457")).toBeInTheDocument();
    expect(store.saved).toHaveLength(0);

    await userEvent.click(screen.getByRole("button", { name: "Use model" }));
    expect(store.saved.at(-1)?.assets[0].model).toBe("AT-50G");
    expect(store.saved.at(-1)?.assets[0].serial).toBe("");
  });

  it("explains a stopped service and leaves the binder alone", async () => {
    const store = memoryStore(blank);
    const client = fixtureClient({
      readLabel: async () => {
        throw new AssistError("service-offline", "The local QVAC service is not running. Start it with npm run qvac:service.");
      },
    });
    render(<Homebook store={store} today="2026-10-23" client={client} />);
    await userEvent.upload(screen.getByLabelText("Rating plate photo"), plate);
    expect(await screen.findByRole("alert")).toHaveTextContent("npm run qvac:service");
    expect(store.saved).toHaveLength(0);
  });
});

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
    identify: async () => ({
      model: "fixture-vlm",
      identity: {
        kind: "proposed-identity",
        category: "water-heater",
        name: "Gas water heater",
        categoryUnrecognised: false,
        rawText: "category: water heater; name: gas water heater",
      },
    }),
    ask: async () => ({
      status: "answered",
      answer: "Turn the knob to OFF and wait five minutes before relighting [1].",
      citations: [{ n: 1, docId: "doc-wh-manual", title: "Aquaterra AT-50G owner's manual", file: "aquaterra-at50g-manual.txt", page: 4 }],
      model: "fixture-llm",
    }),
    summarise: async () => ({
      kind: "proposed-summary",
      draft: "Tank flushed 2025-03-10. Pilot relit 2025-08-22. Anode check due 2027-03-14.",
      unsupportedDates: [],
      model: "fixture-llm",
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

  it("sets the category only after a person accepts the photo identification", async () => {
    const other = cloneBinder(sampleBinder);
    other.assets[0] = { ...other.assets[0], category: "other" };
    const store = memoryStore(other);
    render(<Homebook store={store} today="2026-10-23" client={fixtureClient()} />);
    await userEvent.upload(screen.getByLabelText("Asset photo"), new File(["png"], "heater.png", { type: "image/png" }));
    await screen.findByRole("group", { name: "Proposed identity" });
    expect(store.saved).toHaveLength(0);
    await userEvent.click(screen.getByRole("button", { name: "Use category" }));
    expect(store.saved.at(-1)?.assets[0].category).toBe("water-heater");
  });

  it("shows an answer with a link to the cited manual page", async () => {
    render(<Homebook store={memoryStore()} today="2026-10-23" client={fixtureClient()} />);
    await userEvent.type(screen.getByLabelText("Ask this asset's manuals"), "How do I relight the pilot?");
    await userEvent.click(screen.getByRole("button", { name: "Ask" }));
    const answer = await screen.findByRole("group", { name: "Manual answer" });
    expect(within(answer).getByRole("link", { name: "Aquaterra AT-50G owner's manual, page 4" })).toHaveAttribute(
      "href",
      "/test-files/homebook/aquaterra-at50g-manual.txt",
    );
  });

  it("saves an edited summary to notes only when a person saves it", async () => {
    const store = memoryStore();
    render(<Homebook store={store} today="2026-10-23" client={fixtureClient()} />);
    await userEvent.click(screen.getByRole("button", { name: "Draft maintenance summary" }));
    const draft = await screen.findByLabelText(/Draft by fixture-llm/);
    expect(store.saved).toHaveLength(0);
    await userEvent.type(draft, " Checked by Sam.");
    await userEvent.click(screen.getByRole("button", { name: "Save to notes" }));
    expect(store.saved.at(-1)?.assets[0].notes).toMatch(/Anode check due 2027-03-14\. Checked by Sam\.$/);
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

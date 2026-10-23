import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { replayGate, samplePatterns } from "./patterns";
import { ProposalPanel } from "./ProposalPanel";

const examples = samplePatterns[0].examples;

// FIXTURE responses only. These are not live model output.
describe("ProposalPanel", () => {
  it("shows readable rules and applies them only when a person confirms", async () => {
    const onApply = vi.fn();
    render(
      <ProposalPanel
        examples={examples}
        onApply={onApply}
        gate={() => ({ ok: true, failures: [] })}
        request={async () => ({ status: "ok", raw: "", model: "fixture", check: { ok: true, rules: [{ kind: "case", to: "title" }] } })}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Propose rules" }));
    expect(screen.getByRole("list", { name: "Proposed rules" })).toHaveTextContent("Change to title case");
    expect(onApply).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Apply as new revision" }));
    expect(onApply).toHaveBeenCalledWith([{ kind: "case", to: "title" }], "fixture");
  });

  it("explains a rejected proposal and applies nothing", async () => {
    const onApply = vi.fn();
    render(
      <ProposalPanel
        examples={examples}
        onApply={onApply}
        gate={() => ({ ok: true, failures: [] })}
        request={async () => ({ status: "ok", raw: "[]", model: "fixture", check: { ok: false, reasons: ['Rule 1 has unknown kind "regex"'] } })}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Propose rules" }));
    expect(screen.getByRole("status")).toHaveTextContent("Nothing was applied");
    expect(screen.queryByRole("button", { name: "Apply as new revision" })).toBeNull();
  });

  it("blocks a proposal that fails a counterexample", async () => {
    const invoices = samplePatterns[1];
    // FIXTURE proposal: matches all three examples but breaks the held-out counterexample.
    const rules = [
      { kind: "trim", collapse: true },
      { kind: "case", to: "upper" },
      { kind: "replace", find: "INV ", with: "" },
      { kind: "format", template: "INV-{value}" },
    ] as const;
    render(
      <ProposalPanel
        examples={invoices.examples}
        onApply={vi.fn()}
        gate={(r) => replayGate(r, invoices)}
        request={async () => ({ status: "ok", raw: "", model: "fixture", check: { ok: true, rules: [...rules] } })}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Propose rules" }));
    expect(screen.getByRole("alert")).toHaveTextContent('"INV-0042" → "INV-INV-0042"');
    expect(screen.getByRole("button", { name: "Apply as new revision" })).toBeDisabled();
  });

  it("keeps the manual path when the service is down", async () => {
    render(<ProposalPanel examples={examples} onApply={vi.fn()} gate={() => ({ ok: true, failures: [] })} request={async () => ({ status: "unavailable", message: "Keep weaving by hand." })} />);
    await userEvent.click(screen.getByRole("button", { name: "Propose rules" }));
    expect(screen.getByRole("status")).toHaveTextContent("Keep weaving by hand.");
  });
});

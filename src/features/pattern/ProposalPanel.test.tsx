import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { samplePatterns } from "./patterns";
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
        request={async () => ({ status: "ok", raw: "[]", model: "fixture", check: { ok: false, reasons: ['Rule 1 has unknown kind "regex"'] } })}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Propose rules" }));
    expect(screen.getByRole("status")).toHaveTextContent("Nothing was applied");
    expect(screen.queryByRole("button", { name: "Apply as new revision" })).toBeNull();
  });

  it("keeps the manual path when the service is down", async () => {
    render(<ProposalPanel examples={examples} onApply={vi.fn()} request={async () => ({ status: "unavailable", message: "Keep weaving by hand." })} />);
    await userEvent.click(screen.getByRole("button", { name: "Propose rules" }));
    expect(screen.getByRole("status")).toHaveTextContent("Keep weaving by hand.");
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { samplePatterns } from "./patterns";
import { ProposalPanel } from "./ProposalPanel";

describe("ProposalPanel", () => {
  it("shows a raw proposal without applying it (FIXTURE response)", async () => {
    render(
      <ProposalPanel
        examples={samplePatterns[0].examples}
        request={async () => ({ status: "ok", raw: '[{"kind":"trim","collapse":true}]', model: "fixture" })}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Propose rules" }));
    expect(screen.getByLabelText("Raw proposal")).toHaveTextContent('"kind":"trim"');
  });

  it("keeps the manual path when the service is down", async () => {
    render(<ProposalPanel examples={samplePatterns[0].examples} request={async () => ({ status: "unavailable", message: "Keep weaving by hand." })} />);
    await userEvent.click(screen.getByRole("button", { name: "Propose rules" }));
    expect(screen.getByRole("status")).toHaveTextContent("Keep weaving by hand.");
  });
});

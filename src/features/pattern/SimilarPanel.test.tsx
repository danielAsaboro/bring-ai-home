import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { samplePatterns } from "./patterns";
import { SimilarPanel } from "./SimilarPanel";

describe("SimilarPanel", () => {
  it("lists close patterns and opens one (FIXTURE vectors, not real embeddings)", async () => {
    const onOpen = vi.fn();
    const embed = async () => ({ status: "ok" as const, vectors: [[1, 0], [0, 1], [0.9, 0.2]], model: "fixture" });
    render(<SimilarPanel patterns={samplePatterns} targetId="p-contacts" onOpen={onOpen} embed={embed} />);
    await userEvent.click(screen.getByRole("button", { name: "Find similar patterns" }));
    await userEvent.click(screen.getByRole("button", { name: "Vendor names" }));
    expect(onOpen).toHaveBeenCalledWith("p-vendors");
  });
});

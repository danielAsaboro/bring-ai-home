import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LookSearch } from "./LookSearch";
import { sampleCloset } from "./sample-closet";

afterEach(() => vi.unstubAllGlobals());

describe("look search", () => {
  it("ranks looks with the service's vectors", async () => {
    // Fixture vectors: the query points at the second look. Not model output.
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        const { texts } = JSON.parse(String(init.body)) as { texts: string[] };
        const embeddings = texts.map((_, i) => (i === 0 || i === 2 ? [0, 1] : [1, 0]));
        return new Response(JSON.stringify({ embeddings, model: "GTE_LARGE_FP16" }));
      }),
    );
    const user = userEvent.setup();
    render(<LookSearch closet={sampleCloset()} />);
    await user.type(screen.getByLabelText("Find looks for an occasion"), "wet office day");
    await user.click(screen.getByRole("button", { name: "Search" }));
    const list = await screen.findByRole("list", { name: "Matching looks" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(1);
    expect(list).toHaveTextContent("Rainy commute · 1.00");
    expect(screen.getByText("GTE_LARGE_FP16 · local embeddings")).toBeInTheDocument();
  });

  it("falls back to keywords and says so when the service is down", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("fetch failed"))));
    const user = userEvent.setup();
    render(<LookSearch closet={sampleCloset()} />);
    await user.type(screen.getByLabelText("Find looks for an occasion"), "rain");
    await user.click(screen.getByRole("button", { name: "Search" }));
    expect(await screen.findByText(/keyword match · The local Closet service is not running/)).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Matching looks" })).toHaveTextContent("Rainy commute");
  });
});

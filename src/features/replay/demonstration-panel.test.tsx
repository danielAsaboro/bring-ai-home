import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DemonstrationPanel } from "./demonstration-panel";
import { WEEKLY_REPORT_NARRATION_FIXTURE } from "./fixtures/narration.fixture";
import { STEPS_OUTPUT_FIXTURE } from "./fixtures/model-output.fixture";
import { toNarration } from "./narration";
import { parseStepProposals } from "./proposals";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const narration = toNarration(WEEKLY_REPORT_NARRATION_FIXTURE);

// FIXTURE service: answers with hand-written data. Nothing here is live model output.
function fixtureService() {
  return vi.fn(async (url: string) => {
    if (url.endsWith("/v1/transcribe")) {
      return Response.json({ sourceDigest: "f".repeat(64), model: "WHISPER_TINY", transcribeMs: 1, narration });
    }
    return Response.json({
      model: "LLAMA_3_2_1B_INST_Q4_0",
      raw: STEPS_OUTPUT_FIXTURE,
      result: parseStepProposals(STEPS_OUTPUT_FIXTURE, narration.transcript),
    });
  });
}

describe("DemonstrationPanel", () => {
  it("shows an honest error when the service is down", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("fetch failed"))));
    const user = userEvent.setup();
    render(<DemonstrationPanel onAddFrames={() => {}} />);
    await user.upload(screen.getByLabelText("Narration (.wav)"), new File(["RIFF"], "n.wav"));
    await user.click(screen.getByRole("button", { name: "Transcribe locally" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("service_unreachable");
  });

  it("adds only the proposals a person selects", async () => {
    vi.stubGlobal("fetch", fixtureService());
    const onAddFrames = vi.fn();
    const user = userEvent.setup();
    render(<DemonstrationPanel onAddFrames={onAddFrames} />);
    await user.upload(screen.getByLabelText("Narration (.wav)"), new File(["RIFF"], "n.wav"));
    await user.click(screen.getByRole("button", { name: "Transcribe locally" }));
    await user.click(await screen.findByRole("button", { name: "Propose frames" }));
    expect(await screen.findByText("2 proposals were held back")).toBeInTheDocument();
    expect(onAddFrames).not.toHaveBeenCalled();
    await user.click(screen.getByRole("checkbox", { name: /Export the summary as CSV/ }));
    await user.click(screen.getByRole("button", { name: "Add 1 selected frames" }));
    expect(onAddFrames).toHaveBeenCalledWith([expect.objectContaining({ title: "Export the summary as CSV" })]);
  });
});

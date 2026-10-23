// FIXTURE: hand-written strings shaped like LLAMA_3_2_1B_INST_Q4_0 JSON output.
// These are NOT model output. They exist so the gate can be tested the same way on every machine.

export const STEPS_OUTPUT_FIXTURE = JSON.stringify({
  steps: [
    { title: "Open the Harbor dashboard", detail: "Operations workspace", quote: "I open the Harbor dashboard and pick the Operations workspace" },
    { title: "Set the date range to last week", detail: "", quote: "set the date range to last week" },
    { title: "Export the summary as CSV", detail: "", quote: "I export the summary as a CSV" },
    { title: "Email the CFO", detail: "Invented step", quote: "then I email the CFO" },
    { title: "Open the Harbor dashboard", detail: "duplicate", quote: "I open the Harbor dashboard" },
    { title: "Publish to the team page", detail: "", quote: "publish it to the team page" },
  ],
});

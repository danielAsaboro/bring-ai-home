import type { Tape } from "./tape.ts";

// Fictional sample tapes. Every name, system, and address here is made up.
const at = "2026-10-01T09:00:00.000Z";

export const SAMPLE_LIBRARY: Tape[] = [
  {
    id: "tape-weekly-report",
    title: "Publish the weekly report",
    summary: "Pull last week's numbers from the Harbor dashboard and post the report to the team page.",
    steps: [
      { id: "wr-1", title: "Open the Harbor dashboard", detail: "Sign in and choose the Operations workspace." },
      { id: "wr-2", title: "Set the date range to last week", detail: "Monday to Sunday, in the team's time zone." },
      { id: "wr-3", title: "Export the summary as CSV", detail: "Use Export, then Summary only." },
      { id: "wr-4", title: "Paste the totals into the report template", detail: "Fill the three highlighted cells." },
      { id: "wr-5", title: "Publish to the team page", detail: "Title it 'Week NN report' and notify #ops." },
    ],
    parameters: [{ name: "week_start", example: "2026-09-28" }],
    preconditions: ["You can sign in to the Harbor dashboard"],
    stopConditions: ["The export is empty or the totals do not match the dashboard"],
    revision: 3,
    updatedAt: at,
  },
  {
    id: "tape-contractor-onboarding",
    title: "Onboard a new contractor",
    summary: "Give a new contractor the accounts and documents they need on day one.",
    steps: [
      { id: "oc-1", title: "Create the directory account", detail: "Use the contractor template, not the employee one." },
      { id: "oc-2", title: "Add them to the project channel", detail: "Read-only until the agreement is signed." },
      { id: "oc-3", title: "Send the welcome packet", detail: "Attach the code of conduct and the handbook." },
    ],
    parameters: [{ name: "contractor_name", example: "Rowan Vale" }],
    preconditions: ["The signed agreement is on file"],
    stopConditions: ["The contractor's start date is not confirmed"],
    revision: 1,
    updatedAt: at,
  },
  {
    id: "tape-checkout-bug",
    title: "Reproduce the checkout rounding bug",
    summary: "Steps QA uses to reproduce the cart total that is one cent off.",
    steps: [
      { id: "cb-1", title: "Open the staging store", detail: "Use the QA test account." },
      { id: "cb-2", title: "Add three of the sample mug", detail: "Unit price 3.335." },
      { id: "cb-3", title: "Apply the code TENOFF", detail: "Watch the subtotal line." },
      { id: "cb-4", title: "Compare the cart total with the receipt", detail: "Note both values." },
    ],
    parameters: [],
    preconditions: ["Staging is up"],
    stopConditions: ["Staging shows real customer data"],
    revision: 2,
    updatedAt: at,
  },
];

# Episode 2 — placement scorecard

Choose one capability, not an entire product. Replace every bracketed instruction with a concrete answer.

## Capability boundary

- User action: [What does the person do?]
- Required result: [What observable result must return?]
- Maximum acceptable latency: [Number and unit]
- Minimum acceptable quality: [A testable threshold]
- Target device: [Exact hardware and operating system]

## Five placement questions

| Question | Observation | Consequence |
|---|---|---|
| What happens without a network? | [Measured or required behavior] | [Placement implication] |
| Who may revoke execution? | [Named authority] | [Accepted or unacceptable dependency] |
| What happens if inference costs multiply? | [Simple cost model] | [Business implication] |
| What context crosses the device boundary? | [Exact fields/media] | [Privacy implication] |
| Can the model change without rebuilding the product? | [Replacement mechanism] | [Continuity implication] |

## Decision

- Primary placement: [local / trusted peer / cloud / split]
- Fallback: [Explicit behavior, including no fallback]
- User-visible placement signal: [What the interface shows]
- Evidence required before shipping: [Named measurements and negative cases]

## Worked example: private meeting recall

### Capability boundary

- User action: asks a factual question about a previously recorded meeting.
- Required result: a concise answer citing the relevant transcript passage.
- Maximum acceptable latency: first visible feedback within 500 milliseconds; final answer within 12 seconds on the recording laptop.
- Minimum acceptable quality: the correct passage appears in the top three retrieval results and every meeting-specific claim carries a citation.
- Target device: the pinned macOS Apple Silicon recording machine.

### Placement findings

| Question | Observation | Consequence |
|---|---|---|
| What happens without a network? | Recall is an essential offline capability. | Retrieval and baseline generation run locally. |
| Who may revoke execution? | A compulsory model provider could disable the core feature. | The working model and runtime must remain locally possessable. |
| What happens if inference costs multiply? | Meeting questions are frequent and may contain long context. | Local baseline inference prevents an unbounded per-token operating cost. |
| What context crosses the device boundary? | Raw audio, names, dates, decisions, and action items are sensitive. | Raw meeting context stays on the user’s hardware by default. |
| Can the model change without rebuilding the product? | Retrieval, prompting, and UI use capability interfaces rather than a provider response shape. | A model can be replaced after the same acceptance suite passes. |

### Decision

- Primary placement: local retrieval and local generation.
- Fallback: an explicitly paired trusted device may handle generation; there is no silent public-cloud fallback.
- User-visible placement signal: the answer shows the active device and citations.
- Evidence required before shipping: offline completion, supported and unsupported questions, deletion behavior, latency on named hardware, peer timeout, and visible fallback behavior.

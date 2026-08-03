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

# Ask Laya which lines are sensitive

This checkpoint adds Laya, QVAC's local decision model, after OCR.
For each OCR line it answers one yes/no question per field, such as "This text contains a person's name.", and returns a probability.
A typed direction becomes one more question.

## Trust pipeline

1. Laya receives only the validated OCR lines; it never writes text or geometry.
2. For each line, the most likely field above 0.5 becomes a candidate.
3. A deterministic semantic gate re-derives the label from the OCR text and drops lines the text doesn't support.
4. The browser grounds each surviving candidate to its already-normalized OCR block.

Suggestions remain advisory in this checkpoint; Accept and Reject arrive in the next one.

## Verification

```bash
npm test -- qvac-service/reasoning.test.ts qvac-service/candidate-validation.test.ts
npm run lint
npm run typecheck
npm test
npm run build
git diff --check
```

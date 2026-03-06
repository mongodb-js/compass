# Tool Call Eval Improvements

## Context

This note captures the main follow-up improvements identified after running the full unified tool-call eval suite in `tool-call-cases.ts`.

- Experiment: [tool-calls-1772826043634](https://www.braintrust.dev/app/mongodb-education-ai/p/Compass%20Tool%20Calls/experiments/tool-calls-1772826043634)
- Total cases: `101`
- Aggregate `CompoundToolCorrectness`: `85.61%`

## High-Level Readout

- `easy` cases are effectively saturated: `35 / 35` perfect.
- `medium` cases are useful and still expose meaningful misses: `21 / 34` perfect.
- `hard` cases are doing the most work: `12 / 32` perfect.

The current suite is in a good place: it no longer just checks obvious tool routing, and it now reliably surfaces real weaknesses in the assistant's behavior.

## Main Improvement Areas

### 1. Prefer acting over advisory prose

In several cases, the assistant produced a helpful natural-language answer instead of issuing the expected tool calls.

Representative failures:

- `v2 medium: explore available data after connecting`
- `v2 medium: infer explain from slow query question`
- `v2 hard: debug current pipeline with follow-up inspection`
- `v2 harder: most recent movies without aggregation`

Desired improvement:

- When the user request is actionable and the necessary tool path is available, prefer tool execution over general guidance or prose-only answers.

### 2. Finish multi-step plans after retrieving context

The assistant can often start a multi-step flow, but it still frequently stops after the first retrieval step.

Representative failures:

- `v2 harder: adapt current pipeline with extra filter`
  Expected: `get-current-pipeline` then `aggregate`
- `v2 harder: inspect current query before checking sort index`
  Expected: `get-current-query` then `explain`
- `v2 hard: broad weather collection overview`
  Expected: `collection-schema`, `collection-indexes`, `collection-storage-size`, `count`

Desired improvement:

- Strengthen "retrieve context, then continue acting" behavior.
- After `get-current-query` or `get-current-pipeline`, the model should more reliably issue the follow-up tool call instead of stopping.

### 3. Improve tool selection under ambiguity

Some failures are straightforward tool-choice misses rather than multi-step execution problems.

Representative failures:

- `v2 medium: average imdb rating per genre`
  Model chose `collection-schema` instead of `aggregate`
- `explain: is query using index`
  Model chose `collection-indexes` instead of `explain`
- `find: top rated movies (canonical over aggregate)`
  The model did not satisfy the canonical `find` expectation

Desired improvement:

- Better distinguish between:
  - `collection-indexes` vs `explain`
  - `schema inspection` vs `aggregation`
  - `find` vs `aggregate` for ranking and grouped-statistics tasks

### 4. Preserve negative constraints and refusal behavior

The suite is now catching cases where the assistant should either avoid a disallowed tool path or avoid acting entirely.

Representative failures:

- `v2 harder: refuse create index request`
  The model retrieved the current query and started helping instead of refusing
- `v2 harder: most recent movies without aggregation`
  The model respected the spirit of the request in prose, but still failed to act via tools

Desired improvement:

- Respect explicit negative constraints such as "do not use aggregation"
- Refuse write/admin requests more consistently when the assistant should not perform them

## Eval / Scorer Improvements

Not every non-perfect score reflects a true behavioral problem. Some rows are semantically correct but lose points because the scorer is too strict.

### 1. Tolerate benign extra tool arguments

Some correct tool calls include harmless runtime args such as:

- `sampleSize`
- `responseBytesLimit`

These should not reduce argument correctness when the substantive tool choice and core user-relevant arguments are correct.

Affected patterns include:

- `multi: schema then find`
- `v2 medium: inspect schema before querying restaurants`
- `v2 medium: schema and indexes for sales collection`
- `multi: indexes then explain`

### 2. Add a dedicated no-tool scorer

The current scoring setup under-represents correct abstention behavior.

Cases affected:

- refusal cases such as delete / insert / create-index requests
- knowledge-only prompts such as docs questions
- unsupported requests such as query-history comparison

Desired improvement:

- Add a scorer that rewards correct no-tool behavior even when the response is not a single canonical refusal template.

### 3. Consider allowing semantically equivalent canonical choices where appropriate

Some cases intentionally enforce a canonical tool even when another path is arguable.

Potential follow-up:

- Revisit whether some rows should allow one-of style expectations, especially where both tool paths are reasonable but one is preferred.

## Recommended Priority Order

1. Fix assistant behavior that answers in prose instead of acting.
2. Fix chained execution after `get-current-query` and `get-current-pipeline`.
3. Improve ambiguous tool selection: `explain` vs `collection-indexes`, `aggregate` vs `schema`, `find` vs `aggregate`.
4. Add scorer support for no-tool correctness.
5. Relax scorer strictness for harmless extra tool arguments.

## Suggested Validation Pass After Fixes

After behavior or scorer changes, rerun the full suite and compare especially:

- `ToolCallAmountCorrect` for prose-vs-action regressions
- `ToolArgumentsCorrect` for extra-argument brittleness
- `CompoundToolCorrectness` on `medium` and `hard` only
- The multi-step cases involving `get-current-query` and `get-current-pipeline`

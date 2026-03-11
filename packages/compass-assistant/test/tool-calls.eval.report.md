# Compass Assistant tool-calls eval failure analysis

## Scope

- Eval run date: 2026-03-11
- Package/script: `packages/compass-assistant/package.json` → `npm run eval:tool-calls`
- Current Braintrust experiment: `tool-calls-1773236654273`
- Baseline Braintrust experiment: `tool-calls-1773087660541`
- Source eval suite: `packages/compass-assistant/test/tool-calls.eval.ts:291`
- Eval case definitions: `packages/compass-assistant/test/eval-cases/tool-call-cases.ts:1`

## Executive summary

This run did **not** expose infrastructure instability inside the eval itself: Braintrust reported `errors=0`, `llm_errors=0`, and `tool_errors=0`. The failures are overwhelmingly **decision-quality failures** in the assistant’s tool planning, not transport or runtime failures.

The highest-level result is a **drop versus baseline on every tool-quality metric except message ordering**:

| Metric                  | Current | Delta vs baseline |
| ----------------------- | ------: | ----------------: |
| CompoundToolCorrectness |  81.45% |         -5.67 pts |
| ToolArgumentsCorrect    |  72.77% |         -5.52 pts |
| ToolCallAmountCorrect   |  88.66% |         -1.94 pts |
| ToolOrderCorrect        |  90.10% |         -3.84 pts |
| MessageOrderCorrect     |  98.97% |         +0.95 pts |

Three conclusions matter most for stakeholders:

1. **Easy cases are solid; medium and hard cases are the problem.** All 35 easy cases passed on the core component checks, while medium and hard cases account for all observed failures.
2. **The dominant product issue is incomplete or missing tool execution**, especially when the user asks for performance analysis, pipeline debugging, or “overview” workflows that require more than one tool call.
3. **Argument grounding is the next major issue**, especially canonical database naming and strict field-path/schema grounding.

## What failed, in plain English

Using the component-level Braintrust scores, the 108 scored cases break down as follows:

| Primary failure class            | Cases | Share of suite | What it means                                                                             |
| -------------------------------- | ----: | -------------: | ----------------------------------------------------------------------------------------- |
| Pass                             |    68 |          63.0% | Correct tool count, order/tool choice, and arguments                                      |
| Tool-count failure               |    16 |          14.8% | The assistant called too few / too many tools                                             |
| Tool-arguments failure           |    13 |          12.0% | The assistant chose the right tool shape but populated arguments incorrectly              |
| Tool-order / tool-choice failure |    11 |          10.2% | The assistant used the wrong tool or wrong sequence while keeping the count roughly right |

A few additional aggregate observations from Braintrust:

- Easy cases: **35/35** passed component checks.
- Medium cases: **19/37** failed some component check.
- Hard cases: **21/36** failed some component check.
- There are **5 no-tool cases** in the suite; the assistant abstained correctly on **4** and failed on **1**.

## Failure mode 1: missing tools or incomplete multi-step plans

This is the biggest practical product issue.

### Pattern

The assistant often understands the user’s intent at a conversational level, but stops before emitting the required tool sequence. In Braintrust this shows up as either:

- **zero tool calls** where one or more were expected, or
- **only the first tool** in a multi-step plan, with the follow-up execution step omitted.

The detailed breakdown inside this failure class is:

- **7 cases** where the assistant emitted **0 tools** even though tools were expected.
- **7 cases** where the assistant emitted **1 tool instead of 2**.
- **1 case** where the assistant emitted **1 tool instead of 4**.
- **1 case** where the assistant emitted **1 tool when 0 were expected**.

### Representative cases

1. **`infer explain from slow query question`** — `packages/compass-assistant/test/eval-cases/tool-call-cases.ts:2952`

   - User prompt: “Why is this query slow?”
   - Expected: `get-current-query` → `explain`
   - Actual: no tool call; the assistant returned a generic prose explanation of slow queries.
   - Braintrust signal: `ToolCallAmountCorrect=0`, `ToolArgumentsCorrect=0`, `CompoundToolCorrectness=0`.
   - Interpretation: when the user asks a performance-diagnosis question tied to an in-session query, the assistant falls back to generic advice instead of interrogating the live query context.

2. **`adapt current pipeline with extra filter`** — `packages/compass-assistant/test/eval-cases/tool-call-cases.ts:3392`

   - User prompt: “Run my current pipeline, but only for documents after 2010.”
   - Expected: `get-current-pipeline` → `aggregate`
   - Actual: only `get-current-pipeline`
   - Braintrust signal: `ToolCallAmountCorrect=0.5`, `ToolArgumentsCorrect=0`, `ToolOrderCorrect=1`, `CompoundToolCorrectness=0.5`.
   - Interpretation: the assistant retrieves state but fails to complete the execution step.

3. **`broad weather collection overview`** — `packages/compass-assistant/test/eval-cases/tool-call-cases.ts:3169`

   - User prompt: “Tell me everything about the weather observations collection.”
   - Expected: `collection-schema` → `collection-indexes` → `collection-storage-size` → `count`
   - Actual: only `collection-schema`
   - Braintrust signal: `ToolCallAmountCorrect=0.25`, `ToolArgumentsCorrect=0.25`, `CompoundToolCorrectness=0.625`.
   - Interpretation: the assistant begins the exploration workflow but does not fan out into the broader inventory of facts the eval expects.

4. **`debug current pipeline with follow-up inspection`** — `packages/compass-assistant/test/eval-cases/tool-call-cases.ts:3252`

   - User prompt: “My aggregation pipeline is returning unexpected results. Help me debug it.”
   - Expected: `get-current-pipeline` followed by a follow-up inspection tool sequence.
   - Actual: no tool call; the assistant asks for the pipeline instead of retrieving it from context.
   - Interpretation: the model behaves as if context retrieval is optional even when the current pipeline is available.

5. **`refuse create index request`** — `packages/compass-assistant/test/eval-cases/tool-call-cases.ts:3903`
   - User prompt: “Can you create an index to speed up my current query?”
   - Expected: no tool call (refusal / abstention case)
   - Actual: `get-current-query`
   - Braintrust signal: this is the single **false-positive tool invocation** among the no-tool cases.
   - Interpretation: abstention is mostly working, but the assistant still sometimes “starts helping” with tool retrieval on requests that should be refused.

### Product implication

The assistant’s main weakness is not understanding intent; it is **converting intent into a fully completed tool plan**. This is especially visible when the prompt implies a workflow:

- diagnose performance,
- inspect current query/pipeline,
- provide a collection overview, or
- retrieve context and then act on it.

## Failure mode 2: argument grounding and canonicalization errors

This is the second major issue class.

### Pattern

The assistant often picks the correct tool family but fills arguments with slightly wrong values. These are not random mistakes; they cluster around a few repeatable grounding problems:

- using a **human alias** instead of the canonical seeded database name,
- inventing a **plausible but wrong field name**, or
- partially grounding a nested field path.

### Representative cases

1. **`use prompt database over current context`** — `packages/compass-assistant/test/eval-cases/tool-call-cases.ts:367`

   - User prompt: “Show me collections in the airbnb database.”
   - Expected argument: `database="sample_airbnb"`
   - Actual argument: `database="airbnb"`
   - Braintrust signal: `ToolArgumentsCorrect=0`, `CompoundToolCorrectness=0.5`.
   - Interpretation: the assistant understands that the user wants the Airbnb dataset, but fails to normalize the colloquial database reference to the actual database name used in the cluster.

2. **`find: weather observations by station`** — `packages/compass-assistant/test/eval-cases/tool-call-cases.ts:896`

   - User prompt: “Find weather observations for station x+47600-047900.”
   - Expected filter: `{ st: "x+47600-047900" }`
   - Actual filter: `{ station: "x+47600-047900" }`
   - Braintrust signal: `ToolArgumentsCorrect=0.6667`, `CompoundToolCorrectness=0.8333`.
   - Interpretation: this is a classic schema-grounding miss; the assistant invents a semantically sensible field name instead of using the actual schema.

3. **`find by nested cleanliness score`** — `packages/compass-assistant/test/eval-cases/tool-call-cases.ts:1086`

   - User prompt: “Find airbnb listings where the cleanliness review score is above 9.”
   - Expected filter path: `review_scores.review_scores_cleanliness`
   - Actual filter path: `review_scores.cleanliness`
   - Braintrust signal: `ToolArgumentsCorrect=0.6667`, `CompoundToolCorrectness=0.8333`.
   - Interpretation: the assistant gets close, but shortens the nested field path to a plausible alias. This is a recurring “approximate schema memory” behavior.

4. **`pre-query collection overview`** — `packages/compass-assistant/test/eval-cases/tool-call-cases.ts:3449`
   - User prompt: “Tell me what I should know about this collection before I query it.”
   - Expected: both `collection-schema` and `collection-indexes`
   - Actual: only `collection-schema`
   - Braintrust signal: `ToolArgumentsCorrect=0.5`, `ToolCallAmountCorrect=0.5`, `CompoundToolCorrectness=0.75`.
   - Interpretation: even when the first tool is correct, the assistant under-specifies the broader evidence set needed to answer confidently.

### Product implication

These are the cases most likely to produce **quietly wrong tool executions**: the tool call looks plausible, but hits the wrong namespace or field. That is a more serious product risk than an obvious abstention because it can return misleading results without looking visibly broken.

## Failure mode 3: wrong tool family or wrong execution path

This class is best thought of as a **planning / tool-choice mismatch**. Braintrust reports it mostly through `ToolOrderCorrect`, but the underlying issue is often that the assistant chooses a different tool than the eval expects.

### Representative cases

1. **`find: top rated movies (canonical over aggregate)`** — `packages/compass-assistant/test/eval-cases/tool-call-cases.ts:1393`

   - User prompt: “What are the top 5 highest rated movies sorted by IMDB rating?”
   - Expected: `find` with `sort` + `limit`
   - Actual: `aggregate`
   - Why this matters: this is a real scored failure, but it is also an **eval-design caveat**. The fixture comment explicitly says `aggregate` is also a reasonable interpretation and the eval is intentionally canonicalized to `find`.
   - Interpretation: not every scored “wrong tool” here is a product bug of equal severity.

2. **`explain: brooklyn american restaurants query`** — `packages/compass-assistant/test/eval-cases/tool-call-cases.ts:2408`

   - User prompt: “Will a find on Brooklyn American restaurants use an index?”
   - Expected: `explain`
   - Actual: `collection-indexes`
   - Interpretation: the assistant chooses a related diagnostic tool, but not the one that actually tests the query plan.

3. **`infer logs from slow database question`** — `packages/compass-assistant/test/eval-cases/tool-call-cases.ts:2508`

   - User prompt: “The database seems slow today. Can you check if anything unusual is happening?”
   - Expected: `mongodb-logs`
   - Actual: `db-stats`
   - Interpretation: the model maps “slow database” to a generic health/statistics check instead of the more targeted operational log inspection the eval expects.

4. **`pipeline build-up`** — `packages/compass-assistant/test/eval-cases/tool-call-cases.ts:3717`

   - Conversation ends with: “Run it and show me the results.”
   - Expected: `aggregate`
   - Actual: `get-current-pipeline`
   - Interpretation: in multi-turn settings, the assistant sometimes re-reads context it already effectively has, instead of executing the requested action.

5. **`indexes then explain`** — `packages/compass-assistant/test/eval-cases/tool-call-cases.ts:2908`
   - User prompt: “What indexes does the movies collection have, and how would a query on the year field perform?”
   - Expected: `collection-indexes` → `explain`
   - Actual: `collection-indexes` followed by an `explain` call with an over-specified method payload.
   - Braintrust signal: correct count, but degraded `ToolOrderCorrect` / `ToolArgumentsCorrect`.
   - Interpretation: when the assistant does continue the plan, it sometimes adds unnecessary query construction details rather than issuing the simpler expected diagnostic call.

### Product implication

This failure class suggests the model has decent semantic clustering of tools (“performance-related”, “schema-related”, “pipeline-related”), but is still **loosely selecting from a neighborhood of nearby tools** rather than deterministically choosing the best one for the task.

## Difficulty concentration

The failures are highly concentrated in the non-trivial half of the suite:

| Difficulty | Cases | Passes | Failures |
| ---------- | ----: | -----: | -------: |
| Easy       |    35 |     35 |        0 |
| Medium     |    37 |     18 |       19 |
| Hard       |    36 |     15 |       21 |

This split is important. The assistant is already reliable on direct, single-step requests. The gap is in **compositional execution**:

- infer the right latent operation from a vague request,
- pull live state from Compass when that state exists,
- transform that state into the next tool call, and
- finish the sequence without reverting to generic prose.

## Measurement caveats stakeholders should know

These are not reasons to dismiss the results, but they do affect interpretation.

1. **`CompoundToolCorrectness` can hide missing-tool failures.**

   - In **`list dbs then list collections`** — `packages/compass-assistant/test/eval-cases/tool-call-cases.ts:2880` — the assistant emitted only `list-databases` even though the eval expected `list-databases` followed by `list-collections`.
   - Braintrust still recorded `CompoundToolCorrectness=1` while `ToolCallAmountCorrect=0.5`.
   - Practical takeaway: stakeholders should **not use compound score alone** as the primary KPI for this suite.

2. **Some “wrong tool” failures are partly artifacts of canonicalization.**

   - The fixture for **`find: top rated movies (canonical over aggregate)`** explicitly notes that `aggregate` is also reasonable, but the eval encodes `find` as the only accepted answer.
   - Practical takeaway: a subset of `ToolOrderCorrect` / tool-choice failures are better interpreted as **strictness of the eval contract**, not necessarily user-visible product defects.

3. **No-tool/refusal scoring is already flagged in the fixture as not fully stable.**
   - The case comments around **`refuse create index request`** and **`unsupported query history comparison`** note that the current scorer under-rewards correct no-tool behavior.
   - Practical takeaway: abstention results are directionally useful, but should be treated as a **secondary** signal until a dedicated refusal scorer exists.

## Recommended next actions

### 1) Add a tool-completion guard for context-retrieval workflows

When the assistant calls `get-current-query` or `get-current-pipeline`, it should strongly prefer one of two follow-ups before answering:

- emit the next tool call required by the user’s request, or
- explicitly refuse / abstain if the request is disallowed.

This would directly target failures like:

- `infer explain from slow query question`
- `adapt current pipeline with extra filter`
- `inspect current query before checking sort index` — `packages/compass-assistant/test/eval-cases/tool-call-cases.ts:3293`
- `pipeline build-up`

### 2) Tighten schema-grounded argument generation

For collection filters and nested fields, the assistant should bias more heavily toward:

- existing schema field names,
- canonical database names in the live cluster, and
- verbatim field-path reuse when the schema is known.

This would directly target failures like:

- `find: weather observations by station`
- `find by nested cleanliness score`
- `use prompt database over current context`

### 3) Distinguish “diagnose” from “explain conceptually”

Prompts containing words like “slow”, “debug”, “using an index”, “optimize”, or “run it” should prefer an operational/tool path over a conceptual prose answer when live context is present.

This would reduce failures like:

- `infer explain from slow query question`
- `get-current-pipeline: optimize pipeline` — `packages/compass-assistant/test/eval-cases/tool-call-cases.ts:2746`
- `retrieve current pipeline before optimization` — `packages/compass-assistant/test/eval-cases/tool-call-cases.ts:2775`
- `debug current pipeline with follow-up inspection`

### 4) Improve the eval KPI stack before using it as the sole release gate

For stakeholder reporting, I recommend treating these as the primary release indicators:

1. `ToolCallAmountCorrect`
2. `ToolArgumentsCorrect`
3. component-level full-pass rate (`68/108 = 63.0%` in this run)
4. `CompoundToolCorrectness` only as a secondary summary metric

This avoids overstating performance when the assistant gets part of a workflow right but still fails to complete it.

## Bottom line

The suite shows a clear pattern: the assistant is strong on straightforward, single-step tool selection, but still brittle on **context-aware, multi-step execution** and **strict argument grounding**. The most important product risk is not random hallucination; it is that the assistant often starts the right workflow, then either stops early, chooses a nearby-but-wrong diagnostic path, or fills in a plausible-looking but non-canonical argument.

If stakeholders want one sentence: **the assistant’s next quality milestone is moving from “mostly picks the right tool family” to “reliably completes the right tool workflow with exact grounded arguments.”**

## Codebase implementation recommendations

After reviewing the failure patterns against the current implementation, the best places to make changes are below.

### 1) Add multi-step tool execution support in the shipped transport and keep the eval aligned

- **Primary code paths:** `packages/compass-assistant/src/docs-provider-transport.ts:114`, `packages/compass-assistant/test/tool-calls.eval.ts:261`
- **Why this is high priority:** both the production transport and the eval harness call `streamText()` without any explicit multi-step tool loop settings. That is a plausible architectural contributor to the “retrieve context, then stop” failures, because many of the misses are exactly one missing follow-up step after `get-current-query` or `get-current-pipeline`.
- **What to change:**
  - Evaluate enabling multi-step tool execution in `DocsProviderTransport.sendMessages()` so the model can retrieve current context and then continue to the next tool call in the same request lifecycle.
  - Mirror the same behavior in `test/tool-calls.eval.ts` so eval results reflect the shipped assistant behavior rather than a simplified single-step harness.
- **Failure modes this targets:**
  - `infer explain from slow query question` — `packages/compass-assistant/test/eval-cases/tool-call-cases.ts:2952`
  - `adapt current pipeline with extra filter` — `packages/compass-assistant/test/eval-cases/tool-call-cases.ts:3392`
  - `inspect current query before checking sort index` — `packages/compass-assistant/test/eval-cases/tool-call-cases.ts:3293`
  - `pipeline build-up` — `packages/compass-assistant/test/eval-cases/tool-call-cases.ts:3717`

### 2) Strengthen the base tool-calling instructions and context prompt

- **Primary code paths:** `packages/compass-assistant/src/prompts.ts:24`, `packages/compass-assistant/src/prompts.ts:234`, `packages/compass-assistant/src/prompts.ts:339`
- **Why this is high priority:** the base conversation instructions are still very generic. The tool-calling context prompt currently says only “Always offer to run a tool again if the user asks about data that requires it,” which is too weak for the kinds of compositional behaviors this eval expects.
- **What to change:**
  - In `buildConversationInstructionsPrompt()`, add explicit decision rules for when the user asks to **diagnose**, **optimize**, **run**, **compare**, or **inspect** the current query/pipeline.
  - In `buildContextPrompt()`, add concrete rules such as:
    - if current query/pipeline context exists and the user asks why it is slow, debug it, optimize it, or run it, first retrieve the current state and then continue to the next required tool instead of replying with generic prose;
    - for “overview” prompts, prefer a small evidence bundle like schema + indexes, and add count/storage only when the prompt explicitly asks for breadth;
    - prefer exact schema and namespace names over colloquial aliases.
  - Add explicit disambiguation guidance for nearby tools:
    - `collection-indexes` tells what indexes exist;
    - `explain` tells whether a specific query/pipeline uses them;
    - `db-stats` describes size/usage;
    - `mongodb-logs` is for unusual recent operational behavior.
- **Failure modes this targets:**
  - generic prose instead of tool use on `Why is this query slow?` and pipeline-debug prompts;
  - wrong diagnostic tool choice on `explain: brooklyn american restaurants query` and `infer logs from slow database question`.

### 3) Add targeted per-message instruction overlays in the provider

- **Primary code paths:** `packages/compass-assistant/src/compass-assistant-provider.tsx:401`, `packages/compass-assistant/src/compass-assistant-provider.tsx:603`
- **Why this is high priority:** the provider already injects custom per-message instructions via `message.metadata.instructions`, but normal chat sends only the static global instructions. That means we have a ready-made place to add narrow, high-value routing hints without overloading the base prompt for every conversation.
- **What to change:**
  - In `ensureOptInAndSend()`, inspect the outgoing user message plus available context (`currentQuery`, `currentPipeline`, active tab) and attach short dynamic instructions for high-risk intents.
  - Candidate overlays:
    - performance/slow/index prompts → bias toward `explain` or `mongodb-logs`, not prose;
    - “run my current pipeline/query” prompts → bias toward context retrieval followed by execution;
    - collection overview prompts → bias toward schema + indexes before answering.
  - Keep this heuristic and narrow; it does not need to become a second planner.
- **Failure modes this targets:**
  - `infer explain from slow query question`
  - `get-current-pipeline: optimize pipeline` — `packages/compass-assistant/test/eval-cases/tool-call-cases.ts:2746`
  - `retrieve current pipeline before optimization` — `packages/compass-assistant/test/eval-cases/tool-call-cases.ts:2775`
  - `debug current pipeline with follow-up inspection` — `packages/compass-assistant/test/eval-cases/tool-call-cases.ts:3252`

### 4) Make tool availability a little more resilient to follow-up turns

- **Primary code path:** `packages/compass-assistant/src/compass-assistant-provider.tsx:700`
- **Why this is worth doing:** `setToolsContext()` currently enables `querybar` only for `Documents`/`Schema` tabs and `aggregation-builder` only for `Aggregations`. That is sensible, but it is brittle if follow-up turns are sent while tab metadata lags or if the state still contains a meaningful current query/pipeline string.
- **What to change:**
  - Consider enabling `querybar` whenever `query` exists and `aggregation-builder` whenever `pipeline` exists, even if `activeTab` is stale or missing.
  - At minimum, add a guarded fallback path so the assistant does not lose access to current-state tools on follow-up turns that are clearly about the existing query or pipeline.
- **Failure modes this targets:**
  - multi-turn re-inspection loops like `pipeline build-up`
  - current-state follow-ups like `inspect current query before checking sort index`

### 5) Sharpen tool descriptions to reduce “nearby tool” confusion

- **Primary code paths:** `packages/compass-generative-ai/src/available-tools.ts:1`, `packages/compass-generative-ai/src/tools-controller.ts:112`
- **Why this is worth doing:** the current tool descriptions are short and correct, but several failures suggest the model is choosing from a neighborhood of related tools rather than from sharply separated roles.
- **What to change:**
  - Update descriptions in `available-tools.ts` so they encode the distinctions the eval is testing. For example:
    - `explain`: “Run explain for a specific query or pipeline to inspect index usage and execution stats.”
    - `collection-indexes`: “List indexes only; does not tell whether a specific query uses them.”
    - `mongodb-logs`: “Inspect recent server log events to investigate unusual behavior or slowdowns.”
    - `db-stats`: “Get database size and usage stats; not a query performance diagnostic.”
  - Consider similarly clarifying the runtime descriptions returned by `ToolsController.getActiveTools()` for `get-current-query` and `get-current-pipeline`.
- **Failure modes this targets:**
  - `explain: brooklyn american restaurants query` — `packages/compass-assistant/test/eval-cases/tool-call-cases.ts:2408`
  - `infer logs from slow database question` — `packages/compass-assistant/test/eval-cases/tool-call-cases.ts:2508`
  - `find: top rated movies (canonical over aggregate)` — `packages/compass-assistant/test/eval-cases/tool-call-cases.ts:1393` (partially; prompt/eval strictness also matters)

### 6) Improve current-state tool outputs for downstream planning

- **Primary code paths:** `packages/compass-generative-ai/src/tools-controller.ts:115`, `packages/compass-generative-ai/src/tools-controller.ts:134`, `packages/compass-assistant/src/assistant-global-state.tsx:14`
- **Why this is worth evaluating:** `get-current-query` and `get-current-pipeline` currently return string payloads from context. That keeps the transport simple, but it forces the model to parse and transform a serialized query/pipeline before deciding on the next tool call.
- **What to change:**
  - Explore returning a richer structured shape from these tools when the underlying state is parseable, while preserving the raw string for display/debugging.
  - Even a lightweight normalized shape could make follow-up generation more reliable for `explain` and `aggregate` calls.
- **Failure modes this targets:**
  - the “retrieve current state, then stop” cluster
  - argument-construction failures after current-state retrieval

### 7) Add regression coverage where the implementation changes land

- **Primary test files:** `packages/compass-assistant/src/docs-provider-transport.spec.ts`, `packages/compass-assistant/src/compass-assistant-provider.spec.tsx`, `packages/compass-generative-ai/src/tools-controller.spec.ts`, `packages/compass-assistant/test/tool-calls.eval.ts`
- **What to add:**
  - transport-level tests for multi-step tool continuation;
  - provider-level tests for dynamic instruction overlays and tool activation fallback;
  - tools-controller tests for any richer `get-current-query` / `get-current-pipeline` output shape;
  - eval assertions that specifically cover the high-regression cases listed above.

### Recommended implementation order

If we want the smallest set of changes with the highest likely return, I would implement in this order:

1. `DocsProviderTransport` multi-step tool support, plus matching eval harness support.
2. Prompt/instruction tightening in `prompts.ts`.
3. Narrow per-message overlays in `compass-assistant-provider.tsx`.
4. Tool description improvements in `available-tools.ts`.
5. Optional richer current-state tool payloads in `tools-controller.ts`.

That sequence addresses the likely architectural bottleneck first, then improves the model’s routing and grounding behavior once it has the opportunity to complete multi-step tool workflows.

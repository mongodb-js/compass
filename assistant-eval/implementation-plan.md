# Plan: Compass Assistant Tool Call Eval Suite

## Context

The Education AI (EAI) team has published an Assistant Evaluation Library (AEL) and we need to integrate it into the Compass repo to evaluate the assistant's MCP tool call behavior. The goal is to verify that the assistant generates the **correct tool calls** (right tools, right arguments, right order) — without executing them against a live MongoDB database.

This builds on existing eval infrastructure in `packages/compass-assistant/` which already uses Braintrust for docs chatbot evaluation.

## What We're Building

A new eval file at `packages/compass-assistant/test/tool-calls.eval.ts` that:

1. Defines eval cases covering each MCP tool
2. Calls the assistant API with tools enabled
3. Captures the generated tool calls (without executing them)
4. Scores tool call correctness using 6 assertion-based metrics

## Implementation Steps

### Step 1: Create the eval case dataset

**File:** `packages/compass-assistant/test/eval-cases/tool-call-cases.ts`

Define eval cases following the spec's `CompassConversationEvalCase` schema:

```ts
interface CompassAssistantCustomInput {
  clusterUid: string;
  databaseName: string;
  collectionName: string;
  currentQuery?: { filter?; projection?; sort?; skip?; limit? };
  currentPipeline?: Record<string, unknown>[];
}
```

Each case has:

- `input.messages` — the user prompt (e.g., "list all databases")
- `input.custom` — Compass-specific context (clusterUid, db, collection, current query/pipeline)
- `expected.outputMessages` — expected tool calls with name + arguments
- `tags` — for filtering in Braintrust

Coverage targets from spec:

- At least 3 cases per tool (13 tools × 3 = ~39 minimum)
- More cases for `find`, `aggregate`, `get-current-query`, `get-current-pipeline`
- ~10 multi-tool-call-in-sequence cases (e.g., get schema → run query)

**TODO:** Write the actual eval cases. Need to determine:

- **Q: What realistic user prompts trigger each tool?** We should look at real usage data or work with the DevTools team.
- **Q: For multi-step cases, what does the expected output look like?** The model generates tool call 1, gets a (mocked?) result, then generates tool call 2. How do we represent this in the dataset?

#### Step 1b: Local MongoDB with Seed Data

We want a local MongoDB seeded with fixture data. This is a **phased design:**

- **Phase 1 (now):** Seed data provides schema/sample docs as prompt context. Tool calls are captured but NOT executed against the DB. Matches current spec.
- **Phase 2 (future):** Tool calls execute against the seeded DB. Enables testing real results, multi-step chains, and runtime errors.

The key design goal is to make the seed data layer work for both phases without rework.

##### How it works in the Compass repo

The standard pattern (from `data-service.spec.ts`, `compass-import-export`, etc.) is:

```ts
import { mochaTestServer } from '@mongodb-js/compass-test-server';

const cluster = mochaTestServer(); // starts MongoDB in before(), stops in after()

beforeEach(async function () {
  const client = new MongoClient(cluster().connectionString);
  await client.connect();
  await client.db('testdb').collection('movies').insertMany(seedDocs);
  await client.db('testdb').collection('movies').createIndex({ year: 1 });
});

afterEach(async function () {
  await client.db('testdb').collection('movies').drop();
});
```

We'll follow this same pattern.

##### Seed data structure

Create a `fixtures/` directory under the eval test area with seed data organized by dataset:

**File:** `packages/compass-assistant/test/fixtures/seed-data.ts`

```ts
export interface SeedCollection {
  databaseName: string;
  collectionName: string;
  documents: Record<string, unknown>[];
  indexes?: {
    key: Record<string, 1 | -1>;
    options?: Record<string, unknown>;
  }[];
}

export const seedCollections: SeedCollection[] = [
  {
    databaseName: 'sample_mflix',
    collectionName: 'movies',
    documents: [
      /* movie docs */
    ],
    indexes: [{ key: { year: 1 } }, { key: { title: 'text' } }],
  },
  {
    databaseName: 'sample_airbnb',
    collectionName: 'listingsAndReviews',
    documents: [
      /* airbnb docs */
    ],
    indexes: [
      { key: { 'address.location': '2dsphere' } }, // needed for geo queries
      { key: { property_type: 1 } },
    ],
  },
  // ... more collections
];
```

**Why this shape:**

- `documents` can be used in Phase 1 as prompt context (derive schema + samples, like existing gen-ai evals) AND in Phase 2 as actual DB seed data
- `indexes` are stored alongside documents so Phase 2 can create them before executing tool calls (e.g., `$geoWithin` needs a `2dsphere` index)
- Organized by collection to match how tools reference data (`databaseName` + `collectionName`)

##### Phase 1 usage (context only, no execution)

In Phase 1, the seed data provides prompt context without touching MongoDB:

```ts
import { seedCollections } from '../fixtures/seed-data';
import { getSimplifiedSchema } from 'mongodb-schema';

function getContextForEvalCase(databaseName: string, collectionName: string) {
  const collection = seedCollections.find(
    (c) =>
      c.databaseName === databaseName && c.collectionName === collectionName
  );
  const sampleDocs = sampleItems(collection.documents, 2);
  const schema = await getSimplifiedSchema(sampleDocs);
  // Feed schema + samples into the model's system prompt / instructions
  return { sampleDocs, schema };
}
```

This mirrors the existing `compass-generative-ai` eval pattern (see `getSampleAndSchemaFromDataset()` in `tests/evals/utils.ts`).

##### Phase 2 usage (tool execution against real DB)

In Phase 2, the same seed data gets loaded into a real MongoDB:

```ts
import { startTestServer } from '@mongodb-js/compass-test-server';
import { MongoClient } from 'mongodb';
import { seedCollections } from '../fixtures/seed-data';

async function seedDatabase(connectionString: string) {
  const client = new MongoClient(connectionString);
  await client.connect();
  for (const collection of seedCollections) {
    const coll = client
      .db(collection.databaseName)
      .collection(collection.collectionName);
    await coll.insertMany(collection.documents);
    for (const index of collection.indexes ?? []) {
      await coll.createIndex(index.key, index.options ?? {});
    }
  }
  return client;
}
```

Then tool calls execute against this DB via `ToolsController`, and we can add result-correctness scorers.

##### Which datasets to seed

**TODO:** Decide on datasets. Options:

- **Q: Reuse existing fixtures?** The `compass-generative-ai/tests/evals/fixtures/` already has Airbnb, Netflix, NYC parking, and Berlin cocktailbar data. We could import these directly to avoid duplication.
- **Q: Use MongoDB sample datasets?** The [MongoDB Atlas sample datasets](https://www.mongodb.com/docs/atlas/sample-data/) (sample_mflix, sample_airbnb, sample_restaurants, etc.) are well-known and the assistant may already be trained on them. Using a subset would make eval cases more natural.
- **Q: How much data per collection?** The existing fixtures have ~9 docs each. For Phase 1 (context only) this is fine. For Phase 2 (query execution), we may want 50-100 docs to make queries meaningful.
- **Q: What indexes are needed?** At minimum: `2dsphere` for geo fields, text indexes for `$text` queries, compound indexes for `explain` test cases.

### Step 2: Create the task function

**File:** `packages/compass-assistant/test/tool-calls.eval.ts`

The task function calls the assistant API and captures tool calls. Pattern based on existing `chatbot-api.ts` in compass-generative-ai:

```ts
async function makeToolCallAssistantCall(input): Promise<TaskOutput> {
  const openai = createOpenAI({
    baseURL:
      process.env.COMPASS_ASSISTANT_BASE_URL_OVERRIDE ??
      'https://eval.knowledge-dev.mongodb.com/api/v1',
    apiKey: '',
    headers: { 'X-Request-Origin': 'compass-tool-call-braintrust' },
  });

  const result = streamText({
    model: openai.responses('mongodb-chat-latest'),
    messages: input.messages,
    tools: toolDefinitions, // tool schemas without execute functions
    providerOptions: {
      openai: {
        instructions: buildInstructions(input.custom),
        store: false,
      },
    },
  });

  // Capture tool calls from result
  const toolCalls = await result.toolCalls;
  return { toolCalls, text: await result.text };
}
```

**TODO:** Determine how to provide tools to the model:

- **Q: Can we pass tool schemas (from MCP server) without `execute` functions?** The Vercel AI SDK `tool()` requires `execute` to be optional, which it is. We should be able to pass just the schemas.
- **Q: How do we inject Compass context (currentQuery, currentPipeline, clusterUid) into the conversation?** These would go into the system prompt / instructions. Need to look at how `setToolsContext()` works in the provider.
- **Q: For multi-step tool calls, do we need to mock tool results so the model can generate subsequent calls?** If the model generates `collection-schema` and needs the result before generating `find`, we'd need to provide mock results. This may be out of scope for v1.

### Step 3: Implement or import scorers

The spec lists 6 tool call scorers:

| Scorer                        | What it checks                      |
| ----------------------------- | ----------------------------------- |
| `ToolCallAmountCorrect`       | Right number of tool calls          |
| `ToolOrderCorrect`            | Tool calls in correct sequence      |
| `ToolsCallsInParallelCorrect` | Parallel calls happen when expected |
| `ToolArgumentsCorrect`        | Arguments match expectations        |
| `MessageOrderCorrect`         | Proper message ordering             |
| `CompoundToolCorrectness`     | Combined score of above             |

**TODO:** Determine where scorers come from:

- **Q: Are these scorers available in the AEL package?** The spec says they come from `packages/chatbot-server-mongodb-public/src/eval/scorers` in the ai-assistant repo. If the AEL is published, we'd `npm install` it and import them.
- **Q: If AEL isn't ready yet, should we stub them locally?** We could implement simple versions and replace them with AEL imports later.

### Step 4: Wire up the Braintrust Eval

**File:** `packages/compass-assistant/test/tool-calls.eval.ts`

Follow the existing pattern from `assistant.eval.ts`:

```ts
Eval('Compass Tool Calls', {
  data: makeToolCallEvalCases,
  task: makeToolCallAssistantCall,
  scores: [
    ToolCallAmountCorrect,
    ToolOrderCorrect,
    ToolsCallsInParallelCorrect,
    ToolArgumentsCorrect,
    MessageOrderCorrect,
    CompoundToolCorrectness,
  ],
});
```

### Step 5: Add npm script

**File:** `packages/compass-assistant/package.json`

Add a script to run the tool call evals:

```json
"eval:tool-calls": "braintrust eval test/tool-calls.eval.ts --verbose"
```

## Key Files

| File                                                            | Action                                          |
| --------------------------------------------------------------- | ----------------------------------------------- |
| `packages/compass-assistant/test/tool-calls.eval.ts`            | **Create** — main eval harness                  |
| `packages/compass-assistant/test/eval-cases/tool-call-cases.ts` | **Create** — eval case dataset                  |
| `packages/compass-assistant/package.json`                       | **Edit** — add eval script                      |
| `packages/compass-assistant/test/assistant.eval.ts`             | **Reference** — existing eval pattern to follow |
| `packages/compass-generative-ai/src/available-tools.ts`         | **Reference** — tool definitions and schemas    |
| `packages/compass-generative-ai/tests/evals/chatbot-api.ts`     | **Reference** — existing task function pattern  |

## Open Questions Summary

1. **Tool context injection:** How do we provide database/collection/query context to the model without a live DB? Need to discuss the instructions/system prompt approach.
2. **Multi-step tool calls:** For cases where tool call 2 depends on the result of tool call 1, do we mock intermediate results or only test single-step cases in v1?
3. **AEL package status:** Can we install and use the scorers now, or stub them locally?
4. **Tool schemas without execution:** Confirm that passing tool schemas (from the MCP server's Zod definitions) without `execute` functions works with the assistant API.

## Verification

1. Run `npm run eval:tool-calls` from `packages/compass-assistant/`
2. Verify results appear in Braintrust dashboard under "Compass Tool Calls" project
3. Check that each scorer produces meaningful scores (not all nulls)
4. Confirm eval cases cover all 13 tools with at least 3 cases each

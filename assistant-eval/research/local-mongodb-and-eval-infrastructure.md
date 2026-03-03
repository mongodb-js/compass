# Compass Repo: Local MongoDB & AI Evaluation Infrastructure

Research notes for building an evaluation system for the AI assistant's use of the MongoDB MCP server.

---

## Table of Contents

1. [Local MongoDB for Testing](#local-mongodb-for-testing)
2. [AI Assistant + MCP Server Architecture](#ai-assistant--mcp-server-architecture)
3. [Existing Evaluation Infrastructure](#existing-evaluation-infrastructure)
4. [Key Files Reference](#key-files-reference)
5. [Recommendations for the Eval System](#recommendations-for-the-eval-system)

---

## Local MongoDB for Testing

The repo does **not** use remote MongoDB instances (e.g. Atlas) for tests. Instead it uses two local approaches:

### Approach 1: `mongodb-runner` via `compass-test-server`

**What it is:** The package `@mongodb-js/compass-test-server` (`packages/compass-test-server/`) wraps the `mongodb-runner` npm package (v6.7.1+). `mongodb-runner` **downloads real MongoDB server binaries** and runs them as local processes — no Docker required.

**When it's used:** Most unit and integration tests across the repo. This is the lightweight, default approach.

**Usage pattern:**

```typescript
import { mochaTestServer } from '@mongodb-js/compass-test-server';

describe('MyTest', function () {
  const cluster = mochaTestServer(); // starts MongoDB in before(), stops in after()

  it('connects', async function () {
    const connectionString = cluster().connectionString;
    // connect and run queries against a real local MongoDB
  });
});
```

There is also a lower-level API:

```typescript
import { startTestServer } from '@mongodb-js/compass-test-server';

const server = await startTestServer();
const connectionString = server.connectionString;
// ... use it ...
await server.close();
```

**Configuration via environment variables:**

| Variable                 | Purpose                                          |
| ------------------------ | ------------------------------------------------ |
| `MONGODB_VERSION`        | Which MongoDB server version to download and run |
| `MONGODB_RUNNER_LOGDIR`  | Directory for server logs                        |
| `MONGODB_RUNNER_VERSION` | Alias for version (used in CI)                   |

**Default settings:** Topology is `standalone`, temp directory is `os.tmpdir()/compass-tests-{hash}`.

**Example consumer:** `packages/data-service/src/data-service.spec.ts` uses `mochaTestServer()` for standalone and replica set tests.

### Approach 2: Docker via `@mongodb-js/devtools-docker-test-envs`

**What it is:** A separate package (`devtools-docker-test-envs`, sourced from https://github.com/mongodb-js/devtools-docker-test-envs) that provides Docker Compose configurations for complex MongoDB topologies and authentication scenarios.

**When it's used:** Integration/connectivity tests that need specialized setups — sharded clusters, LDAP, Kerberos, TLS, OIDC, SSH tunneling, etc.

**Available Docker environments:**

| Environment   | Description                                                |
| ------------- | ---------------------------------------------------------- |
| `enterprise`  | MongoDB Enterprise (port 27021)                            |
| `sharded`     | Sharded cluster (mongos on 28004, config replicas, shards) |
| `replica-set` | Replica set                                                |
| `ldap`        | LDAP authentication                                        |
| `kerberos`    | Kerberos authentication                                    |
| `ssh`         | SSH tunneling                                              |
| `tls`         | TLS/SSL                                                    |
| `oidc`        | OIDC authentication                                        |
| `scram`       | SCRAM authentication                                       |

**Programmatic usage:**

```javascript
const createTestEnvironments = require('@mongodb-js/devtools-docker-test-envs');
const testEnvironments = createTestEnvironments(['sharded', 'ldap']);

before(async () => {
  await testEnvironments.start();
});

const { connectionString } = testEnvironments.getConnectionOptions('sharded');
```

**CI orchestration:** The script `.evergreen/start-docker-envs.sh` clones the `devtools-docker-test-envs` repo (v1.3.4) and starts multiple Docker Compose stacks. Cleanup is handled via a trap on EXIT (`docker-compose down -v --remove-orphans`).

### CI System: Evergreen

The repo uses MongoDB's Evergreen CI system (not GitHub Actions). Key config files:

- `.evergreen.yml` — main config (imports the others)
- `.evergreen/functions.yml` — CI function definitions including `test-connectivity`
- `.evergreen/buildvariants-and-tasks.yml` — build variants and task scheduling
- `.evergreen/start-docker-envs.sh` — Docker environment orchestration
- `.evergreen/connectivity-tests/` — Dockerfile and scripts for running connectivity tests inside Docker with `--network host`

**Log collection:** Evergreen collects `src/.testserver/logs/` (mongodb-runner logs) and `src/.evergreen/logs/` (Docker logs) as tarballs.

---

## AI Assistant + MCP Server Architecture

### Overview

The MongoDB MCP Server (`mongodb-mcp-server` v1.6.1-prerelease.2) is integrated as a dependency in `packages/compass-generative-ai/`. It runs **in-memory** (no external transport) and is configured as **read-only**.

### Key Components

#### ToolsController (`packages/compass-generative-ai/src/tools-controller.ts`)

- Creates an `InMemoryRunner` extending `TransportRunnerBase` from mongodb-mcp-server
- Runs the MCP server in-process without binding to any transport
- Manages server startup/shutdown lifecycle
- Wraps MCP tools for the Vercel AI SDK using `tool()` with Zod schemas
- All tools require user approval (`needsApproval: true`)
- Server config: `readOnly: true`, `disabledTools: ['connect']`, `telemetry: 'disabled'`

#### ToolsConnectionManager (`packages/compass-generative-ai/src/tools-connection-manager.ts`)

- Extends `ConnectionManager` from mongodb-mcp-server
- Manages connections via Compass's `NodeDriverServiceProvider`
- Sets read preference to `secondaryPreferred` with 30s timeout
- Rejects Atlas Stream connections
- Overrides app name for telemetry (e.g., "MongoDB Compass Database Tools")

#### Available Tools (`packages/compass-generative-ai/src/available-tools.ts`)

Tools are organized into groups:

| Tool                      | Description                                 | Groups                |
| ------------------------- | ------------------------------------------- | --------------------- |
| `find`                    | Retrieve documents matching search criteria | `db-read`             |
| `aggregate`               | Complex data processing and calculations    | `db-read`             |
| `count`                   | Return total document count                 | `db-read`             |
| `list-databases`          | Display available databases                 | `db-read`             |
| `list-collections`        | Show collections in a database              | `db-read`             |
| `collection-schema`       | Describe collection schema structure        | `db-read`             |
| `collection-indexes`      | List collection indexes                     | `db-read`             |
| `collection-storage-size` | Get storage information                     | `db-read`             |
| `db-stats`                | Database statistics                         | `db-read`             |
| `explain`                 | Query execution statistics                  | `db-read`             |
| `mongodb-logs`            | Recent mongod events                        | `db-read`             |
| `get-current-query`       | Get query from querybar                     | `querybar`            |
| `get-current-pipeline`    | Get pipeline from aggregation builder       | `aggregation-builder` |

#### How Tools Flow to the AI

1. `compass-assistant-provider.tsx` receives `toolsController` via service locator
2. Calls `toolsController.startServer()` when tool calling is enabled
3. Sets tool context via `setToolsContext()` with active connections and current queries
4. Passes tools to Chat via `getTools: () => toolsController.getActiveTools()`
5. `docs-provider-transport.ts` includes `tools: this.getTools()` in calls to `streamText()`
6. The AI model (via OpenAI API) decides when to invoke tools
7. Tool results flow back into the conversation

#### Supporting Files

- `tools-logger.ts` — adapts MCP server logs to Compass logging system
- `tools-connection-error-handler.ts` — connection error handling (currently minimal)
- `remove-zod-transforms.ts` — strips Zod transforms to prevent double-transformation between MCP server and AI SDK

---

## Existing Evaluation Infrastructure

### compass-assistant Evals

**File:** `packages/compass-assistant/test/assistant.eval.ts`
**Run with:** `npm run eval` (uses `braintrust eval`)

**What it evaluates:** The docs-based assistant (responses to user questions about MongoDB/Compass).

**Eval case types:**

```typescript
type SimpleEvalCase = {
  name: string;
  input: string;          // user question
  expected: string;       // expected answer
  expectedSources?: string[];  // expected documentation URLs
  tags: string[];         // categorization tags
};

type ConversationEvalCase = {
  input: { messages, instructions };
  expected: { messages with sources };
};
```

**Scorers:**

1. **Factuality** — uses `autoevals.Factuality()` with GPT-4.1 to judge answer accuracy
2. **BinaryNdcgAt5** — evaluates source citation quality (are the right docs linked in the top 5?)

**Eval case files:**

- `test/eval-cases/generated-cases.ts` — auto-generated from CSV
- `test/eval-cases/trick-questions.ts` — regression tests (e.g., don't misattribute MongoDB features to Compass)
- `test/eval-cases/humility.ts` — tests for humble/qualified responses
- `test/entrypoints/explain-plan.ts` — explain plan interpretation

**Test data conversion:** `npm run convert-eval-cases` converts CSV files to TypeScript eval cases.

**Environment variables:**

- `CHAT_TEMPERATURE` — controls model temperature during eval
- `SCORER_TEMPERATURE` — controls scorer model temperature

### compass-generative-ai Evals

**File:** `packages/compass-generative-ai/tests/evals/gen-ai.eval.ts`

**What it evaluates:** The AI's ability to generate correct `find` and `aggregate` queries given a natural-language prompt and collection context.

**Framework:** Braintrust.

#### How datasets are loaded — no live MongoDB involved

This is an important architectural detail: **these evals do not connect to a MongoDB database at all.** The datasets are hardcoded TypeScript arrays in fixture files and are used purely as static context for prompts.

The pipeline is:

```
fixture file (hardcoded TS array of docs)
  → sampleItems()         — randomly picks 2 docs from the array
  → EJSON.parse()         — converts EJSON notation ({$date:…}, {$numberDecimal:…}) to real BSON types
  → getSimplifiedSchema() — derives a schema from the 2 sample docs (via mongodb-schema)
  → buildFindQueryPrompt() / buildAggregateQueryPrompt()
                          — builds an LLM prompt with the user's natural-language input,
                            the 2 sample docs, and the derived schema
  → chatbot API call      — LLM generates a MongoDB query
  → Factuality scorer     — LLM judge compares output to hardcoded expectedOutput
```

**Fixture files** (all are plain TypeScript `export default` arrays):

| File                                    | Collection                  | Contents                        |
| --------------------------------------- | --------------------------- | ------------------------------- |
| `fixtures/airbnb.listingsAndReviews.ts` | `airbnb.listingsAndReviews` | ~9 Airbnb listing documents     |
| `fixtures/netflix.movies.ts`            | `netflix.movies`            | Netflix movie documents         |
| `fixtures/netflix.comments.ts`          | `netflix.comments`          | Netflix comment documents       |
| `fixtures/nyc.parking.ts`               | `nyc.parking`               | NYC parking violation documents |
| `fixtures/berlin.cocktailbars.ts`       | `berlin.cocktailbars`       | Berlin cocktail bar documents   |

**Key utility** (`tests/evals/utils.ts`):

```typescript
export async function getSampleAndSchemaFromDataset(
  dataset: unknown[],
  sampleSize = 2
): Promise<{ sampleDocuments: any[]; schema: any }> {
  const documents = sampleItems(dataset, Math.min(sampleSize, dataset.length));
  const sampleDocuments = EJSON.parse(JSON.stringify(documents)); // EJSON → BSON
  const schema = await getSimplifiedSchema(sampleDocuments); // derive schema
  return { sampleDocuments, schema };
}
```

**Use cases** (from `use-cases/find-query.ts` and `use-cases/aggregate-query.ts`) define the eval cases as plain objects:

```typescript
{
  namespace: 'netflix.movies',
  userInput: 'find all the movies released in 1983',
  expectedOutput: `<filter>{year: 1983}</filter>`,
  name: 'simple find',
}
```

The LLM is given the `userInput` along with sample docs and schema, and its output is compared to `expectedOutput` using the Factuality scorer.

**Implication for MCP tool-use evals:** This approach tests query _generation_ but not query _execution_. An MCP tool-use eval would need a live MongoDB (via `compass-test-server`) because it needs to verify that the generated queries actually run and return correct results when executed through the MCP tools.

### Testing Libraries Used Across the Repo

| Library                               | Purpose                                         |
| ------------------------------------- | ----------------------------------------------- |
| `mocha`                               | Test runner                                     |
| `chai`                                | Assertions                                      |
| `sinon`                               | Mocks, stubs, spies                             |
| `@mongodb-js/testing-library-compass` | Custom React testing utilities                  |
| `braintrust`                          | LLM evaluation framework                        |
| `autoevals`                           | LLM-based evaluation scorers (Factuality, etc.) |
| `nyc`                                 | Code coverage                                   |
| `electron-mocha`                      | Electron-environment test runner                |

---

## Key Files Reference

### Local MongoDB Infrastructure

| File                                        | Purpose                                             |
| ------------------------------------------- | --------------------------------------------------- |
| `packages/compass-test-server/src/index.ts` | `startTestServer()` and `mochaTestServer()` exports |
| `packages/compass-test-server/package.json` | Depends on `mongodb-runner` ^6.7.1                  |
| `.evergreen/start-docker-envs.sh`           | Docker environment orchestration for CI             |
| `.evergreen/functions.yml`                  | CI function definitions (env vars, test tasks)      |
| `.evergreen/connectivity-tests/Dockerfile`  | Docker container for connectivity tests             |

### MCP Server Integration

| File                                                             | Purpose                                            |
| ---------------------------------------------------------------- | -------------------------------------------------- |
| `packages/compass-generative-ai/package.json`                    | Depends on `mongodb-mcp-server` 1.6.1-prerelease.2 |
| `packages/compass-generative-ai/src/tools-controller.ts`         | MCP server lifecycle, tool wrapping                |
| `packages/compass-generative-ai/src/tools-connection-manager.ts` | Connection management for tool execution           |
| `packages/compass-generative-ai/src/available-tools.ts`          | Tool definitions and groupings                     |
| `packages/compass-generative-ai/src/tools-logger.ts`             | Log adapter                                        |
| `packages/compass-generative-ai/src/remove-zod-transforms.ts`    | Schema transform fix                               |

### AI Assistant

| File                                                            | Purpose                                  |
| --------------------------------------------------------------- | ---------------------------------------- |
| `packages/compass-assistant/src/compass-assistant-provider.tsx` | Wires tools + chat + UI together         |
| `packages/compass-assistant/src/docs-provider-transport.ts`     | AI SDK transport (passes tools to model) |
| `packages/compass-assistant/src/prompts.ts`                     | Prompt builders for different contexts   |
| `packages/compass-assistant/src/@ai-sdk/react/chat-react.ts`    | Custom Chat class                        |

### Existing Evals

| File                                                        | Purpose                            |
| ----------------------------------------------------------- | ---------------------------------- |
| `packages/compass-assistant/test/assistant.eval.ts`         | Docs assistant eval (Braintrust)   |
| `packages/compass-assistant/test/eval-cases/`               | Eval case definitions              |
| `packages/compass-generative-ai/tests/evals/gen-ai.eval.ts` | Query generation eval (Braintrust) |

---

## Recommendations for the Eval System

Based on this research, here's what's available for building an MCP tool-use evaluation:

1. **Use `compass-test-server`** (via `mongodb-runner`) to spin up local MongoDB instances with test data. This is the lightest approach, requires no Docker, and is what most packages in the repo use.

2. **Follow the Braintrust eval pattern** already established in `compass-assistant` and `compass-generative-ai`. The infrastructure and conventions are already in place.

3. **Use `ToolsController` programmatically** — since the MCP server runs in-memory, you can invoke tools against a test MongoDB without needing the full Compass UI. This is the key to testing tool use in isolation.

4. **For complex topologies** (sharded, auth, etc.), the Docker-based `devtools-docker-test-envs` is available but likely overkill for initial eval work.

5. **Eval work can live in `packages/compass-assistant/`** alongside the existing eval infrastructure, or in a new dedicated location depending on scope.

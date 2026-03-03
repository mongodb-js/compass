# Spec: Support Evals in Client Code

Author: [Ben Perlmutter](mailto:ben.p@mongodb.com)

## Overview

This document provides a technical overview of building the evaluation library and integrating it into the Compass evaluation suite.

## Assistant Evaluation Library (AEL)

This library will bundle existing evaluation logic from the mongodb/ai-assistant repo. All new logic is noted below. If existing logic, the location is noted.

### Braintrust

The AEL will wrap the Braintrust evaluation platform. All evaluations will be uploaded to Braintrust.

### Dataset Schema

We will base the base Conversation dataset entry schema on the existing [ConversationEvalCaseSchema](https://github.com/mongodb/ai-assistant/blob/main/packages/mongodb-rag-core/src/eval/getConversationEvalCasesFromYaml.ts#L106). We also need to make it more extensible to support custom input and output data coming from client applications. We can accomplish this using TypeScript types and Zod.

Pseudocode of the TypeScript schema for the dataset:

```ts

interface InputMessage {
  role: "assistant" | "user" | "system" | "tool"
  content: string;
  toolCallName?: string;
}

type CompareOperator = {
  gt?: number;
  gte?: number;
  lt?: number;
  lte?: number;
  eq?: number;
  neq?: number;
};

type SingleToolCallArgument = {
  name: string;
  type?: "string" | "array" | "object" | "boolean" | "number"; // defaults to "string"
  value?: string | number | boolean | (string | number | boolean)[] | Record<string, string | number | boolean>;
  matchRegex?: string;   // only valid when type is "string"
  size?: CompareOperator; // only valid for "array", "string", "object", "number"
};

type ToolCallArguments = SingleToolCallArgument[];

type OutputMessage =
      | { role: "assistant" | "tool" | "user" | "system" }
      | {
          role: "assistant-tool";
          toolCalls: {
            name: string;
            arguments?: ToolCallArguments;}[];
        };


interface BasePromotion {
   type: string;
}

interface SkillPromotion extends BasePromotion {
  type: "skill";
  topic?: string;
  skill?: string;
}

type Promotion = SkillPromotion; // leaving extensible for other promotion types

interface ConversationEvalCase<CustomInput extends Record<string, unknown> | undefined, CustomExpectation extends Record<string, unknown> | undefined>, Metadata extends Record<string, unknown> {
  // arbitrary name for case
  name?: string;
 // not for scorers. used to explain to reader what eval case covers
 description?: string
  input: {
    messages: InputMessage[];
    // can put things like a message-specific system prompt here.
    custom?: CustomInput;
  };
  // arbitrary human-readable tags
  tags?: string[];
  skip?: boolean;
 expected: {
    guardrail?: {
      reject: boolean;
      type?: "irrelevant" | "inappropriate" | "valid" | "unknown";
      reason?: string;
    };
    links?: string[];
    referenceAnswer?: string;
    promptAdherence?: string;
    outputMessages: OutputMessage[];
    promotions?: Promotion[]
    verifiedAnswer?: boolean;
    custom: CustomExpectation;
  }
  ci?: boolean;
  metadata?: Metadata;

}
```

Note that this data model is slightly different from the model in [ConversationEvalCaseSchema](https://github.com/mongodb/ai-assistant/blob/main/packages/mongodb-rag-core/src/eval/getConversationEvalCasesFromYaml.ts#L106). I think this will be more maintainable over time.

### Harness CLI

Configurable CLI to run different evaluation experiments. Base this on the existing evaluation CLI in MongoDB Assistant source code \- [https://github.com/mongodb/ai-assistant/blob/main/packages/chatbot-server-mongodb-public/src/conversations.eval.ts\#L134](https://github.com/mongodb/ai-assistant/blob/main/packages/chatbot-server-mongodb-public/src/conversations.eval.ts#L134)

The CLI should use the same pattern for creating a CLI as is used in our benchmark CLI [https://github.com/mongodb/ai-benchmarks/blob/main/packages/benchmarks/src/cli/benchmarkCli.ts](https://github.com/mongodb/ai-benchmarks/blob/main/packages/benchmarks/src/cli/benchmarkCli.ts)

##### Configuration Options

1. Dataset: Support passing multiple datasets to the conversation eval.
2. Model: Specify which of the supported Assistant models to run the task against
3. Task: Specify what task (prompt, tools, etc) you want to run the assistant against.
4. Validators: Specify thresholds for whether the eval run should count as pass/fail.

#### Commands

##### `datasets` Commands

1. `datasets list`: List available datasets to run evals against
2. `datasets validate <name>`: Validate that the named dataset can be loaded.

##### `models` Commands

1. `models list`: List all available models to run eval against

##### `evaluation` Commands

1. `evaluation run`: Main command of the Eval CLI. Runs an eval against Braintrust. CLI options below.

| Option                    | Required | Accepts    | Notes                                                                                                    |
| :------------------------ | :------- | :--------- | :------------------------------------------------------------------------------------------------------- |
| `--dataset`               | Yes      | string\[\] | Select the conversation datasets to run against                                                          |
| `--model`                 | Yes      | string\[\] | Select models to run dataset against                                                                     |
| `--task`                  | Yes      | string     | Select which task (prompt \+ tool calls mapped to structured output) to run.                             |
| `--taskConcurrency`       | No       | number     | How many tasks to run at once. Default: 10                                                               |
| `--validate`              | No       | string\[\] | Validation functions to run on the eval result.                                                          |
| `--ci`                    | No       | boolean    | CI environment flag. Currently, only surfaced when reportTo is `"slack"`. Included in the Slack message. |
| `--runId`                 | No       | string     | Arbitrary run identifier. Defaults to current timestamp                                                  |
| `--experimentConcurrency` | No       | number     | Number of experiments to run concurrently. Defaults to 2\.                                               |
| `--reportTo`              | No       | string     | Platform to report validation results to. Currently only supports `"slack"` or `none`.                   |
| `--reportOn`              | No       | string     | When to report validation results.                                                                       |

### Metrics

For the initial version, only export the current scorers that we use internally in the Assistant, located here [https://github.com/mongodb/ai-assistant/tree/main/packages/chatbot-server-mongodb-public/src/eval/scorers](https://github.com/mongodb/ai-assistant/tree/main/packages/chatbot-server-mongodb-public/src/eval/scorers)

We may need to change the function input and outputs to take into account the more flexible data model necessary for the AEL.

Metrics to include:

| Metric Name                                                                                                                                            | Type           | Measures                       | Required Data                                   | Notes                                                                                                                                                                        |
| :----------------------------------------------------------------------------------------------------------------------------------------------------- | :------------- | :----------------------------- | :---------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BinaryNDCG@k                                                                                                                                           | Statistical    | Search quality                 | Actual search results, reference search results | [More info on NDCG](https://towardsdatascience.com/demystifying-ndcg-bee3be58cfe0/). We use 'binary' NDCG, where each correct match is valued at 1 and each incorrect as 0\. |
| ResponseStartPatience@k                                                                                                                                | Statistical    | Performance                    | Response start time                             |                                                                                                                                                                              |
| ToolCallScorers (ToolOrderCorrect,ToolsCallsInParallelCorrect, ToolArgumentsCorrect,MessageOrderCorrect,ToolCallAmountCorrect,CompoundToolCorrectness) | Assertion      | Tool Calls                     | Actual tool calls, expected tool calls          | Variety of scorers that measure different aspects of whether tool call is correct.                                                                                           |
| IsExpectedVerifiedAnswer                                                                                                                               | Assertion      | Verified Answer used correctly | Actual verified answer, expectation of VA       | Whether the response is a verified answer.                                                                                                                                   |
| Factuality                                                                                                                                             | LLM-as-a-Judge | Response Quality               | Measures if a                                   | Assess if generated answer matches against a reference answer.                                                                                                               |
| PromptAdherence                                                                                                                                        | LLM-as-a-Judge | Response Quality               |                                                 | Assess if the generated response adheres to the system prompt.                                                                                                               |

Note to coding agent implementing this feature:

1. Please port over all metrics from `packages/chatbot-server-mongodb-public/src/eval/scorers`. I've only listed a subset of them here because these are the primary ones to be used by downstream teams consuming the Assistant API.

### Utils

Port over utils for evaluations like the function `getConverationEvalFromYaml()`.

## Documentation Updates

Update the AI Assistant evaluation docs to explain how to download and use the AEL.

High level overview of changes:

1. Landing page [https://mongodb-assistant-docs.prod.corp.mongodb.com/server/evaluation](https://mongodb-assistant-docs.prod.corp.mongodb.com/server/evaluation)
   1. Mention the AEL on landing page
2. On page Evaluation Datasets [https://mongodb-assistant-docs.prod.corp.mongodb.com/server/evaluation/datasets](https://mongodb-assistant-docs.prod.corp.mongodb.com/server/evaluation/datasets)
   1. Mention how to load and structure datasets using AEL
3. On Recommended Metrics page [https://mongodb-assistant-docs.prod.corp.mongodb.com/server/evaluation/metrics](https://mongodb-assistant-docs.prod.corp.mongodb.com/server/evaluation/metrics)
   1. Refactor this whole page to be about the metrics supported by the AEL
   2. For relevant metrics show code example for set up. Examples can be minimal
   3. Because we're showing the metrics from the npm package, we can remove the links to the ai-assistant codebase
   4. Add new section about "Custom Metrics"
      1. Include when you should/should not use a custom metric
4. \[new page\] Run Evaluations
   1. Path: server/evaluation/run
   2. Show how to configure and use the evaluation CLI
   3. Show how to run the CLI
      1. Show basic run command for a given config
      2. Show some advanced options
   4. Reference of all CLI options
      1. This can be super minimal, like the output of the `--help` for each command. Doesn't even need to be rendered in a table. Just the terminal output.

## Update Assistant Evals to Use AEL

1. Update the MongoDB Assistant chatbot-server-mongodb-public package to use the new AEL package, as applicable.

Note: we should do this before integrating the AEL with Compass. This'll let us validate and iterate on making changes to the AEL before using it externally.

## Compass Tool Call Eval Suite

The Compass eval suite will consist the the following aspects

### Dataset

#### Composition

1. Every tool call should have at least 3 eval cases.
2. We should include more cases for the presumably more commonly used tools, such as `find`, `aggregate`, `get-current-query`, and `get-current-pipeline`.
3. We should include \~10 eval cases that include multiple tool calls in sequence. For example, get a collection schema, then run a query against it.

#### Data Model

```ts
interface CompassAssistantCustomInput {
   clusterUid: string;
   databaseName: string;
   collectionName: string;
   currentQuery?: {
      filter?: Record<string,unknown>;
      projection?: Record<string, 0 | 1>;
      sort?: Record<string, 1 | -1>;
      skip?: number;
      limit?: number;
   };
   currentPipeline?: Record<string,unknown>[];
}

type CompassConversationEvalCase<CompassAssistantCustomInput>
```

### Task

The task will be a lightweight wrapper around the call to the assistant in the Compass repo.

### Metrics

We will evaluate tool call correctness against the following metrics:

1. ToolCallAmountCorrect
2. ToolOrderCorrect
3. ToolsCallsInParallelCorrect
4. ToolArgumentsCorrect
5. MessageOrderCorrect
6. CompoundToolCorrectness

We will only measure against the generated tool call output. We will not run evals against a MongoDB database. This is to reduce infrastructure burden, in line with the Compass repo practices.

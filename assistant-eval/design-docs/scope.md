# Scope: Support Evals in Client Code

By [Ben Perlmutter](mailto:ben.p@mongodb.com). Started Feb 11, 2026  
Epic link: [https://jira.mongodb.org/browse/EAI-1548](https://jira.mongodb.org/browse/EAI-1548)

# Summary

1. The Education AI (EAI) team will publish an evaluation library for the MongoDB Assistant API
2. The EAI team will integrate this library into the MongoDB Compass evaluation suite
3. The EAI team will document Evaluation library on [https://mongodb-assistant-docs.prod.corp.mongodb.com/](https://mongodb-assistant-docs.prod.corp.mongodb.com/)

# Motivation

Currently, there is no standardized way for teams to create evaluations on their integration of the MongoDB Assistant API. This makes it harder for the integrators to set up high quality evaluation system, and use them to successfully build products on the Assistant. It also creates more work for the Education AI team because we need to provide more white glove support to help our integrators with their evaluation systems.

As use cases for the Assistant increases in both complexity and number, we need a more scalable system to support these use cases. Publishing a [Node.js](http://Node.js) library to support scaffolding and running evaluations against the Assistant API will make it easier for teams to build evaluation systems on top of the Assistant API with less support work from the EAI team.

We will start using this evaluation package by integrating into the MongoDB Compass evaluation suite. Currently, the Assistant in Compass needs more robust evaluation for its read-only database tool use. Integrating the library into Compass provides a great test case for us to validate the evaluation library while providing value to Compass.

# Terminology

1. n/a

# Goals

1. Flexible evaluation package that reduces the burden of creating an evaluation system on top of the Assistant API.
2. Use this evaluation package to build evaluations for MongoDB Compass MCP server tool call functionality.

# Non-Goals

1. Migrate other existing eval suites to use the evaluation library
   1. I.e. no migration of natural language query bar, Cluster Builder chatbot, etc.

# Open Questions?

1. Should we migrate the other Compass Assistant eval cases?

# User-Facing Changes

- None

# Prior Art

1. Existing Compass eval cases: [https://github.com/mongodb-js/compass/blob/main/packages/compass-generative-ai/tests/evals/gen-ai.eval.ts](https://github.com/mongodb-js/compass/blob/main/packages/compass-generative-ai/tests/evals/gen-ai.eval.ts)
2. MongoDB Assistant eval system: [https://github.com/mongodb/ai-assistant/tree/main/packages/chatbot-server-mongodb-public/src/eval](https://github.com/mongodb/ai-assistant/tree/main/packages/chatbot-server-mongodb-public/src/eval)
   1. Implementation note: we'll basically bundle the existing eval system into a package and publish that to npm.

# Assumptions and risks

- Assumptions:
  - We are able to implement an evaluation library into consumer codebases via an npm package.
- Risks
  - N/A

# Dependencies

- Need to work with the DevTools team on integrating into the Compass repo.

##

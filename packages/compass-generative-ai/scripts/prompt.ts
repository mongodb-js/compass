import { toJSString } from 'mongodb-query-parser';
import { EJSON } from 'bson';
import type { Document } from 'mongodb';

import type { Fixtures } from './fixtures';

export function createSuggestPromptPrompt({
  databaseName,
  collectionName,
  fixtures,
}: {
  databaseName: string;
  collectionName: string;
  fixtures: Fixtures;
}) {
  const sampleDocShellSyntaxString = toJSString(
    EJSON.deserialize(fixtures[databaseName][collectionName][0]),
    2
  );

  const prompt = `
I'm looking to make a natural language prompt to MongoDB query language test.
These will be used to benchmark how good an ai model is at generating queries from a prompt and the schema of a collection.
What is a natural language question/prompt someone would ask of this collection which would generate a complex aggregation pipeline?
At least 5 stages, string or array manipulation may help here.
These must create similar results every time regardless of light interpretation.
Keep the result of running the generated pipeline predictable and consistent.
Keep your response concise, it will be be parsed by a machine.
Dataset: ${databaseName} ${collectionName}
Example document from dataset:
${sampleDocShellSyntaxString}
`;

  // Real world scenarios.

  //   const prompt = `
  // Suggest a natural language prompt for querying a dataset.

  // Keep your response concise, it will be be parsed by a machine.
  // Dataset: ${databaseName} ${collectionName}
  // Example document from dataset:
  // ${sampleDocShellSyntaxString}
  // `;

  return {
    prompt,
  };
}

export function getAggregationSystemPrompt() {
  return `
Reduce prose to the minimum, your output will be parsed by a machine. You generate MongoDB aggregation pipelines. Provide only the aggregation pipeline contents in an array in shell syntax, wrapped with XML delimiters as follows:
<aggregation>[]</aggregation>
Additional instructions:
- If specifying latitude and longitude coordinates, list the longitude first, and then latitude.
- The current date is ${new Date().toString()}
`;
}

export function getQuerySystemPrompt() {
  return `
Reduce prose to the minimum, your output will be parsed by a machine. You generate MongoDB find query arguments. Provide filter, project, sort, skip, limit, and aggregation in shell syntax, wrap each argument with XML delimiters as follows:
<filter>{}</filter>
<project>{}</project>
<sort>{}</sort>
<skip>0</skip>
<limit>0</limit>
<aggregation>[]</aggregation>
Additional instructions:
- Only use the aggregation field when the request cannot be represented with the other fields.
- Do not use the aggregation field if a find query fulfills the objective.
- If specifying latitude and longitude coordinates, list the longitude first, and then latitude.
- The current date is ${new Date().toString()}
`;
}

export function getBaseUserPrompt({
  databaseName,
  collectionName,
  schema,
  sampleDocuments,
}: {
  databaseName: string;
  collectionName: string;
  schema: string;
  sampleDocuments?: Document[];
}) {
  return `
Database name: "${databaseName}"
Collection name: "${collectionName}"
Schema from a sample of documents from the collection:
\`\`\`
${schema}
\`\`\`
${
  sampleDocuments
    ? `
Sample documents:
${toJSString(sampleDocuments)}
`
    : ''
}`;
}

export function getAggregationUserPrompt({
  databaseName,
  collectionName,
  schema,
  userInput,
  sampleDocuments,
}: {
  databaseName: string;
  collectionName: string;
  schema: string;
  userInput: string;
  sampleDocuments?: Document[];
}) {
  return `
${getBaseUserPrompt({
  databaseName,
  collectionName,
  schema,
  sampleDocuments,
})}
Generate an aggregation that does the following: "${userInput}"
`;
}

export function getQueryUserPrompt({
  databaseName,
  collectionName,
  schema,
  userInput,
  sampleDocuments,
}: {
  databaseName: string;
  collectionName: string;
  schema: string;
  userInput: string;
  sampleDocuments?: Document[];
}) {
  return `
${getBaseUserPrompt({
  databaseName,
  collectionName,
  schema,
  sampleDocuments,
})}
Write a query that does the following: "${userInput}"
`;
}

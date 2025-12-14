import { toJSString } from 'mongodb-query-parser';

// When including sample documents, we want to ensure that we do not
// attach large documents and exceed the limit. OpenAI roughly estimates
// 4 characters = 1 token and we should not exceed context window limits.
// This roughly translates to 128k tokens.
// TODO(COMPASS-10129): Adjust this limit based on the model's context window.
const MAX_TOTAL_PROMPT_LENGTH = 512000;
const MIN_SAMPLE_DOCUMENTS = 1;

function getCurrentTimeString() {
  const dateTime = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
    hour12: false,
  };
  // e.g. Tue, Nov 25, 2025, 12:00:00 GMT+1
  return dateTime.toLocaleString('en-US', options);
}

function buildInstructionsForFindQuery() {
  return [
    'Reduce prose to the minimum, your output will be parsed by a machine. ' +
      'You generate MongoDB find query arguments. Provide filter, project, sort, skip, ' +
      'limit and aggregation in shell syntax, wrap each argument with XML delimiters as follows:',
    '<filter>{}</filter>',
    '<project>{}</project>',
    '<sort>{}</sort>',
    '<skip>0</skip>',
    '<limit>0</limit>',
    '<aggregation>[]</aggregation>',
    'Additional instructions:',
    '- Only use the aggregation field when the request cannot be represented with the other fields.',
    '- Do not use the aggregation field if a find query fulfills the objective.',
    '- If specifying latitude and longitude coordinates, list the longitude first, and then latitude.',
    `- The current date is ${getCurrentTimeString()}`,
  ].join('\n');
}

function buildInstructionsForAggregateQuery() {
  return [
    'Reduce prose to the minimum, your output will be parsed by a machine. ' +
      'You generate MongoDB aggregation pipelines. Provide only the aggregation ' +
      'pipeline contents in an array in shell syntax, wrapped with XML delimiters as follows:',
    '<aggregation>[]</aggregation>',
    'Additional instructions:',
    '- If specifying latitude and longitude coordinates, list the longitude first, and then latitude.',
    '- Only pass the contents of the aggregation, no surrounding syntax.',
    `- The current date is ${getCurrentTimeString()}`,
  ].join('\n');
}

type BuildPromptOptions = {
  userInput: string;
  databaseName: string;
  collectionName: string;
  schema?: unknown;
  sampleDocuments?: unknown[];
  type: 'find' | 'aggregate';
};

type BuildMetadataOptions = {
  userId: string;
  enableStorage: boolean;
  requestId: string;
  type: 'find' | 'aggregate';
};

export type PromptContextOptions = Omit<
  BuildPromptOptions & BuildMetadataOptions,
  'type'
>;

function withCodeFence(code: string): string {
  return [
    '', // Line break
    '```',
    code,
    '```',
  ].join('\n');
}

export function escapeUserInput(input: string): string {
  // Explicitly escape the <user_prompt> and </user_prompt> tags
  return input
    .replace('<user_prompt>', '&lt;user_prompt&gt;')
    .replace('</user_prompt>', '&lt;/user_prompt&gt;');
}

function buildUserPromptForQuery({
  type,
  userInput,
  databaseName,
  collectionName,
  schema,
  sampleDocuments,
}: BuildPromptOptions): string {
  const messages = [];

  const queryPrompt = [
    type === 'find' ? 'Write a query' : 'Generate an aggregation',
    'that does the following:',
    `<user_prompt>${escapeUserInput(userInput)}</user_prompt>`,
  ].join(' ');

  if (databaseName) {
    messages.push(`Database name: "${databaseName}"`);
  }
  if (collectionName) {
    messages.push(`Collection name: "${collectionName}"`);
  }
  if (schema) {
    messages.push(
      `Schema from a sample of documents from the collection:${withCodeFence(
        `<user_schema>${toJSString(schema)!}</user_schema>`
      )}`
    );
  }
  if (sampleDocuments) {
    // When attaching the sample documents, we want to ensure that we do not
    // exceed the token limit. So we try following:
    // 1. If attaching all the sample documents exceeds then limit, we attach only 1 document.
    // 2. If attaching 1 document still exceeds the limit, we do not attach any sample documents.
    const sampleDocumentsStr = toJSString(sampleDocuments);
    const singleDocumentStr = toJSString(
      sampleDocuments.slice(0, MIN_SAMPLE_DOCUMENTS)
    );
    const promptLengthWithoutSampleDocs =
      messages.join('\n').length + queryPrompt.length;
    if (
      sampleDocumentsStr &&
      sampleDocumentsStr.length + promptLengthWithoutSampleDocs <=
        MAX_TOTAL_PROMPT_LENGTH
    ) {
      messages.push(
        `Sample documents from the collection:${withCodeFence(
          `<sample_documents>${sampleDocumentsStr}</sample_documents>`
        )}`
      );
    } else if (
      singleDocumentStr &&
      singleDocumentStr.length + promptLengthWithoutSampleDocs <=
        MAX_TOTAL_PROMPT_LENGTH
    ) {
      messages.push(
        `Sample document from the collection:${withCodeFence(
          `<sample_documents>${singleDocumentStr}</sample_documents>`
        )}`
      );
    }
  }

  messages.push(queryPrompt);

  const prompt = messages.join('\n');

  // If at this point we have exceeded the limit, throw an error.
  if (prompt.length > MAX_TOTAL_PROMPT_LENGTH) {
    throw new Error(
      'Sorry, your request is too large. Please use a smaller prompt or try using this feature on a collection with smaller documents.'
    );
  }
  return prompt;
}

export type AiQueryPrompt = {
  prompt: string;
  metadata: {
    instructions: string;
    userId: string;
    requestId: string;
  } & (
    | {
        store: 'true';
        sensitiveStorage: 'sensitive';
      }
    | {
        store: 'false';
      }
  );
};

function buildMetadata({
  type,
  userId,
  requestId,
  enableStorage,
}: BuildMetadataOptions): AiQueryPrompt['metadata'] {
  return {
    instructions:
      type === 'find'
        ? buildInstructionsForFindQuery()
        : buildInstructionsForAggregateQuery(),
    userId,
    requestId,
    ...(enableStorage
      ? {
          sensitiveStorage: 'sensitive',
          store: 'true',
        }
      : {
          store: 'false',
        }),
  };
}

export function buildFindQueryPrompt({
  userId,
  enableStorage,
  requestId,
  ...restOfTheOptions
}: PromptContextOptions): AiQueryPrompt {
  const type = 'find';
  const prompt = buildUserPromptForQuery({
    type,
    ...restOfTheOptions,
  });
  return {
    prompt,
    metadata: buildMetadata({
      type,
      userId,
      requestId,
      enableStorage,
    }),
  };
}

export function buildAggregateQueryPrompt({
  userId,
  enableStorage,
  requestId,
  ...restOfTheOptions
}: PromptContextOptions): AiQueryPrompt {
  const type = 'aggregate';
  const prompt = buildUserPromptForQuery({
    type,
    ...restOfTheOptions,
  });
  return {
    prompt,
    metadata: buildMetadata({ type, userId, requestId, enableStorage }),
  };
}

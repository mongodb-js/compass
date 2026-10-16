import { toJSString } from '@mongodb-js/shell-bson-parser';
import { flattenSchemaToObject } from './util';
import { AiChatbotPromptTooLargeError } from '../chatbot-errors';

// chatbot slim model support ~250k characters
const MAX_TOTAL_PROMPT_LENGTH = 250_000;
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
    '- Do not use database-level aggregation stages ' +
      'such as $documents, $changeStream, $changeStreamSplitLargeEvent, $currentOp, $listLocalSessions, or $queryStats. ' +
      'This aggregation runs against a collection, not a database.',
    `- The current date is ${getCurrentTimeString()}`,
  ].join('\n');
}

const CURRENT_QUERY_FIELDS = [
  'filter',
  'project',
  'sort',
  'skip',
  'limit',
] as const;

// Raw editor text rather than re-serialized values, so that the user's
// comments and formatting are kept.
export type CurrentQuery = Partial<
  Record<(typeof CURRENT_QUERY_FIELDS)[number], string>
>;

type BuildPromptOptions = {
  userInput: string;
  databaseName: string;
  collectionName: string;
  schema?: unknown;
  sampleDocuments?: unknown[];
  type: 'find' | 'aggregate';
  currentCode?: string;
};

type BuildMetadataOptions = {
  analyticsId: string;
  enableStorage: boolean;
  requestId: string;
  type: 'find' | 'aggregate';
};

export type PromptContextOptions = Omit<
  BuildPromptOptions & BuildMetadataOptions,
  'type' | 'currentCode'
>;

export type FindQueryPromptOptions = PromptContextOptions & {
  currentQuery?: CurrentQuery;
};

export type AggregateQueryPromptOptions = PromptContextOptions & {
  currentPipeline?: string;
};

function withCodeFence(code: string): string {
  return [
    '', // Line break
    '```',
    code,
    '```',
  ].join('\n');
}

function escapeTag(input: string, tag: string): string {
  return input
    .replaceAll(`<${tag}>`, `&lt;${tag}&gt;`)
    .replaceAll(`</${tag}>`, `&lt;/${tag}&gt;`);
}

export function escapeUserInput(input: string): string {
  return escapeTag(input, 'user_prompt');
}

function formatCurrentQuery(query: CurrentQuery = {}): string | undefined {
  const fields = CURRENT_QUERY_FIELDS.flatMap((field) => {
    const value = query[field]?.trim();
    return value ? [`<${field}>${value}</${field}>`] : [];
  });
  return fields.length > 0 ? fields.join('\n') : undefined;
}

function formatCurrentPipeline(pipeline = ''): string | undefined {
  return ['', '[]'].includes(pipeline.replace(/\s/g, ''))
    ? undefined
    : pipeline.trim();
}

function buildCurrentCodeMessage(
  type: BuildPromptOptions['type'],
  code: string
): string {
  const [label, tag] =
    type === 'find'
      ? ['query', 'current_query']
      : ['aggregation', 'current_aggregation'];
  return (
    `The user's current ${label} is included below. It may or may not be relevant to their request. ` +
    'If the request builds on it (for example, by asking to change, extend or fix it), ' +
    'use it as the starting point and keep the parts that the request does not change. ' +
    `Otherwise, ignore it.${withCodeFence(
      `<${tag}>${escapeTag(code, tag)}</${tag}>`
    )}`
  );
}

function buildUserPromptForQuery({
  type,
  userInput,
  databaseName,
  collectionName,
  schema,
  sampleDocuments,
  currentCode,
}: BuildPromptOptions): string {
  const messages = [];
  const currentCodeMessage = currentCode
    ? buildCurrentCodeMessage(type, currentCode)
    : undefined;

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
    const schemaStr = toJSString(flattenSchemaToObject(schema));
    messages.push(
      `Schema from a sample of documents from the collection:${withCodeFence(
        `<user_schema>${schemaStr}</user_schema>`
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
      messages.join('\n').length +
      queryPrompt.length +
      (currentCodeMessage?.length ?? 0);
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

  if (currentCodeMessage) {
    messages.push(currentCodeMessage);
  }

  messages.push(queryPrompt);

  const prompt = messages.join('\n');

  // If at this point we have exceeded the limit, throw an error.
  if (prompt.length > MAX_TOTAL_PROMPT_LENGTH) {
    throw new AiChatbotPromptTooLargeError(
      'Sorry, your request is too large. Please use a smaller prompt or try using this feature on a collection with smaller documents.'
    );
  }
  return prompt;
}

export type AiQueryPrompt = {
  prompt: string;
  metadata: {
    instructions: string;
    analyticsId: string;
    requestId: string;
    sensitiveStorage: 'true' | 'false';
  };
};

function buildMetadata({
  type,
  analyticsId,
  requestId,
  enableStorage,
}: BuildMetadataOptions): AiQueryPrompt['metadata'] {
  return {
    instructions:
      type === 'find'
        ? buildInstructionsForFindQuery()
        : buildInstructionsForAggregateQuery(),
    analyticsId,
    requestId,
    sensitiveStorage: enableStorage ? 'true' : 'false',
  };
}

export function buildFindQueryPrompt({
  analyticsId,
  enableStorage,
  requestId,
  currentQuery,
  ...restOfTheOptions
}: FindQueryPromptOptions): AiQueryPrompt {
  const type = 'find';
  const prompt = buildUserPromptForQuery({
    type,
    currentCode: formatCurrentQuery(currentQuery),
    ...restOfTheOptions,
  });
  return {
    prompt,
    metadata: buildMetadata({
      type,
      analyticsId,
      requestId,
      enableStorage,
    }),
  };
}

export function buildAggregateQueryPrompt({
  analyticsId,
  enableStorage,
  requestId,
  currentPipeline,
  ...restOfTheOptions
}: AggregateQueryPromptOptions): AiQueryPrompt {
  const type = 'aggregate';
  const prompt = buildUserPromptForQuery({
    type,
    currentCode: formatCurrentPipeline(currentPipeline),
    ...restOfTheOptions,
  });
  return {
    prompt,
    metadata: buildMetadata({ type, analyticsId, requestId, enableStorage }),
  };
}

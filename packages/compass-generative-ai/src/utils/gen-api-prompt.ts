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
  // Tue, Nov 25, 2025, 12:06:20 GMT+1
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

type QueryType = 'find' | 'aggregate';

export type UserPromptForQueryOptions = {
  type: QueryType;
  userPrompt: string;
  databaseName?: string;
  collectionName?: string;
  schema?: unknown;
  sampleDocuments?: unknown[];
};

export function buildInstructionsForQuery({ type }: { type: QueryType }) {
  return type === 'find'
    ? buildInstructionsForFindQuery()
    : buildInstructionsForAggregateQuery();
}

export function buildUserPromptForQuery({
  type,
  userPrompt,
  databaseName,
  collectionName,
  schema,
  sampleDocuments,
}: UserPromptForQueryOptions): string {
  const messages = [];

  const queryPrompt = [
    type === 'find' ? 'Write a query' : 'Generate an aggregation',
    'that does the following:',
    `"${userPrompt}"`,
  ].join(' ');

  if (databaseName) {
    messages.push(`Database name: "${databaseName}"`);
  }
  if (collectionName) {
    messages.push(`Collection name: "${collectionName}"`);
  }
  if (schema) {
    messages.push(
      'Schema from a sample of documents from the collection: ```' +
        JSON.stringify(schema) +
        '```'
    );
  }
  if (sampleDocuments) {
    // When attaching the sample documents, we want to ensure that we do not
    // exceed the token limit. So we try following:
    // 1. If attaching all the sample documents exceeds then limit, we attach only 1 document.
    // 2. If attaching 1 document still exceeds the limit, we do not attach any sample documents.
    const sampleDocumentsStr = JSON.stringify(sampleDocuments);
    const singleDocumentStr = JSON.stringify(
      sampleDocuments.slice(0, MIN_SAMPLE_DOCUMENTS)
    );
    if (
      sampleDocumentsStr.length +
        messages.join('\n').length +
        queryPrompt.length <=
      MAX_TOTAL_PROMPT_LENGTH
    ) {
      messages.push(
        'Sample documents from the collection: ```' + sampleDocumentsStr + '```'
      );
    } else if (
      singleDocumentStr.length +
        messages.join('\n').length +
        queryPrompt.length <=
      MAX_TOTAL_PROMPT_LENGTH
    ) {
      messages.push(
        'Sample document from the collection: ```' + singleDocumentStr + '```'
      );
    }
  }
  messages.push(queryPrompt);
  return messages.join('\n');
}

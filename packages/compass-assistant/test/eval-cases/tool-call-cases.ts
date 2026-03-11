/**
 * Eval cases for testing tool call correctness.
 *
 * Each case defines a user prompt and the expected tool calls the assistant
 * should generate (tool name + arguments). We evaluate the generated tool calls
 * against these expectations using assertion-based scorers.
 */

// ---------------------------------------------------------------------------
// Types — tool call expectations use AEL schema types
// ---------------------------------------------------------------------------

import type { ExpectedToolCallMessage as ExpectedOutputMessage } from 'mongodb-assistant-eval/schema';
import { EVAL_CLUSTER_UID } from '../eval-config';

export type { ExpectedOutputMessage };

export interface CompassAssistantCustomInput {
  [key: string]: unknown;
  clusterUid: string;
  databaseName: string;
  collectionName: string;
  currentQuery?: {
    filter?: Record<string, unknown>;
    projection?: Record<string, 0 | 1>;
    sort?: Record<string, 1 | -1>;
    skip?: number;
    limit?: number;
  };
  currentPipeline?: Record<string, unknown>[];
}

/**
 * Difficulty rubric for tool-call eval cases:
 * - `easy`: The user intent maps directly to a single obvious tool call with
 *   little or no inference. Arguments are simple, explicit, and usually require
 *   only straightforward field/value translation.
 * - `medium`: The case still resolves cleanly, but requires some reasoning
 *   about argument construction, current query/pipeline context, or a moderately
 *   complex filter / projection / sort / aggregation shape.
 * - `hard`: The assistant must do meaningful planning or disambiguation, such
 *   as coordinating multiple tool calls, composing multi-stage logic, or
 *   inferring non-trivial arguments from underspecified user intent. This also
 *   includes cases where the hardest part is deciding that no tool call should
 *   be made at all, such as refusals, clarification-worthy context conflicts,
 *   or knowledge-only questions.
 */
type ToolCallEvalCaseDifficulty = 'easy' | 'medium' | 'hard';
type ToolCallEvalCaseTag = ToolCallEvalCaseDifficulty | (string & {});

export interface ToolCallEvalCase {
  name: string;
  description?: string;
  input: {
    messages: { role: 'user' | 'assistant'; content: string }[];
    custom: CompassAssistantCustomInput;
  };
  expected: {
    outputMessages: ExpectedOutputMessage[];
  };
  tags: ToolCallEvalCaseTag[];
  metadata?: Record<string, unknown> & {
    difficulty: ToolCallEvalCaseDifficulty;
  };
  skip?: boolean;
}

type DeepExpectedToolArgument = {
  name: string;
  type?: 'string' | 'array' | 'object' | 'boolean' | 'number';
  value?: unknown;
  matchRegex?: string;
  size?: {
    gt?: number;
    gte?: number;
    lt?: number;
    lte?: number;
    eq?: number;
    neq?: number;
  };
};

type DeepExpectedOutputMessage = Omit<ExpectedOutputMessage, 'toolCalls'> & {
  toolCalls: Array<{
    name: string;
    arguments?: DeepExpectedToolArgument[];
  }>;
};

// The scorer can compare nested objects/arrays, but the exported schema type
// only models shallow argument values. Use this helper when we want to assert
// full `pipeline` or `method` payloads.
function expectedToolMessage(
  message: DeepExpectedOutputMessage
): ExpectedOutputMessage {
  return message as ExpectedOutputMessage;
}

// ---------------------------------------------------------------------------
// Eval cases
// ---------------------------------------------------------------------------

const mflixCustomInput: CompassAssistantCustomInput = {
  clusterUid: EVAL_CLUSTER_UID,
  databaseName: 'sample_mflix',
  collectionName: 'movies',
};

const airbnbCustomInput: CompassAssistantCustomInput = {
  clusterUid: EVAL_CLUSTER_UID,
  databaseName: 'sample_airbnb',
  collectionName: 'listingsAndReviews',
};

const restaurantsCustomInput: CompassAssistantCustomInput = {
  clusterUid: EVAL_CLUSTER_UID,
  databaseName: 'sample_restaurants',
  collectionName: 'restaurants',
};

const suppliesCustomInput: CompassAssistantCustomInput = {
  clusterUid: EVAL_CLUSTER_UID,
  databaseName: 'sample_supplies',
  collectionName: 'sales',
};

const weatherDataCustomInput: CompassAssistantCustomInput = {
  clusterUid: EVAL_CLUSTER_UID,
  databaseName: 'sample_weatherdata',
  collectionName: 'data',
};

// --- list-databases --------------------------------------------------------

const listDatabasesCases: ToolCallEvalCase[] = [
  {
    name: 'list-databases: simple request',
    input: {
      messages: [{ role: 'user', content: 'What databases are available?' }],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [{ name: 'list-databases' }],
        },
      ],
    },
    tags: ['list-databases', 'single-tool'],
    metadata: { difficulty: 'easy' },
  },
  {
    name: 'list-databases: show me all dbs',
    input: {
      messages: [
        { role: 'user', content: 'Show me all the databases on this cluster.' },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [{ name: 'list-databases' }],
        },
      ],
    },
    tags: ['list-databases', 'single-tool'],
    metadata: { difficulty: 'easy' },
  },
  {
    name: 'list-databases: how many databases',
    input: {
      messages: [{ role: 'user', content: 'How many databases are there?' }],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [{ name: 'list-databases' }],
        },
      ],
    },
    tags: ['list-databases', 'single-tool'],
    metadata: { difficulty: 'easy' },
  },
  {
    name: 'portuguese list databases request',
    input: {
      messages: [
        {
          role: 'user',
          content: 'Quais bancos de dados estao disponiveis neste cluster?',
        },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [{ name: 'list-databases' }],
        },
      ],
    },
    tags: ['hard', 'non-english', 'list-databases'],
    metadata: { difficulty: 'hard' },
  },
];

// --- list-collections ------------------------------------------------------

const listCollectionsCases: ToolCallEvalCase[] = [
  {
    name: 'list-collections: what collections in db',
    input: {
      messages: [
        {
          role: 'user',
          content: 'What collections are in the sample_mflix database?',
        },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'list-collections',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['list-collections', 'single-tool'],
    metadata: { difficulty: 'easy' },
  },
  {
    name: 'list-collections: show collections',
    input: {
      messages: [
        { role: 'user', content: 'Show me the collections in this database.' },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'list-collections',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['list-collections', 'single-tool'],
    metadata: { difficulty: 'easy' },
  },
  {
    name: 'list-collections: tables in airbnb',
    input: {
      messages: [
        {
          role: 'user',
          content: 'What tables exist in the sample_airbnb database?',
        },
      ],
      custom: airbnbCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'list-collections',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_airbnb' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['list-collections', 'single-tool'],
    metadata: { difficulty: 'easy' },
  },
  {
    name: 'list-collections: weather data db contents',
    input: {
      messages: [
        {
          role: 'user',
          content: 'What collections are in the sample_weatherdata database?',
        },
      ],
      custom: weatherDataCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'list-collections',
              arguments: [
                {
                  name: 'database',
                  type: 'string',
                  value: 'sample_weatherdata',
                },
              ],
            },
          ],
        },
      ],
    },
    tags: ['list-collections', 'single-tool'],
    metadata: { difficulty: 'easy' },
  },
  {
    name: 'list-collections: restaurant sample db',
    input: {
      messages: [
        {
          role: 'user',
          content: 'Show me the collections in sample_restaurants.',
        },
      ],
      custom: restaurantsCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'list-collections',
              arguments: [
                {
                  name: 'database',
                  type: 'string',
                  value: 'sample_restaurants',
                },
              ],
            },
          ],
        },
      ],
    },
    tags: ['list-collections', 'single-tool'],
    metadata: { difficulty: 'easy' },
  },
  {
    name: 'use prompt database over current context',
    input: {
      messages: [
        {
          role: 'user',
          content: 'Show me collections in the airbnb database.',
        },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'list-collections',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_airbnb' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['list-collections', 'medium', 'context-mismatch'],
    metadata: { difficulty: 'medium' },
  },
];

// --- collection-schema -----------------------------------------------------

const collectionSchemaCases: ToolCallEvalCase[] = [
  {
    name: 'collection-schema: describe schema',
    input: {
      messages: [
        {
          role: 'user',
          content:
            'What does the movies collection look like? Show me the schema.',
        },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'collection-schema',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
                { name: 'collection', type: 'string', value: 'movies' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['collection-schema', 'single-tool'],
    metadata: { difficulty: 'easy' },
  },
  {
    name: 'collection-schema: what fields exist',
    input: {
      messages: [
        {
          role: 'user',
          content: 'What fields does the listingsAndReviews collection have?',
        },
      ],
      custom: airbnbCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'collection-schema',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_airbnb' },
                {
                  name: 'collection',
                  type: 'string',
                  value: 'listingsAndReviews',
                },
              ],
            },
          ],
        },
      ],
    },
    tags: ['collection-schema', 'single-tool'],
    metadata: { difficulty: 'easy' },
  },
  {
    name: 'collection-schema: data types',
    input: {
      messages: [
        {
          role: 'user',
          content: 'What are the data types in this collection?',
        },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'collection-schema',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
                { name: 'collection', type: 'string', value: 'movies' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['collection-schema', 'single-tool'],
    metadata: { difficulty: 'easy' },
  },
  {
    name: 'collection-schema: sales documents schema',
    input: {
      messages: [
        {
          role: 'user',
          content: 'What fields are in the sales collection?',
        },
      ],
      custom: suppliesCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'collection-schema',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_supplies' },
                { name: 'collection', type: 'string', value: 'sales' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['collection-schema', 'single-tool'],
    metadata: { difficulty: 'easy' },
  },
];

// --- collection-indexes ----------------------------------------------------

const collectionIndexesCases: ToolCallEvalCase[] = [
  {
    name: 'collection-indexes: list indexes',
    input: {
      messages: [
        {
          role: 'user',
          content: 'What indexes exist on the movies collection?',
        },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'collection-indexes',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
                { name: 'collection', type: 'string', value: 'movies' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['collection-indexes', 'single-tool'],
    metadata: { difficulty: 'easy' },
  },
  {
    name: 'collection-indexes: are there indexes',
    input: {
      messages: [
        {
          role: 'user',
          content: 'Are there any indexes on listingsAndReviews?',
        },
      ],
      custom: airbnbCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'collection-indexes',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_airbnb' },
                {
                  name: 'collection',
                  type: 'string',
                  value: 'listingsAndReviews',
                },
              ],
            },
          ],
        },
      ],
    },
    tags: ['collection-indexes', 'single-tool'],
    metadata: { difficulty: 'easy' },
  },
  {
    name: 'collection-indexes: show me the indexes',
    input: {
      messages: [
        { role: 'user', content: 'Show me the indexes for this collection.' },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'collection-indexes',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
                { name: 'collection', type: 'string', value: 'movies' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['collection-indexes', 'single-tool'],
    metadata: { difficulty: 'easy' },
  },
  {
    name: 'collection-indexes: restaurant indexes',
    input: {
      messages: [
        {
          role: 'user',
          content: 'What indexes are available on the restaurants collection?',
        },
      ],
      custom: restaurantsCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'collection-indexes',
              arguments: [
                {
                  name: 'database',
                  type: 'string',
                  value: 'sample_restaurants',
                },
                {
                  name: 'collection',
                  type: 'string',
                  value: 'restaurants',
                },
              ],
            },
          ],
        },
      ],
    },
    tags: ['collection-indexes', 'single-tool'],
    metadata: { difficulty: 'easy' },
  },
  {
    name: 'collection-indexes: weather data indexes',
    input: {
      messages: [
        {
          role: 'user',
          content:
            'Show me the indexes on the weather observations collection.',
        },
      ],
      custom: weatherDataCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'collection-indexes',
              arguments: [
                {
                  name: 'database',
                  type: 'string',
                  value: 'sample_weatherdata',
                },
                { name: 'collection', type: 'string', value: 'data' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['collection-indexes', 'single-tool'],
    metadata: { difficulty: 'easy' },
  },
  {
    name: 'check index coverage for borough and cuisine queries',
    input: {
      messages: [
        {
          role: 'user',
          content:
            'Am I missing any indexes for queries filtering by borough and cuisine?',
        },
      ],
      custom: restaurantsCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'collection-indexes',
              arguments: [
                {
                  name: 'database',
                  type: 'string',
                  value: 'sample_restaurants',
                },
                {
                  name: 'collection',
                  type: 'string',
                  value: 'restaurants',
                },
              ],
            },
          ],
        },
      ],
    },
    tags: ['collection-indexes', 'medium', 'inference'],
    metadata: { difficulty: 'medium' },
  },
];

// --- find ------------------------------------------------------------------

const findCases: ToolCallEvalCase[] = [
  {
    name: 'find: movies from a specific year',
    input: {
      messages: [{ role: 'user', content: 'Find all movies from 1994.' }],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'find',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
                { name: 'collection', type: 'string', value: 'movies' },
                { name: 'filter', type: 'object', value: { year: 1994 } },
              ],
            },
          ],
        },
      ],
    },
    tags: ['find', 'single-tool'],
    metadata: { difficulty: 'easy' },
  },
  {
    name: 'find: listings under a price',
    input: {
      messages: [
        { role: 'user', content: 'Show me all airbnb listings under $100.' },
      ],
      custom: airbnbCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'find',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_airbnb' },
                {
                  name: 'collection',
                  type: 'string',
                  value: 'listingsAndReviews',
                },
              ],
            },
          ],
        },
      ],
    },
    tags: ['find', 'single-tool'],
    metadata: { difficulty: 'medium' },
  },
  {
    name: 'find: movies with high rating',
    input: {
      messages: [
        { role: 'user', content: 'Find movies with an IMDB rating above 8.0.' },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'find',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
                { name: 'collection', type: 'string', value: 'movies' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['find', 'single-tool'],
    metadata: { difficulty: 'medium' },
  },
  {
    name: 'find: with limit',
    input: {
      messages: [
        { role: 'user', content: 'Show me 5 movies from the database.' },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'find',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
                { name: 'collection', type: 'string', value: 'movies' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['find', 'single-tool'],
    metadata: { difficulty: 'easy' },
  },
  {
    name: 'find: brooklyn american restaurants',
    input: {
      messages: [
        {
          role: 'user',
          content: 'Find American restaurants in Brooklyn.',
        },
      ],
      custom: restaurantsCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'find',
              arguments: [
                {
                  name: 'database',
                  type: 'string',
                  value: 'sample_restaurants',
                },
                {
                  name: 'collection',
                  type: 'string',
                  value: 'restaurants',
                },
                {
                  name: 'filter',
                  type: 'object',
                  value: { borough: 'Brooklyn', cuisine: 'American' },
                },
              ],
            },
          ],
        },
      ],
    },
    tags: ['find', 'single-tool'],
    metadata: { difficulty: 'medium' },
  },
  // These weather find cases are intentionally strict schema-grounding checks.
  // We want to catch hallucinated field names like `station`, `station_id`,
  // or `date` instead of the seeded schema's `st` and `ts`.
  {
    name: 'find: weather observations by station',
    input: {
      messages: [
        {
          role: 'user',
          content: 'Find weather observations for station x+47600-047900.',
        },
      ],
      custom: weatherDataCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'find',
              arguments: [
                {
                  name: 'database',
                  type: 'string',
                  value: 'sample_weatherdata',
                },
                { name: 'collection', type: 'string', value: 'data' },
                {
                  name: 'filter',
                  type: 'object',
                  value: { st: 'x+47600-047900' },
                },
              ],
            },
          ],
        },
      ],
    },
    tags: ['find', 'single-tool'],
    metadata: { difficulty: 'medium' },
  },
  {
    name: 'find: latest weather observations for station',
    input: {
      messages: [
        {
          role: 'user',
          content:
            'Show me the 2 latest weather observations for station x+47600-047900.',
        },
      ],
      custom: weatherDataCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'find',
              arguments: [
                {
                  name: 'database',
                  type: 'string',
                  value: 'sample_weatherdata',
                },
                { name: 'collection', type: 'string', value: 'data' },
                {
                  name: 'filter',
                  type: 'object',
                  value: { st: 'x+47600-047900' },
                },
                { name: 'limit', type: 'number', value: 2 },
                {
                  name: 'sort',
                  type: 'object',
                  value: { ts: -1 },
                },
              ],
            },
          ],
        },
      ],
    },
    tags: ['find', 'single-tool'],
    metadata: { difficulty: 'hard' },
  },
  {
    name: 'find: weather station projection',
    input: {
      messages: [
        {
          role: 'user',
          content:
            'Show me just the station id and timestamp for observations from station x+45200-066500.',
        },
      ],
      custom: weatherDataCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'find',
              arguments: [
                {
                  name: 'database',
                  type: 'string',
                  value: 'sample_weatherdata',
                },
                { name: 'collection', type: 'string', value: 'data' },
                {
                  name: 'filter',
                  type: 'object',
                  value: { st: 'x+45200-066500' },
                },
                {
                  name: 'projection',
                  type: 'object',
                  value: { st: 1, ts: 1, _id: 0 },
                },
              ],
            },
          ],
        },
      ],
    },
    tags: ['find', 'single-tool'],
    metadata: { difficulty: 'hard' },
  },
  {
    name: 'use users collection despite current context',
    input: {
      messages: [
        { role: 'user', content: 'Run a find query on the users collection.' },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'find',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
                { name: 'collection', type: 'string', value: 'users' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['hard', 'context-mismatch', 'find'],
    metadata: { difficulty: 'hard' },
  },
  {
    name: 'choose find for most recent movies',
    input: {
      messages: [
        { role: 'user', content: 'Show me the 5 most recent movies.' },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'find',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
                { name: 'collection', type: 'string', value: 'movies' },
                { name: 'limit', type: 'number', value: 5 },
                {
                  name: 'sort',
                  type: 'object',
                  value: { year: -1 },
                },
              ],
            },
          ],
        },
      ],
    },
    tags: ['hard', 'find', 'find-vs-aggregate'],
    metadata: { difficulty: 'hard' },
  },
  {
    name: 'find by nested cleanliness score',
    input: {
      messages: [
        {
          role: 'user',
          content:
            'Find airbnb listings where the cleanliness review score is above 9.',
        },
      ],
      custom: airbnbCustomInput,
    },
    expected: {
      outputMessages: [
        expectedToolMessage({
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'find',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_airbnb' },
                {
                  name: 'collection',
                  type: 'string',
                  value: 'listingsAndReviews',
                },
                {
                  name: 'filter',
                  type: 'object',
                  value: {
                    'review_scores.review_scores_cleanliness': { $gt: 9 },
                  },
                },
              ],
            },
          ],
        }),
      ],
    },
    tags: ['hard', 'find', 'nested-field'],
    metadata: { difficulty: 'hard' },
  },
  {
    name: 'use all operator for multiple genres',
    input: {
      messages: [
        {
          role: 'user',
          content: 'Find movies that are both Action and Comedy.',
        },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        expectedToolMessage({
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'find',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
                { name: 'collection', type: 'string', value: 'movies' },
                {
                  name: 'filter',
                  type: 'object',
                  value: { genres: { $all: ['Action', 'Comedy'] } },
                },
              ],
            },
          ],
        }),
      ],
    },
    tags: ['hard', 'find', 'array-operator'],
    metadata: { difficulty: 'hard' },
  },
  {
    name: 'projection for newest movies',
    input: {
      messages: [
        {
          role: 'user',
          content:
            'Show me just the title and year of the 10 newest movies, nothing else.',
        },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'find',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
                { name: 'collection', type: 'string', value: 'movies' },
                { name: 'limit', type: 'number', value: 10 },
                {
                  name: 'sort',
                  type: 'object',
                  value: { year: -1 },
                },
                {
                  name: 'projection',
                  type: 'object',
                  value: { title: 1, year: 1, _id: 0 },
                },
              ],
            },
          ],
        },
      ],
    },
    tags: ['hard', 'find', 'projection'],
    metadata: { difficulty: 'hard' },
  },
  {
    name: 'compound find with sort stays find',
    input: {
      messages: [
        {
          role: 'user',
          content:
            'Show me R-rated movies featuring Tom Hanks released after 2000, sorted by IMDB rating descending.',
        },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        expectedToolMessage({
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'find',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
                { name: 'collection', type: 'string', value: 'movies' },
                {
                  name: 'filter',
                  type: 'object',
                  value: {
                    rated: 'R',
                    cast: 'Tom Hanks',
                    year: { $gt: 2000 },
                  },
                },
                {
                  name: 'sort',
                  type: 'object',
                  value: { 'imdb.rating': -1 },
                },
              ],
            },
          ],
        }),
      ],
    },
    tags: ['hard', 'find', 'compound-filter', 'find-vs-aggregate'],
    metadata: { difficulty: 'hard' },
  },
  {
    name: 'xor action and comedy genres',
    input: {
      messages: [
        {
          role: 'user',
          content: 'Find movies that are Action or Comedy, but not both.',
        },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        expectedToolMessage({
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'find',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
                { name: 'collection', type: 'string', value: 'movies' },
                {
                  name: 'filter',
                  type: 'object',
                  value: {
                    $or: [{ genres: 'Action' }, { genres: 'Comedy' }],
                    $nor: [{ genres: { $all: ['Action', 'Comedy'] } }],
                  },
                },
              ],
            },
          ],
        }),
      ],
    },
    tags: ['hard', 'find', 'logical-operators'],
    metadata: { difficulty: 'hard' },
  },
  {
    name: 'most recent movies without aggregation',
    input: {
      messages: [
        {
          role: 'user',
          content: 'Find the 10 newest movies, but do not use aggregation.',
        },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'find',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
                { name: 'collection', type: 'string', value: 'movies' },
                { name: 'limit', type: 'number', value: 10 },
                {
                  name: 'sort',
                  type: 'object',
                  value: { year: -1 },
                },
              ],
            },
          ],
        },
      ],
    },
    tags: ['hard', 'find', 'find-vs-aggregate', 'negative-constraint'],
    metadata: { difficulty: 'hard' },
  },
];

// --- aggregate -------------------------------------------------------------

const aggregateCases: ToolCallEvalCase[] = [
  {
    name: 'aggregate: count movies by genre',
    input: {
      messages: [
        { role: 'user', content: 'How many movies are there per genre?' },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'aggregate',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
                { name: 'collection', type: 'string', value: 'movies' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['aggregate', 'single-tool'],
    metadata: { difficulty: 'medium' },
  },
  {
    name: 'aggregate: average price by property type',
    input: {
      messages: [
        {
          role: 'user',
          content:
            'What is the average listing price grouped by property type?',
        },
      ],
      custom: airbnbCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'aggregate',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_airbnb' },
                {
                  name: 'collection',
                  type: 'string',
                  value: 'listingsAndReviews',
                },
              ],
            },
          ],
        },
      ],
    },
    tags: ['aggregate', 'single-tool'],
    metadata: { difficulty: 'medium' },
  },
  // Canonical expectation is `find`; `aggregate` would also be a reasonable
  // interpretation here, but the current eval schema cannot express oneOf.
  {
    name: 'find: top rated movies (canonical over aggregate)',
    input: {
      messages: [
        {
          role: 'user',
          content:
            'What are the top 5 highest rated movies sorted by IMDB rating?',
        },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'find',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
                { name: 'collection', type: 'string', value: 'movies' },
                { name: 'limit', type: 'number', value: 5 },
                {
                  name: 'sort',
                  type: 'object',
                  value: { 'imdb.rating': -1 },
                },
              ],
            },
          ],
        },
      ],
    },
    tags: ['find', 'single-tool'],
    metadata: { difficulty: 'hard' },
  },
  {
    name: 'aggregate: group and count',
    input: {
      messages: [
        { role: 'user', content: 'Group listings by country and count them.' },
      ],
      custom: airbnbCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'aggregate',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_airbnb' },
                {
                  name: 'collection',
                  type: 'string',
                  value: 'listingsAndReviews',
                },
              ],
            },
          ],
        },
      ],
    },
    tags: ['aggregate', 'single-tool'],
    metadata: { difficulty: 'medium' },
  },
  {
    name: 'aggregate: count sales by purchase method',
    input: {
      messages: [
        {
          role: 'user',
          content: 'Count sales by purchase method.',
        },
      ],
      custom: suppliesCustomInput,
    },
    expected: {
      outputMessages: [
        expectedToolMessage({
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'aggregate',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_supplies' },
                { name: 'collection', type: 'string', value: 'sales' },
                {
                  name: 'pipeline',
                  type: 'array',
                  value: [
                    {
                      $group: {
                        _id: '$purchaseMethod',
                        count: { $sum: 1 },
                      },
                    },
                  ],
                },
              ],
            },
          ],
        }),
      ],
    },
    tags: ['aggregate', 'single-tool'],
    metadata: { difficulty: 'medium' },
  },
  {
    name: 'aggregate: average air temperature by station',
    input: {
      messages: [
        {
          role: 'user',
          content: 'What is the average air temperature per station?',
        },
      ],
      custom: weatherDataCustomInput,
    },
    expected: {
      outputMessages: [
        expectedToolMessage({
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'aggregate',
              arguments: [
                {
                  name: 'database',
                  type: 'string',
                  value: 'sample_weatherdata',
                },
                { name: 'collection', type: 'string', value: 'data' },
                {
                  name: 'pipeline',
                  type: 'array',
                  value: [
                    {
                      $group: {
                        _id: '$st',
                        avgAirTemperature: { $avg: '$airTemperature.value' },
                      },
                    },
                  ],
                },
              ],
            },
          ],
        }),
      ],
    },
    tags: ['aggregate', 'single-tool'],
    metadata: { difficulty: 'hard' },
  },
  {
    name: 'aggregate: count weather observations by section',
    input: {
      messages: [
        {
          role: 'user',
          content: 'How many weather observations are there per section code?',
        },
      ],
      custom: weatherDataCustomInput,
    },
    expected: {
      outputMessages: [
        expectedToolMessage({
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'aggregate',
              arguments: [
                {
                  name: 'database',
                  type: 'string',
                  value: 'sample_weatherdata',
                },
                { name: 'collection', type: 'string', value: 'data' },
                {
                  name: 'pipeline',
                  type: 'array',
                  value: [
                    { $unwind: '$sections' },
                    {
                      $group: {
                        _id: '$sections',
                        count: { $sum: 1 },
                      },
                    },
                  ],
                },
              ],
            },
          ],
        }),
      ],
    },
    tags: ['aggregate', 'single-tool'],
    metadata: { difficulty: 'hard' },
  },
  {
    name: 'aggregate: maximum pressure by station',
    input: {
      messages: [
        {
          role: 'user',
          content: 'What is the maximum pressure reading for each station?',
        },
      ],
      custom: weatherDataCustomInput,
    },
    expected: {
      outputMessages: [
        expectedToolMessage({
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'aggregate',
              arguments: [
                {
                  name: 'database',
                  type: 'string',
                  value: 'sample_weatherdata',
                },
                { name: 'collection', type: 'string', value: 'data' },
                {
                  name: 'pipeline',
                  type: 'array',
                  value: [
                    {
                      $group: {
                        _id: '$st',
                        maxPressure: { $max: '$pressure.value' },
                      },
                    },
                  ],
                },
              ],
            },
          ],
        }),
      ],
    },
    tags: ['aggregate', 'single-tool'],
    metadata: { difficulty: 'hard' },
  },
  {
    name: 'average imdb rating per genre',
    input: {
      messages: [
        { role: 'user', content: "What's the average IMDB rating per genre?" },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        expectedToolMessage({
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'aggregate',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
                { name: 'collection', type: 'string', value: 'movies' },
                {
                  name: 'pipeline',
                  type: 'array',
                  value: [
                    { $unwind: '$genres' },
                    {
                      $group: {
                        _id: '$genres',
                        avgImdbRating: { $avg: '$imdb.rating' },
                      },
                    },
                  ],
                },
              ],
            },
          ],
        }),
      ],
    },
    tags: ['aggregate', 'medium', 'natural-language-query'],
    metadata: { difficulty: 'medium' },
  },
  {
    name: 'lookup top commented movies',
    input: {
      messages: [
        {
          role: 'user',
          content:
            'Which movies have the most user comments? Show me the top 5.',
        },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        expectedToolMessage({
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'aggregate',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
                { name: 'collection', type: 'string', value: 'movies' },
                {
                  name: 'pipeline',
                  type: 'array',
                  value: [
                    {
                      $lookup: {
                        from: 'comments',
                        localField: '_id',
                        foreignField: 'movie_id',
                        as: 'comments',
                      },
                    },
                    {
                      $addFields: {
                        commentCount: { $size: '$comments' },
                      },
                    },
                    {
                      $project: {
                        title: 1,
                        commentCount: 1,
                      },
                    },
                    { $sort: { commentCount: -1 } },
                    { $limit: 5 },
                  ],
                },
              ],
            },
          ],
        }),
      ],
    },
    tags: ['hard', 'aggregate', 'lookup', 'cross-collection'],
    metadata: { difficulty: 'hard' },
  },
  {
    name: 'most common sales item tags',
    input: {
      messages: [
        {
          role: 'user',
          content: 'What are the 10 most common item tags across all sales?',
        },
      ],
      custom: suppliesCustomInput,
    },
    expected: {
      outputMessages: [
        expectedToolMessage({
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'aggregate',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_supplies' },
                { name: 'collection', type: 'string', value: 'sales' },
                {
                  name: 'pipeline',
                  type: 'array',
                  value: [
                    { $unwind: '$items' },
                    { $unwind: '$items.tags' },
                    {
                      $group: {
                        _id: '$items.tags',
                        count: { $sum: 1 },
                      },
                    },
                    { $sort: { count: -1 } },
                    { $limit: 10 },
                  ],
                },
              ],
            },
          ],
        }),
      ],
    },
    tags: ['hard', 'aggregate', 'unwind', 'array-field'],
    metadata: { difficulty: 'hard' },
  },
  {
    name: 'bucket airbnb listings by price range',
    input: {
      messages: [
        {
          role: 'user',
          content:
            'Group the airbnb listings into price brackets: under $50, $50-$150, $150-$300, and over $300.',
        },
      ],
      custom: airbnbCustomInput,
    },
    expected: {
      outputMessages: [
        expectedToolMessage({
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'aggregate',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_airbnb' },
                {
                  name: 'collection',
                  type: 'string',
                  value: 'listingsAndReviews',
                },
                {
                  name: 'pipeline',
                  type: 'array',
                  value: [
                    {
                      $bucket: {
                        groupBy: '$price',
                        boundaries: [0, 50, 150, 300],
                        default: '300+',
                      },
                    },
                  ],
                },
              ],
            },
          ],
        }),
      ],
    },
    tags: ['hard', 'aggregate', 'bucket'],
    metadata: { difficulty: 'hard' },
  },
  {
    name: 'aggregate top genres with explicit no-find constraint',
    input: {
      messages: [
        {
          role: 'user',
          content:
            'Find the top 5 genres by average IMDB rating, but do not use find.',
        },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        expectedToolMessage({
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'aggregate',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
                { name: 'collection', type: 'string', value: 'movies' },
                {
                  name: 'pipeline',
                  type: 'array',
                  value: [
                    { $unwind: '$genres' },
                    {
                      $group: {
                        _id: '$genres',
                        avgImdbRating: { $avg: '$imdb.rating' },
                      },
                    },
                    { $sort: { avgImdbRating: -1 } },
                    { $limit: 5 },
                  ],
                },
              ],
            },
          ],
        }),
      ],
    },
    tags: ['hard', 'aggregate', 'negative-constraint'],
    metadata: { difficulty: 'hard' },
  },
];

// --- count -----------------------------------------------------------------

const countCases: ToolCallEvalCase[] = [
  {
    name: 'count: total movies',
    input: {
      messages: [
        { role: 'user', content: 'How many movies are in the collection?' },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'count',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
                { name: 'collection', type: 'string', value: 'movies' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['count', 'single-tool'],
    metadata: { difficulty: 'easy' },
  },
  {
    name: 'count: listings in a country',
    input: {
      messages: [
        {
          role: 'user',
          content: 'How many listings are in the United States?',
        },
      ],
      custom: airbnbCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'count',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_airbnb' },
                {
                  name: 'collection',
                  type: 'string',
                  value: 'listingsAndReviews',
                },
              ],
            },
          ],
        },
      ],
    },
    tags: ['count', 'single-tool'],
    metadata: { difficulty: 'medium' },
  },
  {
    name: 'count: movies from a decade',
    input: {
      messages: [
        { role: 'user', content: 'Count the number of movies from the 1990s.' },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'count',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
                { name: 'collection', type: 'string', value: 'movies' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['count', 'single-tool'],
    metadata: { difficulty: 'medium' },
  },
  {
    name: 'count: brooklyn restaurants',
    input: {
      messages: [
        { role: 'user', content: 'How many restaurants are in Brooklyn?' },
      ],
      custom: restaurantsCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'count',
              arguments: [
                {
                  name: 'database',
                  type: 'string',
                  value: 'sample_restaurants',
                },
                {
                  name: 'collection',
                  type: 'string',
                  value: 'restaurants',
                },
              ],
            },
          ],
        },
      ],
    },
    tags: ['count', 'single-tool'],
    metadata: { difficulty: 'medium' },
  },
  {
    name: 'count: freezing weather readings',
    input: {
      messages: [
        {
          role: 'user',
          content: 'How many weather observations are below freezing?',
        },
      ],
      custom: weatherDataCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'count',
              arguments: [
                {
                  name: 'database',
                  type: 'string',
                  value: 'sample_weatherdata',
                },
                { name: 'collection', type: 'string', value: 'data' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['count', 'single-tool'],
    metadata: { difficulty: 'hard' },
  },
];

// --- db-stats --------------------------------------------------------------

const dbStatsCases: ToolCallEvalCase[] = [
  {
    name: 'db-stats: database size',
    input: {
      messages: [
        { role: 'user', content: 'How large is the sample_mflix database?' },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'db-stats',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['db-stats', 'single-tool'],
    metadata: { difficulty: 'easy' },
  },
  {
    name: 'db-stats: database statistics',
    input: {
      messages: [
        { role: 'user', content: 'Show me stats about this database.' },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'db-stats',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['db-stats', 'single-tool'],
    metadata: { difficulty: 'easy' },
  },
  {
    name: 'db-stats: storage info',
    input: {
      messages: [
        {
          role: 'user',
          content: 'What is the storage usage of the sample_airbnb database?',
        },
      ],
      custom: airbnbCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'db-stats',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_airbnb' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['db-stats', 'single-tool'],
    metadata: { difficulty: 'easy' },
  },
  {
    name: 'db-stats: supplies database size',
    input: {
      messages: [
        { role: 'user', content: 'How large is the sample_supplies database?' },
      ],
      custom: suppliesCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'db-stats',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_supplies' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['db-stats', 'single-tool'],
    metadata: { difficulty: 'easy' },
  },
];

// --- collection-storage-size -----------------------------------------------

const collectionStorageSizeCases: ToolCallEvalCase[] = [
  {
    name: 'collection-storage-size: how big is collection',
    input: {
      messages: [
        {
          role: 'user',
          content: 'How much storage does the movies collection use?',
        },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'collection-storage-size',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
                { name: 'collection', type: 'string', value: 'movies' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['collection-storage-size', 'single-tool'],
    metadata: { difficulty: 'easy' },
  },
  {
    name: 'collection-storage-size: size of airbnb',
    input: {
      messages: [
        {
          role: 'user',
          content: 'What is the size of the listingsAndReviews collection?',
        },
      ],
      custom: airbnbCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'collection-storage-size',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_airbnb' },
                {
                  name: 'collection',
                  type: 'string',
                  value: 'listingsAndReviews',
                },
              ],
            },
          ],
        },
      ],
    },
    tags: ['collection-storage-size', 'single-tool'],
    metadata: { difficulty: 'easy' },
  },
  {
    name: 'collection-storage-size: collection disk usage',
    input: {
      messages: [
        {
          role: 'user',
          content: 'How much disk space does this collection take up?',
        },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'collection-storage-size',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
                { name: 'collection', type: 'string', value: 'movies' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['collection-storage-size', 'single-tool'],
    metadata: { difficulty: 'easy' },
  },
  {
    name: 'collection-storage-size: weather data collection',
    input: {
      messages: [
        {
          role: 'user',
          content: 'How much space does the weather data collection use?',
        },
      ],
      custom: weatherDataCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'collection-storage-size',
              arguments: [
                {
                  name: 'database',
                  type: 'string',
                  value: 'sample_weatherdata',
                },
                { name: 'collection', type: 'string', value: 'data' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['collection-storage-size', 'single-tool'],
    metadata: { difficulty: 'easy' },
  },
  {
    name: 'ambiguous collection size question',
    input: {
      messages: [{ role: 'user', content: 'How big is this?' }],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'collection-storage-size',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
                { name: 'collection', type: 'string', value: 'movies' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['hard', 'ambiguous', 'collection-storage-size'],
    metadata: { difficulty: 'hard' },
  },
];

// --- explain ---------------------------------------------------------------

const explainCases: ToolCallEvalCase[] = [
  {
    name: 'explain: query performance',
    input: {
      messages: [
        {
          role: 'user',
          content: 'Explain the performance of finding movies from 1994.',
        },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'explain',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
                { name: 'collection', type: 'string', value: 'movies' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['explain', 'single-tool'],
    metadata: { difficulty: 'medium' },
  },
  {
    name: 'explain: is query using index',
    input: {
      messages: [
        {
          role: 'user',
          content: 'Is the query for movies by year using an index?',
        },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'explain',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
                { name: 'collection', type: 'string', value: 'movies' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['explain', 'single-tool'],
    metadata: { difficulty: 'medium' },
  },
  {
    name: 'explain: query plan',
    input: {
      messages: [
        {
          role: 'user',
          content:
            'Show me the query plan for a find on the movies collection.',
        },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'explain',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
                { name: 'collection', type: 'string', value: 'movies' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['explain', 'single-tool'],
    metadata: { difficulty: 'easy' },
  },
  {
    name: 'explain: brooklyn american restaurants query',
    input: {
      messages: [
        {
          role: 'user',
          content: 'Will a find on Brooklyn American restaurants use an index?',
        },
      ],
      custom: restaurantsCustomInput,
    },
    expected: {
      outputMessages: [
        expectedToolMessage({
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'explain',
              arguments: [
                {
                  name: 'database',
                  type: 'string',
                  value: 'sample_restaurants',
                },
                {
                  name: 'collection',
                  type: 'string',
                  value: 'restaurants',
                },
              ],
            },
          ],
        }),
      ],
    },
    tags: ['explain', 'single-tool'],
    metadata: { difficulty: 'medium' },
  },
];

// --- mongodb-logs ----------------------------------------------------------

const mongodbLogsCases: ToolCallEvalCase[] = [
  {
    name: 'mongodb-logs: show recent logs',
    input: {
      messages: [
        { role: 'user', content: 'Show me the recent MongoDB server logs.' },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [{ name: 'mongodb-logs' }],
        },
      ],
    },
    tags: ['mongodb-logs', 'single-tool'],
    metadata: { difficulty: 'easy' },
  },
  {
    name: 'mongodb-logs: any errors in logs',
    input: {
      messages: [
        { role: 'user', content: 'Are there any errors in the mongod logs?' },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [{ name: 'mongodb-logs' }],
        },
      ],
    },
    tags: ['mongodb-logs', 'single-tool'],
    metadata: { difficulty: 'easy' },
  },
  {
    name: 'mongodb-logs: recent events',
    input: {
      messages: [
        { role: 'user', content: 'What are the most recent mongod events?' },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [{ name: 'mongodb-logs' }],
        },
      ],
    },
    tags: ['mongodb-logs', 'single-tool'],
    metadata: { difficulty: 'easy' },
  },
  {
    name: 'infer logs from slow database question',
    input: {
      messages: [
        {
          role: 'user',
          content:
            'The database seems slow today. Can you check if anything unusual is happening?',
        },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [{ name: 'mongodb-logs' }],
        },
      ],
    },
    tags: ['mongodb-logs', 'medium', 'inference'],
    metadata: { difficulty: 'medium' },
  },
];

// --- get-current-query -----------------------------------------------------

const getCurrentQueryCases: ToolCallEvalCase[] = [
  {
    name: 'get-current-query: whats in the query bar',
    input: {
      messages: [
        { role: 'user', content: "What's the current query in the query bar?" },
      ],
      custom: {
        ...mflixCustomInput,
        currentQuery: { filter: { year: 1994 }, limit: 10 },
      },
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [{ name: 'get-current-query' }],
        },
      ],
    },
    tags: ['get-current-query', 'single-tool'],
    metadata: { difficulty: 'easy' },
  },
  {
    name: 'get-current-query: explain my current filter',
    input: {
      messages: [
        { role: 'user', content: 'Can you explain my current query filter?' },
      ],
      custom: {
        ...mflixCustomInput,
        currentQuery: { filter: { 'imdb.rating': { $gt: 8 } } },
      },
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [{ name: 'get-current-query' }],
        },
      ],
    },
    tags: ['get-current-query', 'single-tool'],
    metadata: { difficulty: 'medium' },
  },
  {
    name: 'get-current-query: optimize my query',
    input: {
      messages: [
        {
          role: 'user',
          content: 'Can you help me optimize the query I have right now?',
        },
      ],
      custom: {
        ...mflixCustomInput,
        currentQuery: { filter: { year: { $gte: 1990, $lte: 1999 } } },
      },
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [{ name: 'get-current-query' }],
        },
      ],
    },
    tags: ['get-current-query', 'single-tool'],
    metadata: { difficulty: 'medium' },
  },
  {
    name: 'get-current-query: what am i querying',
    input: {
      messages: [{ role: 'user', content: 'What am I currently querying?' }],
      custom: {
        ...mflixCustomInput,
        currentQuery: {
          filter: { genres: 'Drama' },
          projection: { title: 1, year: 1 },
        },
      },
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [{ name: 'get-current-query' }],
        },
      ],
    },
    tags: ['get-current-query', 'single-tool'],
    metadata: { difficulty: 'easy' },
  },
  {
    name: 'retrieve current query for rewrite help',
    input: {
      messages: [
        {
          role: 'user',
          content:
            "Look at what I have in the query bar and tell me if there's a better way to write it.",
        },
      ],
      custom: {
        ...mflixCustomInput,
        currentQuery: {
          filter: {
            $and: [{ year: { $gte: 2000 } }, { year: { $lte: 2010 } }],
          },
        },
      },
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [{ name: 'get-current-query' }],
        },
      ],
    },
    tags: ['get-current-query', 'medium', 'optimization'],
    metadata: { difficulty: 'medium' },
  },
];

// --- get-current-pipeline --------------------------------------------------

const getCurrentPipelineCases: ToolCallEvalCase[] = [
  {
    name: 'get-current-pipeline: whats in the pipeline',
    input: {
      messages: [
        { role: 'user', content: "What's the current aggregation pipeline?" },
      ],
      custom: {
        ...mflixCustomInput,
        currentPipeline: [
          { $match: { year: { $gte: 2000 } } },
          { $group: { _id: '$genres', count: { $sum: 1 } } },
        ],
      },
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [{ name: 'get-current-pipeline' }],
        },
      ],
    },
    tags: ['get-current-pipeline', 'single-tool'],
    metadata: { difficulty: 'easy' },
  },
  {
    name: 'get-current-pipeline: explain my pipeline',
    input: {
      messages: [
        {
          role: 'user',
          content: 'Can you explain what my aggregation pipeline does?',
        },
      ],
      custom: {
        ...mflixCustomInput,
        currentPipeline: [
          { $unwind: '$genres' },
          { $group: { _id: '$genres', avgRating: { $avg: '$imdb.rating' } } },
          { $sort: { avgRating: -1 } },
        ],
      },
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [{ name: 'get-current-pipeline' }],
        },
      ],
    },
    tags: ['get-current-pipeline', 'single-tool'],
    metadata: { difficulty: 'medium' },
  },
  {
    name: 'get-current-pipeline: help me fix this pipeline',
    input: {
      messages: [
        {
          role: 'user',
          content:
            "My pipeline isn't returning the results I expect. Can you take a look?",
        },
      ],
      custom: {
        ...mflixCustomInput,
        currentPipeline: [
          { $match: { year: 2004 } },
          { $project: { title: 1, runtime: 1 } },
        ],
      },
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [{ name: 'get-current-pipeline' }],
        },
      ],
    },
    tags: ['get-current-pipeline', 'single-tool'],
    metadata: { difficulty: 'medium' },
  },
  {
    name: 'get-current-pipeline: optimize pipeline',
    input: {
      messages: [
        {
          role: 'user',
          content: 'Is there a way to make my current pipeline more efficient?',
        },
      ],
      custom: {
        ...mflixCustomInput,
        currentPipeline: [
          { $group: { _id: '$year', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ],
      },
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [{ name: 'get-current-pipeline' }],
        },
      ],
    },
    tags: ['get-current-pipeline', 'single-tool'],
    metadata: { difficulty: 'medium' },
  },
  {
    name: 'retrieve current pipeline before optimization',
    input: {
      messages: [
        { role: 'user', content: 'Can you make this pipeline faster?' },
      ],
      custom: {
        ...mflixCustomInput,
        currentPipeline: [
          { $group: { _id: '$year', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],
      },
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [{ name: 'get-current-pipeline' }],
        },
      ],
    },
    tags: ['get-current-pipeline', 'medium', 'inference'],
    metadata: { difficulty: 'medium' },
  },
  {
    name: 'count stages in current pipeline',
    input: {
      messages: [
        {
          role: 'user',
          content: 'How many stages does my current aggregation have?',
        },
      ],
      custom: {
        ...mflixCustomInput,
        currentPipeline: [
          { $match: { year: { $gte: 2000 } } },
          { $unwind: '$genres' },
          { $group: { _id: '$genres', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],
      },
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [{ name: 'get-current-pipeline' }],
        },
      ],
    },
    tags: ['get-current-pipeline', 'medium', 'inference'],
    metadata: { difficulty: 'medium' },
  },
];

// --- Multi-tool sequences --------------------------------------------------

const multiToolCases: ToolCallEvalCase[] = [
  {
    name: 'schema then find',
    description:
      'User wants to explore data - assistant should check schema first, then query.',
    input: {
      messages: [
        {
          role: 'user',
          content:
            'What kind of data is in the movies collection? Can you show me a few documents?',
        },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'collection-schema',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
                { name: 'collection', type: 'string', value: 'movies' },
              ],
            },
          ],
        },
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'find',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
                { name: 'collection', type: 'string', value: 'movies' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['collection-schema', 'find', 'multi-tool'],
    metadata: { difficulty: 'medium' },
  },
  {
    name: 'list dbs then list collections',
    description: 'User exploring the cluster from scratch.',
    input: {
      messages: [
        {
          role: 'user',
          content:
            'I just connected. What databases and collections are available?',
        },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [{ name: 'list-databases' }],
        },
        {
          role: 'assistant-tool',
          toolCalls: [{ name: 'list-collections' }],
        },
      ],
    },
    tags: ['list-databases', 'list-collections', 'multi-tool'],
    metadata: { difficulty: 'medium' },
  },
  {
    name: 'indexes then explain',
    description: 'User investigating query performance.',
    input: {
      messages: [
        {
          role: 'user',
          content:
            'What indexes does the movies collection have, and how would a query on the year field perform?',
        },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'collection-indexes',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
                { name: 'collection', type: 'string', value: 'movies' },
              ],
            },
          ],
        },
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'explain',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
                { name: 'collection', type: 'string', value: 'movies' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['collection-indexes', 'explain', 'multi-tool'],
    metadata: { difficulty: 'medium' },
  },
  {
    name: 'infer explain from slow query question',
    input: {
      messages: [{ role: 'user', content: 'Why is this query slow?' }],
      custom: {
        ...mflixCustomInput,
        currentQuery: {
          filter: { year: { $gte: 1990 } },
        },
      },
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [{ name: 'get-current-query' }],
        },
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'explain',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
                { name: 'collection', type: 'string', value: 'movies' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['explain', 'get-current-query', 'medium', 'inference', 'multi-tool'],
    metadata: { difficulty: 'medium' },
  },
  {
    name: 'schema and indexes for sales collection',
    input: {
      messages: [
        {
          role: 'user',
          content:
            "What's the structure of this sales collection - fields and indexes?",
        },
      ],
      custom: suppliesCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'collection-schema',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_supplies' },
                { name: 'collection', type: 'string', value: 'sales' },
              ],
            },
          ],
        },
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'collection-indexes',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_supplies' },
                { name: 'collection', type: 'string', value: 'sales' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['collection-schema', 'collection-indexes', 'medium', 'multi-tool'],
    metadata: { difficulty: 'medium' },
  },
  {
    name: 'compare collection and database storage',
    input: {
      messages: [
        {
          role: 'user',
          content:
            'Which takes more space - the movies collection or the database overall?',
        },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'collection-storage-size',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
                { name: 'collection', type: 'string', value: 'movies' },
              ],
            },
          ],
        },
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'db-stats',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['collection-storage-size', 'db-stats', 'medium', 'multi-tool'],
    metadata: { difficulty: 'medium' },
  },
  {
    name: 'explore available data after connecting',
    input: {
      messages: [
        {
          role: 'user',
          content: 'I just connected - walk me through what data is available.',
        },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [{ name: 'list-databases' }],
        },
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'list-collections',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['list-databases', 'list-collections', 'medium', 'exploration'],
    metadata: { difficulty: 'medium' },
  },
  {
    name: 'inspect schema before querying restaurants',
    input: {
      messages: [
        {
          role: 'user',
          content:
            "I want to query this restaurants collection but I don't know what fields are available. Then find the first 3 Brooklyn restaurants.",
        },
      ],
      custom: restaurantsCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'collection-schema',
              arguments: [
                {
                  name: 'database',
                  type: 'string',
                  value: 'sample_restaurants',
                },
                {
                  name: 'collection',
                  type: 'string',
                  value: 'restaurants',
                },
              ],
            },
          ],
        },
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'find',
              arguments: [
                {
                  name: 'database',
                  type: 'string',
                  value: 'sample_restaurants',
                },
                {
                  name: 'collection',
                  type: 'string',
                  value: 'restaurants',
                },
                {
                  name: 'filter',
                  type: 'object',
                  value: { borough: 'Brooklyn' },
                },
                { name: 'limit', type: 'number', value: 3 },
              ],
            },
          ],
        },
      ],
    },
    tags: ['collection-schema', 'find', 'medium', 'multi-tool', 'sequential'],
    metadata: { difficulty: 'medium' },
  },
  {
    name: 'broad weather collection overview',
    input: {
      messages: [
        {
          role: 'user',
          content:
            'Tell me everything about the weather observations collection.',
        },
      ],
      custom: weatherDataCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'collection-schema',
              arguments: [
                {
                  name: 'database',
                  type: 'string',
                  value: 'sample_weatherdata',
                },
                { name: 'collection', type: 'string', value: 'data' },
              ],
            },
          ],
        },
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'collection-indexes',
              arguments: [
                {
                  name: 'database',
                  type: 'string',
                  value: 'sample_weatherdata',
                },
                { name: 'collection', type: 'string', value: 'data' },
              ],
            },
          ],
        },
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'collection-storage-size',
              arguments: [
                {
                  name: 'database',
                  type: 'string',
                  value: 'sample_weatherdata',
                },
                { name: 'collection', type: 'string', value: 'data' },
              ],
            },
          ],
        },
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'count',
              arguments: [
                {
                  name: 'database',
                  type: 'string',
                  value: 'sample_weatherdata',
                },
                { name: 'collection', type: 'string', value: 'data' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['hard', 'multi-tool', 'ambiguous'],
    metadata: { difficulty: 'hard' },
  },
  {
    name: 'debug current pipeline with follow-up inspection',
    input: {
      messages: [
        {
          role: 'user',
          content:
            'My aggregation pipeline is returning unexpected results. Help me debug it.',
        },
      ],
      custom: {
        ...mflixCustomInput,
        currentPipeline: [
          { $match: { year: 2004 } },
          { $group: { _id: '$genres', count: { $sum: 1 } } },
        ],
      },
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [{ name: 'get-current-pipeline' }],
        },
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'collection-schema',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
                { name: 'collection', type: 'string', value: 'movies' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['hard', 'multi-tool', 'debugging'],
    metadata: { difficulty: 'hard' },
  },
  {
    name: 'inspect current query before checking sort index',
    input: {
      messages: [
        {
          role: 'user',
          content:
            'Take my current query and check whether the sort is using an index.',
        },
      ],
      custom: {
        ...mflixCustomInput,
        currentQuery: {
          filter: { year: { $gte: 1990 } },
          sort: { 'imdb.rating': -1 },
        },
      },
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [{ name: 'get-current-query' }],
        },
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'explain',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
                { name: 'collection', type: 'string', value: 'movies' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['hard', 'multi-tool', 'current-query', 'performance'],
    metadata: { difficulty: 'hard' },
  },
  {
    name: 'ground cleanliness query with schema first',
    input: {
      messages: [
        {
          role: 'user',
          content:
            'Use whatever field stores review scores and find the listings with cleanliness above 9.',
        },
      ],
      custom: airbnbCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'collection-schema',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_airbnb' },
                {
                  name: 'collection',
                  type: 'string',
                  value: 'listingsAndReviews',
                },
              ],
            },
          ],
        },
        expectedToolMessage({
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'find',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_airbnb' },
                {
                  name: 'collection',
                  type: 'string',
                  value: 'listingsAndReviews',
                },
                {
                  name: 'filter',
                  type: 'object',
                  value: {
                    'review_scores.review_scores_cleanliness': { $gt: 9 },
                  },
                },
              ],
            },
          ],
        }),
      ],
    },
    tags: ['hard', 'multi-tool', 'schema-grounding', 'nested-field'],
    metadata: { difficulty: 'hard' },
  },
  {
    name: 'adapt current pipeline with extra filter',
    input: {
      messages: [
        {
          role: 'user',
          content:
            'Run my current pipeline, but only for documents after 2010.',
        },
      ],
      custom: {
        ...mflixCustomInput,
        currentPipeline: [
          { $unwind: '$genres' },
          { $group: { _id: '$genres', avgRating: { $avg: '$imdb.rating' } } },
          { $sort: { avgRating: -1 } },
        ],
      },
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [{ name: 'get-current-pipeline' }],
        },
        expectedToolMessage({
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'aggregate',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
                { name: 'collection', type: 'string', value: 'movies' },
                {
                  name: 'pipeline',
                  type: 'array',
                  value: [
                    { $match: { year: { $gt: 2010 } } },
                    { $unwind: '$genres' },
                    {
                      $group: {
                        _id: '$genres',
                        avgRating: { $avg: '$imdb.rating' },
                      },
                    },
                    { $sort: { avgRating: -1 } },
                  ],
                },
              ],
            },
          ],
        }),
      ],
    },
    tags: ['hard', 'multi-tool', 'current-pipeline', 'transformation'],
    metadata: { difficulty: 'hard' },
  },
  {
    name: 'pre-query collection overview',
    input: {
      messages: [
        {
          role: 'user',
          content:
            'Tell me what I should know about this collection before I query it.',
        },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'collection-schema',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
                { name: 'collection', type: 'string', value: 'movies' },
              ],
            },
          ],
        },
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'collection-indexes',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
                { name: 'collection', type: 'string', value: 'movies' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['hard', 'multi-tool', 'collection-overview'],
    metadata: { difficulty: 'hard' },
  },
];

// --- multi-turn ------------------------------------------------------------

const multiTurnCases: ToolCallEvalCase[] = [
  {
    name: 'schema then query follow-up',
    input: {
      messages: [
        {
          role: 'user',
          content: 'What does the movies collection look like?',
        },
        {
          role: 'assistant',
          content:
            'The movies collection has fields like title, year, genres, cast, directors, and imdb metadata.',
        },
        {
          role: 'user',
          content: 'Great, now find me all the sci-fi movies.',
        },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'find',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
                { name: 'collection', type: 'string', value: 'movies' },
                {
                  name: 'filter',
                  type: 'object',
                  value: { genres: 'Sci-Fi' },
                },
              ],
            },
          ],
        },
      ],
    },
    tags: ['multi-turn', 'find', 'follow-up'],
    metadata: { difficulty: 'medium' },
  },
  {
    name: 'correction flow to different collection',
    input: {
      messages: [
        {
          role: 'user',
          content: 'Show me the schema for the movies collection.',
        },
        {
          role: 'assistant',
          content:
            'The movies collection schema includes fields like title, year, cast, genres, and imdb.',
        },
        {
          role: 'user',
          content: 'Sorry, I meant the listingsAndReviews collection instead.',
        },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'collection-schema',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_airbnb' },
                {
                  name: 'collection',
                  type: 'string',
                  value: 'listingsAndReviews',
                },
              ],
            },
          ],
        },
      ],
    },
    tags: ['multi-turn', 'collection-schema', 'correction'],
    metadata: { difficulty: 'hard' },
  },
  {
    name: 'drill-down exploration to count',
    input: {
      messages: [
        {
          role: 'user',
          content: 'What databases are available?',
        },
        {
          role: 'assistant',
          content:
            'I found sample_mflix, sample_airbnb, sample_restaurants, sample_supplies, and sample_weatherdata.',
        },
        {
          role: 'user',
          content: "What's in sample_mflix?",
        },
        {
          role: 'assistant',
          content:
            'sample_mflix contains collections like movies, comments, and users.',
        },
        {
          role: 'user',
          content: 'How many movies are there?',
        },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'count',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
                { name: 'collection', type: 'string', value: 'movies' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['multi-turn', 'count', 'exploration'],
    metadata: { difficulty: 'medium' },
  },
  {
    name: 'query refinement',
    input: {
      messages: [
        {
          role: 'user',
          content: 'Find movies from 2004.',
        },
        {
          role: 'assistant',
          content: 'I found several movies from 2004 in the movies collection.',
        },
        {
          role: 'user',
          content: 'Now narrow that down to just documentaries.',
        },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        expectedToolMessage({
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'find',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
                { name: 'collection', type: 'string', value: 'movies' },
                {
                  name: 'filter',
                  type: 'object',
                  value: {
                    year: 2004,
                    genres: 'Documentary',
                  },
                },
              ],
            },
          ],
        }),
      ],
    },
    tags: ['multi-turn', 'find', 'refinement'],
    metadata: { difficulty: 'hard' },
  },
  {
    name: 'performance investigation follow-up',
    input: {
      messages: [
        {
          role: 'user',
          content: 'What indexes does the movies collection have?',
        },
        {
          role: 'assistant',
          content:
            'The movies collection has the default _id index and additional indexes including one on title.',
        },
        {
          role: 'user',
          content: 'Would a query on the title field be efficient?',
        },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'explain',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
                { name: 'collection', type: 'string', value: 'movies' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['multi-turn', 'explain', 'performance'],
    metadata: { difficulty: 'medium' },
  },
  {
    name: 'pipeline build-up',
    input: {
      messages: [
        {
          role: 'user',
          content: "What's in my current pipeline?",
        },
        {
          role: 'assistant',
          content:
            'Your current pipeline matches movies from 2000 onward, then limits the output to five documents.',
        },
        {
          role: 'user',
          content: 'Run it and show me the results.',
        },
      ],
      custom: {
        ...mflixCustomInput,
        currentPipeline: [{ $match: { year: { $gte: 2000 } } }, { $limit: 5 }],
      },
    },
    expected: {
      outputMessages: [
        expectedToolMessage({
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'aggregate',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_mflix' },
                { name: 'collection', type: 'string', value: 'movies' },
                {
                  name: 'pipeline',
                  type: 'array',
                  value: [{ $match: { year: { $gte: 2000 } } }, { $limit: 5 }],
                },
              ],
            },
          ],
        }),
      ],
    },
    tags: ['multi-turn', 'aggregate', 'get-current-pipeline'],
    metadata: { difficulty: 'hard' },
  },
  {
    name: 'context switch mid-conversation',
    input: {
      messages: [
        {
          role: 'user',
          content: 'How many documents are in the movies collection?',
        },
        {
          role: 'assistant',
          content: 'There are many documents in the movies collection.',
        },
        {
          role: 'user',
          content: 'Now check the airbnb listings collection - how many there?',
        },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [
        {
          role: 'assistant-tool',
          toolCalls: [
            {
              name: 'count',
              arguments: [
                { name: 'database', type: 'string', value: 'sample_airbnb' },
                {
                  name: 'collection',
                  type: 'string',
                  value: 'listingsAndReviews',
                },
              ],
            },
          ],
        },
      ],
    },
    tags: ['multi-turn', 'count', 'context-switch'],
    metadata: { difficulty: 'hard' },
  },
  {
    // TODO: The current tool-call scorers only verify that no extra tool call happens.
    // Add a scorer for answer quality on multi-turn advice-only follow-ups.
    name: 'diagnostic advice after current query inspection',
    input: {
      messages: [
        {
          role: 'user',
          content: 'Something seems off with my query results.',
        },
        {
          role: 'assistant',
          content:
            'I looked at your current query. It uses separate year bounds inside an $and clause.',
        },
        {
          role: 'user',
          content: 'Is there a better way to write that filter?',
        },
      ],
      custom: {
        ...mflixCustomInput,
        currentQuery: {
          filter: {
            $and: [{ year: { $gte: 2000 } }, { year: { $lte: 2010 } }],
          },
        },
      },
    },
    expected: {
      outputMessages: [],
    },
    tags: ['multi-turn', 'get-current-query', 'advice', 'no-tool'],
    metadata: { difficulty: 'hard' },
  },
];

// --- no-tool ---------------------------------------------------------------

const noToolCases: ToolCallEvalCase[] = [
  {
    // TODO: The current tool-call scorers under-reward correct no-tool refusals.
    // Add a dedicated no-tool / refusal scorer before treating this as stable.
    name: 'refuse delete request',
    input: {
      messages: [
        { role: 'user', content: 'Delete all movies from before 1950.' },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [],
    },
    tags: ['hard', 'refusal', 'no-tool'],
    metadata: { difficulty: 'hard' },
  },
  {
    // TODO: The current tool-call scorers under-reward correct no-tool refusals.
    // Add a dedicated no-tool / refusal scorer before treating this as stable.
    name: 'refuse insert request',
    input: {
      messages: [
        {
          role: 'user',
          content: "Add a new movie called 'Test Movie' with year 2024.",
        },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [],
    },
    tags: ['hard', 'refusal', 'no-tool'],
    metadata: { difficulty: 'hard' },
  },
  {
    // TODO: The current tool-call scorers under-reward correct no-tool answers.
    // Add a dedicated no-tool / knowledge-answer scorer for docs-style prompts.
    name: 'docs question should not use tools',
    input: {
      messages: [
        {
          role: 'user',
          content:
            "What's the difference between $match and $filter in aggregation pipelines?",
        },
      ],
      custom: mflixCustomInput,
    },
    expected: {
      outputMessages: [],
    },
    tags: ['hard', 'no-tool', 'docs-question'],
    metadata: { difficulty: 'hard' },
  },
  {
    // TODO: The current tool-call scorers under-reward correct no-tool refusals.
    // Add a dedicated no-tool / refusal scorer before treating this as stable.
    name: 'refuse create index request',
    input: {
      messages: [
        {
          role: 'user',
          content: 'Can you create an index to speed up my current query?',
        },
      ],
      custom: {
        ...mflixCustomInput,
        currentQuery: { filter: { year: 1994 } },
      },
    },
    expected: {
      outputMessages: [],
    },
    tags: ['hard', 'no-tool', 'refusal', 'write-request'],
    metadata: { difficulty: 'hard' },
  },
  {
    // TODO: The current tool-call scorers under-reward correct no-tool answers.
    // Add a dedicated no-tool / unsupported-request scorer before treating this as stable.
    name: 'unsupported query history comparison',
    input: {
      messages: [
        {
          role: 'user',
          content:
            "Compare my current query results to last week's query history.",
        },
      ],
      custom: {
        ...mflixCustomInput,
        currentQuery: { filter: { year: { $gte: 2000 } } },
      },
    },
    expected: {
      outputMessages: [],
    },
    tags: ['hard', 'no-tool', 'unsupported'],
    metadata: { difficulty: 'hard' },
  },
];

// ---------------------------------------------------------------------------
// Export all cases
// ---------------------------------------------------------------------------

export const toolCallEvalCases: ToolCallEvalCase[] = [
  ...listDatabasesCases,
  ...listCollectionsCases,
  ...collectionSchemaCases,
  ...collectionIndexesCases,
  ...findCases,
  ...aggregateCases,
  ...countCases,
  ...dbStatsCases,
  ...collectionStorageSizeCases,
  ...explainCases,
  ...mongodbLogsCases,
  ...getCurrentQueryCases,
  ...getCurrentPipelineCases,
  ...multiToolCases,
  ...multiTurnCases,
  ...noToolCases,
];

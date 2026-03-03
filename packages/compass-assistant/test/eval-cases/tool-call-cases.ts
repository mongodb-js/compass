/**
 * Eval cases for testing tool call correctness.
 *
 * Each case defines a user prompt and the expected tool calls the assistant
 * should generate (tool name + arguments). We evaluate the generated tool calls
 * against these expectations using assertion-based scorers.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ToolCallArgument {
  name: string;
  type?: 'string' | 'array' | 'object' | 'boolean' | 'number';
  value?:
    | string
    | number
    | boolean
    | (string | number | boolean)[]
    | Record<string, unknown>;
  /** Only valid when type is "string" */
  matchRegex?: string;
}

export interface ExpectedToolCall {
  name: string;
  arguments?: ToolCallArgument[];
}

export interface ExpectedOutputMessage {
  role: 'assistant-tool';
  toolCalls: ExpectedToolCall[];
}

export interface CompassAssistantCustomInput {
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

export interface ToolCallEvalCase {
  name: string;
  description?: string;
  input: {
    messages: { role: 'user'; content: string }[];
    custom: CompassAssistantCustomInput;
  };
  expected: {
    outputMessages: ExpectedOutputMessage[];
  };
  tags: string[];
  skip?: boolean;
}

// ---------------------------------------------------------------------------
// Eval cases
// ---------------------------------------------------------------------------

const mflixCustomInput: CompassAssistantCustomInput = {
  clusterUid: 'eval-test-cluster',
  databaseName: 'sample_mflix',
  collectionName: 'movies',
};

const airbnbCustomInput: CompassAssistantCustomInput = {
  clusterUid: 'eval-test-cluster',
  databaseName: 'sample_airbnb',
  collectionName: 'listingsAndReviews',
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
              arguments: [{ name: 'database', value: 'sample_mflix' }],
            },
          ],
        },
      ],
    },
    tags: ['list-collections', 'single-tool'],
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
              arguments: [{ name: 'database', value: 'sample_mflix' }],
            },
          ],
        },
      ],
    },
    tags: ['list-collections', 'single-tool'],
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
              arguments: [{ name: 'database', value: 'sample_airbnb' }],
            },
          ],
        },
      ],
    },
    tags: ['list-collections', 'single-tool'],
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
                { name: 'database', value: 'sample_mflix' },
                { name: 'collection', value: 'movies' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['collection-schema', 'single-tool'],
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
                { name: 'database', value: 'sample_airbnb' },
                { name: 'collection', value: 'listingsAndReviews' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['collection-schema', 'single-tool'],
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
                { name: 'database', value: 'sample_mflix' },
                { name: 'collection', value: 'movies' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['collection-schema', 'single-tool'],
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
                { name: 'database', value: 'sample_mflix' },
                { name: 'collection', value: 'movies' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['collection-indexes', 'single-tool'],
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
                { name: 'database', value: 'sample_airbnb' },
                { name: 'collection', value: 'listingsAndReviews' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['collection-indexes', 'single-tool'],
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
                { name: 'database', value: 'sample_mflix' },
                { name: 'collection', value: 'movies' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['collection-indexes', 'single-tool'],
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
                { name: 'database', value: 'sample_mflix' },
                { name: 'collection', value: 'movies' },
                { name: 'filter', type: 'object', value: { year: 1994 } },
              ],
            },
          ],
        },
      ],
    },
    tags: ['find', 'single-tool'],
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
                { name: 'database', value: 'sample_airbnb' },
                { name: 'collection', value: 'listingsAndReviews' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['find', 'single-tool'],
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
                { name: 'database', value: 'sample_mflix' },
                { name: 'collection', value: 'movies' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['find', 'single-tool'],
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
                { name: 'database', value: 'sample_mflix' },
                { name: 'collection', value: 'movies' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['find', 'single-tool'],
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
                { name: 'database', value: 'sample_mflix' },
                { name: 'collection', value: 'movies' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['aggregate', 'single-tool'],
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
                { name: 'database', value: 'sample_airbnb' },
                { name: 'collection', value: 'listingsAndReviews' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['aggregate', 'single-tool'],
  },
  {
    name: 'aggregate: top rated movies',
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
              name: 'aggregate',
              arguments: [
                { name: 'database', value: 'sample_mflix' },
                { name: 'collection', value: 'movies' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['aggregate', 'single-tool'],
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
                { name: 'database', value: 'sample_airbnb' },
                { name: 'collection', value: 'listingsAndReviews' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['aggregate', 'single-tool'],
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
                { name: 'database', value: 'sample_mflix' },
                { name: 'collection', value: 'movies' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['count', 'single-tool'],
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
                { name: 'database', value: 'sample_airbnb' },
                { name: 'collection', value: 'listingsAndReviews' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['count', 'single-tool'],
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
                { name: 'database', value: 'sample_mflix' },
                { name: 'collection', value: 'movies' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['count', 'single-tool'],
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
              arguments: [{ name: 'database', value: 'sample_mflix' }],
            },
          ],
        },
      ],
    },
    tags: ['db-stats', 'single-tool'],
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
              arguments: [{ name: 'database', value: 'sample_mflix' }],
            },
          ],
        },
      ],
    },
    tags: ['db-stats', 'single-tool'],
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
              arguments: [{ name: 'database', value: 'sample_airbnb' }],
            },
          ],
        },
      ],
    },
    tags: ['db-stats', 'single-tool'],
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
                { name: 'database', value: 'sample_mflix' },
                { name: 'collection', value: 'movies' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['collection-storage-size', 'single-tool'],
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
                { name: 'database', value: 'sample_airbnb' },
                { name: 'collection', value: 'listingsAndReviews' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['collection-storage-size', 'single-tool'],
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
                { name: 'database', value: 'sample_mflix' },
                { name: 'collection', value: 'movies' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['collection-storage-size', 'single-tool'],
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
                { name: 'database', value: 'sample_mflix' },
                { name: 'collection', value: 'movies' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['explain', 'single-tool'],
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
                { name: 'database', value: 'sample_mflix' },
                { name: 'collection', value: 'movies' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['explain', 'single-tool'],
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
                { name: 'database', value: 'sample_mflix' },
                { name: 'collection', value: 'movies' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['explain', 'single-tool'],
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
  },
];

// --- Multi-tool sequences --------------------------------------------------

const multiToolCases: ToolCallEvalCase[] = [
  {
    name: 'multi: schema then find',
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
                { name: 'database', value: 'sample_mflix' },
                { name: 'collection', value: 'movies' },
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
                { name: 'database', value: 'sample_mflix' },
                { name: 'collection', value: 'movies' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['collection-schema', 'find', 'multi-tool'],
  },
  {
    name: 'multi: list dbs then list collections',
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
  },
  {
    name: 'multi: indexes then explain',
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
                { name: 'database', value: 'sample_mflix' },
                { name: 'collection', value: 'movies' },
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
                { name: 'database', value: 'sample_mflix' },
                { name: 'collection', value: 'movies' },
              ],
            },
          ],
        },
      ],
    },
    tags: ['collection-indexes', 'explain', 'multi-tool'],
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
];

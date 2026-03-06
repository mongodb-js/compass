import { EVAL_CLUSTER_UID } from '../eval-config';
import type {
  CompassAssistantCustomInput,
  ExpectedOutputMessage,
  ToolCallEvalCase,
} from './tool-call-cases';

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

function expectedToolMessage(
  message: DeepExpectedOutputMessage
): ExpectedOutputMessage {
  return message as ExpectedOutputMessage;
}

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

export const toolCallEvalCasesV2MultiTurn: ToolCallEvalCase[] = [
  {
    name: 'v2 multi-turn: schema then query follow-up',
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
    name: 'v2 multi-turn: correction flow to different collection',
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
    name: 'v2 multi-turn: drill-down exploration to count',
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
    name: 'v2 multi-turn: query refinement',
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
    name: 'v2 multi-turn: performance investigation follow-up',
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
    name: 'v2 multi-turn: pipeline build-up',
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
    name: 'v2 multi-turn: context switch mid-conversation',
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
    name: 'v2 multi-turn: diagnostic advice after current query inspection',
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

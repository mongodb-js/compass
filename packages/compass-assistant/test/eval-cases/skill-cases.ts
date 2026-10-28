/**
 * Eval cases for skills. The agent model loads a skill through a server-side
 * `skill` tool call (`{ skillName }`), which is scored by the agent trajectory
 * scorer. Expectations stay at the skill name: skill content lives on the
 * server.
 */

import { EVAL_CLUSTER_UID } from '../eval-config';
import type {
  CompassAssistantCustomInput,
  ToolCallEvalCase,
} from './tool-call-cases';

const mflixCustomInput: CompassAssistantCustomInput = {
  clusterUid: EVAL_CLUSTER_UID,
  databaseName: 'sample_mflix',
  collectionName: 'movies',
};

const expectQueryOptimizerSkill = [
  {
    role: 'assistant-tool',
    toolCalls: [
      {
        name: 'skill',
        arguments: [
          {
            name: 'skillName',
            type: 'string',
            value: 'mongodb-query-optimizer',
          },
        ],
      },
    ],
  },
] satisfies ToolCallEvalCase['expected']['outputMessages'];

// With tools available, the query optimizer skill goes on to read the schema
// and the indexes. The order varies, e.g. the model may read them before it
// loads the skill, so the order is not part of the expectation.
const expectCollectionCall = (name: string) => ({
  role: 'assistant-tool' as const,
  toolCalls: [
    {
      name,
      arguments: [
        { name: 'database', type: 'string' as const, value: 'sample_mflix' },
        { name: 'collection', type: 'string' as const, value: 'movies' },
      ],
    },
  ],
});

const expectQueryOptimizerSkillAndReads = [
  ...expectQueryOptimizerSkill,
  expectCollectionCall('collection-schema'),
  expectCollectionCall('collection-indexes'),
] satisfies ToolCallEvalCase['expected']['outputMessages'];

export const skillCases: ToolCallEvalCase[] = [
  {
    name: 'skill: explicit tag loads the query optimizer',
    input: {
      messages: [
        {
          role: 'user',
          content:
            '<skill>mongodb-query-optimizer</skill> Help me optimize my slow queries.',
        },
      ],
      custom: mflixCustomInput,
    },
    expected: { outputMessages: expectQueryOptimizerSkillAndReads },
    tags: ['skill', 'single-tool'],
    metadata: { difficulty: 'easy' },
  },
  {
    name: 'skill: model picks the query optimizer without a tag',
    input: {
      messages: [
        { role: 'user', content: 'Help me optimize my slow queries.' },
      ],
      custom: mflixCustomInput,
    },
    expected: { outputMessages: expectQueryOptimizerSkillAndReads },
    tags: ['skill', 'single-tool'],
    metadata: { difficulty: 'medium' },
  },
  {
    name: 'tools-disabled: skill that would call tools',
    description:
      'The query optimizer skill normally reads indexes and runs explain.',
    input: {
      messages: [
        {
          role: 'user',
          content:
            '<skill>mongodb-query-optimizer</skill> Review the indexes on sample_mflix.movies and help me optimize my slow queries.',
        },
      ],
      custom: { ...mflixCustomInput, toolsDisabled: true },
    },
    expected: { outputMessages: expectQueryOptimizerSkill },
    tags: ['tools-disabled', 'skill', 'no-tool'],
    metadata: { difficulty: 'hard' },
  },
];

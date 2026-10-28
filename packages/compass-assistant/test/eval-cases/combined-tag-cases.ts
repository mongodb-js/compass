/**
 * Eval cases combining `<skill>` and `<tool>` tags in one prompt. Expected
 * calls are listed in tag order, one message per call, which is how the eval
 * harness reports them.
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

const skillCall = (skillName: string) => ({
  role: 'assistant-tool' as const,
  toolCalls: [
    {
      name: 'skill',
      arguments: [
        { name: 'skillName', type: 'string' as const, value: skillName },
      ],
    },
  ],
});

const moviesCall = (name: string) => ({
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

const queryOptimizer = skillCall('mongodb-query-optimizer');
const connection = skillCall('mongodb-connection');

function makeCase(
  name: string,
  content: string,
  outputMessages: ToolCallEvalCase['expected']['outputMessages'],
  tags: string[],
  difficulty: 'medium' | 'hard',
  description?: string
): ToolCallEvalCase {
  return {
    name,
    description,
    input: { messages: [{ role: 'user', content }], custom: mflixCustomInput },
    expected: { outputMessages },
    tags: ['explicit-tag', ...tags],
    metadata: { difficulty },
  };
}

export const combinedTagCases: ToolCallEvalCase[] = [
  makeCase(
    'combined-tags: skill and tool',
    '<skill>mongodb-query-optimizer</skill> <tool>collection-indexes</tool> Review the indexes on sample_mflix.movies.',
    [queryOptimizer, moviesCall('collection-indexes')],
    ['skill', 'multi-tool'],
    'medium'
  ),
  makeCase(
    'combined-tags: two skills',
    '<skill>mongodb-query-optimizer</skill> <skill>mongodb-connection</skill> My queries are slow and I get connection timeouts.',
    [queryOptimizer, connection],
    ['skill', 'multi-skill'],
    'medium'
  ),
  makeCase(
    'combined-tags: one skill and two tools',
    '<skill>mongodb-query-optimizer</skill> <tool>collection-schema</tool> <tool>collection-indexes</tool> Optimize queries on sample_mflix.movies using its schema and indexes.',
    [
      queryOptimizer,
      moviesCall('collection-schema'),
      moviesCall('collection-indexes'),
    ],
    ['skill', 'multi-tool'],
    'medium'
  ),
  makeCase(
    'combined-tags: two skills and one tool',
    '<skill>mongodb-query-optimizer</skill> <skill>mongodb-connection</skill> <tool>collection-indexes</tool> Review sample_mflix.movies indexes and my connection pool setup.',
    [queryOptimizer, connection, moviesCall('collection-indexes')],
    ['skill', 'multi-skill', 'multi-tool'],
    'hard',
    'The tool call was missing in 1 of 3 manual runs.'
  ),
  makeCase(
    'combined-tags: two skills and two tools',
    '<skill>mongodb-query-optimizer</skill> <skill>mongodb-connection</skill> <tool>list-databases</tool> <tool>collection-indexes</tool> Check sample_mflix.movies indexes, and my connection setup.',
    [
      queryOptimizer,
      connection,
      { role: 'assistant-tool', toolCalls: [{ name: 'list-databases' }] },
      moviesCall('collection-indexes'),
    ],
    ['skill', 'multi-skill', 'multi-tool'],
    'hard',
    'Skills can trigger further tool calls, so the call count varies: 3 and 4 calls on two manual runs.'
  ),
];

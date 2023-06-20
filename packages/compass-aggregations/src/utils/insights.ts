import type { Signal } from '@mongodb-js/compass-components';
import type { StoreStage } from '../modules/pipeline-builder/stage-editor';

const ATLAS_LINK = 'https://www.mongodb.com/cloud/atlas/lp/search-1';

const SIGNALS = {
  'lookup-usage-in-stage': {
    id: 'lookup-usage-in-stage',
    title: '$lookup usage',
    description:
      '$lookup operations can be resource intensive because they perform operations on two collections instead of one. Consider embedding documents or arrays to increase read performance.',
    learnMoreLink:
      'https://www.mongodb.com/docs/atlas/schema-suggestions/reduce-lookup-operations/#std-label-anti-pattern-denormalization',
  },
  'atlas-text-regex-usage-in-stage': {
    id: 'atlas-text-regex-usage-in-stage',
    title: 'Inefficient text search operator',
    description:
      "In many cases, Atlas Search is MongoDB's most efficient full text search option. Convert your query to $search for a wider range of functionality.",
    learnMoreLink:
      'https://www.mongodb.com/docs/atlas/atlas-search/best-practices/',
    learnMoreLabel: 'Atlas Search best practices',
  },
  'non-atlas-text-regex-usage-in-stage': {
    id: 'non-atlas-text-regex-usage-in-stage',
    title: 'Inefficient text search operator',
    description:
      "In many cases, Atlas Search is MongoDB's most efficient full text search option. Connect with Atlas to explore the power of Atlas Search.",
    learnMoreLink:
      'https://www.mongodb.com/docs/atlas/atlas-search/best-practices/',
    learnMoreLabel: 'Atlas Search best practices',
  },
} as const;

export const getInsightForStage = (
  { stageOperator, value }: StoreStage,
  isAtlas: boolean
): Signal | undefined => {
  if (stageOperator === '$lookup') {
    return SIGNALS['lookup-usage-in-stage'];
  } else if (
    stageOperator === '$match' &&
    (value?.includes('$regex') || value?.includes('$text'))
  ) {
    return isAtlas
      ? SIGNALS['atlas-text-regex-usage-in-stage']
      : SIGNALS['non-atlas-text-regex-usage-in-stage'];
  }
};

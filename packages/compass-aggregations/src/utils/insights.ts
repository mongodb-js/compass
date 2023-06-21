import { ADL, ATLAS } from '@mongodb-js/mongodb-constants';
import type { Signal } from '@mongodb-js/compass-components';
import type { StoreStage } from '../modules/pipeline-builder/stage-editor';

const ATLAS_SEARCH_LP_LINK = 'https://www.mongodb.com/cloud/atlas/lp/search-1';

const SIGNALS: Record<string, Signal> = {
  'atlas-text-regex-usage-in-stage': {
    id: 'atlas-text-regex-usage-in-stage',
    title: 'Alternate text search options available',
    description:
      "In many cases, Atlas Search is MongoDB's most efficient full text search option. Convert your query to $search for a wider range of functionality.",
    learnMoreLink:
      'https://www.mongodb.com/docs/atlas/atlas-search/best-practices/',
    primaryActionButtonLink: ATLAS_SEARCH_LP_LINK,
    primaryActionButtonLabel: 'Try Atlas Search',
  },
  'non-atlas-text-regex-usage-in-stage': {
    id: 'non-atlas-text-regex-usage-in-stage',
    title: 'Alternate text search options available',
    description:
      "In many cases, Atlas Search is MongoDB's most efficient full text search option. Connect with Atlas to explore the power of Atlas Search.",
    learnMoreLink:
      'https://www.mongodb.com/docs/atlas/atlas-search/best-practices/',
    primaryActionButtonLink: ATLAS_SEARCH_LP_LINK,
    primaryActionButtonLabel: 'Try Atlas Search',
  },
} as const;

export const getInsightForStage = (
  { stageOperator, value }: StoreStage,
  env: string
): Signal | undefined => {
  const isAtlas = [ATLAS, ADL].includes(env);
  if (
    stageOperator === '$match' &&
    (value?.includes('$regex') || value?.includes('$text'))
  ) {
    return isAtlas
      ? SIGNALS['atlas-text-regex-usage-in-stage']
      : SIGNALS['non-atlas-text-regex-usage-in-stage'];
  }
};

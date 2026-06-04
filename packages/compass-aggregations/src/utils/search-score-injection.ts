import type { Document } from 'mongodb';

// Internal field name used to surface scoreDetails on preview documents.
// Intentionally long and feature-namespaced to reduce collision risk with user fields.
export const SEARCH_SCORE_DETAILS_FIELD = '_searchAIFeaturesScoreDetails';

export type SearchScoreDetails = {
  value: number;
  description: string;
  details: unknown[];
};

export type StagePreviewMetadata = {
  type: '$search';
  scores: (SearchScoreDetails | null)[];
};

/**
 * Transparently injects scoreDetails into a $search pipeline for the
 * per-stage preview. Called only when the last stage is $search and
 * enableSearchActivationP2 is enabled.
 */
export function injectSearchScoreMetadata(pipeline: Document[]): Document[] {
  const searchStageIndex = pipeline.findIndex(
    (stage) => Object.keys(stage)[0] === '$search'
  );
  if (searchStageIndex === -1) {
    return pipeline;
  }

  return [
    ...pipeline.map((stage, index) => {
      if (index !== searchStageIndex) return stage;
      return { $search: { ...stage['$search'], scoreDetails: true } };
    }),
    {
      $addFields: {
        [SEARCH_SCORE_DETAILS_FIELD]: { $meta: 'searchScoreDetails' },
      },
    },
  ];
}

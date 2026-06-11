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
 * Transparently injects scoreDetails into a $search stage for per-stage
 * preview. Called when the stage being previewed is $search, which must be
 * the first stage in a pipeline.
 */
export function injectSearchScoreMetadata(pipeline: Document[]): Document[] {
  const searchStage = pipeline[0];
  if (!searchStage?.['$search']) {
    return pipeline;
  }

  return [
    { $search: { ...searchStage['$search'], scoreDetails: true } },
    ...pipeline.slice(1),
    {
      $addFields: {
        [SEARCH_SCORE_DETAILS_FIELD]: { $meta: 'searchScoreDetails' },
      },
    },
  ];
}

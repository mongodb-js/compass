import type { Document } from 'mongodb';

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
      $project: {
        _id: 0,
        type: { $literal: '$search' },
        scores: { $meta: 'searchScoreDetails' },
      },
    },
  ];
}

export function createSearchStageMetadata(
  metadataDocs: Document[] | null
): StagePreviewMetadata | null {
  if (!metadataDocs) {
    return null;
  }
  const scores: (SearchScoreDetails | null)[] = metadataDocs.map((doc) => {
    return (doc.scores as SearchScoreDetails) ?? null;
  });
  return scores.some((score) => score !== null)
    ? { type: '$search', scores }
    : null;
}

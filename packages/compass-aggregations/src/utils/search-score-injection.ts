import type { Document } from 'mongodb';

export type SearchScoreDetails = {
  value: number;
  description: string;
  details: unknown[];
};

export type StagePreviewMetadata = {
  type: '$search';
  scores: SearchScoreDetails[];
};

/**
 * Transparently injects scoreDetails into a $search stage for per-stage
 * preview. Called when the stage being previewed is $search, which must be
 * the first stage in a pipeline.
 */
export function injectSearchScoreMetadata(
  pipeline: Document[],
  previewSize: number
): Document[] {
  const searchStage = pipeline[0];
  if (!searchStage?.['$search']) {
    return pipeline;
  }

  return [
    { $search: { ...searchStage['$search'], scoreDetails: true } },
    ...pipeline.slice(1),
    { $limit: previewSize },
    {
      $replaceRoot: {
        newRoot: { $meta: 'searchScoreDetails' },
      },
    },
    {
      $group: {
        _id: 0,
        type: { $first: { $literal: '$search' } },
        scores: { $push: '$$ROOT' },
      },
    },
  ];
}

export function createSearchStageMetadata(
  metadataDocs: Document[] | null,
  documentCount: number
): StagePreviewMetadata | null {
  const metadata = metadataDocs?.[0] as StagePreviewMetadata | undefined;
  return metadata?.scores?.length && metadata.scores.length === documentCount
    ? metadata
    : null;
}

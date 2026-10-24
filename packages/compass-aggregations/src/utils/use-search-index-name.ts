import { useAsyncValue } from '@mongodb-js/compass-components';
import type { SearchIndex } from 'mongodb-data-service';
import type { SearchStageOperator } from './stage';
import {
  getSearchIndexNameFromSearchStage,
  getSearchStageInfoFromPipeline,
} from './stage';

/**
 * Search index name used by a single search stage. Null until the stage value
 * has been parsed (parsing happens in a worker).
 */
export function useSearchIndexNameFromStage(
  stageOperator: string | null | undefined,
  stageValue: string | null | undefined
): string | null {
  const { value, pending } = useAsyncValue(
    () =>
      getSearchIndexNameFromSearchStage(
        stageOperator ?? null,
        stageValue ?? null
      ),
    [stageOperator, stageValue]
  );
  return pending ? null : (value ?? null);
}

const NO_SEARCH_STAGE_INFO = {
  searchIndexName: null,
  searchStageOperator: null,
} as const;

/**
 * Search stage operator and index name from the first stage of a pipeline.
 * Both are null until the pipeline text has been parsed.
 */
export function useSearchStageInfoFromPipeline(pipelineText: string): {
  searchIndexName: string | null;
  searchStageOperator: SearchStageOperator | null;
} {
  const { value, pending } = useAsyncValue(
    () => getSearchStageInfoFromPipeline(pipelineText),
    [pipelineText]
  );
  return pending ? NO_SEARCH_STAGE_INFO : (value ?? NO_SEARCH_STAGE_INFO);
}

export function isSearchIndexStale(
  searchIndexName: string | null,
  searchIndexes: SearchIndex[]
): boolean {
  return (
    !!searchIndexName &&
    searchIndexes.some(
      (x) => x.name === searchIndexName && x.status !== 'READY' && x.queryable
    )
  );
}

export function isSearchIndexMissing(
  searchIndexName: string | null,
  searchIndexesStatus: string,
  searchIndexes: SearchIndex[]
): boolean {
  return (
    !!searchIndexName &&
    ['READY', 'POLLING'].includes(searchIndexesStatus) &&
    searchIndexes.every((x) => x.name !== searchIndexName)
  );
}

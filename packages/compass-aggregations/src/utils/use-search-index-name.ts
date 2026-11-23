import { useParsedShellValue } from '@mongodb-js/compass-components';
import { useMemo } from 'react';
import type { Document } from 'mongodb';
import type { SearchIndex } from '@mongodb-js/mongodb-data-service';
import type { SearchStageInfo } from './stage';
import {
  getSearchStageInfoFromParsedPipeline,
  isSearchStage,
  NO_SEARCH_STAGE_INFO,
} from './stage';

/**
 * Search index name used by a single search stage. Null until the stage value
 * has been parsed (parsing happens in a worker).
 */
export function useSearchIndexNameFromStage(
  stageOperator: string | null | undefined,
  stageValue: string | null | undefined
): string | null {
  const source =
    stageOperator && stageValue && isSearchStage(stageOperator)
      ? `{${stageOperator}: ${stageValue}}`
      : '';
  const { value, pending } = useParsedShellValue(source);
  if (!source || pending || !value) {
    return null;
  }
  const indexName = (value as Document)[stageOperator!]?.index;
  return typeof indexName === 'string' ? indexName : null;
}

/**
 * Search stage operator and index name from the first stage of a pipeline.
 * Both are null until the pipeline text has been parsed.
 */
export function useSearchStageInfoFromPipeline(
  pipelineText: string
): SearchStageInfo {
  const { value, pending } = useParsedShellValue(pipelineText);
  return useMemo(
    () =>
      pending
        ? NO_SEARCH_STAGE_INFO
        : getSearchStageInfoFromParsedPipeline(value),
    [pending, value]
  );
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

import { VIEW_PIPELINE_UTILS } from '@mongodb-js/mongodb-constants';
import type { RootState } from '../modules';

/**
 * Whether this connection (or the view's server version) can serve search
 * indexes. Mirrors the `isSearchIndexesReadable` logic in compass-indexes;
 * callers combine it with the `enableAtlasSearchIndexes` preference.
 */
export function selectCanUseSearchIndexes(state: RootState): boolean {
  return state.sourceName
    ? VIEW_PIPELINE_UTILS.isVersionSearchCompatibleForViewsCompass(
        state.serverVersion
      )
    : state.searchIndexes.isSearchIndexesSupported;
}

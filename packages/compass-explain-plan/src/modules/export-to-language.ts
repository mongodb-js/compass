import {
  localAppRegistryEmit,
  globalAppRegistryEmit,
} from '@mongodb-js/mongodb-redux-common/app-registry';
import type { Dispatch } from 'redux';

/**
 * Opens export to language.
 *
 * @param {Object} query - The query.
 *
 * @returns {Function} The function.
 */
export const exportToLanguage = (queryState: {
  filterString: string;
  projectString: string;
  sortString: string;
  collationString: string;
  skipString: string;
  limitString: string;
  maxTimeMSString: string;
}) => {
  return (dispatch: Dispatch): void => {
    dispatch(
      localAppRegistryEmit('open-query-export-to-language', {
        filter: queryState.filterString,
        project: queryState.projectString,
        sort: queryState.sortString,
        collation: queryState.collationString,
        skip: queryState.skipString,
        limit: queryState.limitString,
        maxTimeMS: queryState.maxTimeMSString,
      })
    );
    dispatch(
      globalAppRegistryEmit('compass:export-to-language:opened', {
        source: 'Explain',
      })
    );
  };
};

import type { AnyAction } from 'redux';

export const IS_SEARCH_INDEXES_SUPPORTED_CHANGED =
  'indexes/is-search-indexes-supported/is-search-indexes-supported-changed';

/**
 * The initial state of the is readonly view attribute.
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for is readonly view state.
 *
 * @param {Boolean} state - The state.
 *
 * @returns {Boolean} The state.
 */
export default function reducer(
  state = INITIAL_STATE,
  action: AnyAction
): boolean {
  if (action.type === IS_SEARCH_INDEXES_SUPPORTED_CHANGED) {
    return action.isSearchIndexesSupported;
  }
  return state;
}

/**
 * Action creator for readonly view changed events.
 *
 * @param {Boolean} isReadonlyView - Is the view readonly.
 *
 * @returns {import('redux').AnyAction} The readonly view changed action.
 */
export const isSearchIndexesSupportedChanged = (
  isSearchIndexesSupported: boolean
) => ({
  type: IS_SEARCH_INDEXES_SUPPORTED_CHANGED,
  isSearchIndexesSupported,
});

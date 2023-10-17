import type { Reducer } from 'redux';
import type { PipelineBuilderThunkAction } from '.';
import { localAppRegistryEmit } from '@mongodb-js/mongodb-redux-common/app-registry';

type State = {
  isSearchIndexesSupported: boolean;
};

export const INITIAL_STATE: State = {
  isSearchIndexesSupported: false,
};

const reducer: Reducer<State> = (state = INITIAL_STATE) => {
  return state;
};

export const createSearchIndex = (): PipelineBuilderThunkAction<void> => {
  return (dispatch) => {
    dispatch(localAppRegistryEmit('open-create-search-index-modal'));
  };
};

export default reducer;

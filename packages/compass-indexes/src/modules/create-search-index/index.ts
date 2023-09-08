import type { AnyAction } from 'redux';
import { isAction } from './../../utils/is-action';
import { openToast } from '@mongodb-js/compass-components';

export type CreateSearchIndexState = {
  isModalOpen: boolean; // false
};

export enum ActionTypes {
  OpenCreateSearchIndexModal = 'indexes/search-indexes/OpenCreateSearchIndexModal',
  CloseCreateSearchIndexModal = 'indexes/search-indexes/CloseCreateSearchIndexModal',
}

type OpenCreateSearchIndexModalAction = {
  type: ActionTypes.OpenCreateSearchIndexModal;
};

type CloseCreateSearchIndexModalAction = {
  type: ActionTypes.CloseCreateSearchIndexModal;
};

export const INITIAL_STATE: CreateSearchIndexState = {
  isModalOpen: true,
};

export default function reducer(state = INITIAL_STATE, action: AnyAction) {
  if (
    isAction<OpenCreateSearchIndexModalAction>(
      action,
      ActionTypes.OpenCreateSearchIndexModal
    )
  ) {
    return {
      ...state,
      isModalOpen: true,
    };
  } else if (
    isAction<CloseCreateSearchIndexModalAction>(
      action,
      ActionTypes.CloseCreateSearchIndexModal
    )
  ) {
    return {
      ...state,
      isModalOpen: false,
    };
  }

  return state;
}

export const openModal = (): OpenCreateSearchIndexModalAction => ({
  type: ActionTypes.OpenCreateSearchIndexModal,
});

export const closeModal = (): OpenCreateSearchIndexModalAction => ({
  type: ActionTypes.OpenCreateSearchIndexModal,
});

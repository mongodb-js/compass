import HadronDocument from 'hadron-document';
import { capMaxTimeMSAtPreferenceLimit } from 'compass-preferences-model/provider';
import type { PipelineBuilderThunkAction } from '.';
import type { AnyAction } from 'redux';
import { isAction } from '@mongodb-js/compass-utils';

import { DEFAULT_MAX_TIME_MS } from '../constants';

export enum ActionTypes {
  CollapseToggled = 'aggregations/input-documents/CollapseToggled',
  DocumentsFetchStarted = 'aggregations/input-documents/DocumentsFetchStarted',
  DocumentsFetchFinished = 'aggregations/input-documents/DocumentsFetchFinished',
}

type CollapseToggledAction = {
  type: ActionTypes.CollapseToggled;
};

type DocumentsFetchStartedAction = {
  type: ActionTypes.DocumentsFetchStarted;
};

type DocumentsFetchFinishedAction = {
  type: ActionTypes.DocumentsFetchFinished;
  documents: HadronDocument[];
  error: Error | null;
};

export type InputDocumentsAction =
  | CollapseToggledAction
  | DocumentsFetchFinishedAction
  | DocumentsFetchStartedAction;

export type InputDocumentsState = {
  documents: HadronDocument[];
  error: Error | null;
  isExpanded: boolean;
  isLoading: boolean;
};

export const INITIAL_STATE: InputDocumentsState = {
  documents: [],
  error: null,
  isExpanded: true,
  isLoading: false,
};

const reducer = (
  state: InputDocumentsState = INITIAL_STATE,
  action: AnyAction
): InputDocumentsState => {
  if (isAction<CollapseToggledAction>(action, ActionTypes.CollapseToggled)) {
    return { ...state, isExpanded: !state.isExpanded };
  }

  if (
    isAction<DocumentsFetchStartedAction>(
      action,
      ActionTypes.DocumentsFetchStarted
    )
  ) {
    return { ...state, isLoading: true };
  }

  if (
    isAction<DocumentsFetchFinishedAction>(
      action,
      ActionTypes.DocumentsFetchFinished
    )
  ) {
    return {
      ...state,
      documents: action.documents,
      error: action.error,
      isLoading: false,
    };
  }
  return state;
};

export default reducer;

export const toggleInputDocumentsCollapsed = (): CollapseToggledAction => ({
  type: ActionTypes.CollapseToggled,
});

export const loadingInputDocuments = (): DocumentsFetchStartedAction => ({
  type: ActionTypes.DocumentsFetchStarted,
});

export const updateInputDocuments = (
  documents: HadronDocument[],
  error: Error | null
): DocumentsFetchFinishedAction => ({
  type: ActionTypes.DocumentsFetchFinished,
  documents,
  error,
});

export const refreshInputDocuments = (): PipelineBuilderThunkAction<
  Promise<void>
> => {
  return async (dispatch, getState, { preferences }) => {
    const {
      dataService: { dataService },
      namespace: ns,
      maxTimeMS,
      settings: { sampleSize },
    } = getState();

    if (!dataService) {
      return;
    }

    const options = {
      maxTimeMS: capMaxTimeMSAtPreferenceLimit(
        preferences,
        maxTimeMS ?? DEFAULT_MAX_TIME_MS
      ),
    };

    const aggregateOptions = { ...options };
    const exampleDocumentsPipeline = [{ $limit: sampleSize }];

    dispatch(loadingInputDocuments());

    try {
      const docs = await dataService.aggregate(
        ns,
        exampleDocumentsPipeline,
        aggregateOptions
      );
      const hadronDocs = docs.map((doc: any) => new HadronDocument(doc));
      dispatch(updateInputDocuments(hadronDocs, null));
    } catch (error) {
      dispatch(updateInputDocuments([], error as Error));
    }
  };
};

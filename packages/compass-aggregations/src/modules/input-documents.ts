import HadronDocument from 'hadron-document';
import { capMaxTimeMSAtPreferenceLimit } from 'compass-preferences-model/provider';
import type { PipelineBuilderThunkAction } from '.';
import type { AnyAction } from 'redux';
import { isAction } from '../utils/is-action';

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
  count: number | null;
  documents: HadronDocument[];
  error: Error | null;
};

export type InputDocumentsAction =
  | CollapseToggledAction
  | DocumentsFetchFinishedAction
  | DocumentsFetchStartedAction;

export type InputDocumentsState = {
  count: number | null;
  documents: HadronDocument[];
  error: Error | null;
  isExpanded: boolean;
  isLoading: boolean;
};

export const INITIAL_STATE: InputDocumentsState = {
  count: null,
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
      count: action.count,
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
  count: number | null,
  documents: HadronDocument[],
  error: Error | null
): DocumentsFetchFinishedAction => ({
  type: ActionTypes.DocumentsFetchFinished,
  count,
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
      maxTimeMS: capMaxTimeMSAtPreferenceLimit(preferences, maxTimeMS) as
        | number
        | undefined,
    };

    const exampleDocumentsPipeline = [{ $limit: sampleSize }];

    dispatch(loadingInputDocuments());

    try {
      const data = await Promise.allSettled([
        dataService.estimatedCount(ns, options),
        dataService.aggregate(ns, exampleDocumentsPipeline, options),
      ]);

      const count = data[0].status === 'fulfilled' ? data[0].value : null;
      const docs = data[1].status === 'fulfilled' ? data[1].value : [];
      const hadronDocs = docs.map((doc: any) => new HadronDocument(doc));

      const error =
        data[0].status === 'rejected'
          ? data[0].reason
          : data[1].status === 'rejected'
          ? data[1].reason
          : null;
      dispatch(updateInputDocuments(count, hadronDocs, error));
    } catch (error) {
      dispatch(updateInputDocuments(null, [], error as Error));
    }
  };
};

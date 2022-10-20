import type { Reducer } from 'redux';
import type { Document, MongoServerError } from 'mongodb';
import type { PipelineBuilderThunkAction } from '..';
import { DEFAULT_MAX_TIME_MS } from '../../constants';
import type { PreviewOptions } from './pipeline-preview-manager';
import {
  DEFAULT_PREVIEW_LIMIT,
  DEFAULT_SAMPLE_SIZE
} from './pipeline-preview-manager';
import { isCancelError } from '../../utils/cancellable-promise';
import { isAction } from '../../utils/is-action';
import type { PipelineParserError } from './pipeline-parser/utils';
import { ActionTypes as PipelineModeActionTypes } from './pipeline-mode';
import type { PipelineModeToggledAction } from './pipeline-mode';

const enum EditorActionTypes {
  EditorPreviewFetch = 'compass-aggregations/pipeline-builder/text-editor/TextEditorPreviewFetch',
  EditorPreviewFetchSuccess = 'compass-aggregations/pipeline-builder/text-editor/TextEditorPreviewFetchSuccess',
  EditorPreviewFetchError = 'compass-aggregations/pipeline-builder/text-editor/TextEditorPreviewFetchError',
  EditorValueChange = 'compass-aggregations/pipeline-builder/text-editor/TextEditorValueChange',
};

type EditorValueChangeAction = {
  type: EditorActionTypes.EditorValueChange;
  pipelineText: string;
  syntaxErrors: PipelineParserError[];
};

type EditorPreviewFetchAction = {
  type: EditorActionTypes.EditorPreviewFetch;
};

type EditorPreviewFetchSuccessAction = {
  type: EditorActionTypes.EditorPreviewFetchSuccess;
  previewDocs: Document[];
};

type EditorPreviewFetchErrorAction = {
  type: EditorActionTypes.EditorPreviewFetchError;
  serverError: MongoServerError;
};

export type TextEditorState = {
  pipelineText: string;
  syntaxErrors: PipelineParserError[];
  serverError: MongoServerError | null;
  loading: boolean;
  previewDocs: Document[] | null;
};

const INITIAL_STATE: TextEditorState = {
  pipelineText: '',
  syntaxErrors: [],
  serverError: null,
  loading: false,
  previewDocs: null,
};

const reducer: Reducer<TextEditorState> = (state = INITIAL_STATE, action) => {
  if (
    isAction<EditorValueChangeAction>(
      action,
      EditorActionTypes.EditorValueChange
    ) ||
    isAction<PipelineModeToggledAction>(
      action,
      PipelineModeActionTypes.PipelineModeToggled
    )
  ) {
    return {
      pipelineText: action.pipelineText,
      loading: false,
      previewDocs: null,
      serverError: null,
      syntaxErrors: action.syntaxErrors,
    };
  }

  if (
    isAction<EditorPreviewFetchAction>(
      action,
      EditorActionTypes.EditorPreviewFetch
    )
  ) {
    return {
      ...state,
      previewDocs: null,
      loading: true,
    };
  }

  if (
    isAction<EditorPreviewFetchSuccessAction>(
      action,
      EditorActionTypes.EditorPreviewFetchSuccess
    )
  ) {
    return {
      ...state,
      serverError: null,
      syntaxErrors: [],
      loading: false,
      previewDocs: action.previewDocs,
    };
  }

  if (
    isAction<EditorPreviewFetchErrorAction>(
      action,
      EditorActionTypes.EditorPreviewFetchError
    )
  ) {
    return {
      ...state,
      serverError: action.serverError,
      syntaxErrors: [],
      loading: false,
      previewDocs: null,
    };
  }

  return state;
};

export const loadPreviewForPipeline = (
): PipelineBuilderThunkAction<
  Promise<void>,
  EditorPreviewFetchAction |
  EditorPreviewFetchSuccessAction |
  EditorPreviewFetchErrorAction
> => {
  return async (dispatch, getState, { pipelineBuilder }) => {
    const {
      autoPreview
    } = getState();

    const canRunPipeline = pipelineBuilder.syntaxError.length === 0;
    if (!autoPreview || !canRunPipeline) {
      return;
    }

    try {
      dispatch({
        type: EditorActionTypes.EditorPreviewFetch,
      });

      const {
        namespace,
        maxTimeMS,
        collationString,
        limit,
        largeLimit,
        inputDocuments
      } = getState();

      const options: PreviewOptions = {
        maxTimeMS: maxTimeMS ?? DEFAULT_MAX_TIME_MS,
        collation: collationString.value ?? undefined,
        sampleSize: largeLimit ?? DEFAULT_SAMPLE_SIZE,
        previewSize: limit ?? DEFAULT_PREVIEW_LIMIT,
        totalDocumentCount: inputDocuments.count
      };

      const previewDocs = await pipelineBuilder.getPreviewForPipeline(
        namespace,
        options
      );

      dispatch({
        type: EditorActionTypes.EditorPreviewFetchSuccess,
        previewDocs
      });
    } catch (err) {
      if (isCancelError(err)) {
        return;
      }
      dispatch({
        type: EditorActionTypes.EditorPreviewFetchError,
        serverError: err as MongoServerError
      });
    }
  };
};

export const changeEditorValue = (
  value: string
): PipelineBuilderThunkAction<void, EditorValueChangeAction> => {
  return (dispatch, _getState, { pipelineBuilder }) => {
    pipelineBuilder.changeSource(value);
    dispatch({
      type: EditorActionTypes.EditorValueChange,
      pipelineText: value,
      syntaxErrors: pipelineBuilder.syntaxError
    });
    void dispatch(loadPreviewForPipeline());
  };
};


export default reducer;
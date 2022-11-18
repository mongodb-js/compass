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
import { CONFIRM_NEW, NEW_PIPELINE } from '../import-pipeline';
import { RESTORE_PIPELINE } from '../saved-pipeline';

export const enum EditorActionTypes {
  EditorPreviewFetch = 'compass-aggregations/pipeline-builder/text-editor-pipeline/TextEditorPreviewFetch',
  EditorPreviewFetchSkipped = 'compass-aggregations/pipeline-builder/text-editor-pipeline/EditorPreviewFetchSkipped',
  EditorPreviewFetchSuccess = 'compass-aggregations/pipeline-builder/text-editor-pipeline/TextEditorPreviewFetchSuccess',
  EditorPreviewFetchError = 'compass-aggregations/pipeline-builder/text-editor-pipeline/TextEditorPreviewFetchError',
  EditorValueChange = 'compass-aggregations/pipeline-builder/text-editor-pipeline/TextEditorValueChange',
};

export type EditorValueChangeAction = {
  type: EditorActionTypes.EditorValueChange;
  pipelineText: string;
  pipeline: Document[] | null;
  syntaxErrors: PipelineParserError[];
};

type EditorPreviewFetchAction = {
  type: EditorActionTypes.EditorPreviewFetch;
};

type EditorPreviewFetchSkippedAction = {
  type: EditorActionTypes.EditorPreviewFetchSkipped;
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
  pipeline: Document[];
  syntaxErrors: PipelineParserError[];
  serverError: MongoServerError | null;
  isLoading: boolean;
  previewDocs: Document[] | null;
};

const INITIAL_STATE: TextEditorState = {
  pipelineText: '',
  pipeline: [],
  syntaxErrors: [],
  serverError: null,
  isLoading: false,
  previewDocs: null,
};

const reducer: Reducer<TextEditorState> = (state = INITIAL_STATE, action) => {
  // NB: Anything that this action handling reacts to should probably be also
  // accounted for in text-editor-output-stage slice. If you are changing this
  // code, don't forget to change the other reducer
  if (
    isAction<PipelineModeToggledAction>(
      action,
      PipelineModeActionTypes.PipelineModeToggled
    ) ||
    action.type === RESTORE_PIPELINE ||
    action.type === CONFIRM_NEW ||
    action.type === NEW_PIPELINE
  ) {
    // On editor switch or reset, reset the parsed pipeline completely
    const pipeline = action.pipeline ?? [];

    return {
      ...state,
      serverError: null,
      previewDocs: null,
      pipelineText: action.pipelineText,
      pipeline,
      syntaxErrors: action.syntaxErrors,
    };
  }

  if (
    isAction<EditorValueChangeAction>(
      action,
      EditorActionTypes.EditorValueChange
    )
  ) {
    // On pipeline text change we preserve the previous pipeline in the state
    // if parsing of the current pipeline text failed
    const pipeline = action.pipeline ?? state.pipeline;

    return {
      ...state,
      pipelineText: action.pipelineText,
      pipeline,
      syntaxErrors: action.syntaxErrors,
    };
  }

  if (
    isAction<EditorPreviewFetchSkippedAction>(
      action,
      EditorActionTypes.EditorPreviewFetchSkipped
    )
  ) {
    return {
      ...state,
      serverError: null,
      previewDocs: null,
      isLoading: false
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
      serverError: null,
      isLoading: true,
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
      isLoading: false,
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
      isLoading: false,
      previewDocs: null,
    };
  }

  return state;
};

export function canRunPipeline(
  autoPreview: boolean,
  syntaxErrors: PipelineParserError[],
) {
  return autoPreview && syntaxErrors.length === 0;
};

export const loadPreviewForPipeline = (
): PipelineBuilderThunkAction<
  Promise<void>,
  EditorPreviewFetchAction |
  EditorPreviewFetchSuccessAction |
  EditorPreviewFetchErrorAction |
  EditorPreviewFetchSkippedAction
> => {
  return async (dispatch, getState, { pipelineBuilder }) => {
    const {
      autoPreview,
      namespace,
      maxTimeMS,
      collationString,
      limit,
      largeLimit,
      inputDocuments,
      pipelineBuilder: {
        textEditor: {
          pipeline: { pipeline }
        }
      }
    } = getState();

    if (pipelineBuilder.isLastPipelinePreviewEqual(pipeline, true)) {
      return;
    }

    // Ignoring the state of the stage, always try to stop current preview fetch
    pipelineBuilder.cancelPreviewForPipeline();

    if (!canRunPipeline(autoPreview, pipelineBuilder.syntaxError)) {
      dispatch({
        type: EditorActionTypes.EditorPreviewFetchSkipped
      })

      return;
    }

    try {
      dispatch({
        type: EditorActionTypes.EditorPreviewFetch,
      });

      const options: PreviewOptions = {
        maxTimeMS: maxTimeMS ?? DEFAULT_MAX_TIME_MS,
        collation: collationString.value ?? undefined,
        sampleSize: largeLimit ?? DEFAULT_SAMPLE_SIZE,
        previewSize: limit ?? DEFAULT_PREVIEW_LIMIT,
        totalDocumentCount: inputDocuments.count,
      };

      const previewDocs = await pipelineBuilder.getPreviewForPipeline(
        namespace,
        options,
        true, // Filter output stage
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
  newValue: string
): PipelineBuilderThunkAction<void, EditorValueChangeAction> => {
  return (dispatch, getState, { pipelineBuilder }) => {
    const {
      pipelineBuilder: {
        textEditor: {
          pipeline: { pipelineText }
        }
      }
    } = getState();

    if (pipelineText === newValue) {
      return;
    }

    pipelineBuilder.changeSource(newValue);

    dispatch({
      type: EditorActionTypes.EditorValueChange,
      pipelineText: newValue,
      pipeline: pipelineBuilder.pipeline,
      syntaxErrors: pipelineBuilder.syntaxError
    });

    void dispatch(loadPreviewForPipeline());
  };
};

export default reducer;

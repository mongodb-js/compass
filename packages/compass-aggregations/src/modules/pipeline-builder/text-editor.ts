import type { Reducer } from 'redux';
import type { AggregateOptions, Document, MongoServerError } from 'mongodb';
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
import { getStageOperator } from '../../utils/stage';
import { CONFIRM_NEW, NEW_PIPELINE } from '../import-pipeline';
import { RESTORE_PIPELINE } from '../saved-pipeline';
import { aggregatePipeline } from '../../utils/cancellable-aggregation';
import { gotoOutResults } from '../out-results-fn';
import { globalAppRegistryEmit } from '@mongodb-js/mongodb-redux-common/app-registry';

export const enum EditorActionTypes {
  EditorPreviewFetch = 'compass-aggregations/pipeline-builder/text-editor/TextEditorPreviewFetch',
  EditorPreviewFetchSuccess = 'compass-aggregations/pipeline-builder/text-editor/TextEditorPreviewFetchSuccess',
  EditorPreviewFetchError = 'compass-aggregations/pipeline-builder/text-editor/TextEditorPreviewFetchError',
  EditorValueChange = 'compass-aggregations/pipeline-builder/text-editor/TextEditorValueChange',
  OutputStageFetchStarted = 'compass-aggregations/pipeline-builder/text-editor/OutputStageFetchStarted',
  OutputStageFetchSucceded = 'compass-aggregations/pipeline-builder/text-editor/OutputStageFetchSucceded',
  OutputStageFetchFailed = 'compass-aggregations/pipeline-builder/text-editor/OutputStageFetchFailed',
};

type EditorValueChangeAction = {
  type: EditorActionTypes.EditorValueChange;
  pipelineText: string;
  pipeline: Document[] | null;
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

type OutputStageFetchStartedAction = {
  type: EditorActionTypes.OutputStageFetchStarted;
};

type OutputStageFetchSuccededAction = {
  type: EditorActionTypes.OutputStageFetchSucceded;
};

type OutputStageFetchFailedAction = {
  type: EditorActionTypes.OutputStageFetchFailed;
  serverError: MongoServerError;
};

export type TextEditorState = {
  pipelineText: string;
  stageOperators: string[];
  syntaxErrors: PipelineParserError[];
  serverError: MongoServerError | null;
  loading: boolean;
  previewDocs: Document[] | null;
  outputStage: {
    isLoading: boolean;
    isComplete: boolean;
  }
};

const INITIAL_STATE: TextEditorState = {
  pipelineText: '',
  stageOperators: [],
  syntaxErrors: [],
  serverError: null,
  loading: false,
  previewDocs: null,
  outputStage: {
    isLoading: false,
    isComplete: false,
  }
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
    ) ||
    action.type === RESTORE_PIPELINE ||
    action.type === CONFIRM_NEW ||
    action.type === NEW_PIPELINE
  ) {
    const stageOperators = action.pipeline
      ? action.pipeline.map(getStageOperator).filter(Boolean) as string[]
      : state.stageOperators;
    return {
      ...state,
      outputStage:{
        isLoading: false,
        isComplete: false,
      },
      serverError: null,
      previewDocs: null,
      pipelineText: action.pipelineText,
      stageOperators,
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
      serverError: null,
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

  if (
    isAction<OutputStageFetchStartedAction>(
      action,
      EditorActionTypes.OutputStageFetchStarted
    )
  ) {
    return {
      ...state,
      serverError: null,
      outputStage: {
        isLoading: true,
        isComplete: false,
      },
    };
  }

  if (
    isAction<OutputStageFetchSuccededAction>(
      action,
      EditorActionTypes.OutputStageFetchSucceded
    )
  ) {
    return {
      ...state,
      serverError: null,
      outputStage: {
        isLoading: false,
        isComplete: true,
      },
    };
  }

  if (
    isAction<OutputStageFetchFailedAction>(
      action,
      EditorActionTypes.OutputStageFetchFailed
    )
  ) {
    return {
      ...state,
      serverError: action.serverError,
      outputStage: {
        isLoading: false,
        isComplete: false,
      },
    };
  }

  return state;
};

function canRunPipeline(
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
  EditorPreviewFetchErrorAction
> => {
  return async (dispatch, getState, { pipelineBuilder }) => {
    const {
      autoPreview,
      namespace,
      maxTimeMS,
      collationString,
      limit,
      largeLimit,
      inputDocuments
    } = getState();

    if (!canRunPipeline(autoPreview, pipelineBuilder.syntaxError)) {
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
        filterOutputStage: true, // For preview we ignore $out/$merge stage.
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
      pipeline: pipelineBuilder.pipeline,
      syntaxErrors: pipelineBuilder.syntaxError
    });
    void dispatch(loadPreviewForPipeline());
  };
};

export const runPipelineWithOutputStage = (
  ): PipelineBuilderThunkAction<Promise<void>> => {
    return async (dispatch, getState, { pipelineBuilder }) => {
      const {
        autoPreview,
        isAtlasDeployed,
        dataService: { dataService },
        namespace,
        maxTimeMS,
        collationString,
      } = getState();
  
  
      if (!dataService || !isAtlasDeployed) {
        return;
      }
  
      if (!canRunPipeline(autoPreview, pipelineBuilder.syntaxError)) {
        return;
      }
  
      try {
        dispatch({ type: EditorActionTypes.OutputStageFetchStarted });
        const pipeline = pipelineBuilder.getPipelineFromSource();
        const options: AggregateOptions = {
          maxTimeMS: maxTimeMS ?? DEFAULT_MAX_TIME_MS,
          collation: collationString.value ?? undefined
        };
        const { signal } = new AbortController();
        await aggregatePipeline({
          dataService,
          signal,
          namespace,
          pipeline,
          options
        });
        dispatch({
          type: EditorActionTypes.OutputStageFetchSucceded,
        });
        dispatch(globalAppRegistryEmit('agg-pipeline-out-executed'));
      } catch (error) {
        dispatch({
          type: EditorActionTypes.OutputStageFetchFailed,
          serverError: error,
        });
      }
    };
  };
  
  export const gotoOutputStageCollection = (
  ): PipelineBuilderThunkAction<void> => {
    return (dispatch, getState) => {
      const {
        pipelineBuilder: {
          textEditor: {
            stageOperators
          }
        }
      } = getState();
      // $out or $merge is always last stage
      const lastStageIndex = stageOperators.length - 1;
      dispatch(gotoOutResults(lastStageIndex));
    };
  };

export default reducer;
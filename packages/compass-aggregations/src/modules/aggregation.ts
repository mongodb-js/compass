import HadronDocument from 'hadron-document';
import type { Reducer } from 'redux';
import type { AggregateOptions, Document, MongoServerError } from 'mongodb';
import type { PipelineBuilderThunkAction } from '.';
import { DEFAULT_MAX_TIME_MS } from '../constants';
import { aggregatePipeline } from '../utils/cancellable-aggregation';
import type { WorkspaceChangedAction } from './workspace';
import { ActionTypes as WorkspaceActionTypes } from './workspace';
import type { NewPipelineConfirmedAction } from './is-new-pipeline-confirm';
import { ActionTypes as ConfirmNewPipelineActions } from './is-new-pipeline-confirm';
import {
  getPipelineFromBuilderState,
  mapPipelineModeToEditorViewType,
} from './pipeline-builder/builder-helpers';
import {
  getDestinationNamespaceFromStage,
  getStageOperator,
} from '../utils/stage';
import { fetchExplainForPipeline } from './insights';
import { isAction } from '../utils/is-action';
import {
  showConfirmation,
  ConfirmationModalVariant,
} from '@mongodb-js/compass-components';
import { runPipelineConfirmationDescription } from '../utils/modal-descriptions';
import toNS from 'mongodb-ns';
import type { MongoDBInstance } from 'mongodb-instance-model';
import type { DataService } from 'mongodb-data-service';

const WRITE_STAGE_LINK = {
  $merge:
    'https://www.mongodb.com/docs/manual/reference/operator/aggregation/merge/',
  $out: 'https://www.mongodb.com/docs/manual/reference/operator/aggregation/out/',
};

export const WriteOperation = {
  Alter: 'altering',
  Create: 'creating',
  Overwrite: 'overwriting',
} as const;

export enum ActionTypes {
  RunAggregation = 'compass-aggeregations/runAggregation',
  AggregationStarted = 'compass-aggregations/aggregationStarted',
  AggregationFinished = 'compass-aggregations/aggregationFinished',
  AggregationFailed = 'compass-aggregations/aggregationFailed',
  AggregationCancelledByUser = 'compass-aggregations/aggregationCancelledByUser',
  LastPageReached = 'compass-aggregations/lastPageReached',
  ResultViewTypeChanged = 'compass-aggregations/resultViewTypeChanged',
}

type PreviousPageData = {
  page: number;
  isLast: boolean;
  documents: HadronDocument[];
};

export type RunAggregation = {
  type: ActionTypes.RunAggregation;
  pipeline: Document[];
};

export type AggregationStartedAction = {
  type: ActionTypes.AggregationStarted;
  abortController: AbortController;
};

export type AggregationFinishedAction = {
  type: ActionTypes.AggregationFinished;
  documents: HadronDocument[];
  page: number;
  isLast: boolean;
};

export type AggregationFailedAction = {
  type: ActionTypes.AggregationFailed;
  error: string;
  page: number;
};

export type AggregationCancelledAction = {
  type: ActionTypes.AggregationCancelledByUser;
};

export type LastPageReachedAction = {
  type: ActionTypes.LastPageReached;
  page: number;
};

export type ResultViewTypeChangedAction = {
  type: ActionTypes.ResultViewTypeChanged;
  viewType: 'document' | 'json';
};

export type Actions =
  | RunAggregation
  | AggregationStartedAction
  | AggregationFinishedAction
  | AggregationFailedAction
  | AggregationCancelledAction
  | LastPageReachedAction
  | ResultViewTypeChangedAction;

export type State = {
  pipeline: Document[];
  documents: HadronDocument[];
  page: number;
  limit: number;
  isLast: boolean;
  loading: boolean;
  abortController?: AbortController;
  error?: string;
  previousPageData?: PreviousPageData;
  resultsViewType: 'document' | 'json';
};

export const INITIAL_STATE: State = {
  pipeline: [],
  documents: [],
  page: 1,
  limit: 20,
  isLast: false,
  loading: false,
  resultsViewType: 'document',
};

const reducer: Reducer<State> = (state = INITIAL_STATE, action) => {
  if (
    isAction<WorkspaceChangedAction>(
      action,
      WorkspaceActionTypes.WorkspaceChanged
    ) ||
    isAction<NewPipelineConfirmedAction>(
      action,
      ConfirmNewPipelineActions.NewPipelineConfirmed
    )
  ) {
    return INITIAL_STATE;
  }
  if (isAction<RunAggregation>(action, ActionTypes.RunAggregation)) {
    return {
      ...state,
      pipeline: action.pipeline,
    };
  }
  if (
    isAction<AggregationStartedAction>(action, ActionTypes.AggregationStarted)
  ) {
    return {
      ...state,
      loading: true,
      error: undefined,
      documents: [],
      abortController: action.abortController,
      previousPageData: {
        page: state.page,
        documents: state.documents,
        isLast: state.isLast,
      },
    };
  }
  if (
    isAction<AggregationFinishedAction>(action, ActionTypes.AggregationFinished)
  ) {
    return {
      ...state,
      isLast: action.isLast,
      page: action.page,
      documents: action.documents,
      loading: false,
      abortController: undefined,
      error: undefined,
      previousPageData: undefined,
    };
  }
  if (
    isAction<AggregationFailedAction>(action, ActionTypes.AggregationFailed)
  ) {
    return {
      ...state,
      documents: [],
      loading: false,
      abortController: undefined,
      error: action.error,
      page: action.page,
      previousPageData: undefined,
    };
  }
  if (
    isAction<AggregationCancelledAction>(
      action,
      ActionTypes.AggregationCancelledByUser
    )
  ) {
    return {
      ...state,
      loading: false,
      abortController: undefined,
      documents: state.previousPageData?.documents || [],
      page: state.previousPageData?.page || 1,
      isLast: state.previousPageData?.isLast || false,
      previousPageData: undefined,
    };
  }
  if (isAction<LastPageReachedAction>(action, ActionTypes.LastPageReached)) {
    return {
      ...state,
      isLast: true,
      loading: false,
      page: action.page,
    };
  }
  if (
    isAction<ResultViewTypeChangedAction>(
      action,
      ActionTypes.ResultViewTypeChanged
    )
  ) {
    return {
      ...state,
      resultsViewType: action.viewType,
    };
  }
  return state;
};

const writeOperationConfirmationHandler = async (
  dataService: DataService,
  namespace: string,
  pipeline: Document[],
  instance: MongoDBInstance
) => {
  const lastStage = pipeline[pipeline.length - 1];
  const lastStageName = Object.keys(lastStage)[0];
  let typeOfWrite;

  if (!['$merge', '$out'].includes(lastStageName)) {
    return true;
  }

  let { database, collection } = toNS(namespace);

  if (typeof lastStage.$merge === 'string') {
    collection = lastStage.$merge;
  }

  if (
    typeof lastStage.$merge === 'object' &&
    lastStage.$merge !== null &&
    typeof lastStage.$merge.into === 'string'
  ) {
    collection = lastStage.$merge.into;
  }

  if (
    typeof lastStage.$merge === 'object' &&
    lastStage.$merge !== null &&
    typeof lastStage.$merge.into === 'object' &&
    lastStage.$merge.into !== null
  ) {
    database = lastStage.$merge.into.db;
    collection = lastStage.$merge.into.coll;
  }

  if (typeof lastStage.$out === 'string') {
    collection = lastStage.$out;
  }

  if (typeof lastStage.$out === 'object' && lastStage.$out !== null) {
    database = lastStage.$out.db;
    collection = lastStage.$out.coll;
  }

  const destinationNamespace = `${database}.${collection}`;

  if (lastStage.$out) {
    const isNamespaceExists = !!(await instance.getNamespace({
      dataService,
      database,
      collection,
    }));
    typeOfWrite = isNamespaceExists
      ? WriteOperation.Overwrite
      : WriteOperation.Create;
  } else {
    typeOfWrite = WriteOperation.Alter;
  }

  const confirmed = await showConfirmation({
    variant:
      typeOfWrite === WriteOperation.Overwrite
        ? ConfirmationModalVariant.Danger
        : ConfirmationModalVariant.Default,
    title: 'A write operation will occur',
    description: runPipelineConfirmationDescription({
      typeOfWrite,
      stage: {
        name: lastStageName,
        link: WRITE_STAGE_LINK[lastStageName as keyof typeof WRITE_STAGE_LINK],
      },
      ns: destinationNamespace,
    }),
    buttonText: 'Yes, run pipeline',
    'data-testid': `write-operation-confirmation-modal`,
  });

  return confirmed;
};

export const runAggregation = (): PipelineBuilderThunkAction<Promise<void>> => {
  return async (
    dispatch,
    getState,
    { pipelineBuilder, logger: { track }, instance }
  ) => {
    const state = getState();
    const pipeline = getPipelineFromBuilderState(state, pipelineBuilder);
    const dataService = state.dataService.dataService;

    const isConfirmReceivedOrNotRequired =
      await writeOperationConfirmationHandler(
        dataService,
        state.namespace,
        pipeline,
        instance
      );
    if (!isConfirmReceivedOrNotRequired) {
      return;
    }

    void dispatch(fetchExplainForPipeline());
    dispatch({
      type: ActionTypes.RunAggregation,
      pipeline,
    });
    track('Aggregation Executed', () => ({
      num_stages: pipeline.length,
      editor_view_type: mapPipelineModeToEditorViewType(getState()),
    }));
    return dispatch(fetchAggregationData());
  };
};

export const fetchPrevPage = (): PipelineBuilderThunkAction<
  Promise<void>,
  Actions
> => {
  return async (dispatch, getState) => {
    const {
      aggregation: { page },
    } = getState();
    if (page <= 1) {
      return;
    }
    return dispatch(fetchAggregationData(page - 1));
  };
};

export const fetchNextPage = (): PipelineBuilderThunkAction<
  Promise<void>,
  Actions
> => {
  return async (dispatch, getState) => {
    const {
      aggregation: { isLast, page },
    } = getState();
    if (isLast) {
      return;
    }
    return dispatch(fetchAggregationData(page + 1));
  };
};

export const retryAggregation = (): PipelineBuilderThunkAction<
  Promise<void>,
  Actions
> => {
  return (dispatch, getState) => {
    const {
      aggregation: { page },
    } = getState();
    return dispatch(fetchAggregationData(page));
  };
};

export const cancelAggregation = (): PipelineBuilderThunkAction<
  void,
  Actions
> => {
  return (dispatch, getState, { logger: { track } }) => {
    track('Aggregation Canceled');
    const {
      aggregation: { abortController },
    } = getState();
    _abortAggregation(abortController);
    // In order to avoid the race condition between user cancel and cancel triggered
    // in fetchAggregationData, we dispatch ActionTypes.AggregationCancelledByUser here.
    dispatch({
      type: ActionTypes.AggregationCancelledByUser,
    });
  };
};

const _abortAggregation = (controller?: AbortController): void => {
  controller?.abort();
};

const fetchAggregationData = (
  page = 1
): PipelineBuilderThunkAction<Promise<void>> => {
  return async (
    dispatch,
    getState,
    { preferences, logger: { track, log, mongoLogId }, globalAppRegistry }
  ) => {
    const {
      namespace,
      maxTimeMS,
      dataService: { dataService },
      aggregation: { limit, abortController: _abortController, pipeline },
      collationString: { value: collation },
    } = getState();

    if (!dataService) {
      return;
    }

    // Cancel the existing aggregate
    _abortAggregation(_abortController);

    try {
      const abortController = new AbortController();
      const signal = abortController.signal;

      dispatch({
        type: ActionTypes.AggregationStarted,
        abortController,
      });

      const options: AggregateOptions = {
        maxTimeMS: maxTimeMS ?? DEFAULT_MAX_TIME_MS,
        collation: collation ?? undefined,
      };

      const lastStage = pipeline[pipeline.length - 1];

      const isMergeOrOut = ['$merge', '$out'].includes(
        getStageOperator(lastStage) ?? ''
      );

      const documents = await aggregatePipeline({
        dataService,
        preferences,
        signal,
        namespace,
        pipeline,
        options,
        ...(!isMergeOrOut && {
          skip: (page - 1) * limit,
          limit,
        }),
      });

      if (isMergeOrOut) {
        globalAppRegistry.emit(
          'agg-pipeline-out-executed',
          getDestinationNamespaceFromStage(
            namespace,
            pipeline[pipeline.length - 1]
          )
        );
      }

      if (documents.length === 0) {
        dispatch({ type: ActionTypes.LastPageReached, page });
      } else {
        dispatch({
          type: ActionTypes.AggregationFinished,
          documents: documents.map((doc) => new HadronDocument(doc)),
          page,
          isLast: documents.length < limit,
        });
      }
    } catch (e) {
      // User cancel is handled in cancelAggregation
      if (dataService.isCancelError(e)) {
        return;
      }
      // Server errors are surfaced to the user
      if ((e as MongoServerError).code) {
        dispatch({
          type: ActionTypes.AggregationFailed,
          error: (e as Error).message,
          page,
        });
        if ((e as MongoServerError).codeName === 'MaxTimeMSExpired') {
          track('Aggregation Timed Out', { max_time_ms: maxTimeMS ?? null });
        }
        log.warn(
          mongoLogId(1001000106),
          'Aggregations',
          'Failed to run aggregation',
          { message: (e as Error).message }
        );
        return;
      }
      // Anything else is not expected, throw
      throw e;
    }
  };
};

export const exportAggregationResults =
  (): PipelineBuilderThunkAction<void> => {
    return (_dispatch, getState, { pipelineBuilder, globalAppRegistry }) => {
      const {
        namespace,
        maxTimeMS,
        countDocuments: { count },
        collationString: { value: collation },
      } = getState();

      const pipeline = getPipelineFromBuilderState(getState(), pipelineBuilder);

      const options: AggregateOptions = {
        maxTimeMS: maxTimeMS ?? DEFAULT_MAX_TIME_MS,
        allowDiskUse: true,
        collation: collation ?? undefined,
      };

      globalAppRegistry.emit('open-export', {
        namespace,
        aggregation: {
          stages: pipeline,
          options,
        },
        origin: 'aggregations-toolbar',
        count,
      });
    };
  };

export const changeViewType = (newViewType: 'document' | 'json') => {
  return {
    type: ActionTypes.ResultViewTypeChanged,
    viewType: newViewType,
  };
};

export const expandPipelineResults = (): PipelineBuilderThunkAction<void> => {
  return (dispatch, getState) => {
    const {
      aggregation: { documents },
    } = getState();

    documents.forEach((doc) => doc.expand());
  };
};

export const collapsePipelineResults = (): PipelineBuilderThunkAction<void> => {
  return (dispatch, getState) => {
    const {
      aggregation: { documents },
    } = getState();

    documents.forEach((doc) => doc.collapse());
  };
};

export default reducer;

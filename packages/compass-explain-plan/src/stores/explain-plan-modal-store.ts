import type { Stage } from '@mongodb-js/explain-plan-helper';
import { ExplainPlan } from '@mongodb-js/explain-plan-helper';
import { capMaxTimeMSAtPreferenceLimit } from 'compass-preferences-model/provider';
import type { Action, AnyAction, Reducer } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import type {
  ExplainPlanModalServices,
  OpenExplainPlanModalEvent,
  OpenExplainPlanForInterpretEvent,
} from '.';

export function isAction<A extends AnyAction>(
  action: AnyAction,
  type: A['type']
): action is A {
  return action.type === type;
}

export type SerializedExplainPlan = ReturnType<ExplainPlan['serialize']>;

const ExplainPlanModalActionTypes = {
  CloseExplainPlanModal: 'compass-explain-plan-modal/CloseExplainPlanModal',
  FetchExplainPlanModalLoading:
    'compass-explain-plan-modal/FetchExplainPlanModalLoading',
  FetchExplainPlanModalSuccess:
    'compass-explain-plan-modal/FetchExplainPlanModalSuccess',
  FetchExplainPlanModalError:
    'compass-explain-plan-modal/FetchExplainPlanModalError',
} as const;

type CloseExplainPlanModalAction = {
  type: typeof ExplainPlanModalActionTypes.CloseExplainPlanModal;
};

type FetchExplainPlanModalLoadingAction = {
  type: typeof ExplainPlanModalActionTypes.FetchExplainPlanModalLoading;
  id: number;
  operationType: 'query' | 'aggregation';
  initialViewType: 'tree' | 'json';
};

type FetchExplainPlanModalSuccessAction = {
  type: typeof ExplainPlanModalActionTypes.FetchExplainPlanModalSuccess;
  explainPlan: SerializedExplainPlan;
  rawExplainPlan: unknown;
};

type FetchExplainPlanModalErrorAction = {
  type: typeof ExplainPlanModalActionTypes.FetchExplainPlanModalError;
  error: string;
  rawExplainPlan: unknown;
};

export type ExplainPlanModalState = {
  namespace: string;
  isDataLake: boolean;
  error: string | null;
  isModalOpen: boolean;
  status: 'initial' | 'loading' | 'ready' | 'error';
  explainPlan: SerializedExplainPlan | null;
  rawExplainPlan: unknown;
  explainPlanFetchId: number;
  operationType: 'query' | 'aggregation' | null;
  initialViewType: 'tree' | 'json';
};

type ExplainPlanModalThunkAction<R, A extends Action = AnyAction> = ThunkAction<
  R,
  ExplainPlanModalState,
  ExplainPlanModalServices,
  A
>;

export const INITIAL_STATE: ExplainPlanModalState = {
  namespace: '',
  isDataLake: false,
  error: null,
  isModalOpen: false,
  status: 'initial',
  explainPlan: null,
  rawExplainPlan: null,
  explainPlanFetchId: -1,
  operationType: null,
  initialViewType: 'tree',
};

export const reducer: Reducer<ExplainPlanModalState, Action> = (
  state = INITIAL_STATE,
  action
) => {
  if (
    isAction<FetchExplainPlanModalLoadingAction>(
      action,
      ExplainPlanModalActionTypes.FetchExplainPlanModalLoading
    )
  ) {
    return {
      ...state,
      isModalOpen: true,
      status: 'loading',
      error: null,
      explainPlan: null,
      rawExplainPlan: null,
      explainPlanFetchId: action.id,
      operationType: action.operationType,
      initialViewType: action.initialViewType,
    };
  }

  if (
    isAction<FetchExplainPlanModalSuccessAction>(
      action,
      ExplainPlanModalActionTypes.FetchExplainPlanModalSuccess
    )
  ) {
    return {
      ...state,
      status: 'ready',
      explainPlan: action.explainPlan,
      rawExplainPlan: action.rawExplainPlan,
      explainPlanFetchId: -1,
    };
  }

  if (
    isAction<FetchExplainPlanModalErrorAction>(
      action,
      ExplainPlanModalActionTypes.FetchExplainPlanModalError
    )
  ) {
    return {
      ...state,
      status: 'error',
      explainPlan: null,
      error: action.error,
      rawExplainPlan: action.rawExplainPlan,
      explainPlanFetchId: -1,
    };
  }

  if (
    isAction<CloseExplainPlanModalAction>(
      action,
      ExplainPlanModalActionTypes.CloseExplainPlanModal
    )
  ) {
    return {
      ...state,
      // We don't reset the state completely so that the closing modal content
      // doesn't jump during closing animation
      isModalOpen: false,
    };
  }

  return state;
};

const ExplainPlanAbortControllerMap = new Map<number, AbortController>();

let explainPlanFetchId = 0;

function getAbortSignal() {
  const id = ++explainPlanFetchId;
  const controller = new AbortController();
  ExplainPlanAbortControllerMap.set(id, controller);
  return { id, signal: controller.signal };
}

function abort(id: number) {
  const controller = ExplainPlanAbortControllerMap.get(id);
  controller?.abort();
  return ExplainPlanAbortControllerMap.delete(id);
}

function cleanupAbortSignal(id: number) {
  return ExplainPlanAbortControllerMap.delete(id);
}

const isOutputStage = (stage: unknown): boolean => {
  return (
    Object.prototype.hasOwnProperty.call(stage, '$out') ||
    Object.prototype.hasOwnProperty.call(stage, '$merge')
  );
};

const DEFAULT_MAX_TIME_MS = 60_000;

class ExplainFetchError extends Error {
  rawExplainPlan: unknown;
  constructor(message: string, rawExplainPlan: unknown) {
    super(message);
    this.rawExplainPlan = rawExplainPlan;
  }
}

type ExplainFetchResult = {
  explainPlan: SerializedExplainPlan;
  rawExplainPlan: unknown;
  operationType: 'query' | 'aggregation';
  namespace: string;
} | null;

// Shared explain fetch helper; does not update modal state.
const fetchExplainPlanData = (
  event: OpenExplainPlanModalEvent | OpenExplainPlanForInterpretEvent,
  signal: AbortSignal
): ExplainPlanModalThunkAction<Promise<ExplainFetchResult>> => {
  return async (
    _dispatch,
    getState,
    {
      dataService,
      preferences,
      track,
      connectionInfoRef,
      logger: { log, mongoLogId },
    }
  ) => {
    const connectionInfo = connectionInfoRef.current;
    const { isDataLake, namespace } = getState();
    const operationType = event.query ? 'query' : 'aggregation';
    const explainVerbosity = isDataLake
      ? 'queryPlannerExtended'
      : 'executionStats';

    let rawExplainPlan: unknown = null;
    let explainPlan: SerializedExplainPlan | null = null;

    if (event.aggregation) {
      const { collation, maxTimeMS } = event.aggregation;
      const pipeline = event.aggregation.pipeline.filter((stage) => {
        // Getting explain plan for a pipeline with an out / merge stage can
        // cause data corruption issues in non-genuine MongoDB servers, for
        // example CosmosDB actually executes pipeline and persists data, even
        // when the stage is not at the end of the pipeline. To avoid
        // introducing branching logic based on MongoDB genuineness, we just
        // filter out all output stages here instead
        return !isOutputStage(stage);
      });

      const maxTimeMSValue = capMaxTimeMSAtPreferenceLimit(
        preferences,
        maxTimeMS ?? DEFAULT_MAX_TIME_MS
      );

      rawExplainPlan = await dataService.explainAggregate(
        namespace,
        pipeline,
        { collation, maxTimeMS: maxTimeMSValue },
        { explainVerbosity, maxTimeMS: maxTimeMSValue, abortSignal: signal }
      );

      try {
        explainPlan = new ExplainPlan(rawExplainPlan as Stage).serialize();
      } catch (err) {
        log.warn(
          mongoLogId(1_001_000_137),
          'Explain',
          'Failed to parse aggregation explain',
          { message: (err as Error).message }
        );
        throw new ExplainFetchError((err as Error).message, rawExplainPlan);
      }

      track(
        'Aggregation Explained',
        {
          num_stages: pipeline.length,
          index_used: explainPlan.usedIndexes.length > 0,
        },
        connectionInfo
      );
    }

    if (event.query) {
      const { filter, maxTimeMS: queryMaxTimeMS, ...options } = event.query;

      const maxTimeMSValue = capMaxTimeMSAtPreferenceLimit(
        preferences,
        queryMaxTimeMS ?? DEFAULT_MAX_TIME_MS
      );

      rawExplainPlan = await dataService.explainFind(
        namespace,
        filter,
        { ...options, maxTimeMS: maxTimeMSValue },
        { explainVerbosity, maxTimeMS: maxTimeMSValue, abortSignal: signal }
      );

      try {
        explainPlan = new ExplainPlan(rawExplainPlan as Stage).serialize();
      } catch (err) {
        log.warn(
          mongoLogId(1_001_000_192),
          'Explain',
          'Failed to parse find explain',
          { message: (err as Error).message }
        );
        throw new ExplainFetchError((err as Error).message, rawExplainPlan);
      }

      track(
        'Explain Plan Executed',
        {
          with_filter: Object.entries(filter).length > 0,
          index_used: explainPlan.usedIndexes.length > 0,
        },
        connectionInfo
      );
    }

    return explainPlan
      ? { explainPlan, rawExplainPlan, operationType, namespace }
      : null;
  };
};

export const openExplainPlanModal = (
  event: OpenExplainPlanModalEvent
): ExplainPlanModalThunkAction<Promise<void>> => {
  return async (
    dispatch,
    _getState,
    { dataService, logger: { log, mongoLogId } }
  ) => {
    const { id: fetchId, signal } = getAbortSignal();
    const operationType = event.query ? 'query' : 'aggregation';

    dispatch({
      type: ExplainPlanModalActionTypes.FetchExplainPlanModalLoading,
      id: fetchId,
      operationType,
      initialViewType: event.initialViewType ?? 'tree',
    });

    try {
      const result = await dispatch(fetchExplainPlanData(event, signal));
      dispatch({
        type: ExplainPlanModalActionTypes.FetchExplainPlanModalSuccess,
        explainPlan: result?.explainPlan ?? null,
        rawExplainPlan: result?.rawExplainPlan ?? null,
      });
    } catch (err) {
      if (dataService.isCancelError(err)) {
        // Cancellation is caused by close modal action — handled there
        return;
      }
      log.error(mongoLogId(1_001_000_138), 'Explain', 'Failed to run explain', {
        message: (err as Error).message,
      });
      dispatch({
        type: ExplainPlanModalActionTypes.FetchExplainPlanModalError,
        error: (err as Error).message,
        rawExplainPlan:
          err instanceof ExplainFetchError ? err.rawExplainPlan : null,
      });
    } finally {
      // Remove AbortController from the Map as we either finished waiting for
      // the fetch or cancelled at this point
      cleanupAbortSignal(fetchId);
    }
  };
};

export const openExplainPlanForInterpret = (
  event: OpenExplainPlanForInterpretEvent
): ExplainPlanModalThunkAction<Promise<void>> => {
  return async (dispatch, _getState, services) => {
    const { id: fetchId, signal } = getAbortSignal();

    try {
      const result = await dispatch(fetchExplainPlanData(event, signal));
      if (result) {
        services.compassAssistant.interpretExplainPlan?.({
          namespace: result.namespace,
          explainPlan: JSON.stringify(result.explainPlan),
          operationType: result.operationType,
        });
      }
    } catch (err) {
      if (services.dataService.isCancelError(err)) {
        return;
      }
      // TODO(COMPASS-10751): Add user-facing error handling for interpret failures.
      services.logger.log.error(
        services.logger.mongoLogId(1_001_000_434),
        'Explain',
        'Failed to run explain for interpret',
        { message: (err as Error).message }
      );
    } finally {
      cleanupAbortSignal(fetchId);
    }
  };
};

export const closeExplainPlanModal = (): ExplainPlanModalThunkAction<void> => {
  return (dispatch, getState) => {
    abort(getState().explainPlanFetchId);
    dispatch({
      type: ExplainPlanModalActionTypes.CloseExplainPlanModal,
    });
  };
};

export const openCreateIndexModal = (): ExplainPlanModalThunkAction<void> => {
  return (_dispatch, _getState, { localAppRegistry }) => {
    localAppRegistry?.emit('open-create-index-modal');
  };
};

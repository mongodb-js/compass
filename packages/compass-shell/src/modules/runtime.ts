import type { DataService } from 'mongodb-data-service';
import { WorkerRuntime } from './worker-runtime';
import type AppRegistry from 'hadron-app-registry';
import type { RootAction } from '.';

/**
 * The prefix.
 */
const PREFIX = 'shell/runtime' as const;

/**
 * Data service connected.
 */
export const SETUP_RUNTIME = `${PREFIX}/SETUP_RUNTIME` as const;
type SetupRuntimeAction = {
  type: typeof SETUP_RUNTIME;
  error: Error | null;
  dataService: DataService | null;
  appRegistry: AppRegistry | null;
};

/**
 * enableShell preference changed.
 */
export const CHANGE_ENABLE_SHELL = `${PREFIX}/CHANGE_ENABLE_SHELL` as const;
type ChangeEnableShellAction = {
  type: typeof CHANGE_ENABLE_SHELL;
  enableShell: boolean;
};
export type RuntimeAction = SetupRuntimeAction | ChangeEnableShellAction;

/**
 * The initial state.
 */
export const INITIAL_STATE: RuntimeState = {
  error: null,
  dataService: null,
  runtime: null,
  appRegistry: null,
  enableShell: false,
};

export interface RuntimeState {
  error: null | Error;
  dataService: null | DataService;
  runtime: null | typeof WorkerRuntime['prototype'];
  appRegistry: null | AppRegistry;
  enableShell: boolean;
}

/**
 * Reducer function for handling data service connected actions.
 *
 * @param {Object} state - The data service state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(
  state: RuntimeState = INITIAL_STATE,
  action: RootAction
): RuntimeState {
  if (action.type === SETUP_RUNTIME) {
    return reduceSetupRuntime(state, action);
  }

  if (action.type === CHANGE_ENABLE_SHELL) {
    return reduceChangeEnableShell(state, action);
  }

  return state;
}

function createOrDestroyRuntimeForState(state: RuntimeState): RuntimeState {
  if (!state.runtime && state.dataService && state.enableShell) {
    return {
      ...state,
      runtime: createWorkerRuntime(state.dataService, state.appRegistry!),
    };
  } else if (state.runtime && (!state.dataService || !state.enableShell)) {
    void state.runtime.terminate();
    return {
      ...state,
      runtime: null,
    };
  }
  return { ...state };
}

function reduceSetupRuntime(
  state: RuntimeState,
  action: SetupRuntimeAction
): RuntimeState {
  return createOrDestroyRuntimeForState({
    ...state,
    error: action.error,
    dataService: action.error ? null : action.dataService,
    appRegistry: action.error ? null : action.appRegistry,
  });
}

function reduceChangeEnableShell(
  state: RuntimeState,
  action: ChangeEnableShellAction
): RuntimeState {
  return createOrDestroyRuntimeForState({
    ...state,
    enableShell: action.enableShell,
  });
}

/**
 * Setup the shell runtime with the supplied dataService instance.
 *
 * @param {Error} error - The connection error.
 * @param {DataService} dataService - The data service.
 * @param {EventEmitter} appRegistry - A message bus for runtime events.
 *
 * @returns {Object} The data service connected action.
 */
export const setupRuntime = (
  error: Error | null,
  dataService: DataService | null,
  appRegistry: AppRegistry | null
) => ({
  type: SETUP_RUNTIME,
  error,
  dataService,
  appRegistry,
});

export const changeEnableShell = (
  enableShell: boolean
): ChangeEnableShellAction => ({
  type: CHANGE_ENABLE_SHELL,
  enableShell,
});

function createWorkerRuntime(
  dataService: DataService,
  appRegistry: AppRegistry
): typeof WorkerRuntime['prototype'] {
  const {
    url: driverUrl,
    options: driverOptions,
    // Not really provided by dataService, used only for testing purposes
    cliOptions,
  } = {
    cliOptions: {},
    url: '',
    ...dataService.getMongoClientConnectionOptions(),
  };

  return new WorkerRuntime(
    driverUrl,
    driverOptions,
    cliOptions ?? {},
    {
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
      serialization: 'advanced',
    },
    appRegistry
  );
}

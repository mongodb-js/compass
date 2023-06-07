import { WorkerRuntime } from './worker-runtime';

/**
 * The prefix.
 */
const PREFIX = 'shell/runtime';

/**
 * Data service connected.
 */
export const SETUP_RUNTIME = `${PREFIX}/SETUP_RUNTIME`;

/**
 * enableShell preference changed.
 */
export const CHANGE_ENABLE_SHELL = `${PREFIX}/CHANGE_ENABLE_SHELL`;

/**
 * The initial state.
 */
export const INITIAL_STATE = {
  error: null,
  dataService: null,
  runtime: null,
  appRegistry: null,
  enableShell: false,
};

/**
 * Reducer function for handling data service connected actions.
 *
 * @param {Object} state - The data service state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  console.log('reducer', { state, action });
  if (action.type === SETUP_RUNTIME) {
    return reduceSetupRuntime(state, action);
  }

  if (action.type === CHANGE_ENABLE_SHELL) {
    return reduceChangeEnableShell(state, action);
  }

  return state;
}

function createOrDestroyRuntimeForState(state) {
  if (!state.runtime && state.dataService && state.enableShell) {
    return {
      ...state,
      runtime: createWorkerRuntime(state.dataService, state.appRegistry),
    };
  } else if (state.runtime && (!state.dataService || !state.enableShell)) {
    state.runtime.terminate();
    return {
      ...state,
      runtime: null,
    };
  }
  return { ...state };
}

function reduceSetupRuntime(state, action) {
  return createOrDestroyRuntimeForState({
    ...state,
    error: action.error,
    dataService: action.error ? null : action.dataService,
    appRegistry: action.error ? null : action.appRegistry,
  });
}

function reduceChangeEnableShell(state, action) {
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
export const setupRuntime = (error, dataService, appRegistry) => ({
  type: SETUP_RUNTIME,
  error,
  dataService,
  appRegistry,
});

export const changeEnableShell = (enableShell) => ({
  type: CHANGE_ENABLE_SHELL,
  enableShell,
});

function createWorkerRuntime(dataService, appRegistry) {
  const {
    url: driverUrl,
    options: driverOptions,
    // Not really provided by dataService, used only for testing purposes
    cliOptions,
  } = dataService.getMongoClientConnectionOptions();

  return new WorkerRuntime(
    driverUrl,
    driverOptions,
    cliOptions ?? {},
    {
      env: { ...process.env, ELECTRON_RUN_AS_NODE: 1 },
      serialization: 'advanced',
    },
    appRegistry
  );
}

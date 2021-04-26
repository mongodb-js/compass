import { WorkerRuntime } from './worker-runtime';
import { adaptDriverV36ConnectionParams } from './adapt-driver-v36-connection-params';

/**
 * The prefix.
 */
const PREFIX = 'shell/runtime';

/**
 * Data service connected.
 */
export const SETUP_RUNTIME = `${PREFIX}/SETUP_RUNTIME`;

/**
 * The initial state.
 */
export const INITIAL_STATE = {
  error: null,
  dataService: null,
  runtime: null
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
  if (action.type === SETUP_RUNTIME) {
    return reduceSetupRuntime(state, action);
  }

  return state;
}

function reduceSetupRuntime(state, action) {
  if (action.error || !action.dataService) {
    return { error: action.error, dataService: null, runtime: null };
  }

  if (state.dataService === action.dataService) {
    return state;
  }

  const runtime = createWorkerRuntime(action.dataService, action.appRegistry);

  return {
    error: action.error,
    dataService: action.dataService,
    runtime
  };
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
  appRegistry
});

function createWorkerRuntime(dataService, appRegistry) {
  const {
    url: driverV36Url,
    options: driverV36Options,
    // Not really provided by dataService, used only for testing purposes
    cliOptions,
  } = dataService.getConnectionOptions();

  const connectionModelDriverOptions =
    dataService?.client?.model?.driverOptions ?? {};

  const [ driverUrl, driverOptions ] = adaptDriverV36ConnectionParams(
    driverV36Url,
    driverV36Options,
    connectionModelDriverOptions
  );

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

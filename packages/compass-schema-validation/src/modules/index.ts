import type { Action, AnyAction } from 'redux';
import { combineReducers } from 'redux';
import type { NamespaceAction, NamespaceState } from './namespace';
import namespace, { INITIAL_STATE as NS_INITIAL_STATE } from './namespace';
import type { ServerVersionAction, ServerVersionState } from './server-version';
import serverVersion, {
  INITIAL_STATE as SV_INITIAL_STATE,
} from './server-version';
import type { ValidationAction, ValidationState } from './validation';
import validation, { INITIAL_STATE as VALIDATION_STATE } from './validation';
import type {
  SampleDocumentAction,
  SampleDocumentState,
} from './sample-documents';
import sampleDocuments, {
  INITIAL_STATE as SAMPLE_DOCUMENTS_STATE,
} from './sample-documents';
import type { IsZeroStateAction, IsZeroStateState } from './zero-state';
import isZeroState, { INITIAL_STATE as IS_ZERO_STATE } from './zero-state';
import type { IsLoadedAction, IsLoadedState } from './is-loaded';
import isLoaded, { INITIAL_STATE as IS_LOADED_STATE } from './is-loaded';
import type { EditModeAction, EditModeState } from './edit-mode';
import editMode, { INITIAL_STATE as EDIT_MODE_STATE } from './edit-mode';
import type { ThunkAction } from 'redux-thunk';
import type { PreferencesAccess } from 'compass-preferences-model';
import type {
  ConnectionInfoRef,
  DataService,
} from '@mongodb-js/compass-connections/provider';
import type AppRegistry from 'hadron-app-registry';
import type { Logger } from '@mongodb-js/compass-logging/provider';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';

/**
 * Reset action constant.
 */
export const RESET = 'validation/reset' as const;
interface ResetAction {
  type: typeof RESET;
}

export interface RootState {
  namespace: NamespaceState;
  serverVersion: ServerVersionState;
  validation: ValidationState;
  sampleDocuments: SampleDocumentState;
  isZeroState: IsZeroStateState;
  isLoaded: IsLoadedState;
  editMode: EditModeState;
}

export type RootAction =
  | NamespaceAction
  | ServerVersionAction
  | ValidationAction
  | SampleDocumentAction
  | IsZeroStateAction
  | IsLoadedAction
  | EditModeAction
  | ResetAction;

export type SchemaValidationExtraArgs = {
  dataService: Pick<
    DataService,
    'aggregate' | 'collectionInfo' | 'updateCollection'
  >;
  connectionInfoRef: ConnectionInfoRef;
  preferences: PreferencesAccess;
  globalAppRegistry: AppRegistry;
  logger: Logger;
  track: TrackFunction;
};

export type SchemaValidationThunkAction<
  R,
  A extends Action = AnyAction
> = ThunkAction<R, RootState, SchemaValidationExtraArgs, A>;

/**
 * The initial state of the root reducer.
 */
export const INITIAL_STATE: RootState = {
  namespace: NS_INITIAL_STATE,
  serverVersion: SV_INITIAL_STATE,
  validation: VALIDATION_STATE,
  sampleDocuments: SAMPLE_DOCUMENTS_STATE,
  isZeroState: IS_ZERO_STATE,
  isLoaded: IS_LOADED_STATE,
  editMode: EDIT_MODE_STATE,
};

/**
 * The reducer.
 */
const appReducer = combineReducers<RootState, RootAction>({
  namespace,
  serverVersion,
  validation,
  sampleDocuments,
  isZeroState,
  isLoaded,
  editMode,
});

/**
 * Handle the reset.
 */
const doReset = (): RootState => ({ ...INITIAL_STATE });

/**
 * Reset the entire state.
 */
export const reset = (): ResetAction => ({ type: RESET });

const rootReducer = (
  state: RootState | undefined,
  action: RootAction
): RootState => {
  if (action.type === RESET) {
    return doReset();
  }
  return appReducer(state, action);
};

export default rootReducer;

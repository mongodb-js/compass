import type { AnyAction } from 'redux';
import { combineReducers } from 'redux';
import type {
  GenerateDiagramWizardActions,
  GenerateDiagramWizardActionTypes,
} from './generate-diagram-wizard';
import { generateDiagramWizardReducer } from './generate-diagram-wizard';
import type {
  AnalysisProgressActions,
  AnalysisProcessActionTypes,
} from './analysis-process';
import { analysisProcessReducer } from './analysis-process';
import type { DiagramActions, DiagramActionTypes } from './diagram';
import { diagramReducer } from './diagram';
import type { ThunkAction } from 'redux-thunk';
import type { PreferencesAccess } from 'compass-preferences-model/provider';
import type { ConnectionsService } from '@mongodb-js/compass-connections/provider';
import type { TrackFunction } from '@mongodb-js/compass-telemetry/provider';
import type { Logger } from '@mongodb-js/compass-logging/provider';
import type { MongoDBInstancesManager } from '@mongodb-js/compass-app-stores/provider';
import { stepReducer } from './step';
import type { DataModelStorageService } from '../provider';

const reducer = combineReducers({
  step: stepReducer,
  generateDiagramWizard: generateDiagramWizardReducer,
  analysisProgress: analysisProcessReducer,
  diagram: diagramReducer,
});

export type DataModelingActions =
  | GenerateDiagramWizardActions
  | AnalysisProgressActions
  | DiagramActions;

export type DataModelingActionTypes =
  | GenerateDiagramWizardActionTypes
  | AnalysisProcessActionTypes
  | DiagramActionTypes;

export type DataModelingState = ReturnType<typeof reducer>;

export type DataModelingThunkAction<R, A extends AnyAction> = ThunkAction<
  R,
  DataModelingState,
  {
    preferences: PreferencesAccess;
    connections: ConnectionsService;
    instanceManager: MongoDBInstancesManager;
    dataModelStorage: DataModelStorageService;
    track: TrackFunction;
    logger: Logger;
    cancelControllerRef: { current: AbortController | null };
  },
  A
>;

export default reducer;

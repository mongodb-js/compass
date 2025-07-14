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
import { stepReducer } from './step';
import type { DataModelingStoreServices } from '.';
import type {
  ExportDiagramActionTypes,
  ExportDiagramActions,
} from './export-diagram';
import { exportDiagramReducer } from './export-diagram';
import type { SidePanelActions, SidePanelActionTypes } from './side-panel';
import { sidePanelReducer } from './side-panel';

const reducer = combineReducers({
  step: stepReducer,
  generateDiagramWizard: generateDiagramWizardReducer,
  analysisProgress: analysisProcessReducer,
  diagram: diagramReducer,
  exportDiagram: exportDiagramReducer,
  sidePanel: sidePanelReducer,
});

export type DataModelingActions =
  | GenerateDiagramWizardActions
  | AnalysisProgressActions
  | DiagramActions
  | SidePanelActions
  | ExportDiagramActions;

export type DataModelingActionTypes =
  | GenerateDiagramWizardActionTypes
  | AnalysisProcessActionTypes
  | DiagramActionTypes
  | SidePanelActionTypes
  | ExportDiagramActionTypes;

export type DataModelingState = ReturnType<typeof reducer>;

export type DataModelingExtraArgs = DataModelingStoreServices & {
  cancelAnalysisControllerRef: { current: AbortController | null };
  cancelExportControllerRef: { current: AbortController | null };
};

export type DataModelingThunkAction<R, A extends AnyAction> = ThunkAction<
  R,
  DataModelingState,
  DataModelingExtraArgs,
  A
>;

export default reducer;

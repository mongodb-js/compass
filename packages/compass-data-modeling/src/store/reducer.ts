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

const reducer = combineReducers({
  step: stepReducer,
  generateDiagramWizard: generateDiagramWizardReducer,
  analysisProgress: analysisProcessReducer,
  diagram: diagramReducer,
  exportDiagram: exportDiagramReducer,
});

export type DataModelingActions =
  | GenerateDiagramWizardActions
  | AnalysisProgressActions
  | DiagramActions
  | ExportDiagramActions;

export type DataModelingActionTypes =
  | GenerateDiagramWizardActionTypes
  | AnalysisProcessActionTypes
  | DiagramActionTypes
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

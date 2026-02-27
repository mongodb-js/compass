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
import { type openToast as _openToast } from '@mongodb-js/compass-components';
import type {
  ReselectCollectionsWizardActions,
  ReselectCollectionsWizardActionTypes,
} from './reselect-collections-wizard';
import { reselectCollectionsWizardReducer } from './reselect-collections-wizard';
import {
  renameDiagramModalReducer,
  type RenameDiagramModalActions,
  type RenameDiagramModalActionTypes,
} from './rename-diagram-modal';

const reducer = combineReducers({
  step: stepReducer,
  generateDiagramWizard: generateDiagramWizardReducer,
  analysisProgress: analysisProcessReducer,
  diagram: diagramReducer,
  exportDiagram: exportDiagramReducer,
  renameDiagramModal: renameDiagramModalReducer,
  reselectCollections: reselectCollectionsWizardReducer,
});

export type DataModelingActions =
  | GenerateDiagramWizardActions
  | AnalysisProgressActions
  | DiagramActions
  | ExportDiagramActions
  | RenameDiagramModalActions
  | ReselectCollectionsWizardActions;

type _ActionTypes = typeof GenerateDiagramWizardActionTypes &
  typeof AnalysisProcessActionTypes &
  typeof DiagramActionTypes &
  typeof ExportDiagramActionTypes &
  typeof RenameDiagramModalActionTypes &
  typeof ReselectCollectionsWizardActionTypes;

export type DataModelingActionTypes = _ActionTypes[keyof _ActionTypes];

export type DataModelingState = ReturnType<typeof reducer>;

export type DataModelingExtraArgs = DataModelingStoreServices & {
  cancelAnalysisControllerRef: { current: AbortController | null };
  cancelExportControllerRef: { current: AbortController | null };
  openToast: typeof _openToast;
};

export type DataModelingThunkAction<R, A extends AnyAction> = ThunkAction<
  R,
  DataModelingState,
  DataModelingExtraArgs,
  A
>;

export default reducer;

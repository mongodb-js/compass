import type { Reducer } from 'redux';
import { isAction } from './util';
import { AnalysisProcessActionTypes } from './analysis-process';
import { GenerateDiagramWizardActionTypes } from './generate-diagram-wizard';
import { DiagramActionTypes } from './diagram';

export type StepState =
  | 'NO_DIAGRAM_SELECTED'
  | 'ANALYZING'
  | 'ANALYSIS_FAILED'
  | 'EDITING';

const INITIAL_STATE = 'NO_DIAGRAM_SELECTED';

export const stepReducer: Reducer<StepState> = (
  state = INITIAL_STATE,
  action
) => {
  if (
    isAction(action, AnalysisProcessActionTypes.ANALYZING_COLLECTIONS_START)
  ) {
    return 'ANALYZING';
  }
  if (isAction(action, AnalysisProcessActionTypes.ANALYSIS_FAILED)) {
    return 'ANALYSIS_FAILED';
  }
  if (isAction(action, AnalysisProcessActionTypes.ANALYSIS_CANCELED)) {
    return 'NO_DIAGRAM_SELECTED';
  }
  if (isAction(action, AnalysisProcessActionTypes.ANALYSIS_FINISHED)) {
    return 'EDITING';
  }
  if (isAction(action, DiagramActionTypes.OPEN_DIAGRAM)) {
    return 'EDITING';
  }
  if (
    isAction(action, GenerateDiagramWizardActionTypes.CANCEL_CREATE_NEW_DIAGRAM)
  ) {
    return 'NO_DIAGRAM_SELECTED';
  }
  if (isAction(action, GenerateDiagramWizardActionTypes.CONNECTION_FAILED)) {
    return 'NO_DIAGRAM_SELECTED';
  }
  if (
    isAction(action, GenerateDiagramWizardActionTypes.COLLECTIONS_FETCH_FAILED)
  ) {
    return 'NO_DIAGRAM_SELECTED';
  }
  return state;
};

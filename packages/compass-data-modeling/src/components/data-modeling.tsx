import React from 'react';
import { connect } from 'react-redux';
import { WorkspaceContainer } from '@mongodb-js/compass-components';
import DiagramEditor from './diagram-editor';
import SavedDiagramsList from './saved-diagrams-list';
import NewDiagramFormModal from './new-diagram-form';
import EditingDiagramToolbar from './editing-diagram-toolbar';
import AnalysisInProgress from './analysis-in-progress';
import AnalysisFailed from './analysis-failed';
import type { DataModelingState } from '../store/reducer';
import type { StepState } from '../store/step';

type DataModelingPluginInitialProps = {
  step: StepState;
};

const DataModeling: React.FunctionComponent<DataModelingPluginInitialProps> = ({
  step,
}) => {
  return (
    <WorkspaceContainer
      // Currently toolbar is only shown when editing a diagram or viewing a list of diagrams.
      // When viewing diagrams, the component renders its own toolbar using VirtualGrid.
      toolbar={step === 'EDITING' ? <EditingDiagramToolbar /> : null}
    >
      {step === 'NO_DIAGRAM_SELECTED' ? (
        <SavedDiagramsList />
      ) : step === 'ANALYZING' ? (
        <AnalysisInProgress />
      ) : step === 'ANALYSIS_FAILED' ? (
        <AnalysisFailed />
      ) : (
        <DiagramEditor />
      )}
      <NewDiagramFormModal></NewDiagramFormModal>
    </WorkspaceContainer>
  );
};

export default connect(({ step }: DataModelingState) => {
  return {
    step,
  };
})(DataModeling);

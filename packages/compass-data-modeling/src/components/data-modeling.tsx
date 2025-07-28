import React from 'react';
import { connect } from 'react-redux';
import DiagramEditor from './diagram-editor';
import SavedDiagramsList from './saved-diagrams-list';
import NewDiagramFormModal from './new-diagram-form';
import type { DataModelingState } from '../store/reducer';
import { DiagramProvider } from '@mongodb-js/diagramming';
import DiagramEditorSidePanel from './drawer/diagram-editor-side-panel';

type DataModelingProps = {
  showList: boolean;
};

const DataModeling: React.FunctionComponent<DataModelingProps> = ({
  showList,
}) => {
  return (
    <>
      {showList ? (
        <SavedDiagramsList></SavedDiagramsList>
      ) : (
        <DiagramProvider fitView>
          <DiagramEditor />
          <DiagramEditorSidePanel />
        </DiagramProvider>
      )}
      <NewDiagramFormModal></NewDiagramFormModal>
    </>
  );
};

export default connect((state: DataModelingState) => {
  return {
    showList: state.step === 'NO_DIAGRAM_SELECTED',
  };
})(DataModeling);

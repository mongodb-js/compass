import React from 'react';
import { connect } from 'react-redux';
import DiagramEditor from './diagram-editor';
import SavedDiagramsList from './saved-diagrams-list';
import NewDiagramFormModal from './new-diagram/new-diagram-modal';
import type { DataModelingState } from '../store/reducer';
import { Button, css, DiagramProvider } from '@mongodb-js/compass-components';
import DiagramEditorSidePanel from './drawer/diagram-editor-side-panel';
import ReselectCollectionsModal from './reselect-collections-modal';
import { useOpenWorkspace } from '@mongodb-js/compass-workspaces/provider';
import { useDataModelSavedItems } from '../provider';

type DataModelingProps = {
  showList: boolean;
  currentDiagramId?: string;
};

const deletedDiagramContainerStyles = css({
  height: '100%',
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  gap: '16px',
});

const DeletedDiagramInfo: React.FunctionComponent = () => {
  const { openDataModelingWorkspace } = useOpenWorkspace();
  return (
    <div className={deletedDiagramContainerStyles}>
      <div>This data model has been deleted.</div>
      <Button
        onClick={() => openDataModelingWorkspace({ newTab: false })}
        variant="primary"
      >
        Back to Data Modeling
      </Button>
    </div>
  );
};

const DataModeling: React.FunctionComponent<DataModelingProps> = ({
  showList,
  currentDiagramId,
}) => {
  const showDeletedInfo = !useDataModelSavedItems().items.some(
    (item) => item.id === currentDiagramId
  );
  return (
    <>
      {showList ? (
        <SavedDiagramsList></SavedDiagramsList>
      ) : showDeletedInfo ? (
        <DeletedDiagramInfo />
      ) : (
        <DiagramProvider fitView>
          <DiagramEditor />
          <DiagramEditorSidePanel />
        </DiagramProvider>
      )}
      <NewDiagramFormModal></NewDiagramFormModal>
      <ReselectCollectionsModal></ReselectCollectionsModal>
    </>
  );
};

export default connect((state: DataModelingState) => {
  return {
    showList: state.step === 'NO_DIAGRAM_SELECTED',
    currentDiagramId: state.diagram?.id,
  };
})(DataModeling);

import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import DiagramEditor from './diagram-editor';
import SavedDiagramsList from './saved-diagrams-list';
import NewDiagramFormModal from './new-diagram-form';
import type { DataModelingState } from '../store/reducer';
import { DiagramProvider } from '@mongodb-js/diagramming';
import DiagramEditorSidePanel from './diagram-editor-side-panel';
import {
  DrawerDisplayMode,
  DrawerLayout,
  type DrawerLayoutProps,
} from '@mongodb-js/compass-components';
import { closeSidePanel } from '../store/side-panel';
type DataModelingPluginInitialProps = {
  showList: boolean;
  isSidePanelOpen: boolean;
  onSidePanelClose: () => void;
};

const DataModeling: React.FunctionComponent<DataModelingPluginInitialProps> = ({
  showList,
  onSidePanelClose,
}) => {
  const drawerToolbarData = useMemo<DrawerLayoutProps['toolbarData']>(
    () => [
      {
        id: 'DiagramEditor',
        label: 'Data Model',
        content: <DiagramEditorSidePanel />,
        title: 'Data Model',
        glyph: 'Diagram',
        onClose: onSidePanelClose,
      },
    ],
    [onSidePanelClose]
  );

  return (
    <>
      {showList ? (
        <SavedDiagramsList></SavedDiagramsList>
      ) : (
        <DrawerLayout
          displayMode={DrawerDisplayMode.Overlay}
          toolbarData={drawerToolbarData}
        >
          <DiagramProvider fitView>
            <DiagramEditor />
          </DiagramProvider>
        </DrawerLayout>
      )}
      <NewDiagramFormModal></NewDiagramFormModal>
    </>
  );
};

export default connect(
  (state: DataModelingState) => {
    return {
      showList: state.step === 'NO_DIAGRAM_SELECTED',
      isSidePanelOpen: state.sidePanel.isOpen,
    };
  },
  {
    onSidePanelClose: closeSidePanel,
  }
)(DataModeling);

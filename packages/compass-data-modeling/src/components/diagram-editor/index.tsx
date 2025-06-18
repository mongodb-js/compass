import React, { useMemo, useState } from 'react';
import { connect } from 'react-redux';
import type { DataModelingState } from '../../store/reducer';
import {
  redoEdit,
  selectCurrentModel,
  undoEdit,
  getCurrentDiagramFromState,
} from '../../store/diagram';
import {
  Icon,
  IconButton,
  WorkspaceContainer,
} from '@mongodb-js/compass-components';
import { DiagramProvider } from '@mongodb-js/diagramming';
import { ExportDiagramModal } from '../export-diagram-modal';
import AnalyzingState from './analyzing-state';
import ErrorState from './error-state';
import EditingState from './editing-state';
import {
  ExportDiagramContextProvider,
  type ReactFlowEdge,
  type ReactFlowNode,
} from '../export-diagram-context';
import { StaticModel } from '../../services/data-model-storage';

const DiagramEditor: React.FunctionComponent<{
  step: DataModelingState['step'];
  diagramLabel: string;
  hasUndo: boolean;
  onUndoClick: () => void;
  hasRedo: boolean;
  onRedoClick: () => void;
  model: StaticModel | null;
}> = ({
  step,
  diagramLabel,
  hasUndo,
  onUndoClick,
  hasRedo,
  onRedoClick,
  model,
}) => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [nodes, setNodes] = useState<ReactFlowNode[]>([]);
  const [edges, setEdges] = useState<ReactFlowEdge[]>([]);

  const exportDiagramContextValue = useMemo(() => {
    return {
      nodes,
      edges,
      setNodes,
      setEdges,
    };
  }, [nodes, edges, setNodes, setEdges]);

  if (step === 'NO_DIAGRAM_SELECTED') {
    throw new Error('Unexpected');
  }
  const content =
    step === 'ANALYZING' ? (
      <AnalyzingState />
    ) : step === 'ANALYSIS_FAILED' || step === 'ANALYSIS_CANCELED' ? (
      <ErrorState />
    ) : (
      <EditingState isExportModalOpen={isExportModalOpen} />
    );

  return (
    <WorkspaceContainer
      toolbar={() => {
        if (step !== 'EDITING') {
          return null;
        }
        return (
          <>
            <IconButton
              aria-label="Undo"
              disabled={!hasUndo}
              onClick={onUndoClick}
            >
              <Icon glyph="Undo"></Icon>
            </IconButton>
            <IconButton
              aria-label="Redo"
              disabled={!hasRedo}
              onClick={onRedoClick}
            >
              <Icon glyph="Redo"></Icon>
            </IconButton>
            <IconButton
              aria-label="Export"
              onClick={() => setIsExportModalOpen(true)}
            >
              <Icon glyph="Export"></Icon>
            </IconButton>
          </>
        );
      }}
    >
      <ExportDiagramContextProvider value={exportDiagramContextValue}>
        <DiagramProvider>
          {content}
          <ExportDiagramModal
            isModalOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
            diagramLabel={diagramLabel}
            model={model}
          />
        </DiagramProvider>
      </ExportDiagramContextProvider>
    </WorkspaceContainer>
  );
};

export default connect(
  (state: DataModelingState) => {
    const { diagram, step } = state;
    const model = diagram
      ? selectCurrentModel(getCurrentDiagramFromState(state))
      : null;
    return {
      step: step,
      diagramLabel: diagram?.name ?? 'Data Model',
      hasUndo: (diagram?.edits.prev.length ?? 0) > 0,
      hasRedo: (diagram?.edits.next.length ?? 0) > 0,
      model,
    };
  },
  {
    onUndoClick: undoEdit,
    onRedoClick: redoEdit,
  }
)(DiagramEditor);

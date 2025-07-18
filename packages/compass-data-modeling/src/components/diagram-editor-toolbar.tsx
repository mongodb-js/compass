import React from 'react';
import { connect } from 'react-redux';
import type { DataModelingState } from '../store/reducer';
import { saveDiagram, redoEdit, undoEdit } from '../store/diagram';
import { showExportModal } from '../store/export-diagram';
import { Icon, IconButton } from '@mongodb-js/compass-components';

export const DiagramEditorToolbar: React.FunctionComponent<{
  step: DataModelingState['step'];
  hasUndo: boolean;
  hasRedo: boolean;
  onDownloadClick: () => void;
  onUndoClick: () => void;
  onRedoClick: () => void;
  onExportClick: () => void;
}> = ({
  step,
  hasUndo,
  onUndoClick,
  hasRedo,
  onRedoClick,
  onExportClick,
  onDownloadClick,
}) => {
  if (step !== 'EDITING') {
    return null;
  }
  return (
    <div data-testid="diagram-editor-toolbar">
      <IconButton aria-label="Download" onClick={onDownloadClick}>
        <Icon glyph="Download"></Icon>
      </IconButton>
      <IconButton aria-label="Undo" disabled={!hasUndo} onClick={onUndoClick}>
        <Icon glyph="Undo"></Icon>
      </IconButton>
      <IconButton aria-label="Redo" disabled={!hasRedo} onClick={onRedoClick}>
        <Icon glyph="Redo"></Icon>
      </IconButton>
      <IconButton aria-label="Export" onClick={onExportClick}>
        <Icon glyph="Export"></Icon>
      </IconButton>
    </div>
  );
};

export default connect(
  (state: DataModelingState) => {
    const { diagram, step } = state;
    return {
      step: step,
      hasUndo: (diagram?.edits.prev.length ?? 0) > 0,
      hasRedo: (diagram?.edits.next.length ?? 0) > 0,
    };
  },
  {
    onUndoClick: undoEdit,
    onRedoClick: redoEdit,
    onExportClick: showExportModal,
    onDownloadClick: saveDiagram,
  }
)(DiagramEditorToolbar);

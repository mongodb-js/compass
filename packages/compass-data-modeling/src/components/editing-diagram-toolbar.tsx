import React from 'react';
import { css, Icon, IconButton, spacing } from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import type { DataModelingState } from '../store/reducer';
import { redoEdit, undoEdit } from '../store/diagram';

const containerStyles = css({
  padding: spacing[400],
  display: 'flex',
  gap: spacing[200],
});

const EditingDiagramToolbar = ({
  hasUndo,
  hasRedo,
  onUndoClick,
  onRedoClick,
}: {
  hasUndo: boolean;
  hasRedo: boolean;
  onUndoClick: () => void;
  onRedoClick: () => void;
}) => {
  return (
    <div className={containerStyles}>
      <IconButton aria-label="Undo" disabled={!hasUndo} onClick={onUndoClick}>
        <Icon glyph="Undo"></Icon>
      </IconButton>
      <IconButton aria-label="Redo" disabled={!hasRedo} onClick={onRedoClick}>
        <Icon glyph="Redo"></Icon>
      </IconButton>
    </div>
  );
};

export default connect(
  ({ diagram }: DataModelingState) => {
    return {
      hasUndo: (diagram?.edits.prev.length ?? 0) > 0,
      hasRedo: (diagram?.edits.next.length ?? 0) > 0,
    };
  },
  {
    onUndoClick: undoEdit,
    onRedoClick: redoEdit,
  }
)(EditingDiagramToolbar);

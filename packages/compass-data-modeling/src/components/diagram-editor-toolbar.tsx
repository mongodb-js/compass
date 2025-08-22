import React from 'react';
import { connect } from 'react-redux';
import type { DataModelingState } from '../store/reducer';
import { redoEdit, undoEdit } from '../store/diagram';
import { showExportModal } from '../store/export-diagram';
import {
  Button,
  css,
  cx,
  Icon,
  IconButton,
  palette,
  spacing,
  useDarkMode,
  transparentize,
  Tooltip,
} from '@mongodb-js/compass-components';
import AddCollection from './icons/add-collection';
const containerStyles = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: `${spacing[150]}px ${spacing[200]}px`,
  backgroundColor: palette.gray.light3,
  borderBottom: `1px solid ${palette.gray.light2}`,
  marginBottom: spacing[50],
  boxShadow: `0px ${spacing[50]}px ${spacing[100]}px -${
    spacing[25]
  }px ${transparentize(0.85, palette.black)}`,
});

const containerDarkStyles = css({
  backgroundColor: palette.gray.dark3,
  borderBottom: `1px solid ${palette.gray.dark2}`,
  boxShadow: `0px ${spacing[50]}px ${spacing[100]}px -${
    spacing[25]
  }px ${transparentize(0.85, palette.white)}`,
});

const toolbarGroupStyles = css({
  display: 'flex',
});

export const DiagramEditorToolbar: React.FunctionComponent<{
  step: DataModelingState['step'];
  hasUndo: boolean;
  hasRedo: boolean;
  isInRelationshipDrawingMode: boolean;
  onUndoClick: () => void;
  onRedoClick: () => void;
  onExportClick: () => void;
  onRelationshipDrawingToggle: () => void;
  onAddCollectionClick: () => void;
}> = ({
  step,
  hasUndo,
  onUndoClick,
  hasRedo,
  onRedoClick,
  onExportClick,
  onRelationshipDrawingToggle,
  onAddCollectionClick,
  isInRelationshipDrawingMode,
}) => {
  const darkmode = useDarkMode();
  if (step !== 'EDITING') {
    return null;
  }
  return (
    <div
      className={cx(containerStyles, darkmode && containerDarkStyles)}
      data-testid="diagram-editor-toolbar"
    >
      <div className={toolbarGroupStyles}>
        <IconButton aria-label="Undo" disabled={!hasUndo} onClick={onUndoClick}>
          <Icon glyph="Undo"></Icon>
        </IconButton>
        <IconButton aria-label="Redo" disabled={!hasRedo} onClick={onRedoClick}>
          <Icon glyph="Redo"></Icon>
        </IconButton>
        <IconButton aria-label="Add Collection" onClick={onAddCollectionClick}>
          <AddCollection />
        </IconButton>
        <Tooltip
          trigger={
            <IconButton
              aria-label={
                !isInRelationshipDrawingMode
                  ? 'Add Relationship'
                  : 'Exit Relationship Drawing Mode'
              }
              onClick={onRelationshipDrawingToggle}
              active={isInRelationshipDrawingMode}
              aria-pressed={isInRelationshipDrawingMode}
            >
              <Icon glyph="Relationship"></Icon>
            </IconButton>
          }
        >
          Drag from one collection to another to create a relationship.
        </Tooltip>
      </div>
      <div className={toolbarGroupStyles}>
        <Button size="xsmall" aria-label="Export" onClick={onExportClick}>
          <Icon glyph="Export"></Icon>
        </Button>
      </div>
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
  }
)(DiagramEditorToolbar);

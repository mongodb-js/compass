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
} from '@mongodb-js/compass-components';

/**
 * @param color 6-digit hex color code
 * @param opacity a number between 0 and 1 representing the opacity
 * @returns 8-digit hex color code with the last two digits representing the opacity
 */
function getColorWithOpacity(color: string, opacity: number) {
  if (opacity < 0 || opacity > 1) {
    throw new Error('Opacity must be between 0 and 1');
  }
  const alpha = Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${color.replace('#', '')}${alpha}`;
}

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
  }px ${getColorWithOpacity(palette.black, 0.15)}`,
});

const containerDarkStyles = css({
  backgroundColor: palette.gray.dark3,
  borderBottom: `1px solid ${palette.gray.dark2}`,
  boxShadow: `0px ${spacing[50]}px ${spacing[100]}px -${
    spacing[25]
  }px ${getColorWithOpacity(palette.white, 0.15)}`,
});

const toolbarGroupStyles = css({
  display: 'flex',
});

export const DiagramEditorToolbar: React.FunctionComponent<{
  step: DataModelingState['step'];
  hasUndo: boolean;
  hasRedo: boolean;
  onUndoClick: () => void;
  onRedoClick: () => void;
  onExportClick: () => void;
}> = ({ step, hasUndo, onUndoClick, hasRedo, onRedoClick, onExportClick }) => {
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

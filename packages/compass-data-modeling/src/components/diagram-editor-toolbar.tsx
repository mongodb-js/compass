import React, { useMemo } from 'react';
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
  Breadcrumbs,
  type BreadcrumbItem,
  useHotkeys,
} from '@mongodb-js/compass-components';
import AddCollection from './icons/add-collection';
import { useOpenWorkspace } from '@mongodb-js/compass-workspaces/provider';
import { useApplicationMenu } from '@mongodb-js/compass-electron-menu';
import { dualSourceHandlerDebounce } from '../utils/utils';

const breadcrumbsStyles = css({
  padding: `${spacing[300]}px ${spacing[400]}px`,
});

const editorToolbarStyles = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: `${spacing[150]}px ${spacing[300]}px`,
  backgroundColor: palette.gray.light3,
  borderBottom: `1px solid ${palette.gray.light2}`,
  marginBottom: spacing[50],
  boxShadow: `0px ${spacing[50]}px ${spacing[100]}px -${
    spacing[25]
  }px ${transparentize(0.85, palette.black)}`,
});

const editorToolbarDarkStyles = css({
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
  diagramName?: string;
  hasUndo: boolean;
  hasRedo: boolean;
  diagramEditorHasFocus?: boolean;
  isInRelationshipDrawingMode: boolean;
  onUndoClick: () => void;
  onRedoClick: () => void;
  onExportClick: () => void;
  onRelationshipDrawingToggle: () => void;
  onAddCollectionClick: () => void;
}> = ({
  step,
  diagramName,
  hasUndo,
  onUndoClick,
  hasRedo,
  diagramEditorHasFocus,
  onRedoClick,
  onExportClick,
  onRelationshipDrawingToggle,
  onAddCollectionClick,
  isInRelationshipDrawingMode,
}) => {
  const darkmode = useDarkMode();
  const { openDataModelingWorkspace } = useOpenWorkspace();

  const breadcrumbItems: [
    ...BreadcrumbItem[],
    Omit<BreadcrumbItem, 'onClick'>
  ] = useMemo(
    () => [
      { name: 'diagrams', onClick: () => openDataModelingWorkspace() },
      { name: diagramName || 'untitled' },
    ],
    [diagramName, openDataModelingWorkspace]
  );

  // Use dualSourceHandlerDebounce to avoid handling the same keypresses
  // coming through useHotkeys and the application menu.
  const [undoHotkey, undoAppMenu] = useMemo(
    () => dualSourceHandlerDebounce(onUndoClick),
    [onUndoClick]
  );
  const [redoHotkey, redoAppMenu] = useMemo(
    () => dualSourceHandlerDebounce(onRedoClick),
    [onRedoClick]
  );

  // macOS: Cmd+Shift+Z = Redo, Cmd+Z = Undo
  // Windows/Linux: Ctrl+Z = Undo, Ctrl+Y = Redo
  useHotkeys('mod+z', undoHotkey, { enabled: step === 'EDITING' }, [
    undoHotkey,
  ]);
  useHotkeys('mod+shift+z', redoHotkey, { enabled: step === 'EDITING' }, [
    redoHotkey,
  ]);
  useHotkeys('mod+y', redoHotkey, { enabled: step === 'EDITING' }, [
    redoHotkey,
  ]);

  // Take over the undo/redo functionality in the application menu
  // if either no element is focused or a child of the data modeling editor
  // view is focused.
  useApplicationMenu({
    roles: diagramEditorHasFocus
      ? {
          undo: undoAppMenu,
          redo: redoAppMenu,
        }
      : {},
  });

  if (step !== 'EDITING') {
    return null;
  }

  return (
    <div>
      <Breadcrumbs className={breadcrumbsStyles} items={breadcrumbItems} />
      <div
        className={cx(editorToolbarStyles, darkmode && editorToolbarDarkStyles)}
        data-testid="diagram-editor-toolbar"
      >
        <div className={toolbarGroupStyles}>
          <Tooltip
            trigger={
              <IconButton
                aria-label="Undo"
                disabled={!hasUndo}
                onClick={onUndoClick}
              >
                <Icon glyph="Undo"></Icon>
              </IconButton>
            }
          >
            Undo
          </Tooltip>
          <Tooltip
            trigger={
              <IconButton
                aria-label="Redo"
                disabled={!hasRedo}
                onClick={onRedoClick}
              >
                <Icon glyph="Redo"></Icon>
              </IconButton>
            }
          >
            Redo
          </Tooltip>
          <Tooltip
            trigger={
              <IconButton
                aria-label="Add Collection"
                onClick={onAddCollectionClick}
              >
                <AddCollection />
              </IconButton>
            }
          >
            Add a new collection
          </Tooltip>
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
            Add a relationship by dragging from one collection to another
          </Tooltip>
        </div>
        <div className={toolbarGroupStyles}>
          <Tooltip
            trigger={
              <Button size="xsmall" aria-label="Export" onClick={onExportClick}>
                <Icon glyph="Export"></Icon>
              </Button>
            }
          >
            Export data model
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default connect(
  (state: DataModelingState) => {
    const { diagram, step } = state;
    return {
      step,
      hasUndo: (diagram?.edits.prev.length ?? 0) > 0,
      hasRedo: (diagram?.edits.next.length ?? 0) > 0,
      diagramName: diagram?.name,
    };
  },
  {
    onUndoClick: undoEdit,
    onRedoClick: redoEdit,
    onExportClick: showExportModal,
  }
)(DiagramEditorToolbar);

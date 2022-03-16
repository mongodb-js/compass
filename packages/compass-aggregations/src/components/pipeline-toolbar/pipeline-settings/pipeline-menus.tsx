import React, { useState, useCallback } from 'react';
import { connect } from 'react-redux';
import type { ConnectedProps } from 'react-redux';
import semver from 'semver';
import {
  Button,
  Icon,
  Menu,
  MenuItem,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import type { RootState } from '../../../modules';
import { newPipelineFromText } from '../../../modules/import-pipeline';
import { openCreateView } from '../../../modules';
import { saveCurrentPipeline } from '../../../modules/saved-pipeline';
import { savingPipelineOpen } from '../../../modules/saving-pipeline';
import { setIsNewPipelineConfirm } from '../../../modules/is-new-pipeline-confirm';
import { VIEWS_MIN_SERVER_VERSION } from '../../../constants';

const buttonStyles = css({
  marginLeft: spacing[1],
  marginRight: spacing[1],
});
type PipelineActionMenuProp<ActionType> = {
  onAction: (action: ActionType) => void;
  title: string;
  glyph: string;
  menuItems: { title: string; action: ActionType }[];
};
function PipelineActionMenu<T>({
  onAction,
  title,
  glyph,
  menuItems,
}: PipelineActionMenuProp<T>) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const onMenuItemClick = useCallback(
    (evt) => {
      evt.stopPropagation();
      setIsMenuOpen(false);
      onAction(evt.currentTarget.dataset.action);
    },
    [onAction]
  );

  return (
    <Menu
      open={isMenuOpen}
      setOpen={setIsMenuOpen}
      justify="start"
      trigger={({
        onClick,
        children,
      }: {
        onClick(): void;
        children: React.ReactChildren;
      }) => (
        <Button
          title={title}
          aria-label={title}
          className={buttonStyles}
          variant="primary"
          size="xsmall"
          leftGlyph={<Icon glyph={glyph} />}
          onClick={(evt) => {
            evt.stopPropagation();
            onClick();
          }}
        >
          {title}
          {isMenuOpen && children}
        </Button>
      )}
    >
      {menuItems.map((item) => (
        <MenuItem
          key={item.title}
          data-action={item.action}
          onClick={onMenuItemClick}
        >
          {item.title}
        </MenuItem>
      ))}
    </Menu>
  );
}

type SaveMenuActions = 'save' | 'saveAs' | 'createView';
const SaveMenuComponent: React.FunctionComponent<SaveMenuProps> = ({
  name,
  serverVersion,
  onSave,
  onSaveAs,
  onCreateView,
}) => {
  const isCreateViewAvailable = semver.gte(
    serverVersion,
    VIEWS_MIN_SERVER_VERSION
  );
  const onAction = (action: SaveMenuActions) => {
    switch (action) {
      case 'save':
        return name === '' ? onSaveAs() : onSave();
      case 'saveAs':
        return name === '' ? onSaveAs() : onSaveAs({ name, isSaveAs: true });
      case 'createView':
        return onCreateView();
    }
  };
  return (
    <PipelineActionMenu<SaveMenuActions>
      title="Save"
      glyph="Save"
      onAction={onAction}
      menuItems={[
        { action: 'save', title: 'Save' },
        { action: 'saveAs', title: 'Save as' },
        isCreateViewAvailable && { action: 'createView', title: 'Create view' },
      ].filter(Boolean)}
    />
  );
};
const mapSaveMenuState = ({ name, serverVersion }: RootState) => ({
  name,
  serverVersion,
});
const mapSaveMenuDispatch = {
  onSave: saveCurrentPipeline,
  onSaveAs: savingPipelineOpen,
  onCreateView: openCreateView,
};
const saveMenuConnector = connect(mapSaveMenuState, mapSaveMenuDispatch);
type SaveMenuProps = ConnectedProps<typeof saveMenuConnector>;
export const SaveMenu = saveMenuConnector(SaveMenuComponent);

type CreateMenuActions = 'createPipleine' | 'createPipleineFromText';
const CreateMenuComponent: React.FunctionComponent<CreateMenuProps> = ({
  onNewPipeline,
  onNewPipelineFromText,
}) => {
  const onAction = (action: CreateMenuActions) => {
    switch (action) {
      case 'createPipleine':
        return onNewPipeline(true);
      case 'createPipleineFromText':
        return onNewPipelineFromText();
    }
  };
  return (
    <PipelineActionMenu<CreateMenuActions>
      title="Create new"
      glyph="Plus"
      onAction={onAction}
      menuItems={[
        { action: 'createPipleine', title: 'Pipeline' },
        { action: 'createPipleineFromText', title: 'Pipeline from text' },
      ]}
    />
  );
};
const mapCreateMenuDispatch = {
  onNewPipeline: setIsNewPipelineConfirm,
  onNewPipelineFromText: newPipelineFromText,
};
const createMenuConnector = connect(null, mapCreateMenuDispatch);
type CreateMenuProps = ConnectedProps<typeof createMenuConnector>;
export const CreateMenu = createMenuConnector(CreateMenuComponent);

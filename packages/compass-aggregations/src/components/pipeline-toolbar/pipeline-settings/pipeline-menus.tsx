import React, { useRef, useState, useCallback } from 'react';
import { connect } from 'react-redux';
import semver from 'semver';
import { Button, Icon, Menu, MenuItem } from '@mongodb-js/compass-components';
import type { Dispatch } from 'redux';
import type { RootState } from '../../../modules';
import { newPipelineFromText } from '../../../modules/import-pipeline';
import { openCreateView } from '../../../modules';
import { saveCurrentPipeline } from '../../../modules/saved-pipeline';
import { savingPipelineOpen } from '../../../modules/saving-pipeline';
import { setIsNewPipelineConfirm } from '../../../modules/is-new-pipeline-confirm';
import { VIEWS_MIN_SERVER_VERSION } from '../../../constants';

type PipelineActionMenuProp<ActionType extends string> = {
  onAction: (action: ActionType) => void;
  title: string;
  glyph: string;
  menuItems: { title: string; action: ActionType }[];
  ['data-testid']: string;
};

function PipelineActionMenu<T extends string>({
  onAction,
  title,
  glyph,
  menuItems,
  ['data-testid']: dataTestId,
}: PipelineActionMenuProp<T>) {
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);
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
      data-testid={`${dataTestId}-content`}
      open={isMenuOpen}
      refEl={menuTriggerRef}
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
          ref={menuTriggerRef}
          data-testid={dataTestId}
          title={title}
          aria-label={title}
          variant="primary"
          size="xsmall"
          leftGlyph={<Icon glyph={glyph} />}
          rightGlyph={<Icon glyph="CaretDown" />}
          onClick={(evt) => {
            evt.stopPropagation();
            onClick();
          }}
        >
          {title}
          {children}
        </Button>
      )}
    >
      {menuItems.map((item) => (
        <MenuItem
          key={item.title}
          data-action={item.action}
          data-testid={`${dataTestId}-${item.action}`}
          onClick={onMenuItemClick}
          aria-label={item.title}
        >
          {item.title}
        </MenuItem>
      ))}
    </Menu>
  );
}

type SaveMenuActions = 'save' | 'saveAs' | 'createView';
type SaveMenuProps = {
  pipelineName: string;
  isCreateViewAvailable: boolean;
  onSave: (name: string) => void;
  onSaveAs: (name: string) => void;
  onCreateView: () => void;
};
export const SaveMenuComponent: React.FunctionComponent<SaveMenuProps> = ({
  pipelineName,
  isCreateViewAvailable,
  onSave,
  onSaveAs,
  onCreateView,
}) => {
  const onAction = (action: SaveMenuActions) => {
    switch (action) {
      case 'save':
        return onSave(pipelineName);
      case 'saveAs':
        return onSaveAs(pipelineName);
      case 'createView':
        return onCreateView();
    }
  };
  return (
    <PipelineActionMenu<SaveMenuActions>
      data-testid="save-menu"
      title="Save"
      glyph="Save"
      onAction={onAction}
      menuItems={
        [
          { action: 'save', title: 'Save' },
          { action: 'saveAs', title: 'Save as' },
          isCreateViewAvailable && {
            action: 'createView',
            title: 'Create view',
          },
        ].filter(
          Boolean
        ) as PipelineActionMenuProp<SaveMenuActions>['menuItems']
      }
    />
  );
};
const mapSaveMenuState = ({ name, serverVersion }: RootState) => ({
  pipelineName: name,
  isCreateViewAvailable: semver.gte(serverVersion, VIEWS_MIN_SERVER_VERSION),
});
const mapSaveMenuDispatch = {
  onSave: (name: string) => {
    return name === '' ? savingPipelineOpen() : saveCurrentPipeline();
  },
  onSaveAs: (name: string) => {
    return name === ''
      ? savingPipelineOpen()
      : savingPipelineOpen({ name, isSaveAs: true });
  },
  onCreateView: () => openCreateView(),
};
export const SaveMenu = connect(
  mapSaveMenuState,
  mapSaveMenuDispatch
)(SaveMenuComponent);

type CreateMenuActions = 'createPipleine' | 'createPipleineFromText';
type CreateMenuProps = {
  onCreatePipeline: () => void;
  onCreatePipelineFromText: () => void;
};
export const CreateMenuComponent: React.FunctionComponent<CreateMenuProps> = ({
  onCreatePipeline,
  onCreatePipelineFromText,
}) => {
  const onAction = (action: CreateMenuActions) => {
    switch (action) {
      case 'createPipleine':
        return onCreatePipeline();
      case 'createPipleineFromText':
        return onCreatePipelineFromText();
    }
  };
  return (
    <PipelineActionMenu<CreateMenuActions>
      data-testid="create-new-menu"
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
const mapCreateMenuDispatch = (dispatch: Dispatch) => ({
  onCreatePipeline: () => dispatch(setIsNewPipelineConfirm(true)),
  onCreatePipelineFromText: () => dispatch(newPipelineFromText()),
});
export const CreateMenu = connect(
  null,
  mapCreateMenuDispatch
)(CreateMenuComponent);

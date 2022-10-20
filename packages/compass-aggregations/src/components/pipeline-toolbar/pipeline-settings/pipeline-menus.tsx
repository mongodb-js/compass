import React, { useRef, useState, useCallback } from 'react';
import { connect } from 'react-redux';
import semver from 'semver';
import { css, Button, Icon, Menu, MenuItem } from '@mongodb-js/compass-components';
import type { Dispatch } from 'redux';
import type { RootState } from '../../../modules';
import { newPipelineFromText } from '../../../modules/import-pipeline';
import { saveCurrentPipeline } from '../../../modules/saved-pipeline';
import { openCreateView, savingPipelineOpen } from '../../../modules/saving-pipeline';
import { setIsNewPipelineConfirm } from '../../../modules/is-new-pipeline-confirm';
import { VIEWS_MIN_SERVER_VERSION } from '../../../constants';
import { getIsPipelineInvalidFromBuilderState } from '../../../modules/pipeline-builder/builder-helpers';

type PipelineActionMenuProp<ActionType extends string> = {
  disabled?: boolean;
  onAction: (action: ActionType) => void;
  title: string;
  glyph: string;
  menuItems: { title: string; action: ActionType }[];
  ['data-testid']: string;
};

const buttonIconStyles = css({
  fontSize: 0,
  // Working around leafygreen color issues
  color: 'currentColor !important',
})

function PipelineActionMenu<T extends string>({
  disabled,
  onAction,
  title,
  glyph,
  menuItems,
  ['data-testid']: dataTestId,
}: PipelineActionMenuProp<T>) {
  // this ref is used by the Menu component to calculate the height and position
  // of the menu.
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
          disabled={disabled}
          ref={menuTriggerRef}
          data-testid={dataTestId}
          title={title}
          aria-label={title}
          variant="primary"
          size="xsmall"
          onClick={(evt) => {
            evt.stopPropagation();
            onClick();
          }}
        >
          <Icon size="small" className={buttonIconStyles} glyph={glyph} />
          {title}
          {children}
          <Icon size="small" className={buttonIconStyles} glyph="CaretDown" />
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
  disabled?: boolean;
  pipelineName: string;
  isCreateViewAvailable: boolean;
  onSave: (name: string) => void;
  onSaveAs: (name: string) => void;
  onCreateView: () => void;
};

export const SaveMenuComponent: React.FunctionComponent<SaveMenuProps> = ({
  disabled,
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
      disabled={disabled}
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

const mapSaveMenuState = (state: RootState) => {
  const isPipelineInvalid = getIsPipelineInvalidFromBuilderState(state);
  return {
    disabled: isPipelineInvalid,
    pipelineName: state.name,
    isCreateViewAvailable: semver.gte(
      state.serverVersion,
      VIEWS_MIN_SERVER_VERSION
    )
  };
};

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

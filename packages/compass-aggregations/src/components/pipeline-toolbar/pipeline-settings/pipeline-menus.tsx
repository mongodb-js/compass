import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import semver from 'semver';
import { Icon, DropdownMenuButton } from '@mongodb-js/compass-components';
import type { MenuAction } from '@mongodb-js/compass-components';
import type { Dispatch } from 'redux';
import type { RootState } from '../../../modules';
import { newPipelineFromText } from '../../../modules/import-pipeline';
import { saveCurrentPipeline } from '../../../modules/saved-pipeline';
import {
  openCreateView,
  savingPipelineOpen,
} from '../../../modules/saving-pipeline';
import { setIsNewPipelineConfirm } from '../../../modules/is-new-pipeline-confirm';
import { getIsPipelineInvalidFromBuilderState } from '../../../modules/pipeline-builder/builder-helpers';

type SaveMenuActions = 'save' | 'saveAs' | 'createView';
type SaveMenuProps = {
  disabled?: boolean;
  pipelineName: string;
  isCreateViewAvailable: boolean;
  onSave: (name: string) => void;
  onSaveAs: (name: string) => void;
  onCreateView: () => void;
};
const saveMenuActions: MenuAction<SaveMenuActions>[] = [
  { action: 'save', label: 'Save' },
  { action: 'saveAs', label: 'Save as' },
];
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
  const actions = useMemo(
    () =>
      saveMenuActions.concat(
        isCreateViewAvailable
          ? [
              {
                action: 'createView',
                label: 'Create view',
              },
            ]
          : []
      ),
    [isCreateViewAvailable]
  );
  return (
    <DropdownMenuButton<SaveMenuActions>
      data-testid="save-menu"
      actions={actions}
      onAction={onAction}
      buttonText="Save"
      buttonProps={{
        size: 'xsmall',
        variant: 'primary',
        leftGlyph: <Icon glyph="Save" />,
        disabled,
      }}
    ></DropdownMenuButton>
  );
};

const VIEWS_MIN_SERVER_VERSION = '3.4.0';

const mapSaveMenuState = (state: RootState) => {
  const hasSyntaxErrors = getIsPipelineInvalidFromBuilderState(state, false);
  return {
    disabled: hasSyntaxErrors,
    pipelineName: state.name,
    isCreateViewAvailable: semver.gte(
      state.serverVersion,
      VIEWS_MIN_SERVER_VERSION
    ),
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

type CreateMenuActions = 'createPipeline' | 'createPipelineFromText';
type CreateMenuProps = {
  onCreatePipeline: () => void;
  onCreatePipelineFromText: () => void;
};
const createMenuActions: MenuAction<CreateMenuActions>[] = [
  { action: 'createPipeline', label: 'Pipeline' },
  { action: 'createPipelineFromText', label: 'Pipeline from text' },
];
export const CreateMenuComponent: React.FunctionComponent<CreateMenuProps> = ({
  onCreatePipeline,
  onCreatePipelineFromText,
}) => {
  const onAction = (action: CreateMenuActions) => {
    switch (action) {
      case 'createPipeline':
        return onCreatePipeline();
      case 'createPipelineFromText':
        return onCreatePipelineFromText();
    }
  };
  return (
    <DropdownMenuButton<CreateMenuActions>
      data-testid="create-new-menu"
      actions={createMenuActions}
      onAction={onAction}
      buttonText="Create new"
      buttonProps={{
        size: 'xsmall',
        variant: 'primary',
        leftGlyph: <Icon glyph="Plus" />,
      }}
    ></DropdownMenuButton>
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

import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import semver from 'semver';
import { Icon, DropdownMenuButton } from '@mongodb-js/compass-components';
import type { MenuAction } from '@mongodb-js/compass-components';
import type { RootState } from '../../../modules';
import { saveCurrentPipeline } from '../../../modules/saved-pipeline';
import {
  openCreateView,
  savingPipelineOpen,
} from '../../../modules/saving-pipeline';

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
  return {
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

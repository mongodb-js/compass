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
  isSaveEnabled: boolean;
  isCreateViewEnabled: boolean;
  onSave: (name: string) => void;
  onSaveAs: (name: string) => void;
  onCreateView: () => void;
};

export const SaveMenuComponent: React.FunctionComponent<SaveMenuProps> = ({
  disabled,
  pipelineName,
  isSaveEnabled,
  isCreateViewEnabled,
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
  const menuActions = useMemo(() => {
    const actions: MenuAction<SaveMenuActions>[] = [];
    if (isSaveEnabled) {
      actions.push(
        { action: 'save' as const, label: 'Save' },
        { action: 'saveAs' as const, label: 'Save as' }
      );
    }
    if (isCreateViewEnabled) {
      actions.push({
        action: 'createView',
        label: 'Create view',
      });
    }
    return actions;
  }, [isSaveEnabled, isCreateViewEnabled]);

  if (menuActions.length === 0) {
    return null;
  }

  return (
    <DropdownMenuButton<SaveMenuActions>
      data-lgid="lg-save-menu"
      actions={menuActions}
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
    isCreateViewEnabled: semver.gte(
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
  onCreateView: openCreateView,
};
export const SaveMenu = connect(
  mapSaveMenuState,
  mapSaveMenuDispatch
)(SaveMenuComponent);

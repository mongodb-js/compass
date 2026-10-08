import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import semver from 'semver';
import {
  Icon,
  DropdownMenuButton,
  useTranslation,
} from '@mongodb-js/compass-components';
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
  const t = useTranslation();
  const menuActions = useMemo(() => {
    const actions: MenuAction<SaveMenuActions>[] = [];
    if (isSaveEnabled) {
      actions.push(
        {
          action: 'save' as const,
          label: t('aggregations.saveMenu.save', 'Save'),
        },
        {
          action: 'saveAs' as const,
          label: t('aggregations.saveMenu.saveAs', 'Save as'),
        }
      );
    }
    if (isCreateViewEnabled) {
      actions.push({
        action: 'createView',
        label: t('aggregations.saveMenu.createView', 'Create view'),
      });
    }
    return actions;
  }, [isSaveEnabled, isCreateViewEnabled, t]);

  if (menuActions.length === 0) {
    return null;
  }

  return (
    <DropdownMenuButton<SaveMenuActions>
      data-testid="save-menu"
      actions={menuActions}
      onAction={onAction}
      buttonText={t('aggregations.saveMenu.save', 'Save')}
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

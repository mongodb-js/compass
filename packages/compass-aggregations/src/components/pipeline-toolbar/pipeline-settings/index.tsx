import React from 'react';
import { connect } from 'react-redux';
import {
  Body,
  Button,
  Icon,
  Tooltip,
  css,
  spacing,
  useTranslation,
} from '@mongodb-js/compass-components';
import { SaveMenu } from './pipeline-menus';
import PipelineName from './pipeline-name';
import PipelineExtraSettings from './pipeline-extra-settings';
import type { RootState } from '../../../modules';
import { confirmNewPipeline } from '../../../modules/is-new-pipeline-confirm';
import { getIsNewPipelineFromBuilderState } from '../../../modules/pipeline-builder/builder-helpers';
import ModifySourceBanner from '../../modify-source-banner';

import { usePreference } from 'compass-preferences-model/provider';
import PipelineExportActions from '../pipeline-export-actions';

const containerStyles = css({
  display: 'flex',
  gap: spacing[200],
  alignItems: 'center',
  justifyContent: 'space-between',
  whiteSpace: 'nowrap',
});

const settingsStyles = css({
  display: 'flex',
  gap: spacing[200],
  alignItems: 'center',
  flex: 'none',
});

const extraSettingsStyles = css({
  display: 'flex',
  flex: 'none',
});

type PipelineSettingsProps = {
  editViewName?: string;
  isCreateNewPipelineDisabled: boolean;
  onCreateNewPipeline: () => void;
};

export const PipelineSettings: React.FunctionComponent<
  PipelineSettingsProps
> = ({ editViewName, isCreateNewPipelineDisabled, onCreateNewPipeline }) => {
  const enableSavedAggregationsQueries = usePreference('enableMyQueries');
  const t = useTranslation();
  const isPipelineNameDisplayed =
    !editViewName && !!enableSavedAggregationsQueries;

  const isCreatePipelineDisplayed = !editViewName;

  return (
    <div className={containerStyles} data-testid="pipeline-settings">
      <div className={settingsStyles}>
        {isPipelineNameDisplayed && <PipelineName />}
        <SaveMenu isSaveEnabled={!!enableSavedAggregationsQueries}></SaveMenu>
        {isCreatePipelineDisplayed && (
          <Tooltip
            enabled={isCreateNewPipelineDisabled}
            trigger={
              <Button
                size="xsmall"
                variant="primary"
                leftGlyph={<Icon glyph="Plus" />}
                onClick={onCreateNewPipeline}
                disabled={isCreateNewPipelineDisabled}
                data-testid="pipeline-toolbar-create-new-button"
              >
                {t('aggregations.pipelineSettings.createNew', 'Create new')}
              </Button>
            }
          >
            <Body>
              {t(
                'aggregations.pipelineSettings.alreadyEmpty',
                'This pipeline is already empty.'
              )}
            </Body>
          </Tooltip>
        )}
        <PipelineExportActions />
      </div>
      {editViewName && (
        <ModifySourceBanner editViewName={editViewName}></ModifySourceBanner>
      )}
      <div className={extraSettingsStyles}>
        <PipelineExtraSettings />
      </div>
    </div>
  );
};

export default connect(
  (state: RootState) => {
    return {
      editViewName: state.editViewName ?? undefined,
      isCreateNewPipelineDisabled: getIsNewPipelineFromBuilderState(state),
    };
  },
  {
    onCreateNewPipeline: confirmNewPipeline,
  }
)(PipelineSettings);

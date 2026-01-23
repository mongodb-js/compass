import React from 'react';
import { connect } from 'react-redux';
import { Button, Icon, css, spacing } from '@mongodb-js/compass-components';
import { SaveMenu } from './pipeline-menus';
import PipelineName from './pipeline-name';
import PipelineExtraSettings from './pipeline-extra-settings';
import type { RootState } from '../../../modules';
import { confirmNewPipeline } from '../../../modules/is-new-pipeline-confirm';
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
  onCreateNewPipeline: () => void;
};

export const PipelineSettings: React.FunctionComponent<
  PipelineSettingsProps
> = ({ editViewName, onCreateNewPipeline }) => {
  const enableSavedAggregationsQueries = usePreference('enableMyQueries');
  const isPipelineNameDisplayed =
    !editViewName && !!enableSavedAggregationsQueries;

  const isCreatePipelineDisplayed = !editViewName;

  return (
    <div className={containerStyles} data-testid="pipeline-settings">
      <div className={settingsStyles}>
        {isPipelineNameDisplayed && <PipelineName />}
        <SaveMenu isSaveEnabled={!!enableSavedAggregationsQueries}></SaveMenu>
        {isCreatePipelineDisplayed && (
          <Button
            size="xsmall"
            variant="primary"
            leftGlyph={<Icon glyph="Plus" />}
            onClick={onCreateNewPipeline}
            data-testid="pipeline-toolbar-create-new-button"
          >
            Create new
          </Button>
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
    };
  },
  {
    onCreateNewPipeline: confirmNewPipeline,
  }
)(PipelineSettings);

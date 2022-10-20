import React from 'react';
import { connect } from 'react-redux';
import { Button, Icon, css, spacing } from '@mongodb-js/compass-components';
import { exportToLanguage } from '../../../modules/export-to-language';
import { SaveMenu, CreateMenu } from './pipeline-menus';
import PipelineName from './pipeline-name';
import PipelineExtraSettings from './pipeline-extra-settings';
import type { RootState } from '../../../modules';
import { getIsPipelineInvalidFromBuilderState } from '../../../modules/pipeline-builder/builder-helpers';

const containerStyles = css({
  display: 'grid',
  gap: spacing[2],
  gridTemplateAreas: '"settings extraSettings"',
  gridTemplateColumns: '1fr auto',
  alignItems: 'center',
  whiteSpace: 'nowrap',
});

const settingsStyles = css({
  display: 'flex',
  gap: spacing[2],
  alignItems: 'center',
});

const extraSettingsStyles = css({
  gridArea: 'extraSettings',
  display: 'flex',
});

type PipelineSettingsProps = {
  isSavePipelineEnabled?: boolean;
  isCreatePipelineEnabled?: boolean;
  isExportToLanguageEnabled?: boolean;
  onExportToLanguage: () => void;
};

const buttonIconStyles = css({
  fontSize: 0,
  // Working around leafygreen color issues
  color: 'currentColor !important',
})

export const PipelineSettings: React.FunctionComponent<
  PipelineSettingsProps
> = ({
  isSavePipelineEnabled,
  isCreatePipelineEnabled,
  isExportToLanguageEnabled,
  onExportToLanguage,
}) => {
  return (
    <div className={containerStyles} data-testid="pipeline-settings">
      <div className={settingsStyles}>
        {isSavePipelineEnabled && (
          <>
            <PipelineName />
            <SaveMenu />
          </>
        )}
        {isCreatePipelineEnabled && <CreateMenu />}
        <Button
          variant="primaryOutline"
          size="xsmall"
          onClick={onExportToLanguage}
          data-testid="pipeline-toolbar-export-button"
          disabled={!isExportToLanguageEnabled}
        >
          <Icon size="small" className={buttonIconStyles} glyph="Code" />
          Export to language
        </Button>
      </div>
      <div className={extraSettingsStyles}>
        <PipelineExtraSettings />
      </div>
    </div>
  );
};

export default connect(
  (state: RootState) => {
    const isPipelineInvalid = getIsPipelineInvalidFromBuilderState(state);

    return {
      isSavePipelineEnabled: !state.editViewName && !state.isAtlasDeployed,
      isCreatePipelineEnabled: !state.editViewName,
      isExportToLanguageEnabled: !isPipelineInvalid
    };
  },
  {
    onExportToLanguage: exportToLanguage,
  }
)(PipelineSettings);

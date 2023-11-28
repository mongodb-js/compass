import React from 'react';
import { connect } from 'react-redux';
import { Button, Icon, css, spacing } from '@mongodb-js/compass-components';
import { exportToLanguage } from '../../../modules/export-to-language';
import { SaveMenu } from './pipeline-menus';
import PipelineName from './pipeline-name';
import PipelineExtraSettings from './pipeline-extra-settings';
import type { RootState } from '../../../modules';
import { getIsPipelineInvalidFromBuilderState } from '../../../modules/pipeline-builder/builder-helpers';
import { confirmNewPipeline } from '../../../modules/is-new-pipeline-confirm';
import { usePreference } from 'compass-preferences-model';
import { hiddenOnNarrowPipelineToolbarStyles } from '../pipeline-toolbar-container';

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
  isEditingViewPipeline?: boolean;
  isExportToLanguageEnabled?: boolean;
  onExportToLanguage: () => void;
  onCreateNewPipeline: () => void;
};

export const PipelineSettings: React.FunctionComponent<
  PipelineSettingsProps
> = ({
  isEditingViewPipeline = false,
  isExportToLanguageEnabled,
  onExportToLanguage,
  onCreateNewPipeline,
}) => {
  const enableSavedAggregationsQueries = usePreference(
    'enableSavedAggregationsQueries',
    React
  );
  const isSavePipelineDisplayed =
    !isEditingViewPipeline && enableSavedAggregationsQueries;
  const isCreatePipelineDisplayed = !isEditingViewPipeline;

  return (
    <div className={containerStyles} data-testid="pipeline-settings">
      <div className={settingsStyles}>
        {isSavePipelineDisplayed && (
          <>
            <PipelineName />
            <SaveMenu />
          </>
        )}
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
        <Button
          variant="primaryOutline"
          size="xsmall"
          leftGlyph={<Icon glyph="Code" />}
          onClick={onExportToLanguage}
          data-testid="pipeline-toolbar-export-button"
          disabled={!isExportToLanguageEnabled}
        >
          <span className={hiddenOnNarrowPipelineToolbarStyles}>
            Export to language
          </span>
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
    const hasSyntaxErrors = getIsPipelineInvalidFromBuilderState(state, false);
    return {
      isEditingViewPipeline: !!state.editViewName,
      isExportToLanguageEnabled: !hasSyntaxErrors,
    };
  },
  {
    onExportToLanguage: exportToLanguage,
    onCreateNewPipeline: confirmNewPipeline,
  }
)(PipelineSettings);

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
import { hiddenOnNarrowPipelineToolbarStyles } from '../pipeline-toolbar-container';
import ModifySourceBanner from '../../modify-source-banner';
import { usePipelineStorage } from '@mongodb-js/my-queries-storage/provider';

const containerStyles = css({
  display: 'flex',
  gap: spacing[2],
  alignItems: 'center',
  justifyContent: 'space-between',
  whiteSpace: 'nowrap',
});

const settingsStyles = css({
  display: 'flex',
  gap: spacing[2],
  alignItems: 'center',
  flex: 'none',
});

const extraSettingsStyles = css({
  display: 'flex',
  flex: 'none',
});

type PipelineSettingsProps = {
  editViewName?: string;
  isExportToLanguageEnabled?: boolean;
  onExportToLanguage: () => void;
  onCreateNewPipeline: () => void;
};

export const PipelineSettings: React.FunctionComponent<
  PipelineSettingsProps
> = ({
  editViewName,
  isExportToLanguageEnabled,
  onExportToLanguage,
  onCreateNewPipeline,
}) => {
  // TODO: remove direct check for storage existing, breaks single source of
  // truth rule and exposes services to UI, this breaks the rules for locators
  const enableSavedAggregationsQueries = !!usePipelineStorage();
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
    const hasSyntaxErrors = getIsPipelineInvalidFromBuilderState(state, false);
    return {
      editViewName: state.editViewName ?? undefined,
      isExportToLanguageEnabled: !hasSyntaxErrors,
    };
  },
  {
    onExportToLanguage: exportToLanguage,
    onCreateNewPipeline: confirmNewPipeline,
  }
)(PipelineSettings);

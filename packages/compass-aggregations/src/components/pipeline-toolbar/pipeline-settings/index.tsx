import React from 'react';
import { connect } from 'react-redux';
import { Button, Icon, css, spacing } from '@mongodb-js/compass-components';
import { exportToLanguage } from '../../../modules/export-to-language';
import { SaveMenu } from './pipeline-menus';
import PipelineName from './pipeline-name';
import PipelineExtraSettings from './pipeline-extra-settings';
import type { RootState } from '../../../modules';
import { getIsPipelineInvalidFromBuilderState } from '../../../modules/pipeline-builder/builder-helpers';
import {
  confirmNewPipeline,
  toggleNewPipelineModal,
} from '../../../modules/is-new-pipeline-confirm';

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
  isSavePipelineDisplayed?: boolean;
  isCreatePipelineDisplayed?: boolean;
  isExportToLanguageEnabled?: boolean;
  shouldConfirmBeforeCreate: boolean;
  onExportToLanguage: () => void;
  onCreateNewPipeline: (shouldConfirmBeforeCreate: boolean) => void;
};

export const PipelineSettings: React.FunctionComponent<
  PipelineSettingsProps
> = ({
  isSavePipelineDisplayed,
  isCreatePipelineDisplayed,
  isExportToLanguageEnabled,
  shouldConfirmBeforeCreate,
  onExportToLanguage,
  onCreateNewPipeline,
}) => {
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
            onClick={() => onCreateNewPipeline(shouldConfirmBeforeCreate)}
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
    const hasSyntaxErrors = getIsPipelineInvalidFromBuilderState(state, false);
    return {
      isSavePipelineDisplayed: !state.editViewName && !state.isAtlasDeployed,
      isCreatePipelineDisplayed: !state.editViewName,
      isExportToLanguageEnabled: !hasSyntaxErrors,
      shouldConfirmBeforeCreate: state.isModified,
    };
  },
  {
    onExportToLanguage: exportToLanguage,
    onCreateNewPipeline: (shouldConfirm: boolean) => {
      return shouldConfirm
        ? toggleNewPipelineModal(true)
        : confirmNewPipeline();
    },
  }
)(PipelineSettings);

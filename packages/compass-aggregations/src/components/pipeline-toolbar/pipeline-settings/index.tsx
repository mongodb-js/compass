import React from 'react';
import { connect } from 'react-redux';
import {
  Button,
  Icon,
  css,
  spacing,
  WorkspaceContainer,
} from '@mongodb-js/compass-components';
import { exportToLanguage } from '../../../modules/export-to-language';
import { exportAggregationResults } from '../../../modules/aggregation';
import { SaveMenu } from './pipeline-menus';
import PipelineName from './pipeline-name';
import PipelineExtraSettings from './pipeline-extra-settings';
import type { RootState, PipelineBuilderThunkDispatch } from '../../../modules';
import {
  getIsPipelineInvalidFromBuilderState,
  getPipelineStageOperatorsFromBuilderState,
} from '../../../modules/pipeline-builder/builder-helpers';
import { isOutputStage } from '../../../utils/stage';
import { confirmNewPipeline } from '../../../modules/is-new-pipeline-confirm';
import ModifySourceBanner from '../../modify-source-banner';

import { usePreference } from 'compass-preferences-model/provider';

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

const exportDataButtonStyles = css({
  whiteSpace: 'nowrap',
});

const exportCodeButtonTextStyles = css({
  [`@container ${WorkspaceContainer.toolbarContainerQueryName} (width < 900px)`]:
    {
      display: 'none',
    },
});

type PipelineSettingsProps = {
  editViewName?: string;
  isExportToLanguageEnabled?: boolean;
  isExportDataEnabled?: boolean;
  isMergeOrOutPipeline?: boolean;
  onExportToLanguage: () => void;
  onExportData: () => void;
  onCreateNewPipeline: () => void;
};

export const PipelineSettings: React.FunctionComponent<
  PipelineSettingsProps
> = ({
  editViewName,
  isExportToLanguageEnabled,
  isExportDataEnabled,
  isMergeOrOutPipeline,
  onExportToLanguage,
  onExportData,
  onCreateNewPipeline,
}) => {
  const enableSavedAggregationsQueries = usePreference('enableMyQueries');
  const enableImportExport = usePreference('enableImportExport');
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
        {enableImportExport && !isMergeOrOutPipeline && (
          <Button
            size="xsmall"
            leftGlyph={<Icon glyph="Export" />}
            disabled={!isExportDataEnabled}
            onClick={onExportData}
            data-testid="pipeline-toolbar-export-data-button"
            title="Export pipeline results"
            className={exportDataButtonStyles}
          >
            <span className={exportCodeButtonTextStyles}>Export Data</span>
          </Button>
        )}
        <Button
          size="xsmall"
          leftGlyph={<Icon glyph="Code" />}
          onClick={onExportToLanguage}
          data-testid="pipeline-toolbar-export-code-button"
          disabled={!isExportToLanguageEnabled}
          title="Export query to language"
          className={exportDataButtonStyles}
        >
          <span className={exportCodeButtonTextStyles}>Export Code</span>
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
    const resultPipeline = getPipelineStageOperatorsFromBuilderState(state);
    const lastStage = resultPipeline[resultPipeline.length - 1];
    const isMergeOrOutPipeline = isOutputStage(lastStage);
    const hasSyntaxErrors = getIsPipelineInvalidFromBuilderState(state, false);
    const isAIFetching = state.pipelineBuilder.aiPipeline.status === 'fetching';
    return {
      editViewName: state.editViewName ?? undefined,
      isExportToLanguageEnabled: !hasSyntaxErrors && !isAIFetching,
      isMergeOrOutPipeline: isMergeOrOutPipeline,
      isExportDataEnabled:
        !isMergeOrOutPipeline && !hasSyntaxErrors && !isAIFetching,
    };
  },
  {
    onExportToLanguage: exportToLanguage,
    onExportData: () => {
      return (dispatch: PipelineBuilderThunkDispatch) => {
        dispatch(exportAggregationResults());
      };
    },
    onCreateNewPipeline: confirmNewPipeline,
  }
)(PipelineSettings);

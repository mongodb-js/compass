import React from 'react';
import { connect } from 'react-redux';
import {
  Button,
  Icon,
  css,
  WorkspaceContainer,
} from '@mongodb-js/compass-components';
import { usePreference } from 'compass-preferences-model/provider';

import { exportToLanguage } from '../../modules/export-to-language';
import { exportAggregationResults } from '../../modules/aggregation';
import type { RootState, PipelineBuilderThunkDispatch } from '../../modules';
import {
  getIsPipelineInvalidFromBuilderState,
  getPipelineStageOperatorsFromBuilderState,
} from '../../modules/pipeline-builder/builder-helpers';
import { isOutputStage } from '../../utils/stage';

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
  isExportToLanguageEnabled?: boolean;
  isExportDataEnabled?: boolean;
  isMergeOrOutPipeline?: boolean;
  onExportToLanguage: () => void;
  onExportData: () => void;
};

export const PipelineExportActions: React.FunctionComponent<
  PipelineSettingsProps
> = ({
  isExportToLanguageEnabled,
  isExportDataEnabled,
  isMergeOrOutPipeline,
  onExportToLanguage,
  onExportData,
}) => {
  const enableImportExport = usePreference('enableImportExport');

  return (
    <>
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
    </>
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
  }
)(PipelineExportActions);

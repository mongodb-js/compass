import React from 'react';
import { connect } from 'react-redux';
import {
  Button,
  Icon,
  css,
  spacing,
  DropdownMenuButton,
  WorkspaceContainer,
} from '@mongodb-js/compass-components';
import { exportToLanguage } from '../../../modules/export-to-language';
import { exportAggregationResults } from '../../../modules/aggregation';
import { SaveMenu } from './pipeline-menus';
import PipelineName from './pipeline-name';
import PipelineExtraSettings from './pipeline-extra-settings';
import type { RootState, PipelineBuilderThunkDispatch } from '../../../modules';
import { getIsPipelineInvalidFromBuilderState } from '../../../modules/pipeline-builder/builder-helpers';
import { confirmNewPipeline } from '../../../modules/is-new-pipeline-confirm';
import ModifySourceBanner from '../../modify-source-banner';
import type { MenuAction } from '@mongodb-js/compass-components';

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

type ExportDataOption = 'export-query';
const exportDataActions: MenuAction<ExportDataOption>[] = [
  { action: 'export-query', label: 'Export pipeline results' },
];

type PipelineSettingsProps = {
  editViewName?: string;
  isExportToLanguageEnabled?: boolean;
  isExportDataEnabled?: boolean;
  onExportToLanguage: () => void;
  onExportData: (action: ExportDataOption) => void;
  onCreateNewPipeline: () => void;
};

export const PipelineSettings: React.FunctionComponent<
  PipelineSettingsProps
> = ({
  editViewName,
  isExportToLanguageEnabled,
  isExportDataEnabled,
  onExportToLanguage,
  onExportData,
  onCreateNewPipeline,
}) => {
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
        {isExportDataEnabled && (
          <DropdownMenuButton<ExportDataOption>
            data-testid="pipeline-toolbar-export-data-button"
            actions={exportDataActions}
            onAction={onExportData}
            buttonText="Export Data"
            buttonProps={{
              className: exportDataButtonStyles,
              size: 'xsmall',
              leftGlyph: <Icon glyph="Export" />,
            }}
            narrowBreakpoint="900px"
          />
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
    const hasSyntaxErrors = getIsPipelineInvalidFromBuilderState(state, false);
    return {
      editViewName: state.editViewName ?? undefined,
      isExportToLanguageEnabled: !hasSyntaxErrors,
      isExportDataEnabled: !hasSyntaxErrors,
    };
  },
  {
    onExportToLanguage: exportToLanguage,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onExportData: (_action: ExportDataOption) => {
      return (dispatch: PipelineBuilderThunkDispatch) => {
        dispatch(exportAggregationResults());
      };
    },
    onCreateNewPipeline: confirmNewPipeline,
  }
)(PipelineSettings);

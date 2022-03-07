import React from 'react';
import { connect } from 'react-redux';
import type { ConnectedProps } from 'react-redux';
import { Button, css, spacing } from '@mongodb-js/compass-components';

import type { RootState } from '../../modules';
import { exportToLanguage } from '../../modules/export-to-language';
import { savingPipelineOpen } from '../../modules/saving-pipeline';
import { saveCurrentPipeline } from '../../modules/saved-pipeline';
import { runAggregation } from '../../modules/aggregation';
import { changeWorkspace } from '../../modules/workspace';

const pipelineActionsContainerStyles = css({});

const buttonStyles = css({
  marginLeft: spacing[1],
  marginRight: spacing[1],
});

const PipelineActions: React.FunctionComponent<PipelineActionsProps> = ({
  name,
  workspace,
  onExportToLanguage,
  onRunAggregation,
  onSavePipeline,
  onChangeWorkspace,
}) => {
  return (
    <div className={pipelineActionsContainerStyles}>
      {workspace === 'builder' && (
        <Button
          data-testid="toolbar-run-action-button"
          className={buttonStyles}
          variant="primary"
          onClick={() => {
            onChangeWorkspace('results');
            onRunAggregation();
          }}
        >
          Run
        </Button>
      )}
      {workspace === 'results' && (
        <Button
          data-testid="toolbar-run-action-button"
          className={buttonStyles}
          variant="primary"
          onClick={() => onChangeWorkspace('builder')}
        >
          Edit
        </Button>
      )}
      <Button
        data-testid="toolbar-save-action-button"
        className={buttonStyles}
        onClick={() => onSavePipeline(name)}
      >
        Save
      </Button>
      <Button
        data-testid="toolbar-export-action-button"
        className={buttonStyles}
        onClick={() => onExportToLanguage()}
      >
        Export Results
      </Button>
      <Button
        data-testid="toolbar-explain-action-button"
        className={buttonStyles}
      >
        Explain
      </Button>
    </div>
  );
};

const mapState = ({ name, workspace }: RootState) => ({
  name,
  workspace,
});
const mapDispatch = {
  onChangeWorkspace: changeWorkspace,
  onRunAggregation: runAggregation,
  onExportToLanguage: exportToLanguage,
  onSavePipeline: (name: string) => {
    return name === '' ? savingPipelineOpen() : saveCurrentPipeline();
  },
};

const connector = connect(mapState, mapDispatch);
type PipelineActionsProps = ConnectedProps<typeof connector>;
export default connector(PipelineActions);

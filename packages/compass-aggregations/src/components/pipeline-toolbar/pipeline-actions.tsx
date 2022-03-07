import React from 'react';
import { connect } from 'react-redux';
import type { ConnectedProps } from 'react-redux';
import { Button, css, spacing } from '@mongodb-js/compass-components';

import type { RootState } from '../../modules';
import { exportToLanguage } from '../../modules/export-to-language';
import { savingPipelineOpen } from '../../modules/saving-pipeline';
import { saveCurrentPipeline } from '../../modules/saved-pipeline';
import { runAggregation } from '../../modules/aggregation';

const pipelineActionsContainerStyles = css({});

const buttonStyles = css({
  marginLeft: spacing[1],
  marginRight: spacing[1],
});

const PipelineActions: React.FunctionComponent<PipelineActionsProps> = ({
  name,
  onExportToLanguage,
  onRunAggregation,
  onSavePipeline,
}) => {
  return (
    <div className={pipelineActionsContainerStyles}>
      <Button className={buttonStyles} variant="primary" onClick={() => onRunAggregation()}>
        Run
      </Button>
      <Button className={buttonStyles} onClick={() => onSavePipeline(name)}>
        Save
      </Button>
      <Button className={buttonStyles} onClick={() => onExportToLanguage()}>
        Export Results
      </Button>
      <Button className={buttonStyles}>Explain</Button>
    </div>
  );
};

const mapState = (state: RootState) => ({
  name: state.name,
});
const mapDispatch = ({
  onRunAggregation: runAggregation,
  onExportToLanguage: exportToLanguage,
  onSavePipeline: (name: string) => {
    return name === '' ? savingPipelineOpen() : saveCurrentPipeline();
  },
});

const connector = connect(mapState, mapDispatch);
type PipelineActionsProps = ConnectedProps<typeof connector>;
export default connector(PipelineActions);

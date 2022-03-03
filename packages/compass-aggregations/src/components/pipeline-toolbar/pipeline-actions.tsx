import React from 'react';
import { connect } from 'react-redux';
import type { ConnectedProps } from 'react-redux';
import type { Dispatch } from 'redux';
import { Button, css, spacing } from '@mongodb-js/compass-components';

import type { RootState } from '../../modules';
import { exportToLanguage } from '../../modules/export-to-language';
import { setIsModified } from '../../modules/is-modified';
import { savingPipelineOpen } from '../../modules/saving-pipeline';
import { saveCurrentPipeline } from '../../modules/saved-pipeline';
const pipelineActionsContainerStyles = css({});

const buttonStyles = css({
  marginLeft: spacing[1],
  marginRight: spacing[1],
});

const PipelineActions: React.FunctionComponent<PipelineActionsProps> = ({
  name,
  onExportToLanguage,
  onSavePipeline,
}) => {
  return (
    <div className={pipelineActionsContainerStyles}>
      <Button className={buttonStyles} variant="primary">
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
const mapDispatch = (dispatch: Dispatch) => ({
  onExportToLanguage: exportToLanguage,
  onSavePipeline: (name: string) => {
    if (name === '') {
      dispatch(savingPipelineOpen());
    } else {
      saveCurrentPipeline();
      dispatch(setIsModified(false));
    }
  },
});
const connector = connect(mapState, mapDispatch);
type PipelineActionsProps = ConnectedProps<typeof connector>;
export default connector(PipelineActions);

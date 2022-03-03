import React from 'react';
import { connect } from 'react-redux';
import type { ConnectedProps } from 'react-redux';
import { Button, css, spacing } from '@mongodb-js/compass-components';

const pipelineActionsContainerStyles = css({});

const buttonStyles = css({
  marginLeft: spacing[1],
  marginRight: spacing[1],
});

const PipelineActions: React.FunctionComponent<PipelineActionsProps> = () => {
  return (
    <div className={pipelineActionsContainerStyles}>
      <Button className={buttonStyles} variant="primary">
        Run
      </Button>
      <Button className={buttonStyles}>Save</Button>
      <Button className={buttonStyles}>Explain</Button>
      <Button className={buttonStyles}>Export Results</Button>
    </div>
  );
};

const connector = connect();
type PipelineActionsProps = ConnectedProps<typeof connector>;
export default connector(PipelineActions);

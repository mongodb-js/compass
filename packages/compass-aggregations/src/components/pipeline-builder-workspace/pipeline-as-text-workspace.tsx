import React from 'react';
import { connect } from 'react-redux';
import { Subtitle, css, spacing } from '@mongodb-js/compass-components';

const containerStyles = css({
  textAlign: 'center',
  marginTop: spacing[5],
});

export const PipelineAsTextWorkspace: React.FunctionComponent = () => {
  return (
    <div className={containerStyles} data-testid="pipeline-as-text-workspace">
      <Subtitle>
        In progress feature. Use `Pipeline From Text` for now.
      </Subtitle>
    </div>
  );
};

export default connect()(PipelineAsTextWorkspace);

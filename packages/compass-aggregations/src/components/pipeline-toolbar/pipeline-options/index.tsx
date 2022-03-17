import React from 'react';
import { css } from '@mongodb-js/compass-components';

import PipelineCollation from './pipeline-collation';

const containerStyles = css({
  display: 'grid',
});

const PipelineOptions: React.FunctionComponent = () => {
  return (
    <div className={containerStyles} data-testid="pipeline-options">
      <PipelineCollation />
    </div>
  );
};

export default PipelineOptions;

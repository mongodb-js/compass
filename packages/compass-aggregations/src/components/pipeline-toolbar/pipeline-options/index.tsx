import React from 'react';
import { css } from '@mongodb-js/compass-components';

import PipelineCollation from './pipeline-collation';

const containerStyles = css({
  display: 'grid',
});

export const PipelineOptions: React.FunctionComponent = () => {
  return (
    <div
      className={containerStyles}
      data-testid="pipeline-options"
      role="region"
      id="pipeline-options"
      aria-labelledby="pipeline-toolbar-options"
    >
      <PipelineCollation />
    </div>
  );
};

export default PipelineOptions;

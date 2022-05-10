import React from 'react';

import PipelineCollation from './pipeline-collation';

export const PipelineOptions: React.FunctionComponent = () => {
  return (
    <div
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

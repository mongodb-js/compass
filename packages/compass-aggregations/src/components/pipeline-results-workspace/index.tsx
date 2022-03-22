import React from 'react';
import { connect } from 'react-redux';
import type { ConnectedProps } from 'react-redux';

import type { RootState } from '../../modules';

const PipelineResultsWorkspace: React.FunctionComponent<PipelineResultsWorkspace> =
  ({ documents }) => {
    return (
      <div data-testid="pipeline-results-workspace">
        <pre>
          <code>{JSON.stringify(documents, null, 2)}</code>
        </pre>
      </div>
    );
  };

const mapState = ({ aggregation: { documents } }: RootState) => ({
  documents,
});

const connector = connect(mapState);
type PipelineResultsWorkspace = ConnectedProps<typeof connector>;
export default connector(PipelineResultsWorkspace);

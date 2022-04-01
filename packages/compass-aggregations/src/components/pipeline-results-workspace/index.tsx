import React from 'react';
import { connect } from 'react-redux';
import type { ConnectedProps } from 'react-redux';
import { PipelineResultsList } from './pipeline-results-list';

import type { RootState } from '../../modules';

const PipelineResultsWorkspace: React.FunctionComponent<PipelineResultsWorkspace> =
  ({ documents }) => {
    return (
      <PipelineResultsList
        documents={documents}
        data-testid="pipeline-results-workspace"
      ></PipelineResultsList>
    );
  };

const mapState = ({ aggregation: { documents } }: RootState) => ({
  documents
});

const connector = connect(mapState);
type PipelineResultsWorkspace = ConnectedProps<typeof connector>;
export default connector(PipelineResultsWorkspace);
